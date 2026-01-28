import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Alert, Row, Col, Modal, Form, Table, Badge } from 'react-bootstrap';
import Confetti from 'react-confetti';
import { performDraw, getRaffles, getRaffleWinners, getRaffleTickets } from '../api';
import { io } from 'socket.io-client';
import 'font-awesome/css/font-awesome.min.css';
import './Wheel.css';

const Wheel = ({ isAdmin }) => {
  const [raffles, setRaffles] = useState([]);
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [winners, setWinners] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [whatsappLinks, setWhatsappLinks] = useState([]);
  const [availableTickets, setAvailableTickets] = useState([]);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
  const wheelRef = useRef(null);
  const svgRef = useRef(null);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchRaffles();
    
    // Conectar Socket.IO
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const baseUrl = apiUrl.replace('/api', '');
    
    const newSocket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        console.log('Conectado al servidor Socket.IO');
      });

      socket.on('wheel_spin', (data) => {
        // Actualizar animación de ruleta para todos los usuarios
        if (data.raffleId === selectedRaffle?.id) {
          animateWheelForViewers(data.angle, data.winningNumber);
        }
      });

      socket.on('winner_selected', (data) => {
        // Actualizar lista de ganadores en tiempo real
        if (data.raffleId === selectedRaffle?.id) {
          setWinners(prev => [...prev, data.winner]);
          setCurrentWinnerIndex(prev => prev + 1);
        }
      });

      socket.on('disconnect', () => {
        console.log('Desconectado del servidor Socket.IO');
      });
    }
  }, [socket, selectedRaffle]);

  useEffect(() => {
    if (selectedRaffle) {
      fetchWinners(selectedRaffle.id);
      fetchAvailableTickets(selectedRaffle.id);
      resetWheel();
    }
  }, [selectedRaffle]);

  const fetchRaffles = async () => {
    try {
      const response = await getRaffles(false);
      setRaffles(response.data);
      if (response.data.length > 0) {
        setSelectedRaffle(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching raffles:', error);
    }
  };

  const fetchWinners = async (raffleId) => {
    try {
      const response = await getRaffleWinners(raffleId);
      setWinners(response.data);
      const links = response.data
        .filter(w => w.whatsapp_link)
        .map(w => ({
          name: w.user_name,
          link: w.whatsapp_link,
          position: w.prize_position,
          ticket: w.ticket_number
        }));
      setWhatsappLinks(links);
      
      const drawn = response.data.map(w => w.ticket_number);
      setDrawnNumbers(drawn);
      setCurrentWinnerIndex(drawn.length);
    } catch (error) {
      console.error('Error fetching winners:', error);
    }
  };

  const fetchAvailableTickets = async (raffleId) => {
    try {
      const response = await getRaffleTickets(raffleId);
      setAvailableTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const resetWheel = () => {
    if (svgRef.current) {
      svgRef.current.style.transition = 'none';
      svgRef.current.style.transform = 'rotate(0deg)';
      setCurrentAngle(0);
    }
  };

  const handleSpinWheel = async () => {
    if (!selectedRaffle) {
      setMessage({ type: 'warning', text: 'Seleccione una rifa primero' });
      return;
    }

    if (currentWinnerIndex >= 3) {
      setMessage({ type: 'warning', text: 'Ya se han seleccionado los 3 ganadores' });
      return;
    }

    setSpinning(true);
    setMessage({ type: '', text: '' });

    try {
      const existingWinners = winners.map(w => w.user_id);
      const availableForDraw = availableTickets.filter(ticket => 
        !drawnNumbers.includes(ticket.ticket_number) && 
        !existingWinners.includes(ticket.user_id)
      );
      
      if (availableForDraw.length === 0) {
        setMessage({ type: 'danger', text: 'No hay boletos disponibles para sortear' });
        setSpinning(false);
        return;
      }

      const randomIndex = Math.floor(Math.random() * availableForDraw.length);
      const winningTicket = availableForDraw[randomIndex];
      const winningNumber = winningTicket.ticket_number;

      const anglePerNumber = 3.6;
      const winningAngle = (winningNumber - 1) * anglePerNumber;
      const fullRotations = 5;
      const baseRotation = fullRotations * 360;
      const targetRotation = baseRotation + (360 - winningAngle);
      
      console.log(`Número: ${winningNumber}, Ángulo: ${winningAngle}°, Rotación objetivo: ${targetRotation}°`);

      // Aplicar animación de giro
      if (svgRef.current) {
        svgRef.current.style.transition = 'transform 5s cubic-bezier(0.17, 0.67, 0.3, 0.99)';
        svgRef.current.style.transform = `rotate(${targetRotation}deg)`;
      }

      // Enviar evento Socket.IO
      if (socket) {
        socket.emit('wheel_spin', {
          raffleId: selectedRaffle.id,
          angle: targetRotation,
          winningNumber: winningNumber
        });
      }

      // Esperar a que termine la animación para registrar el ganador
      setTimeout(async () => {
        try {
          const response = await performDraw({
            raffle_id: selectedRaffle.id,
            winning_ticket_id: winningTicket.id,
            prize_position: currentWinnerIndex + 1
          });

          const newWinner = response.data;
          setWinners(prev => [...prev, newWinner]);
          setDrawnNumbers(prev => [...prev, winningNumber]);
          setCurrentWinnerIndex(prev => prev + 1);
          setCurrentAngle(targetRotation % 360);

          if (newWinner.whatsapp_link) {
            setWhatsappLinks(prev => [...prev, {
              name: newWinner.user_name,
              link: newWinner.whatsapp_link,
              position: newWinner.prize_position,
              ticket: newWinner.ticket_number
            }]);
          }

          if (socket) {
            socket.emit('winner_selected', {
              raffleId: selectedRaffle.id,
              winner: newWinner
            });
          }

          if (currentWinnerIndex + 1 === 3) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
            setShowWinnersModal(true);
            fetchRaffles();
          }

          setMessage({
            type: 'success',
            text: `¡Ganador ${currentWinnerIndex + 1} seleccionado! Número: ${winningNumber}`
          });

        } catch (error) {
          setMessage({
            type: 'danger',
            text: error.response?.data?.detail || 'Error al registrar el ganador'
          });
        } finally {
          setSpinning(false);
        }
      }, 5000);

    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.detail || 'Error al realizar el sorteo'
      });
      setSpinning(false);
    }
  };

  const animateWheelForViewers = (angle, winningNumber) => {
    // Animación para usuarios que solo ven
    if (svgRef.current) {
      svgRef.current.style.transition = 'transform 5s cubic-bezier(0.17, 0.67, 0.3, 0.99)';
      svgRef.current.style.transform = `rotate(${angle}deg)`;
      
      setTimeout(() => {
        setMessage({
          type: 'info',
          text: `¡Número ganador: ${winningNumber}!`
        });
      }, 5000);
    }
  };

  const openAllWhatsAppLinks = () => {
    if (whatsappLinks.length === 0) {
      setMessage({ type: 'warning', text: 'No hay enlaces de WhatsApp disponibles' });
      return;
    }
    
    whatsappLinks.forEach(winner => {
      if (winner.link) {
        window.open(winner.link, '_blank');
      }
    });
  };

  const renderWheelSegments = () => {
    const segments = [];
    const radius = 180;
    const centerX = 200;
    const centerY = 200;
    const angleStep = (2 * Math.PI) / 100;
    
    const offsetAngle = -Math.PI / 2;

    for (let i = 0; i < 100; i++) {
      const angle = i * angleStep + offsetAngle;
      const nextAngle = (i + 1) * angleStep + offsetAngle;
      
      const color = i % 2 === 0 ? '#FF0000' : '#000000';
      const textColor = i % 2 === 0 ? '#FFFFFF' : '#FFFFFF';
      
      const x1 = centerX + radius * Math.cos(angle);
      const y1 = centerY + radius * Math.sin(angle);
      const x2 = centerX + radius * Math.cos(nextAngle);
      const y2 = centerY + radius * Math.sin(nextAngle);

      const textRadius = radius - 25;
      const textX = centerX + textRadius * Math.cos(angle + angleStep / 2);
      const textY = centerY + textRadius * Math.sin(angle + angleStep / 2);
      
      const textAngle = (angle + angleStep / 2) * (180 / Math.PI);

      segments.push(
        <g key={`segment-${i + 1}`} className={drawnNumbers.includes(i + 1) ? 'wheel-number-opaque' : ''}>
          <path
            d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
            fill={color}
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          
          <line
            x1={centerX}
            y1={centerY}
            x2={x1}
            y2={y1}
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          
          <text
            x={textX}
            y={textY}
            className="wheel-number"
            fill={textColor}
            transform={`rotate(${textAngle}, ${textX}, ${textY})`}
            style={{ fontSize: '10px', fontWeight: 'bold' }}
          >
            {i + 1}
          </text>
        </g>
      );
    }

    return segments;
  };

  return (
    <div className="wheel-container">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={300}
          gravity={0.1}
        />
      )}

      <Card className="shadow">
        <Card.Header className="bg-danger text-white">
          <h4 className="mb-0">
            <i className="fa fa-trophy me-2"></i>
            Ruleta de Sorteo
          </h4>
        </Card.Header>
        
        <Card.Body>
          {message.text && (
            <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
              {message.text}
            </Alert>
          )}

          <Row>
            <Col lg={4} md={12}>
              <Card className="mb-3">
                <Card.Header>
                  <h5>Configuración del Sorteo</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Seleccionar Rifa</Form.Label>
                    <Form.Select
                      value={selectedRaffle?.id || ''}
                      onChange={(e) => {
                        const raffle = raffles.find(r => r.id === parseInt(e.target.value));
                        setSelectedRaffle(raffle);
                        setDrawnNumbers([]);
                        setCurrentWinnerIndex(0);
                        setCurrentAngle(0);
                      }}
                      disabled={spinning}
                    >
                      {raffles.map(raffle => (
                        <option key={raffle.id} value={raffle.id}>
                          {raffle.title} ({raffle.tickets_sold}/{raffle.total_tickets})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  {selectedRaffle && (
                    <Card className="bg-light">
                      <Card.Body>
                        <div className="mb-2">
                          <strong>1° Premio:</strong> {selectedRaffle.prize_first}
                        </div>
                        <div className="mb-2">
                          <strong>2° Premio:</strong> {selectedRaffle.prize_second}
                        </div>
                        <div className="mb-2">
                          <strong>3° Premio:</strong> {selectedRaffle.prize_third}
                        </div>
                        <p><strong>Boletos vendidos:</strong> {selectedRaffle.tickets_sold}</p>
                        <p><strong>Estado:</strong> 
                          <span className={`badge ${selectedRaffle.is_completed ? 'bg-danger' : 'bg-success'} ms-2`}>
                            {selectedRaffle.is_completed ? 'Completada' : 'Activa'}
                          </span>
                        </p>
                        {selectedRaffle.draw_date && (
                          <p><strong>Fecha del sorteo:</strong> {new Date(selectedRaffle.draw_date).toLocaleDateString()}</p>
                        )}
                        <p><strong>Ganadores seleccionados:</strong> {currentWinnerIndex}/3</p>
                        {drawnNumbers.length > 0 && (
                          <p><strong>Números sorteados:</strong> {drawnNumbers.sort((a, b) => a - b).join(', ')}</p>
                        )}
                      </Card.Body>
                    </Card>
                  )}

                  {isAdmin && (
                    <>
                      <Button
                        variant="danger"
                        onClick={handleSpinWheel}
                        disabled={spinning || !selectedRaffle || selectedRaffle?.is_completed || currentWinnerIndex >= 3}
                        className="w-100 mt-3"
                        size="lg"
                      >
                        {spinning ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Girando...
                          </>
                        ) : (
                          <>
                            <i className="fa fa-play me-2"></i>
                            {currentWinnerIndex === 0 ? 'Iniciar Sorteo' : `Seleccionar Ganador ${currentWinnerIndex + 1}`}
                          </>
                        )}
                      </Button>

                      {whatsappLinks.length > 0 && (
                        <Button
                          variant="success"
                          onClick={openAllWhatsAppLinks}
                          className="w-100 mt-2"
                        >
                          <i className="fa fa-whatsapp me-2"></i>
                          Contactar a Todos los Ganadores
                        </Button>
                      )}
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={8} md={12}>
              <div className="wheel-wrapper">
                <div className="wheel-indicator"></div>
                <div className="wheel-stand"></div>
                <svg
                  ref={svgRef}
                  className="wheel-svg"
                  viewBox="0 0 400 400"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ transform: `rotate(${currentAngle}deg)` }}
                >
                  <circle cx="200" cy="200" r="190" className="wheel-border" />
                  
                  {renderWheelSegments()}
                  
                  <circle cx="200" cy="200" r="30" className="wheel-center" />
                  
                  {Array.from({ length: 20 }).map((_, i) => (
                    <line
                      key={`pointer-${i}`}
                      x1="200"
                      y1="200"
                      x2="400"
                      y2="200"
                      stroke="#654321"
                      strokeWidth="2"
                      transform={`rotate(${i * 18}, 200, 200)`}
                    />
                  ))}
                </svg>
              </div>

              <div className="mt-4 text-center">
                <h5>Progreso del Sorteo</h5>
                <div className="d-flex justify-content-center mb-3">
                  {[1, 2, 3].map((position) => (
                    <div
                      key={position}
                      className={`mx-2 p-3 rounded-circle ${currentWinnerIndex >= position ? 'bg-success' : 'bg-secondary'}`}
                      style={{ width: '50px', height: '50px', color: 'white' }}
                    >
                      <strong>{position}°</strong>
                    </div>
                  ))}
                </div>
                <p className="text-muted">Se deben seleccionar 3 ganadores. Cada giro selecciona un ganador.</p>
              </div>
            </Col>
          </Row>

          {winners.length > 0 && (
            <Card className="mt-4 border-warning">
              <Card.Header className="bg-warning">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Ganadores Seleccionados</h5>
                  {whatsappLinks.length > 0 && isAdmin && (
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={openAllWhatsAppLinks}
                    >
                      <i className="fa fa-whatsapp me-1"></i>
                      Contactar Todos
                    </Button>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                <Row>
                  {winners.map(winner => (
                    <Col lg={4} md={6} sm={12} key={winner.id} className="mb-3">
                      <Card className={`h-100 ${winner.prize_position === 1 ? 'border-success' : ''}`}>
                        <Card.Header className={`${winner.prize_position === 1 ? 'bg-success' : 'bg-info'} text-white`}>
                          <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                              <i className={`fa fa-${winner.prize_position === 1 ? 'trophy' : winner.prize_position === 2 ? 'medal' : 'award'} me-2`}></i>
                              {winner.prize_position}° Lugar
                            </h5>
                            {winner.whatsapp_link && isAdmin && (
                              <Button
                                variant="light"
                                size="sm"
                                href={winner.whatsapp_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1"
                              >
                                <i className="fa fa-whatsapp text-success"></i>
                              </Button>
                            )}
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <div className="text-center mb-3">
                            <div className="winner-avatar">
                              <i className="fa fa-user fa-3x text-primary"></i>
                            </div>
                            <h4 className="mt-2">{winner.user_name}</h4>
                          </div>
                          <p><strong>Número ganador:</strong> {winner.ticket_number}</p>
                          <p><strong>Premio:</strong> {winner.prize_description}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <span>
                              <strong>Notificado:</strong>
                              <span className={`badge ${winner.notified ? 'bg-success' : 'bg-warning'} ms-2`}>
                                {winner.notified ? 'Sí' : 'No'}
                              </span>
                            </span>
                            {winner.whatsapp_link && isAdmin && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                href={winner.whatsapp_link}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <i className="fa fa-whatsapp me-1"></i>
                                Contactar
                              </Button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Wheel;
