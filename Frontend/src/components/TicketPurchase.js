import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Row, Col, Modal, Badge, ProgressBar } from 'react-bootstrap';
import { purchaseTickets, createUser, getRaffles, getRaffleTickets, getUsers, getUserTickets } from '../api';
import 'font-awesome/css/font-awesome.min.css';
import './TicketPurchase.css';

const TicketPurchase = () => {
  const [mode, setMode] = useState('login');
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [reservedTickets, setReservedTickets] = useState([]);
  const [raffles, setRaffles] = useState([]);
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [showNumberModal, setShowNumberModal] = useState(false);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [whatsappLinks, setWhatsappLinks] = useState([]);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [reservedUntil, setReservedUntil] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  const [loginData, setLoginData] = useState({ phone: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [purchaseData, setPurchaseData] = useState({
    raffleId: '',
    quantity: ''
  });

  useEffect(() => {
    fetchRaffles();
  }, []);

  useEffect(() => {
    if (user && purchaseData.raffleId) {
      const raffle = raffles.find(r => r.id === parseInt(purchaseData.raffleId));
      setSelectedRaffle(raffle);
      if (raffle) {
        fetchAvailableNumbers(raffle.id);
        updateMaxQuantity(raffle);
      }
    }
  }, [purchaseData.raffleId, raffles, user]);

  useEffect(() => {
    if (user) {
      fetchUserTickets();
    }
  }, [user]);

  useEffect(() => {
    if (reservedUntil) {
      const timer = setInterval(() => {
        updateTimeLeft();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [reservedUntil]);

  const updateTimeLeft = () => {
    if (!reservedUntil) return;
    
    const now = new Date();
    const reservedDate = new Date(reservedUntil);
    const diff = reservedDate - now;
    
    if (diff <= 0) {
      setTimeLeft('Tiempo expirado');
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
  };

  const updateMaxQuantity = (raffle) => {
    if (!raffle) return;
    const totalOccupied = raffle.tickets_sold + raffle.tickets_reserved;
    const available = raffle.total_tickets - totalOccupied;
    setMaxQuantity(available);
    
    if (purchaseData.quantity && parseInt(purchaseData.quantity) > available) {
      setPurchaseData(prev => ({ ...prev, quantity: '' }));
      setSelectedNumbers([]);
      setValidationErrors(prev => ({
        ...prev,
        quantity: `Máximo ${available} boletos disponibles`
      }));
    }
  };

  const fetchRaffles = async () => {
    try {
      const response = await getRaffles(true);
      setRaffles(response.data);
      if (response.data.length > 0 && !user) {
        setPurchaseData(prev => ({ ...prev, raffleId: response.data[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error fetching raffles:', error);
    }
  };

  const fetchUserTickets = async () => {
    if (!user) return;
    
    try {
      const response = await getUserTickets(user.id);
      const userTickets = response.data || [];
      
      // Separar tickets reservados y pagados
      const reserved = userTickets.filter(t => t.status === 'reserved');
      const paid = userTickets.filter(t => t.status === 'paid');
      
      setReservedTickets(reserved);
      setTickets(paid);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
    }
  };

  const fetchAvailableNumbers = async (raffleId) => {
    setLoadingNumbers(true);
    try {
      const response = await getRaffleTickets(raffleId);
      
      const totalTickets = selectedRaffle?.total_tickets || 100;
      const allNumbers = Array.from({ length: totalTickets }, (_, i) => i + 1);
      
      const soldTickets = response.data || [];
      const soldNumbers = soldTickets
        .filter(t => t.status === 'paid' || t.status === 'reserved')
        .map(ticket => ticket.ticket_number);
      
      const available = allNumbers.filter(number => !soldNumbers.includes(number));
      
      setAvailableNumbers(available);
    } catch (error) {
      console.error('Error fetching available numbers:', error);
      const totalTickets = selectedRaffle?.total_tickets || 100;
      const allNumbers = Array.from({ length: totalTickets }, (_, i) => i + 1);
      setAvailableNumbers(allNumbers);
    } finally {
      setLoadingNumbers(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginData.phone) {
      setMessage({ type: 'danger', text: 'El teléfono es requerido' });
      return;
    }

    setLoading(true);
    try {
      const response = await getUsers();
      const users = response.data;
      const foundUser = users.find(u => u.phone === loginData.phone);
      
      if (foundUser) {
        setUser(foundUser);
        setMessage({ type: 'success', text: 'Inicio de sesión exitoso' });
        if (raffles.length > 0) {
          setPurchaseData(prev => ({ ...prev, raffleId: raffles[0].id.toString() }));
        }
        fetchUserTickets();
      } else {
        setMessage({ 
          type: 'warning', 
          text: 'Usuario no encontrado. Regístrese para continuar.' 
        });
        setRegisterData(prev => ({ ...prev, phone: loginData.phone }));
        setMode('register');
      }
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.detail || 'Error al buscar usuario'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!registerData.name || !registerData.phone) {
      setMessage({ type: 'danger', text: 'Nombre y teléfono son requeridos' });
      return;
    }

    setLoading(true);
    try {
      const response = await createUser({
        name: registerData.name,
        phone: registerData.phone,
        email: registerData.email || null
      });
      
      setUser(response.data);
      setMessage({ 
        type: 'success', 
        text: 'Registro exitoso. Sesión iniciada automáticamente.' 
      });
      
      if (raffles.length > 0) {
        setPurchaseData(prev => ({ ...prev, raffleId: raffles[0].id.toString() }));
      }
      
      setRegisterData({
        name: '',
        phone: '',
        email: ''
      });
      
      fetchUserTickets();
      
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.detail || 'Error al registrar usuario'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNumberSelection = (number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        const quantity = parseInt(purchaseData.quantity) || 0;
        if (prev.length < quantity) {
          return [...prev, number];
        } else {
          setMessage({ type: 'warning', text: `Solo puedes seleccionar ${quantity} número(s)` });
          return prev;
        }
      }
    });
  };

  const handleTicketReservation = async () => {
    if (!user || !purchaseData.raffleId || selectedNumbers.length === 0) {
      setMessage({ type: 'danger', text: 'Complete todos los campos requeridos y seleccione los números' });
      return;
    }

    const quantity = parseInt(purchaseData.quantity);
    if (selectedNumbers.length !== quantity) {
      setMessage({ type: 'warning', text: `Debe seleccionar exactamente ${quantity} número(s)` });
      return;
    }

    if (!selectedRaffle.is_active) {
      setMessage({ type: 'warning', text: 'Esta rifa no está activa' });
      return;
    }

    setLoading(true);
    try {
      const response = await purchaseTickets({
        user_id: user.id,
        raffle_id: parseInt(purchaseData.raffleId),
        ticket_numbers: selectedNumbers
      });

      const reservedTickets = response.data.tickets;
      const whatsappLinks = response.data.whatsapp_links;
      const reservedUntil = response.data.reserved_until;
      
      setReservedUntil(reservedUntil);
      updateTimeLeft();
      
      const totalCost = reservedTickets.length * selectedRaffle.ticket_price;
      
      setMessage({
        type: 'warning',
        text: `¡Reserva exitosa! ${reservedTickets.length} boleto(s) reservado(s). Total: $${totalCost}. Tienes 24 horas para completar el pago.`
      });

      fetchRaffles();
      fetchAvailableNumbers(selectedRaffle.id);
      fetchUserTickets();
      setSelectedNumbers([]);
      setPurchaseData(prev => ({ ...prev, quantity: '' }));
      
      if (whatsappLinks.length > 0) {
        setWhatsappLinks(whatsappLinks);
        setShowWhatsAppModal(true);
      }
      
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.detail || 'Error al reservar boletos'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedRaffle) return 0;
    return selectedNumbers.length * selectedRaffle.ticket_price;
  };

  const renderNumberGrid = () => {
    const totalTickets = selectedRaffle?.total_tickets || 100;
    const numbers = Array.from({ length: totalTickets }, (_, i) => i + 1);
    
    return (
      <div className="number-grid-selector">
        {numbers.map(number => {
          const isAvailable = availableNumbers.includes(number);
          const isSelected = selectedNumbers.includes(number);
          
          return (
            <button
              key={number}
              className={`number-button ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}`}
              onClick={() => isAvailable && handleNumberSelection(number)}
              disabled={!isAvailable || !purchaseData.quantity}
              type="button"
            >
              {number}
            </button>
          );
        })}
      </div>
    );
  };

  const isReservationReady = () => {
    const quantity = parseInt(purchaseData.quantity) || 0;
    return user && 
           purchaseData.raffleId && 
           selectedNumbers.length > 0 && 
           quantity > 0 &&
           selectedNumbers.length === quantity;
  };

  const clearQuantity = () => {
    setPurchaseData(prev => ({ ...prev, quantity: '' }));
    setSelectedNumbers([]);
    setValidationErrors(prev => ({ ...prev, quantity: null }));
  };

  const handleLogout = () => {
    setUser(null);
    setMode('login');
    setPurchaseData({ raffleId: '', quantity: '' });
    setSelectedNumbers([]);
    setTickets([]);
    setReservedTickets([]);
    setReservedUntil(null);
    setTimeLeft('');
    setMessage({ type: 'info', text: 'Sesión cerrada exitosamente' });
  };

  const openWhatsAppLink = (link) => {
    window.open(link, '_blank');
  };

  return (
    <div className="ticket-purchase">
      <Card className="shadow">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">
            <i className="fa fa-ticket me-2"></i>
            Comprar Boletos
          </h4>
        </Card.Header>
        
        <Card.Body>
          {message.text && (
            <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
              {message.text}
            </Alert>
          )}

          {!user ? (
            <Row className="justify-content-center">
              <Col lg={6} md={8} sm={12}>
                <Card className="border-primary">
                  <Card.Header className="bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        {mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
                      </h5>
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                      >
                        {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {mode === 'login' ? (
                      <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3">
                          <Form.Label>Teléfono *</Form.Label>
                          <Form.Control
                            type="tel"
                            value={loginData.phone}
                            onChange={(e) => setLoginData({ phone: e.target.value })}
                            placeholder="Ingrese su teléfono"
                            required
                            disabled={loading}
                          />
                          <Form.Text className="text-muted">
                            Ingrese el teléfono con el que se registró
                          </Form.Text>
                        </Form.Group>

                        <Button
                          variant="primary"
                          type="submit"
                          disabled={loading || !loginData.phone}
                          className="w-100"
                        >
                          {loading ? 'Verificando...' : 'Iniciar Sesión'}
                        </Button>

                        <div className="text-center mt-3">
                          <Button
                            variant="link"
                            onClick={() => setMode('register')}
                            className="text-decoration-none"
                          >
                            ¿Primera vez? Regístrese aquí
                          </Button>
                        </div>
                      </Form>
                    ) : (
                      <Form onSubmit={handleRegister}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nombre Completo *</Form.Label>
                          <Form.Control
                            type="text"
                            value={registerData.name}
                            onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                            placeholder="Ingrese su nombre"
                            required
                            disabled={loading}
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Teléfono *</Form.Label>
                          <Form.Control
                            type="tel"
                            value={registerData.phone}
                            onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                            placeholder="Ingrese su teléfono"
                            required
                            disabled={loading}
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Email (opcional)</Form.Label>
                          <Form.Control
                            type="email"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                            placeholder="Ingrese su email"
                            disabled={loading}
                          />
                        </Form.Group>

                        <Button
                          variant="success"
                          type="submit"
                          disabled={loading || !registerData.name || !registerData.phone}
                          className="w-100"
                        >
                          {loading ? 'Registrando...' : 'Registrarse e Iniciar Sesión'}
                        </Button>

                        <div className="text-center mt-3">
                          <Button
                            variant="link"
                            onClick={() => setMode('login')}
                            className="text-decoration-none"
                          >
                            ¿Ya tienes cuenta? Inicia sesión aquí
                          </Button>
                        </div>
                      </Form>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ) : (
            <>
              <Alert variant="info" className="d-flex justify-content-between align-items-center">
                <div>
                  <i className="fa fa-user me-2"></i>
                  Bienvenido: <strong>{user.name}</strong> ({user.phone})
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleLogout}
                >
                  <i className="fa fa-sign-out me-1"></i>
                  Cerrar Sesión
                </Button>
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>Seleccionar Rifa</Form.Label>
                <Form.Select
                  value={purchaseData.raffleId}
                  onChange={(e) => {
                    setPurchaseData({...purchaseData, raffleId: e.target.value});
                    setSelectedNumbers([]);
                  }}
                  disabled={loading}
                >
                  {raffles.map(raffle => (
                    <option key={raffle.id} value={raffle.id}>
                      {raffle.title} - ${raffle.ticket_price} c/u ({raffle.tickets_sold + raffle.tickets_reserved}/{raffle.total_tickets})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {selectedRaffle && (
                <Card className="mb-3 bg-light">
                  <Card.Body>
                    <h5>{selectedRaffle.title}</h5>
                    <p className="mb-1">{selectedRaffle.description}</p>
                    
                    <div className="prizes-section mb-3">
                      <h6>Premios:</h6>
                      <div className="d-flex flex-wrap gap-2">
                        <Badge bg="success" className="fs-6 p-2">
                          1°: {selectedRaffle.prize_first}
                        </Badge>
                        <Badge bg="info" className="fs-6 p-2">
                          2°: {selectedRaffle.prize_second}
                        </Badge>
                        <Badge bg="warning" className="fs-6 p-2">
                          3°: {selectedRaffle.prize_third}
                        </Badge>
                      </div>
                    </div>

                    <div className="progress-stats mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Progreso de venta</span>
                        <span>{selectedRaffle.tickets_sold + selectedRaffle.tickets_reserved}/{selectedRaffle.total_tickets}</span>
                      </div>
                      <ProgressBar>
                        <ProgressBar 
                          variant="success" 
                          now={(selectedRaffle.tickets_sold / selectedRaffle.total_tickets) * 100} 
                          key={1}
                          label="Pagados"
                        />
                        <ProgressBar 
                          variant="warning" 
                          now={(selectedRaffle.tickets_reserved / selectedRaffle.total_tickets) * 100} 
                          key={2}
                          label="Reservados"
                        />
                      </ProgressBar>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-1">
                          <strong>Boletos disponibles:</strong> {maxQuantity}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-0">
                          <strong>Precio por boleto:</strong> ${selectedRaffle.ticket_price}
                        </p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              )}

              <Row>
                <Col lg={6} md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cantidad de Boletos *</Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type="number"
                        value={purchaseData.quantity}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*$/.test(value)) {
                            const numValue = value === '' ? '' : parseInt(value);
                            if (value === '') {
                              setPurchaseData({...purchaseData, quantity: ''});
                              setSelectedNumbers([]);
                              return;
                            }
                            setPurchaseData({...purchaseData, quantity: numValue});
                            
                            if (selectedNumbers.length > numValue) {
                              setSelectedNumbers(prev => prev.slice(0, numValue));
                            }
                          }
                        }}
                        min="1"
                        max={maxQuantity}
                        disabled={loading || !selectedRaffle || maxQuantity === 0}
                        isInvalid={!!validationErrors.quantity}
                        placeholder={`Máximo ${maxQuantity}`}
                      />
                      {purchaseData.quantity && (
                        <Button
                          variant="outline-secondary"
                          onClick={clearQuantity}
                          disabled={loading}
                        >
                          <i className="fa fa-times"></i>
                        </Button>
                      )}
                    </div>
                    {validationErrors.quantity ? (
                      <Form.Text className="text-danger">
                        {validationErrors.quantity}
                      </Form.Text>
                    ) : (
                      <Form.Text className="text-muted">
                        {maxQuantity > 0 ? 
                          `Ingrese la cantidad (1-${maxQuantity})` : 
                          'No hay boletos disponibles'}
                      </Form.Text>
                    )}
                  </Form.Group>

                  <Button
                    variant="outline-primary"
                    onClick={() => setShowNumberModal(true)}
                    disabled={loading || !selectedRaffle || !purchaseData.quantity || loadingNumbers || !!validationErrors.quantity}
                    className="w-100 mb-3"
                  >
                    <i className="fa fa-hand-pointer me-2"></i>
                    {loadingNumbers ? 'Cargando números...' : 
                     purchaseData.quantity ? 
                       `Seleccionar ${purchaseData.quantity} Número(s)` : 
                       'Ingrese cantidad primero'}
                  </Button>
                  
                  {selectedNumbers.length > 0 && (
                    <div className="selected-numbers-container mb-3">
                      <h6>Números seleccionados:</h6>
                      <div className="selected-numbers">
                        {selectedNumbers.sort((a, b) => a - b).map(number => (
                          <span key={number} className="selected-number-badge">
                            {number}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Col>
                
                <Col lg={6} md={12}>
                  <Card className="bg-warning bg-opacity-10">
                    <Card.Body className="text-center">
                      <h5>Total a Pagar</h5>
                      <h3 className="text-success">${calculateTotal()}</h3>
                      <small className="text-muted">
                        {selectedNumbers.length} x ${selectedRaffle?.ticket_price || 0}
                      </small>
                      <div className="mt-2">
                        <div className="selected-count">
                          <strong>Seleccionados:</strong> {selectedNumbers.length} de {purchaseData.quantity || 0}
                        </div>
                        {purchaseData.quantity && selectedNumbers.length !== parseInt(purchaseData.quantity) && (
                          <Alert variant="warning" className="mt-2 py-1">
                            <small>
                              <i className="fa fa-exclamation-triangle me-1"></i>
                              Debe seleccionar {purchaseData.quantity} número(s)
                            </small>
                          </Alert>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Button
                variant="warning"
                onClick={handleTicketReservation}
                disabled={loading || !isReservationReady()}
                className="w-100 mt-3"
                size="lg"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <i className="fa fa-clock me-2"></i>
                    Reservar Boletos Seleccionados
                  </>
                )}
              </Button>

              {reservedUntil && timeLeft && (
                <Alert variant="warning" className="mt-3">
                  <i className="fa fa-clock me-2"></i>
                  <strong>Tienes reservas pendientes de pago.</strong>
                  <div className="mt-1">
                    Tiempo restante: <strong>{timeLeft}</strong>
                    <div className="small text-muted">
                      Contacta al administrador para completar el pago antes de que expire el tiempo.
                    </div>
                  </div>
                </Alert>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal para seleccionar números */}
      <Modal show={showNumberModal} onHide={() => setShowNumberModal(false)} size="xl">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fa fa-th-list me-2"></i>
            Seleccionar Números de Boletos
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingNumbers ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando números disponibles...</span>
              </div>
              <p className="mt-2">Cargando números disponibles...</p>
            </div>
          ) : (
            <>
              <Alert variant="info">
                <i className="fa fa-info-circle me-2"></i>
                Seleccione {purchaseData.quantity || 0} número(s) de los disponibles. 
                Haga clic en un número para seleccionarlo/deseleccionarlo.
                <div className="mt-1">
                  <span className="badge bg-success me-2">Disponible</span>
                  <span className="badge bg-danger me-2">No disponible</span>
                  <span className="badge bg-primary">Seleccionado</span>
                </div>
                {selectedNumbers.length > 0 && (
                  <span className="ms-2">
                    <strong>Seleccionados: {selectedNumbers.sort((a, b) => a - b).join(', ')}</strong>
                  </span>
                )}
              </Alert>
              
              {renderNumberGrid()}
              
              <div className="mt-4 p-3 bg-light rounded">
                <h6>Resumen de Selección</h6>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Números seleccionados: </strong>
                    {selectedNumbers.length > 0 ? selectedNumbers.sort((a, b) => a - b).join(', ') : 'Ninguno'}
                  </div>
                  <div>
                    <Badge bg={selectedNumbers.length === (parseInt(purchaseData.quantity) || 0) ? "success" : "warning"} className="fs-6">
                      {selectedNumbers.length}/{purchaseData.quantity || 0}
                    </Badge>
                  </div>
                </div>
                {selectedNumbers.length !== (parseInt(purchaseData.quantity) || 0) && (
                  <Alert variant="warning" className="mt-2 mb-0 py-2">
                    <i className="fa fa-exclamation-triangle me-2"></i>
                    Debe seleccionar exactamente {purchaseData.quantity} número(s)
                  </Alert>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNumberModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowNumberModal(false)}
            disabled={selectedNumbers.length === 0}
          >
            Confirmar Selección
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para notificación por WhatsApp */}
      <Modal show={showWhatsAppModal} onHide={() => setShowWhatsAppModal(false)}>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <i className="fa fa-whatsapp me-2"></i>
            Contactar Administradores para Pago
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <i className="fa fa-info-circle me-2"></i>
            <strong>¡Importante!</strong> Tus boletos están <strong>RESERVADOS</strong> pero no pagados.
            Debes contactar a un administrador por WhatsApp para completar el pago.
            Tienes 24 horas para pagar, de lo contrario la reserva se cancelará.
          </Alert>
          
          <Alert variant="warning">
            <i className="fa fa-exclamation-triangle me-2"></i>
            <strong>Instrucciones de pago:</strong>
            <ol className="mb-0 mt-2">
              <li>Haz clic en "Contactar" para abrir WhatsApp</li>
              <li>Envía el mensaje predefinido al administrador</li>
              <li>Coordina el método de pago con el administrador</li>
              <li>El administrador confirmará el pago en el sistema</li>
            </ol>
          </Alert>
          
          {whatsappLinks.map((link, index) => (
            <Card key={index} className="mb-2 border-success">
              <Card.Body className="py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{link.admin_name}</strong>
                    <div className="text-muted small">{link.phone}</div>
                  </div>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => openWhatsAppLink(link.link)}
                  >
                    <i className="fa fa-whatsapp me-1"></i>
                    Contactar
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWhatsAppModal(false)}>
            Entendido
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Sección de boletos reservados */}
      {reservedTickets.length > 0 && (
        <Card className="mt-4 shadow-sm border-warning">
          <Card.Header className="bg-warning text-white">
            <h5 className="mb-0">
              <i className="fa fa-clock me-2"></i>
              Tus Boletos Reservados (Pendientes de Pago)
            </h5>
          </Card.Header>
          <Card.Body>
            <Alert variant="warning">
              <i className="fa fa-exclamation-triangle me-2"></i>
              Estos boletos están reservados pero no pagados. Contacta a un administrador para completar el pago.
              {timeLeft && (
                <div className="mt-1">
                  <strong>Tiempo restante:</strong> {timeLeft}
                </div>
              )}
            </Alert>
            
            <Row>
              {reservedTickets.map(ticket => {
                const raffle = raffles.find(r => r.id === ticket.raffle_id);
                return (
                  <Col lg={3} md={4} sm={6} xs={6} key={ticket.id} className="mb-3">
                    <Card className="text-center border-warning h-100">
                      <Card.Body>
                        <div className="ticket-number-display reserved">
                          <h2 className="text-white">{ticket.ticket_number}</h2>
                        </div>
                        <Badge bg="warning" className="mt-2">Reservado</Badge>
                        <div className="mt-2">
                          <small className="text-muted">
                            {raffle?.title || 'Rifa'}
                          </small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Sección de boletos pagados */}
      {tickets.length > 0 && (
        <Card className="mt-4 shadow-sm border-success">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">
              <i className="fa fa-check-circle me-2"></i>
              Tus Boletos Pagados
            </h5>
          </Card.Header>
          <Card.Body>
            <Alert variant="success">
              <i className="fa fa-check-circle me-2"></i>
              Estos boletos están completamente pagados y puedes participar en el sorteo.
            </Alert>
            
            <Row>
              {tickets.map(ticket => {
                const raffle = raffles.find(r => r.id === ticket.raffle_id);
                return (
                  <Col lg={3} md={4} sm={6} xs={6} key={ticket.id} className="mb-3">
                    <Card className="text-center border-success h-100">
                      <Card.Body>
                        <div className="ticket-number-display paid">
                          <h2 className="text-white">{ticket.ticket_number}</h2>
                        </div>
                        <Badge bg="success" className="mt-2">Pagado</Badge>
                        {ticket.is_winner && (
                          <Badge bg="danger" className="mt-2 ms-1">¡Ganador!</Badge>
                        )}
                        <div className="mt-2">
                          <small className="text-muted">
                            {raffle?.title || 'Rifa'}
                          </small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default TicketPurchase;