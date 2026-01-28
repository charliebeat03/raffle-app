import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Badge, Card } from 'react-bootstrap';
import { getPendingTickets, confirmPayment } from '../api';

const PaymentConfirmation = () => {
  const [pendingTickets, setPendingTickets] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchPendingTickets();
  }, []);

  const fetchPendingTickets = async () => {
    try {
      const response = await getPendingTickets();
      setPendingTickets(response.data);
    } catch (error) {
      console.error('Error fetching pending tickets:', error);
    }
  };

  const handleSelectTicket = (ticketId, userId) => {
    setSelectedTickets(prev => {
      if (prev.includes(ticketId)) {
        return prev.filter(id => id !== ticketId);
      } else {
        return [...prev, ticketId];
      }
    });
    setSelectedUser(userId);
  };

  const handleConfirmPayment = async () => {
    if (selectedTickets.length === 0) {
      setMessage({ type: 'warning', text: 'Seleccione al menos un ticket' });
      return;
    }

    setLoading(true);
    try {
      await confirmPayment({
        ticket_ids: selectedTickets,
        user_id: selectedUser
      });
      
      setMessage({ 
        type: 'success', 
        text: `Pago confirmado para ${selectedTickets.length} ticket(s)` 
      });
      
      // Resetear selección
      setSelectedTickets([]);
      setSelectedUser(null);
      setShowConfirmModal(false);
      
      // Refrescar lista
      fetchPendingTickets();
      
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.detail || 'Error confirmando pago'
      });
    } finally {
      setLoading(false);
    }
  };

  const groupTicketsByUser = () => {
    const groups = {};
    pendingTickets.forEach(ticket => {
      if (!groups[ticket.user_id]) {
        groups[ticket.user_id] = {
          user_name: ticket.user_name,
          user_phone: ticket.user_phone,
          user_email: ticket.user_email,
          tickets: []
        };
      }
      groups[ticket.user_id].tickets.push(ticket);
    });
    return groups;
  };

  const userGroups = groupTicketsByUser();

  return (
    <div className="payment-confirmation">
      {message.text && (
        <Alert 
          variant={message.type} 
          onClose={() => setMessage({ type: '', text: '' })} 
          dismissible
        >
          {message.text}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Pagos Pendientes de Confirmación</h5>
        <div>
          <span className="badge bg-warning me-2">
            {pendingTickets.length} tickets pendientes
          </span>
          {selectedTickets.length > 0 && (
            <Button
              variant="success"
              size="sm"
              onClick={() => setShowConfirmModal(true)}
              disabled={loading}
            >
              <i className="fa fa-check me-1"></i>
              Confirmar {selectedTickets.length} Pago(s)
            </Button>
          )}
        </div>
      </div>

      {Object.keys(userGroups).length === 0 ? (
        <Alert variant="info">
          <i className="fa fa-check-circle me-2"></i>
          No hay pagos pendientes de confirmación
        </Alert>
      ) : (
        Object.entries(userGroups).map(([userId, userData]) => (
          <Card key={userId} className="mb-3 border-warning">
            <Card.Header className="bg-warning text-dark">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{userData.user_name}</strong>
                  <div className="small">
                    📞 {userData.user_phone} | ✉️ {userData.user_email || 'No email'}
                  </div>
                </div>
                <Badge bg="secondary">
                  {userData.tickets.length} ticket(s)
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th width="50">#</th>
                    <th>Rifa</th>
                    <th>Número</th>
                    <th>Precio</th>
                    <th>Reservado hace</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {userData.tickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedTickets.includes(ticket.id)}
                          onChange={() => handleSelectTicket(ticket.id, parseInt(userId))}
                        />
                      </td>
                      <td>
                        <div className="small">
                          {ticket.raffle_title}
                        </div>
                      </td>
                      <td>
                        <Badge bg="primary">#{ticket.ticket_number}</Badge>
                      </td>
                      <td>${ticket.ticket_price}</td>
                      <td>
                        {ticket.days_ago === 0 ? 'Hoy' : 
                         ticket.days_ago === 1 ? 'Ayer' : 
                         `Hace ${ticket.days_ago} días`}
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => window.open(`https://wa.me/${userData.user_phone}`, '_blank')}
                        >
                          <i className="fa fa-whatsapp me-1"></i>
                          Contactar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              <div className="d-flex justify-content-between align-items-center mt-2">
                <div>
                  <strong>Total: </strong>
                  ${userData.tickets.reduce((sum, t) => sum + t.ticket_price, 0).toFixed(2)}
                </div>
                <div>
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => {
                      const userTicketIds = userData.tickets.map(t => t.id);
                      setSelectedTickets(userTicketIds);
                      setSelectedUser(parseInt(userId));
                      setShowConfirmModal(true);
                    }}
                  >
                    <i className="fa fa-check-circle me-1"></i>
                    Confirmar Todos
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        ))
      )}

      {/* Modal de confirmación */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <i className="fa fa-check-circle me-2"></i>
            Confirmar Pago
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <i className="fa fa-exclamation-triangle me-2"></i>
            <strong>¡Atención!</strong> Esta acción marcará los tickets seleccionados como pagados.
            Asegúrese de haber recibido el pago del cliente.
          </Alert>
          
          <p>
            <strong>Tickets a confirmar:</strong> {selectedTickets.length}
          </p>
          <p>
            <strong>Usuario:</strong> {
              userGroups[selectedUser]?.user_name || 'No seleccionado'
            }
          </p>
          <p>
            <strong>Total:</strong> $
            {selectedTickets.reduce((sum, id) => {
              const ticket = pendingTickets.find(t => t.id === id);
              return sum + (ticket?.ticket_price || 0);
            }, 0).toFixed(2)}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="success"
            onClick={handleConfirmPayment}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Confirmando...
              </>
            ) : (
              'Confirmar Pago'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PaymentConfirmation;