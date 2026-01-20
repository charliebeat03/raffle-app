import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import { getRaffles } from '../api';
import 'font-awesome/css/font-awesome.min.css';

const RaffleInfo = () => {
  const [raffles, setRaffles] = useState([]);
  const [activeRaffle, setActiveRaffle] = useState(null);

  useEffect(() => {
    fetchRaffles();
  }, []);

  const fetchRaffles = async () => {
    try {
      const response = await getRaffles(true);
      setRaffles(response.data);
      if (response.data.length > 0) {
        setActiveRaffle(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching raffles:', error);
    }
  };

  const calculateProgress = (raffle) => {
    return (raffle.tickets_sold / raffle.total_tickets) * 100;
  };

  if (!activeRaffle) {
    return null;
  }

  return (
    <Card className="shadow border-primary">
      <Card.Header className="bg-primary text-white">
        <h4 className="mb-0">
          <i className="fa fa-info-circle me-2"></i>
          Rifa Activa
        </h4>
      </Card.Header>
      
      <Card.Body>
        <Row>
          <Col md={8}>
            <h3>{activeRaffle.title}</h3>
            {activeRaffle.description && (
              <p className="text-muted">{activeRaffle.description}</p>
            )}
            
            <div className="mb-3">
              <h5>🎁 Premio Principal</h5>
              <p className="fs-5">{activeRaffle.prize}</p>
            </div>

            <div className="mb-4">
              <h5>📊 Progreso de Venta</h5>
              <ProgressBar 
                now={calculateProgress(activeRaffle)} 
                label={`${calculateProgress(activeRaffle).toFixed(1)}%`}
                variant={calculateProgress(activeRaffle) >= 100 ? 'success' : 'info'}
                className="mb-2"
                style={{ height: '25px' }}
              />
              <div className="d-flex justify-content-between">
                <span>{activeRaffle.tickets_sold} boletos vendidos</span>
                <span>{activeRaffle.total_tickets} total</span>
              </div>
            </div>
          </Col>
          
          <Col md={4}>
            <Card className="bg-light">
              <Card.Body>
                <h5 className="text-center">Detalles</h5>
                <div className="text-center mb-3">
                  <Badge bg="success" className="fs-6 p-2">
                    ${activeRaffle.ticket_price} c/u
                  </Badge>
                </div>
                
                <div className="text-center mb-3">
                  <div className="display-6 text-primary">
                    {activeRaffle.tickets_sold}
                  </div>
                  <small className="text-muted">Boletos Vendidos</small>
                </div>
                
                <div className="text-center mb-3">
                  <div className="display-6 text-success">
                    ${(activeRaffle.tickets_sold * activeRaffle.ticket_price).toFixed(2)}
                  </div>
                  <small className="text-muted">Recaudado</small>
                </div>
                
                <div className="text-center">
                  <div className="display-6 text-warning">
                    {activeRaffle.total_tickets - activeRaffle.tickets_sold}
                  </div>
                  <small className="text-muted">Disponibles</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="mt-4 pt-3 border-top">
          <h6>¿Cómo participar?</h6>
          <Row>
            <Col md={3} className="text-center">
              <div className="step-number">1</div>
              <p><strong>Regístrate</strong></p>
              <small className="text-muted">Crea tu cuenta</small>
            </Col>
            <Col md={3} className="text-center">
              <div className="step-number">2</div>
              <p><strong>Compra Boletos</strong></p>
              <small className="text-muted">Selecciona cantidad</small>
            </Col>
            <Col md={3} className="text-center">
              <div className="step-number">3</div>
              <p><strong>Espera el Sorteo</strong></p>
              <small className="text-muted">Cuando se completen</small>
            </Col>
            <Col md={3} className="text-center">
              <div className="step-number">4</div>
              <p><strong>¡Gana!</strong></p>
              <small className="text-muted">Recibe notificación</small>
            </Col>
          </Row>
        </div>
      </Card.Body>
      
      <style jsx>{`
        .step-number {
          width: 50px;
          height: 50px;
          background: #0d6efd;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          margin: 0 auto 10px;
        }
      `}</style>
    </Card>
  );
};

export default RaffleInfo;