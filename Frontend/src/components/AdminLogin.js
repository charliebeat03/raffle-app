import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { loginAdmin } from '../api';
import './AdminLogin.css';

function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }
    
    setLoading(true);

    try {
      const response = await loginAdmin({ username, password });
      const { access_token, admin_id, username: adminUsername, email } = response.data;
      
      localStorage.setItem('admin_token', access_token);
      localStorage.setItem('admin_user', JSON.stringify({
        id: admin_id,
        username: adminUsername,
        email
      }));
      
      onLoginSuccess({ id: admin_id, username: adminUsername, email });
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.detail || 
        err.response?.data?.message || 
        'Error de autenticación. Verifica tus credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col xs={12} md={6} lg={4}>
            <Card className="admin-login-card shadow-lg border-0">
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <div className="login-icon-wrapper">
                    <i className="fa fa-lock login-icon"></i>
                  </div>
                  <h3 className="login-title">Panel de Administración</h3>
                  <p className="text-muted mb-0">
                    Ingresa tus credenciales para continuar
                  </p>
                </div>
                
                {error && (
                  <Alert 
                    variant="danger" 
                    className="text-center py-2 mb-3"
                    onClose={() => setError('')}
                    dismissible
                  >
                    <i className="fa fa-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Usuario</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ingresa tu usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Contraseña</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Ingresa tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </Form.Group>
                  
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Iniciando sesión...
                      </>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </Button>
                </Form>
                
                <div className="text-center mt-4">
                  <a href="/" className="text-decoration-none">
                    <i className="fa fa-arrow-left me-2"></i>
                    Volver al sistema de rifas
                  </a>
                </div>
                
                <div className="text-center mt-3">
                  <small className="text-muted">
                    <i className="fa fa-shield me-1"></i>
                    Acceso restringido al personal autorizado
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default AdminLogin;