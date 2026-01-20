from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import bcrypt

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    tickets = relationship("Ticket", back_populates="user")
    wins = relationship("Winner", back_populates="user")

class Raffle(Base):
    __tablename__ = "raffles"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    total_tickets = Column(Integer, nullable=False)
    tickets_sold = Column(Integer, default=0)
    ticket_price = Column(Float, nullable=False)
    prize_first = Column(String(300), nullable=False)
    prize_second = Column(String(300), nullable=False)
    prize_third = Column(String(300), nullable=False)
    is_active = Column(Boolean, default=True)
    is_completed = Column(Boolean, default=False)
    draw_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    tickets = relationship("Ticket", back_populates="raffle")
    winners = relationship("Winner", back_populates="raffle")

class Ticket(Base):
    __tablename__ = "tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    raffle_id = Column(Integer, ForeignKey("raffles.id"), nullable=False)
    purchase_date = Column(DateTime, default=datetime.utcnow)
    is_winner = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="tickets")
    raffle = relationship("Raffle", back_populates="tickets")

class Winner(Base):
    __tablename__ = "winners"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    raffle_id = Column(Integer, ForeignKey("raffles.id"), nullable=False)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
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
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    def verify_password(self, password: str) -> bool:
        password_bytes = password.encode('utf-8')
        try:
            return bcrypt.checkpw(password_bytes, self.password_hash.encode('utf-8'))
        except:
            return False
