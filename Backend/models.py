from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Enum as SQLAlchemyEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import bcrypt
import enum

Base = declarative_base()

class TicketStatus(enum.Enum):
    PENDING = "pending"
    RESERVED = "reserved"
    PAID = "paid"
    CANCELLED = "cancelled"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    tickets = relationship("Ticket", back_populates="user", cascade="all, delete-orphan")
    wins = relationship("Winner", back_populates="user", cascade="all, delete-orphan")

class Raffle(Base):
    __tablename__ = "raffles"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    total_tickets = Column(Integer, nullable=False)
    tickets_sold = Column(Integer, default=0)
    tickets_reserved = Column(Integer, default=0)
    ticket_price = Column(Float, nullable=False)
    prize_first = Column(String(300), nullable=False)
    prize_second = Column(String(300), nullable=False)
    prize_third = Column(String(300), nullable=False)
    is_active = Column(Boolean, default=True)
    is_completed = Column(Boolean, default=False)
    draw_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    tickets = relationship("Ticket", back_populates="raffle", cascade="all, delete-orphan")
    winners = relationship("Winner", back_populates="raffle", cascade="all, delete-orphan")

class Ticket(Base):
    __tablename__ = "tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    raffle_id = Column(Integer, ForeignKey("raffles.id", ondelete="CASCADE"), nullable=False)
    purchase_date = Column(DateTime, default=datetime.utcnow)
    status = Column(SQLAlchemyEnum(TicketStatus, name="ticket_status"), default=TicketStatus.RESERVED, nullable=False)
    payment_confirmed = Column(Boolean, default=False)
    payment_date = Column(DateTime, nullable=True)
    is_winner = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="tickets")
    raffle = relationship("Raffle", back_populates="tickets")

class Winner(Base):
    __tablename__ = "winners"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    raffle_id = Column(Integer, ForeignKey("raffles.id", ondelete="CASCADE"), nullable=False)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    prize_position = Column(Integer, nullable=False)
    prize_description = Column(String(300), nullable=False)
    notified = Column(Boolean, default=False)
    notification_date = Column(DateTime, nullable=True)
    whatsapp_link = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="wins")
    raffle = relationship("Raffle", back_populates="winners")
    ticket = relationship("Ticket")

class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    is_main_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def set_password(self, password: str):
        """Establece la contraseña hasheada usando bcrypt"""
        if not password:
            raise ValueError("La contraseña no puede estar vacía")
        
        try:
            password_bytes = password.encode('utf-8')
            salt = bcrypt.gensalt(rounds=12)  # Usar 12 rondas (seguridad buena)
            hash_bytes = bcrypt.hashpw(password_bytes, salt)
            self.password_hash = hash_bytes.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Error al hash la contraseña: {e}")
    
    def verify_password(self, password: str) -> bool:
        """Verifica si la contraseña proporcionada coincide con el hash almacenado"""
        if not password or not self.password_hash:
            return False
        
        try:
            password_bytes = password.encode('utf-8')
            
            # Asegurarse de que el hash almacenado esté en bytes
            if isinstance(self.password_hash, str):
                stored_hash = self.password_hash.encode('utf-8')
            else:
                stored_hash = self.password_hash
            
            # Verificar la contraseña
            return bcrypt.checkpw(password_bytes, stored_hash)
        except Exception as e:
            # Log del error (en producción usarías logging)
            print(f"Error en verify_password: {e}")
            return False
