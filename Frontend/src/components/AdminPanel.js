import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Table, Modal, Badge } from 'react-bootstrap';
import { getRaffles, createRaffle, completeRaffle, deleteRaffle, getAdmins, createAdmin, updateAdmin, deleteAdmin, getStatsOverview } from '../api';
import 'font-awesome/css/font-awesome.min.css';

const AdminPanel = ({ admin }) => {
  const [raffles, setRaffles] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showUpdateAdminModal, setShowUpdateAdminModal] = useState(false);
  const [showDeleteRaffleModal, setShowDeleteRaffleModal] = useState(false);
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  
  const [newRaffle, setNewRaffle] = useState({
    title: '',
    description: '',
    total_tickets: 100,
    ticket_price: 10,
    prize_first: '',
    prize_second: '',
    prize_third: ''
  });
  
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    password: '',
    email: '',
    phone: ''
  });
  
  const [updateAdminData, setUpdateAdminData] = useState({
    email: '',
    phone: '',
    password: ''
  });
  
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rafflesRes, adminsRes, statsRes] = await Promise.all([
        getRaffles(false),
        getAdmins(),
        getStatsOverview()
      ]);
      
      setRaffles(rafflesRes.data);
      setAdmins(adminsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'danger', text: 'Error al cargar datos' });
    }
  };

  const validatePassword = (password) => {
    if (password && password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (password && !/(?=.*[a-z])/.test(password)) {
      return 'La contraseña debe tener al menos una letra minúscula';
    }
    if (password && !/(?=.*[A-Z])/.test(password)) {
      return 'La contraseña debe tener al menos una letra mayúscula';
    }
    if (password && !/(?=.*\d)/.test(password)) {
      return 'La contraseña debe tener al menos un número';
    }
    if (password && !/(?=.*[@$!%*?&])/.test(password)) {
      return 'La contraseña debe tener al menos un carácter especial (@$!%*?&)';
    }
    return '';
  };

  const handleCreateRaffle = async (e) => {
    e.preventDefault();
    if (!newRaffle.title || !newRaffle.prize_first || !newRaffle.prize_second || !newRaffle.prize_third) {
      setMessage({ type: 'danger', text: 'Título y todos los premios son requeridos' });
      return;
    }

    setLoading(true);
    try {
      await createRaffle(newRaffle);
      setMessage({ type: 'success', text: 'Rifa creada exitosamente' });
      setNewRaffle({
        title: '',
        description: '',
        total_tickets: 100,
        ticket_price: 10,
        prize_first: '',
        prize_second: '',
        prize_third: ''
      });
      fetchData();
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.detail || 'Error al crear rifa'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    const passwordError = validatePassword(newAdmin.password);
    if (passwordError) {
      setPasswordError(passwordError);
      return;
    }

    setLoading(true);
    try {
      await createAdmin(newAdmin);
      setMessage({ type: 'success', text: 'Administrador creado exitosamente' });
      setNewAdmin({
        username: '',
        password: '',
        email: '',
        phone: ''
      });
      setShowAdminModal(false);
      fetchData();
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.detail || 'Error al crear administrador'
      });
    } finally {
      setLoading(false);
      setPasswordError('');
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    
    if (updateAdminData.password) {
      const passwordError = validatePassword(updateAdminData.password);
      if (passwordError) {
        setPasswordError(passwordError);
        return;
      }
    }

    setLoading(true);
    try {
      await updateAdmin(selectedAdmin.id, updateAdminData);
      setMessage({ type: 'success', text: 'Administrador actualizado exitosamente' });
      setShowUpdateAdminModal(false);
      setUpdateAdminData({ email: '', phone: '', password: '' });
      setSelectedAdmin(null);
      fetchData();
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.detail || 'Error al actualizar administrador'
      });
    } finally {
      setLoading(false);
      setPasswordError('');
    }
  };

  const handleDeleteRaffle = async () => {
    if (!selectedRaffle) return;

    setLoading(true);
    try {
      await deleteRaffle(selectedRaffle.id);
      setMessage({ type: 'success', text: 'Rifa eliminada exitosamente' });
      setShowDeleteRaffleModal(false);
      setSelectedRaffle(null);
      fetchData();
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.detail || 'Error al eliminar rifa'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    setLoading(true);
    try {
      await deleteAdmin(selectedAdmin.id);
      setMessage({ type: 'success', text: 'Administrador eliminado exitosamente' });
      setShowDeleteAdminModal(false);
      setSelectedAdmin(null);
      fetchData();
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.detail || 'Error al eliminar administrador'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRaffle = async (raffleId) => {
    if (!window.confirm('¿Está seguro de completar esta rifa?')) return;

    try {
      await completeRaffle(raffleId);
      setMessage({ type: 'success', text: 'Rifa completada exitosamente' });
      fetchData();
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.detail || 'Error al completar rifa'
      });
    }
  };

  const openUpdateAdminModal = (adminItem) => {
    setSelectedAdmin(adminItem);
    setUpdateAdminData({
      email: adminItem.email || '',
      phone: adminItem.phone || '',
      password: ''
    });
    setShowUpdateAdminModal(true);
  };

  const openDeleteRaffleModal = (raffleItem) => {
    setSelectedRaffle(raffleItem);
    setShowDeleteRaffleModal(true);
  };

  const openDeleteAdminModal = (adminItem) => {
    setSelectedAdmin(adminItem);
    setShowDeleteAdminModal(true);
  };

  return (
    <Container>
      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
          {message.text}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={12}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">
                <i className="fa fa-user-secret me-2"></i>
                Panel de Administración
              </h4>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <h5>Información del Administrador</h5>
                <Row>
                  <Col md={4}>
                    <div className="admin-info">
                      <i className="fa fa-user fa-3x text-primary mb-2"></i>
                      <h4>{admin?.username}</h4>
                      <p><strong>Email:</strong> {admin?.email}</p>
                      <p><strong>Telefono:</strong> {admin?.phone || 'No registrado'}</p>
                      <p><strong>Tipo:</strong> {admin?.is_main_admin ? 'Administrador Principal' : 'Administrador'}</p>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => openUpdateAdminModal(admin)}
                        className="mt-2"
                      >
                        <i className="fa fa-edit me-1"></i>
                        Actualizar Perfil
                      </Button>
                    </div>
                  </Col>
                  <Col md={8}>
                    <div className="admin-stats">
                      <h6>Estadísticas del Sistema</h6>
                      {stats && (
                        <Row>
                          <Col md={3} className="text-center">
                            <div className="stat-box">
                              <h3 className="text-primary">{stats.total_raffles}</h3>
                              <small>Rifas Totales</small>
                            </div>
                          </Col>
                          <Col md={3} className="text-center">
                            <div className="stat-box">
                              <h3 className="text-success">{stats.active_raffles}</h3>
                              <small>Rifas Activas</small>
                            </div>
                          </Col>
                          <Col md={3} className="text-center">
                            <div className="stat-box">
                              <h3 className="text-info">{stats.total_users}</h3>
                              <small>Usuarios</small>
                            </div>
                          </Col>
                          <Col md={3} className="text-center">
                            <div className="stat-box">
                              <h3 className="text-warning">${stats.total_revenue}</h3>
                              <small>Recaudación</small>
                            </div>
                          </Col>
                        </Row>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <i className="fa fa-plus me-2"></i>
                Crear Nueva Rifa
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleCreateRaffle}>
                <Form.Group className="mb-3">
                  <Form.Label>Título de la Rifa *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newRaffle.title}
                    onChange={(e) => setNewRaffle({...newRaffle, title: e.target.value})}
                    placeholder="Ej: Rifa de Navidad"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={newRaffle.description}
                    onChange={(e) => setNewRaffle({...newRaffle, description: e.target.value})}
                    placeholder="Descripción de la rifa"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Total de Boletos</Form.Label>
                      <Form.Control
                        type="number"
                        value={newRaffle.total_tickets}
                        onChange={(e) => setNewRaffle({...newRaffle, total_tickets: parseInt(e.target.value)})}
                        min="1"
                        max="1000"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Precio por Boleto ($)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        value={newRaffle.ticket_price}
                        onChange={(e) => setNewRaffle({...newRaffle, ticket_price: parseFloat(e.target.value)})}
                        min="1"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Premio 1° Lugar *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newRaffle.prize_first}
                    onChange={(e) => setNewRaffle({...newRaffle, prize_first: e.target.value})}
                    placeholder="Ej: $1000 en efectivo"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Premio 2° Lugar *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newRaffle.prize_second}
                    onChange={(e) => setNewRaffle({...newRaffle, prize_second: e.target.value})}
                    placeholder="Ej: $500 en efectivo"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Premio 3° Lugar *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newRaffle.prize_third}
                    onChange={(e) => setNewRaffle({...newRaffle, prize_third: e.target.value})}
                    placeholder="Ej: $250 en efectivo"
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="success"
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? 'Creando...' : 'Crear Rifa'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow">
            <Card.Header className="bg-warning text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fa fa-users me-2"></i>
                  Administradores
                </h5>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => setShowAdminModal(true)}
                >
                  <i className="fa fa-plus me-1"></i>
                  Nuevo Admin
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover size="sm">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Telefono</th>
                      <th>Tipo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(adminItem => (
                      <tr key={adminItem.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className="fa fa-user-circle text-primary me-2"></i>
                            {adminItem.username}
                            {adminItem.id === admin?.id && (
                              <Badge bg="info" className="ms-2">Tu</Badge>
                            )}
                          </div>
                        </td>
                        <td>{adminItem.email}</td>
                        <td>{adminItem.phone || '-'}</td>
                        <td>
                          <Badge bg={adminItem.is_main_admin ? 'danger' : 'secondary'}>
                            {adminItem.is_main_admin ? 'Principal' : 'Normal'}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openUpdateAdminModal(adminItem)}
                              title="Editar"
                              disabled={adminItem.is_main_admin && adminItem.id !== admin?.id}
                            >
                              <i className="fa fa-edit"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => openDeleteAdminModal(adminItem)}
                              title="Eliminar"
                              disabled={adminItem.id === admin?.id || adminItem.is_main_admin}
                            >
                              <i className="fa fa-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card className="shadow">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <i className="fa fa-ticket me-2"></i>
                Gestión de Rifas
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Boletos</th>
                      <th>Precio</th>
                      <th>Premios</th>
                      <th>Estado</th>
                      <th>Recaudación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raffles.map(raffle => (
                      <tr key={raffle.id}>
                        <td>
                          <strong>{raffle.title}</strong>
                          {raffle.description && (
                            <div className="small text-muted">{raffle.description}</div>
                          )}
                        </td>
                        <td>
                          {raffle.tickets_sold}/{raffle.total_tickets}
                          <div className="progress" style={{ height: '5px' }}>
                            <div 
                              className="progress-bar bg-success" 
                              style={{ 
                                width: `${(raffle.tickets_sold / raffle.total_tickets) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </td>
                        <td>${raffle.ticket_price}</td>
                        <td>
                          <div className="small">
                            <div><strong>1°:</strong> {raffle.prize_first}</div>
                            <div><strong>2°:</strong> {raffle.prize_second}</div>
                            <div><strong>3°:</strong> {raffle.prize_third}</div>
                          </div>
                        </td>
                        <td>
                          <Badge bg={raffle.is_active ? 'success' : 'danger'}>
                            {raffle.is_active ? 'Activa' : 'Inactiva'}
                          </Badge>
                          {raffle.is_completed && (
                            <Badge bg="warning" className="ms-1">Completada</Badge>
                          )}
                        </td>
                        <td>
                          <strong>${(raffle.tickets_sold * raffle.ticket_price).toFixed(2)}</strong>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            {raffle.is_active && !raffle.is_completed && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleCompleteRaffle(raffle.id)}
                                disabled={raffle.tickets_sold === 0}
                                title="Completar Rifa"
                              >
                                <i className="fa fa-check"></i>
                              </Button>
                            )}
                            {!raffle.is_active && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => openDeleteRaffleModal(raffle)}
                                title="Eliminar Rifa"
                                disabled={raffle.tickets_sold > 0}
                              >
                                <i className="fa fa-trash"></i>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal para crear nuevo admin */}
      <Modal show={showAdminModal} onHide={() => setShowAdminModal(false)}>
        <Modal.Header closeButton className="bg-warning text-white">
          <Modal.Title>
            <i className="fa fa-user-plus me-2"></i>
            Crear Nuevo Administrador
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateAdmin}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de Usuario *</Form.Label>
              <Form.Control
                type="text"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                placeholder="Ej: admin2"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                placeholder="Ej: admin2@ejemplo.com"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Telefono (opcional)</Form.Label>
              <Form.Control
                type="tel"
                value={newAdmin.phone}
                onChange={(e) => setNewAdmin({...newAdmin, phone: e.target.value})}
                placeholder="Ej: +1234567890"
              />
              <Form.Text className="text-muted">
                Se usará para notificaciones por WhatsApp
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contraseña *</Form.Label>
              <Form.Control
                type="password"
                value={newAdmin.password}
                onChange={(e) => {
                  setNewAdmin({...newAdmin, password: e.target.value});
                  setPasswordError(validatePassword(e.target.value));
                }}
                placeholder="Contraseña segura"
                required
                isInvalid={!!passwordError}
              />
              {passwordError && (
                <Form.Control.Feedback type="invalid">
                  {passwordError}
                </Form.Control.Feedback>
              )}
              <Form.Text className="text-muted">
                La contraseña debe tener al menos 8 caracteres, incluyendo:
                <ul className="small mb-0">
                  <li>Una letra mayúscula</li>
                  <li>Una letra minúscula</li>
                  <li>Un número</li>
                  <li>Un carácter especial (@$!%*?&)</li>
                </ul>
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                onClick={() => setShowAdminModal(false)}
                className="me-2"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="warning"
                disabled={loading || !!passwordError}
              >
                {loading ? 'Creando...' : 'Crear Administrador'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal para actualizar admin */}
      <Modal show={showUpdateAdminModal} onHide={() => setShowUpdateAdminModal(false)}>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fa fa-edit me-2"></i>
            Actualizar Administrador
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAdmin && (
            <Form onSubmit={handleUpdateAdmin}>
              <Alert variant="info" className="mb-3">
                <i className="fa fa-info-circle me-2"></i>
                Actualizando: <strong>{selectedAdmin.username}</strong>
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={updateAdminData.email}
                  onChange={(e) => setUpdateAdminData({...updateAdminData, email: e.target.value})}
                  placeholder="Nuevo email"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Telefono</Form.Label>
                <Form.Control
                  type="tel"
                  value={updateAdminData.phone}
                  onChange={(e) => setUpdateAdminData({...updateAdminData, phone: e.target.value})}
                  placeholder="Nuevo telefono"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Nueva Contraseña (opcional)</Form.Label>
                <Form.Control
                  type="password"
                  value={updateAdminData.password}
                  onChange={(e) => {
                    setUpdateAdminData({...updateAdminData, password: e.target.value});
                    setPasswordError(validatePassword(e.target.value));
                  }}
                  placeholder="Dejar vacío para no cambiar"
                  isInvalid={!!passwordError}
                />
                {passwordError && (
                  <Form.Control.Feedback type="invalid">
                    {passwordError}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <div className="d-flex justify-content-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowUpdateAdminModal(false)}
                  className="me-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !!passwordError}
                >
                  {loading ? 'Actualizando...' : 'Actualizar'}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal para eliminar rifa */}
      <Modal show={showDeleteRaffleModal} onHide={() => setShowDeleteRaffleModal(false)}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <i className="fa fa-trash me-2"></i>
            Eliminar Rifa
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRaffle && (
            <>
              <Alert variant="danger" className="mb-3">
                <i className="fa fa-exclamation-triangle me-2"></i>
                <strong>¡Advertencia!</strong> Esta acción no se puede deshacer.
              </Alert>
              
              <p>¿Está seguro de eliminar la siguiente rifa?</p>
              <Card className="mb-3">
                <Card.Body>
                  <h5>{selectedRaffle.title}</h5>
                  <div className="small mb-2">
                    <div><strong>1° Premio:</strong> {selectedRaffle.prize_first}</div>
                    <div><strong>2° Premio:</strong> {selectedRaffle.prize_second}</div>
                    <div><strong>3° Premio:</strong> {selectedRaffle.prize_third}</div>
                  </div>
                  <p><strong>Boletos vendidos:</strong> {selectedRaffle.tickets_sold}/{selectedRaffle.total_tickets}</p>
                  <p><strong>Estado:</strong> {selectedRaffle.is_active ? 'Activa' : 'Inactiva'}</p>
                  <p><strong>Completada:</strong> {selectedRaffle.is_completed ? 'Sí' : 'No'}</p>
                </Card.Body>
              </Card>
              
              {selectedRaffle.tickets_sold > 0 && (
                <Alert variant="warning">
                  <i className="fa fa-warning me-2"></i>
                  Esta rifa tiene {selectedRaffle.tickets_sold} boletos vendidos y no se puede eliminar.
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteRaffleModal(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteRaffle}
            disabled={loading || (selectedRaffle && selectedRaffle.tickets_sold > 0)}
          >
            {loading ? 'Eliminando...' : 'Eliminar Rifa'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para eliminar admin */}
      <Modal show={showDeleteAdminModal} onHide={() => setShowDeleteAdminModal(false)}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <i className="fa fa-trash me-2"></i>
            Eliminar Administrador
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAdmin && (
            <>
              <Alert variant="danger" className="mb-3">
                <i className="fa fa-exclamation-triangle me-2"></i>
                <strong>¡Advertencia!</strong> Esta acción no se puede deshacer.
              </Alert>
              
              <p>¿Está seguro de eliminar al siguiente administrador?</p>
              <Card className="mb-3">
                <Card.Body>
                  <h5>{selectedAdmin.username}</h5>
                  <p><strong>Email:</strong> {selectedAdmin.email}</p>
                  <p><strong>Telefono:</strong> {selectedAdmin.phone || 'No registrado'}</p>
                  <p><strong>Tipo:</strong> {selectedAdmin.is_main_admin ? 'Administrador Principal' : 'Administrador Normal'}</p>
                </Card.Body>
              </Card>
              
              {selectedAdmin.is_main_admin && (
                <Alert variant="warning">
                  <i className="fa fa-warning me-2"></i>
                  No se puede eliminar al administrador principal.
                </Alert>
              )}
              
              {selectedAdmin.id === admin?.id && (
                <Alert variant="warning">
                  <i className="fa fa-warning me-2"></i>
                  No puede eliminarse a sí mismo.
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteAdminModal(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteAdmin}
            disabled={loading || (selectedAdmin && (selectedAdmin.is_main_admin || selectedAdmin.id === admin?.id))}
          >
            {loading ? 'Eliminando...' : 'Eliminar Administrador'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPanel;
