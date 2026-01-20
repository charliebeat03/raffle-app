import React, { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { createUser } from '../api';
import 'font-awesome/css/font-awesome.min.css';

const UserRegistration = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      setMessage({ type: 'danger', text: 'Nombre y teléfono son requeridos' });
      return;
    }

    setLoading(true);
    try {
      const response = await createUser(formData);
      setMessage({ type: 'success', text: 'Registro exitoso' });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      setFormData({ name: '', phone: '', email: '' });
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.detail || 'Error en el registro'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Card className="shadow">
      <Card.Header className="bg-secondary text-white">
        <h4 className="mb-0">
          <i className="fa fa-user-plus me-2"></i>
          Registro de Usuario
        </h4>
      </Card.Header>
      
      <Card.Body>
        {message.text && (
          <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
            {message.text}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre Completo *</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ingrese su nombre completo"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Teléfono *</Form.Label>
            <Form.Control
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ej: +1 234 567 8900"
              required
            />
            <Form.Text className="text-muted">
              Se usará para notificaciones por WhatsApp
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email (opcional)</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ingrese su correo electrónico"
            />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            disabled={loading || !formData.name || !formData.phone}
            className="w-100"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Registrando...
              </>
            ) : (
              <>
                <i className="fa fa-check-circle me-2"></i>
                Registrar Usuario
              </>
            )}
          </Button>
        </Form>

        <div className="mt-4 pt-3 border-top">
          <h6>¿Por qué registrarse?</h6>
          <ul className="text-muted">
            <li>Comprar boletos para las rifas</li>
            <li>Recibir notificaciones instantáneas si ganas</li>
            <li>Consultar tus boletos comprados</li>
            <li>Participar en múltiples rifas</li>
          </ul>
        </div>
      </Card.Body>
    </Card>
  );
};

export default UserRegistration;