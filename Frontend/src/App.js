import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import TicketPurchase from './components/TicketPurchase';
import Wheel from './components/Wheel';
import WinnerList from './components/WinnerList';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('buy');
  const [admin, setAdmin] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const adminData = localStorage.getItem('admin_user');
    
    if (token && adminData) {
      setAdmin(JSON.parse(adminData));
      setIsAdminAuthenticated(true);
    }
  }, []);

  const handleAdminLogin = (adminData) => {
    setAdmin(adminData);
    setIsAdminAuthenticated(true);
    setActiveTab('admin');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdmin(null);
    setIsAdminAuthenticated(false);
    setActiveTab('buy');
  };

  const handleNavClick = (tab) => {
    if (tab === 'admin' && !isAdminAuthenticated) {
      setActiveTab('admin-login');
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="App">
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4 shadow">
        <Container>
          <Navbar.Brand href="#home">
            <i className="fa fa-ticket me-2"></i>
            Sistema de Rifas
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              {/* Ocultar "Comprar Boletos" para administradores */}
              {!isAdminAuthenticated && (
                <Nav.Link 
                  active={activeTab === 'buy'} 
                  onClick={() => setActiveTab('buy')}
                  className={activeTab === 'buy' ? 'active' : ''}
                >
                  <i className="fa fa-shopping-cart me-1"></i>
                  Comprar Boletos
                </Nav.Link>
              )}
              
              <Nav.Link 
                active={activeTab === 'wheel'} 
                onClick={() => setActiveTab('wheel')}
                className={activeTab === 'wheel' ? 'active' : ''}
              >
                <i className="fa fa-trophy me-1"></i>
                {isAdminAuthenticated ? 'Sorteo' : 'Ruleta'}
              </Nav.Link>
              
              <Nav.Link 
                active={activeTab === 'winners'} 
                onClick={() => setActiveTab('winners')}
                className={activeTab === 'winners' ? 'active' : ''}
              >
                <i className="fa fa-star me-1"></i>
                Ganadores
              </Nav.Link>
              
              {/* Enlace condicional para Admin */}
              {isAdminAuthenticated ? (
                <>
                  <Nav.Link 
                    active={activeTab === 'admin'} 
                    onClick={() => setActiveTab('admin')}
                    className={activeTab === 'admin' ? 'active text-warning' : 'text-warning'}
                  >
                    <i className="fa fa-cog me-1"></i>
                    Administración
                  </Nav.Link>
                  <Button 
                    variant="outline-light" 
                    size="sm" 
                    className="ms-2"
                    onClick={handleAdminLogout}
                  >
                    <i className="fa fa-sign-out me-1"></i>
                    Salir
                  </Button>
                </>
              ) : (
                <Nav.Link 
                  active={activeTab === 'admin-login'} 
                  onClick={() => handleNavClick('admin')}
                  className={activeTab === 'admin-login' ? 'active' : ''}
                >
                  <i className="fa fa-user-secret me-1"></i>
                  Admin
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <div className="main-content">
          {activeTab === 'buy' && !isAdminAuthenticated && (
            <TicketPurchase />
          )}
          
          {activeTab === 'wheel' && (
            <Wheel isAdmin={isAdminAuthenticated} />
          )}
          
          {activeTab === 'winners' && (
            <WinnerList isAdmin={isAdminAuthenticated} />
          )}
          
          {activeTab === 'admin-login' && !isAdminAuthenticated && (
            <AdminLogin onLoginSuccess={handleAdminLogin} />
          )}
          
          {activeTab === 'admin' && isAdminAuthenticated && (
            <AdminPanel admin={admin} />
          )}
        </div>

        {activeTab !== 'admin-login' && (
          <footer className="mt-5 pt-4 border-top text-center text-muted">
            <p>
              <strong>Sistema de Gestión de Rifas</strong> | 
              Desarrollado con <i className="fa fa-heart text-danger"></i> para facilitar la organización de rifas
            </p>
            <p className="small">
              <i className="fa fa-shield me-1"></i>
              Sistema seguro y confiable | 
              <i className="fa fa-whatsapp ms-3 me-1"></i>
              Notificaciones por WhatsApp | 
              <i className="fa fa-random ms-3 me-1"></i>
              Selección aleatoria garantizada
            </p>
          </footer>
        )}
      </Container>
    </div>
  );
}

export default App;