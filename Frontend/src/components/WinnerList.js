import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Badge, Form, Row, Col, Button, Alert, Modal } from 'react-bootstrap';
import { getRaffles, getRaffleWinners, markWinnerNotified, getWhatsAppLinks } from '../api';
import 'font-awesome/css/font-awesome.min.css';

const WinnerList = ({ isAdmin }) => {
  const [raffles, setRaffles] = useState([]);
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [whatsappLinks, setWhatsappLinks] = useState([]);
  const [copiedLink, setCopiedLink] = useState(null);

  const fetchRaffles = useCallback(async () => {
    try {
      const response = await getRaffles(false);
      setRaffles(response.data);
      const raffleWithWinners = response.data.find(r => r.is_completed);
      if (raffleWithWinners) {
        setSelectedRaffle(raffleWithWinners);
        fetchWinners(raffleWithWinners.id);
      }
    } catch (error) {
      console.error('Error fetching raffles:', error);
    }
  }, []);

  useEffect(() => {
    fetchRaffles();
  }, [fetchRaffles]);

  const fetchWinners = async (raffleId) => {
    setLoading(true);
    try {
      const response = await getRaffleWinners(raffleId);
      setWinners(response.data);
    } catch (error) {
      console.error('Error fetching winners:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsAppLinks = async (raffleId) => {
    try {
      const response = await getWhatsAppLinks(raffleId);
      if (response.data && response.data.winners) {
        setWhatsappLinks(response.data.winners);
        setShowLinksModal(true);
      } else {
        setWhatsappLinks([]);
        setShowLinksModal(true);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp links:', error);
      setWhatsappLinks([]);
      setShowLinksModal(true);
    }
  };

  const handleRaffleChange = (e) => {
    const raffleId = parseInt(e.target.value);
    const raffle = raffles.find(r => r.id === raffleId);
    setSelectedRaffle(raffle);
    if (raffle) {
      fetchWinners(raffle.id);
    }
  };

  const handleMarkNotified = async (winnerId) => {
    try {
      await markWinnerNotified(winnerId);
      if (selectedRaffle) {
        fetchWinners(selectedRaffle.id);
      }
    } catch (error) {
      console.error('Error marking winner as notified:', error);
    }
  };

  const copyToClipboard = (text, linkId) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedLink(linkId);
      setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  const openAllWhatsAppLinks = () => {
    if (whatsappLinks.length === 0) return;
    
    whatsappLinks.forEach(winner => {
      if (winner.whatsapp_link) {
        window.open(winner.whatsapp_link, '_blank');
      }
    });
  };

  const getPositionBadge = (position) => {
    switch (position) {
      case 1:
        return <Badge bg="success">1° Lugar</Badge>;
      case 2:
        return <Badge bg="info">2° Lugar</Badge>;
      case 3:
        return <Badge bg="warning">3° Lugar</Badge>;
      default:
        return <Badge bg="secondary">{position}° Lugar</Badge>;
    }
  };

  return (
    <>
      <Card className="shadow">
        <Card.Header className="bg-info text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="fa fa-list-alt me-2"></i>
              Lista de Ganadores
            </h4>
            {isAdmin && selectedRaffle && winners.length > 0 && (
              <Button
                variant="success"
                size="sm"
                onClick={() => fetchWhatsAppLinks(selectedRaffle.id)}
              >
                <i className="fa fa-whatsapp me-2"></i>
                Contactar por WhatsApp
              </Button>
            )}
          </div>
        </Card.Header>
        
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Seleccionar Rifa</Form.Label>
                <Form.Select
                  value={selectedRaffle?.id || ''}
                  onChange={handleRaffleChange}
                >
                  <option value="">Seleccione una rifa</option>
                  {raffles
                    .filter(raffle => raffle.is_completed)
                    .map(raffle => (
                      <option key={raffle.id} value={raffle.id}>
                        {raffle.title} - {new Date(raffle.draw_date).toLocaleDateString()}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              {selectedRaffle && (
                <Card className="border-primary">
                  <Card.Body className="py-2">
                    <Row>
                      <Col>
                        <small className="text-muted d-block">Premio</small>
                        <strong>{selectedRaffle.prize}</strong>
                      </Col>
                      <Col>
                        <small className="text-muted d-block">Fecha</small>
                        <strong>{new Date(selectedRaffle.draw_date).toLocaleDateString()}</strong>
                      </Col>
                      <Col>
                        <small className="text-muted d-block">Boletos</small>
                        <strong>{selectedRaffle.tickets_sold}/{selectedRaffle.total_tickets}</strong>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando ganadores...</p>
            </div>
          ) : winners.length > 0 ? (
            <div className="table-responsive">
              <Table striped hover className="align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Posición</th>
                    <th>Ganador</th>
                    <th>Número Ganador</th>
                    <th>Premio</th>
                    {isAdmin && <th>Teléfono</th>}
                    {isAdmin && <th>Contactar</th>}
                    <th>Estado</th>
                    {isAdmin && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {winners.map(winner => (
                    <tr key={winner.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="position-indicator me-2">
                            {getPositionBadge(winner.prize_position)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar me-3">
                            <i className="fa fa-user-circle fa-2x text-primary"></i>
                          </div>
                          <div>
                            <strong>{winner.user_name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge bg="primary" className="fs-6">
                          #{winner.ticket_number}
                        </Badge>
                      </td>
                      <td>
                        <div className="prize-info">
                          <strong>{winner.prize_description}</strong>
                        </div>
                      </td>
                      {isAdmin && (
                        <td>
                          <code>{winner.user_phone}</code>
                        </td>
                      )}
                      {isAdmin && (
                        <td>
                          {winner.whatsapp_link && (
                            <Button
                              variant="success"
                              size="sm"
                              href={winner.whatsapp_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="d-flex align-items-center"
                            >
                              <i className="fa fa-whatsapp me-1"></i>
                              WhatsApp
                            </Button>
                          )}
                        </td>
                      )}
                      <td>
                        {winner.notified ? (
                          <Badge bg="success" className="d-flex align-items-center">
                            <i className="fa fa-check-circle me-1"></i>
                            Notificado
                          </Badge>
                        ) : (
                          <Badge bg="warning" className="d-flex align-items-center">
                            <i className="fa fa-clock me-1"></i>
                            Pendiente
                          </Badge>
                        )}
                      </td>
                      {isAdmin && (
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleMarkNotified(winner.id)}
                            disabled={winner.notified}
                            title="Marcar como notificado"
                          >
                            <i className="fa fa-check"></i>
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : selectedRaffle ? (
            <div className="text-center py-5">
              <i className="fa fa-trophy fa-4x text-muted mb-3"></i>
              <h4>No hay ganadores registrados</h4>
              <p className="text-muted">Esta rifa aún no tiene ganadores seleccionados.</p>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fa fa-search fa-4x text-muted mb-3"></i>
              <h4>Seleccione una rifa</h4>
              <p className="text-muted">Elija una rifa completada para ver sus ganadores.</p>
            </div>
          )}

          {winners.length > 0 && (
            <Card className="mt-4 bg-light">
              <Card.Body>
                <Row>
                  <Col md={3} className="text-center">
                    <div className="stat-box">
                      <h2 className="text-primary">{winners.length}</h2>
                      <small className="text-muted">Ganadores Totales</small>
                    </div>
                  </Col>
                  <Col md={3} className="text-center">
                    <div className="stat-box">
                      <h2 className="text-success">
                        {winners.filter(w => w.notified).length}
                      </h2>
                      <small className="text-muted">Notificados</small>
                    </div>
                  </Col>
                  <Col md={3} className="text-center">
                    <div className="stat-box">
                      <h2 className="text-info">
                        {new Set(winners.map(w => w.user_name)).size}
                      </h2>
                      <small className="text-muted">Personas Distintas</small>
                    </div>
                  </Col>
                  <Col md={3} className="text-center">
                    <div className="stat-box">
                      <h2 className="text-warning">
                        {selectedRaffle?.tickets_sold || 0}
                      </h2>
                      <small className="text-muted">Total Participantes</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={showLinksModal}
        onHide={() => setShowLinksModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <i className="fa fa-whatsapp me-2"></i>
            Enlaces de WhatsApp para Ganadores
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRaffle && (
            <Alert variant="info" className="mb-4">
              <i className="fa fa-info-circle me-2"></i>
              <strong>Instrucciones:</strong> Haz clic en "Abrir WhatsApp" para contactar a cada ganador 
              automáticamente, o copia el enlace para compartirlo.
            </Alert>
          )}

          {whatsappLinks.length > 0 ? (
            whatsappLinks.map((winner, index) => (
              <Card key={index} className="mb-3 border-success">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={2}>
                      <Badge bg={winner.position === 1 ? 'success' : winner.position === 2 ? 'info' : 'warning'}>
                        {winner.position}° Lugar
                      </Badge>
                    </Col>
                    <Col md={4}>
                      <div>
                        <strong>{winner.winner_name}</strong>
                        <div className="small text-muted">Boleto: #{winner.ticket_number}</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex gap-2">
                        <Button
                          variant="success"
                          href={winner.whatsapp_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-grow-1"
                        >
                          <i className="fa fa-whatsapp me-2"></i>
                          Abrir WhatsApp
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => copyToClipboard(winner.whatsapp_link, index)}
                          title="Copiar enlace"
                        >
                          {copiedLink === index ? (
                            <i className="fa fa-check text-success"></i>
                          ) : (
                            <i className="fa fa-copy"></i>
                          )}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))
          ) : (
            <div className="text-center py-4">
              <i className="fa fa-warning fa-3x text-warning mb-3"></i>
              <h5>No hay enlaces de WhatsApp disponibles</h5>
              <p className="text-muted">Los ganadores aún no tienen enlaces de contacto generados.</p>
            </div>
          )}

          {whatsappLinks.length > 1 && (
            <div className="mt-4 p-3 bg-light rounded">
              <h6>Contacto Rápido:</h6>
              <div className="d-flex flex-wrap gap-2">
                <Button
                  variant="outline-success"
                  onClick={openAllWhatsAppLinks}
                >
                  <i className="fa fa-external-link me-2"></i>
                  Abrir Todos
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    const allLinks = whatsappLinks.map(w => `${w.winner_name}: ${w.whatsapp_link}`).join('\n\n');
                    copyToClipboard(allLinks, 'all');
                  }}
                >
                  <i className="fa fa-copy me-2"></i>
                  Copiar Todos
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLinksModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default WinnerList;