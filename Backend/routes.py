from fastapi import APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import random
import json
import logging

from models import User, Raffle, Ticket, Winner, Admin, TicketStatus
from database import get_db
from auth import create_access_token, get_current_admin, authenticate_admin
from pydantic import BaseModel, validator
import asyncio

router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic Models
class AdminLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    admin_id: int
    username: str
    email: str

class AdminCreate(BaseModel):
    username: str
    password: str
    email: str
    phone: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        if not any(c.isupper() for c in v):
            raise ValueError('La contraseña debe tener al menos una letra mayúscula')
        if not any(c.islower() for c in v):
            raise ValueError('La contraseña debe tener al menos una letra minúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('La contraseña debe tener al menos un número')
        return v

class AdminUpdate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if v is not None:
            if len(v) < 8:
                raise ValueError('La contraseña debe tener al menos 8 caracteres')
            if not any(c.isupper() for c in v):
                raise ValueError('La contraseña debe tener al menos una letra mayúscula')
            if not any(c.islower() for c in v):
                raise ValueError('La contraseña debe tener al menos una letra minúscula')
            if not any(c.isdigit() for c in v):
                raise ValueError('La contraseña debe tener al menos un número')
        return v

class AdminResponse(BaseModel):
    id: int
    username: str
    email: str
    phone: Optional[str]
    is_active: bool
    is_main_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    
    @validator('phone')
    def validate_phone(cls, v):
        # Limpiar número de teléfono
        cleaned = ''.join(filter(str.isdigit, v))
        if len(cleaned) < 8:
            raise ValueError('Número de teléfono inválido')
        return cleaned

class UserResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class RaffleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    total_tickets: int
    ticket_price: float
    prize_first: str
    prize_second: str
    prize_third: str
    
    @validator('total_tickets')
    def validate_total_tickets(cls, v):
        if v < 1:
            raise ValueError('El total de boletos debe ser mayor a 0')
        if v > 1000:
            raise ValueError('El total de boletos no puede exceder 1000')
        return v
    
    @validator('ticket_price')
    def validate_ticket_price(cls, v):
        if v <= 0:
            raise ValueError('El precio del boleto debe ser mayor a 0')
        return v

class RaffleResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    total_tickets: int
    tickets_sold: int
    tickets_reserved: int
    ticket_price: float
    prize_first: str
    prize_second: str
    prize_third: str
    is_active: bool
    is_completed: bool
    draw_date: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class TicketPurchase(BaseModel):
    user_id: int
    raffle_id: int
    ticket_numbers: List[int]
    
    @validator('ticket_numbers')
    def validate_ticket_numbers(cls, v):
        if not v:
            raise ValueError('Debe seleccionar al menos un número')
        if len(v) > 50:
            raise ValueError('No puede comprar más de 50 boletos a la vez')
        return v

class TicketResponse(BaseModel):
    id: int
    ticket_number: int
    user_id: int
    raffle_id: int
    purchase_date: datetime
    status: str
    payment_confirmed: bool
    is_winner: bool
    
    class Config:
        from_attributes = True

class TicketPurchaseWithWhatsApp(BaseModel):
    tickets: List[TicketResponse]
    whatsapp_links: List[Dict[str, str]]
    reserved_until: datetime

class DrawRequest(BaseModel):
    raffle_id: int
    winning_ticket_id: Optional[int] = None
    prize_position: int = 1
    
    @validator('prize_position')
    def validate_prize_position(cls, v):
        if v not in [1, 2, 3]:
            raise ValueError('La posición del premio debe ser 1, 2 o 3')
        return v

class ConfirmPaymentRequest(BaseModel):
    ticket_ids: List[int]
    user_id: int

class WinnerResponse(BaseModel):
    id: int
    user_id: int
    raffle_id: int
    ticket_id: int
    prize_position: int
    prize_description: str
    notified: bool
    notification_date: Optional[datetime]
    whatsapp_link: Optional[str]
    created_at: datetime
    user_name: str
    user_phone: str
    ticket_number: int
    
    class Config:
        from_attributes = True

class WhatsAppLinksResponse(BaseModel):
    raffle_id: int
    raffle_title: str
    winners: List[Dict[str, Any]]

# ========== RUTAS DE AUTENTICACIÓN ==========
@router.post("/auth/login", response_model=Token)
def login_admin(login_data: AdminLogin, db: Session = Depends(get_db)):
    admin = authenticate_admin(db, login_data.username, login_data.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cuenta de administrador inactiva",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # ¡ESTA LÍNEA ESTABA CAUSANDO EL ERROR!
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    access_token = create_access_token(
        data={"sub": admin.username, "admin_id": admin.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin_id": admin.id,
        "username": admin.username,
        "email": admin.email
    }

# ========== RUTAS PÚBLICAS ==========
@router.post("/users/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.phone == user.phone).first()
    if existing_user:
        return existing_user
    
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/users/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@router.get("/raffles/", response_model=List[RaffleResponse])
def get_raffles(active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(Raffle)
    if active_only:
        query = query.filter(Raffle.is_active == True, Raffle.is_completed == False)
    raffles = query.order_by(Raffle.created_at.desc()).all()
    return raffles

@router.get("/raffles/{raffle_id}", response_model=RaffleResponse)
def get_raffle(raffle_id: int, db: Session = Depends(get_db)):
    raffle = db.query(Raffle).filter(Raffle.id == raffle_id).first()
    if not raffle:
        raise HTTPException(status_code=404, detail="Rifa no encontrada")
    return raffle

# ========== RUTAS PROTEGIDAS ==========
@router.post("/raffles/", response_model=RaffleResponse, status_code=status.HTTP_201_CREATED)
def create_raffle(
    raffle: RaffleCreate, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    db_raffle = Raffle(**raffle.dict())
    db.add(db_raffle)
    db.commit()
    db.refresh(db_raffle)
    return db_raffle

@router.put("/raffles/{raffle_id}/complete")
def complete_raffle(
    raffle_id: int, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    raffle = db.query(Raffle).filter(Raffle.id == raffle_id).first()
    if not raffle:
        raise HTTPException(status_code=404, detail="Rifa no encontrada")
    
    raffle.is_completed = True
    raffle.is_active = False
    raffle.draw_date = datetime.utcnow()
    db.commit()
    return {"message": "Rifa marcada como completada"}

@router.delete("/raffles/{raffle_id}")
def delete_raffle(
    raffle_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    raffle = db.query(Raffle).filter(Raffle.id == raffle_id).first()
    if not raffle:
        raise HTTPException(status_code=404, detail="Rifa no encontrada")
    
    if raffle.is_active and not raffle.is_completed:
        raise HTTPException(
            status_code=400, 
            detail="No se puede eliminar una rifa activa"
        )
    
    ticket_count = db.query(Ticket).filter(Ticket.raffle_id == raffle_id).count()
    if ticket_count > 0:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar una rifa con tickets vendidos"
        )
    
    db.delete(raffle)
    db.commit()
    return {"message": "Rifa eliminada exitosamente"}

@router.post("/tickets/purchase", response_model=TicketPurchaseWithWhatsApp)
def purchase_tickets(purchase: TicketPurchase, db: Session = Depends(get_db)):
    raffle = db.query(Raffle).filter(Raffle.id == purchase.raffle_id).first()
    if not raffle:
        raise HTTPException(status_code=404, detail="Rifa no encontrada")
    
    if not raffle.is_active:
        raise HTTPException(status_code=400, detail="La rifa no está activa")
    
    if raffle.is_completed:
        raise HTTPException(status_code=400, detail="La rifa ya ha sido completada")
    
    user = db.query(User).filter(User.id == purchase.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Calcular boletos disponibles (total - vendidos - reservados)
    total_occupied = raffle.tickets_sold + raffle.tickets_reserved
    available_tickets = raffle.total_tickets - total_occupied
    
    if len(purchase.ticket_numbers) > available_tickets:
        raise HTTPException(
            status_code=400,
            detail=f"Solo hay {available_tickets} boletos disponibles"
        )
    
    # Obtener números ya ocupados (usando subquery para mejor rendimiento)
    from sqlalchemy import func
    occupied_numbers_subquery = db.query(Ticket.ticket_number).filter(
        Ticket.raffle_id == raffle.id,
        Ticket.status.in_([TicketStatus.PAID, TicketStatus.RESERVED])
    ).subquery()
    
    occupied_numbers = db.query(occupied_numbers_subquery.c.ticket_number).all()
    occupied_numbers = [num[0] for num in occupied_numbers]
    
    for ticket_number in purchase.ticket_numbers:
        if ticket_number < 1 or ticket_number > raffle.total_tickets:
            raise HTTPException(
                status_code=400,
                detail=f"El número {ticket_number} está fuera del rango (1-{raffle.total_tickets})"
            )
        if ticket_number in occupied_numbers:
            raise HTTPException(
                status_code=400,
                detail=f"El número {ticket_number} ya está reservado o vendido"
            )
    
    tickets = []
    for ticket_number in purchase.ticket_numbers:
        ticket = Ticket(
            ticket_number=ticket_number,
            user_id=purchase.user_id,
            raffle_id=purchase.raffle_id,
            status=TicketStatus.RESERVED,
            payment_confirmed=False
        )
        db.add(ticket)
        tickets.append(ticket)
    
    # Actualizar contador de reservas
    raffle.tickets_reserved += len(purchase.ticket_numbers)
    
    db.commit()
    
    for ticket in tickets:
        db.refresh(ticket)
    
    # Generar enlaces de WhatsApp para los administradores con teléfono
    admins_with_phone = db.query(Admin).filter(
        Admin.phone.isnot(None),
        Admin.is_active == True
    ).all()
    
    whatsapp_links = []
    for admin in admins_with_phone:
        # Crear mensaje para WhatsApp
        message = (
            f"🎫 NUEVA RESERVA DE BOLETOS 🎫\n\n"
            f"Rifa: {raffle.title}\n"
            f"Cliente: {user.name}\n"
            f"Teléfono: {user.phone}\n"
            f"Email: {user.email or 'No proporcionado'}\n"
            f"Cantidad: {len(purchase.ticket_numbers)} boleto(s)\n"
            f"Números: {', '.join(map(str, purchase.ticket_numbers))}\n"
            f"Precio por boleto: ${raffle.ticket_price}\n"
            f"Total a pagar: ${len(purchase.ticket_numbers) * raffle.ticket_price:.2f}\n"
            f"Fecha: {datetime.utcnow().strftime('%d/%m/%Y %H:%M:%S')}\n\n"
            f"⚠️ ESTOS BOLETOS ESTÁN RESERVADOS ⚠️\n"
            f"Confirme el pago cuando reciba el dinero."
        )
        
        # Codificar mensaje para URL
        import urllib.parse
        encoded_message = urllib.parse.quote(message)
        whatsapp_link = f"https://wa.me/{admin.phone}?text={encoded_message}"
        
        whatsapp_links.append({
            "admin_name": admin.username,
            "phone": admin.phone,
            "link": whatsapp_link
        })
    
    # La reserva es válida por 24 horas
    reserved_until = datetime.utcnow() + timedelta(hours=24)
    
    return {
        "tickets": tickets,
        "whatsapp_links": whatsapp_links,
        "reserved_until": reserved_until
    }

@router.get("/tickets/user/{user_id}", response_model=List[TicketResponse])
def get_user_tickets(user_id: int, db: Session = Depends(get_db)):
    tickets = db.query(Ticket).filter(Ticket.user_id == user_id).all()
    return tickets

@router.get("/tickets/raffle/{raffle_id}", response_model=List[TicketResponse])
def get_raffle_tickets(raffle_id: int, db: Session = Depends(get_db)):
    tickets = db.query(Ticket).filter(Ticket.raffle_id == raffle_id).all()
    return tickets

@router.get("/tickets/pending")
def get_pending_tickets(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    # Obtener tickets reservados pendientes de pago
    pending_tickets = db.query(Ticket).filter(
        Ticket.status == TicketStatus.RESERVED,
        Ticket.payment_confirmed == False
    ).all()
    
    result = []
    for ticket in pending_tickets:
        user = db.query(User).filter(User.id == ticket.user_id).first()
        raffle = db.query(Raffle).filter(Raffle.id == ticket.raffle_id).first()
        
        result.append({
            "id": ticket.id,
            "ticket_number": ticket.ticket_number,
            "user_name": user.name,
            "user_phone": user.phone,
            "user_email": user.email,
            "user_id": user.id,
            "raffle_title": raffle.title,
            "raffle_id": raffle.id,
            "ticket_price": raffle.ticket_price,
            "reserved_date": ticket.purchase_date,
            "days_ago": (datetime.utcnow() - ticket.purchase_date).days
        })
    
    return result

@router.post("/tickets/confirm-payment")
def confirm_payment(
    confirm_request: ConfirmPaymentRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    tickets = db.query(Ticket).filter(
        Ticket.id.in_(confirm_request.ticket_ids),
        Ticket.user_id == confirm_request.user_id,
        Ticket.status == TicketStatus.RESERVED
    ).all()
    
    if not tickets:
        raise HTTPException(status_code=404, detail="No se encontraron tickets reservados")
    
    # Verificar que todos los tickets sean de la misma rifa
    raffle_ids = set(ticket.raffle_id for ticket in tickets)
    if len(raffle_ids) != 1:
        raise HTTPException(status_code=400, detail="Los tickets deben ser de la misma rifa")
    
    raffle_id = list(raffle_ids)[0]
    raffle = db.query(Raffle).filter(Raffle.id == raffle_id).first()
    
    # Actualizar cada ticket
    for ticket in tickets:
        ticket.status = TicketStatus.PAID
        ticket.payment_confirmed = True
        ticket.payment_date = datetime.utcnow()
    
    # Actualizar contadores de la rifa
    raffle.tickets_sold += len(tickets)
    raffle.tickets_reserved -= len(tickets)
    
    db.commit()
    
    return {
        "message": f"Pago confirmado para {len(tickets)} ticket(s)",
        "confirmed_tickets": len(tickets),
        "total_amount": len(tickets) * raffle.ticket_price
    }

# ========== RUTAS DE SORTEO ==========
@router.post("/draw", response_model=WinnerResponse)
def perform_draw(
    draw_request: DrawRequest, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    raffle = db.query(Raffle).filter(Raffle.id == draw_request.raffle_id).first()
    if not raffle:
        raise HTTPException(status_code=404, detail="Rifa no encontrada")
    
    existing_winners = db.query(Winner).filter(Winner.raffle_id == raffle.id).all()
    existing_winner_user_ids = [winner.user_id for winner in existing_winners]
    
    if draw_request.winning_ticket_id:
        winning_ticket = db.query(Ticket).filter(
            Ticket.id == draw_request.winning_ticket_id,
            Ticket.raffle_id == raffle.id,
            Ticket.status == TicketStatus.PAID,
            Ticket.is_winner == False
        ).first()
        
        if not winning_ticket:
            raise HTTPException(
                status_code=400,
                detail="El ticket especificado no existe, no está pagado o ya es ganador"
            )
        
        if winning_ticket.user_id in existing_winner_user_ids:
            raise HTTPException(
                status_code=400,
                detail="Este usuario ya ha ganado en esta rifa"
            )
    else:
        # Solo tickets pagados pueden ganar
        available_tickets = db.query(Ticket).filter(
            Ticket.raffle_id == raffle.id,
            Ticket.status == TicketStatus.PAID,
            Ticket.is_winner == False,
            ~Ticket.user_id.in_(existing_winner_user_ids) if existing_winner_user_ids else True
        ).all()
        
        if not available_tickets:
            raise HTTPException(
                status_code=400,
                detail="No hay boletos pagados disponibles para sortear"
            )
        
        winning_ticket = random.choice(available_tickets)
    
    user = db.query(User).filter(User.id == winning_ticket.user_id).first()
    
    existing_winner = db.query(Winner).filter(
        Winner.raffle_id == raffle.id,
        Winner.prize_position == draw_request.prize_position
    ).first()
    
    if existing_winner:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un ganador para la posición {draw_request.prize_position}"
        )
    
    # Asignar el premio correspondiente según la posición
    if draw_request.prize_position == 1:
        prize_description = f"1° Lugar - {raffle.prize_first}"
    elif draw_request.prize_position == 2:
        prize_description = f"2° Lugar - {raffle.prize_second}"
    elif draw_request.prize_position == 3:
        prize_description = f"3° Lugar - {raffle.prize_third}"
    else:
        prize_description = f"Premio {draw_request.prize_position}° Lugar"
    
    winner = Winner(
        user_id=winning_ticket.user_id,
        raffle_id=raffle.id,
        ticket_id=winning_ticket.id,
        prize_position=draw_request.prize_position,
        prize_description=prize_description,
        notified=False,
        whatsapp_link=f"https://wa.me/{user.phone}?text=Felicidades {user.name}! Has ganado el {draw_request.prize_position}° premio en la rifa '{raffle.title}' con el boleto numero {winning_ticket.ticket_number}. Premio: {prize_description}"
    )
    
    winning_ticket.is_winner = True
    
    total_winners = db.query(Winner).filter(Winner.raffle_id == raffle.id).count()
    if total_winners + 1 >= 3:
        raffle.is_completed = True
        raffle.is_active = False
        raffle.draw_date = datetime.utcnow()
    
    db.add(winner)
    db.commit()
    db.refresh(winner)
    
    winner_details = {
        "id": winner.id,
        "user_id": winner.user_id,
        "raffle_id": winner.raffle_id,
        "ticket_id": winner.ticket_id,
        "prize_position": winner.prize_position,
        "prize_description": winner.prize_description,
        "notified": winner.notified,
        "notification_date": winner.notification_date,
        "whatsapp_link": winner.whatsapp_link,
        "created_at": winner.created_at,
        "user_name": user.name,
        "user_phone": user.phone,
        "ticket_number": winning_ticket.ticket_number
    }
    
    return winner_details

@router.get("/winners/raffle/{raffle_id}", response_model=List[WinnerResponse])
def get_raffle_winners(raffle_id: int, db: Session = Depends(get_db)):
    winners = db.query(Winner).filter(Winner.raffle_id == raffle_id).all()
    
    result = []
    for winner in winners:
        user = db.query(User).filter(User.id == winner.user_id).first()
        ticket = db.query(Ticket).filter(Ticket.id == winner.ticket_id).first()
        
        result.append({
            "id": winner.id,
            "user_id": winner.user_id,
            "raffle_id": winner.raffle_id,
            "ticket_id": winner.ticket_id,
            "prize_position": winner.prize_position,
            "prize_description": winner.prize_description,
            "notified": winner.notified,
            "notification_date": winner.notification_date,
            "whatsapp_link": winner.whatsapp_link,
            "created_at": winner.created_at,
            "user_name": user.name,
            "user_phone": user.phone,
            "ticket_number": ticket.ticket_number
        })
    
    return result

@router.get("/winners/{raffle_id}/whatsapp-links", response_model=WhatsAppLinksResponse)
def get_whatsapp_links(
    raffle_id: int, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    raffle = db.query(Raffle).filter(Raffle.id == raffle_id).first()
    if not raffle:
        raise HTTPException(status_code=404, detail="Rifa no encontrada")
    
    winners = db.query(Winner).filter(Winner.raffle_id == raffle_id).all()
    
    if not winners:
        raise HTTPException(status_code=404, detail="No hay ganadores para esta rifa")
    
    winners_details = []
    for winner in winners:
        user = db.query(User).filter(User.id == winner.user_id).first()
        ticket = db.query(Ticket).filter(Ticket.id == winner.ticket_id).first()
        
        winners_details.append({
            "winner_name": user.name,
            "winner_phone": user.phone,
            "ticket_number": ticket.ticket_number,
            "prize_position": winner.prize_position,
            "whatsapp_link": winner.whatsapp_link
        })
    
    return {
        "raffle_id": raffle_id,
        "raffle_title": raffle.title,
        "winners": winners_details
    }

@router.put("/winners/{winner_id}/mark-notified")
def mark_winner_notified(
    winner_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    winner = db.query(Winner).filter(Winner.id == winner_id).first()
    if not winner:
        raise HTTPException(status_code=404, detail="Ganador no encontrado")
    
    winner.notified = True
    winner.notification_date = datetime.utcnow()
    db.commit()
    
    return {"message": "Ganador marcado como notificado"}

@router.get("/stats/raffle/{raffle_id}")
def get_raffle_stats(
    raffle_id: int, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    raffle = db.query(Raffle).filter(Raffle.id == raffle_id).first()
    if not raffle:
        raise HTTPException(status_code=404, detail="Rifa no encontrada")
    
    total_occupied = raffle.tickets_sold + raffle.tickets_reserved
    total_sales = raffle.tickets_sold * raffle.ticket_price
    completion_percentage = (total_occupied / raffle.total_tickets) * 100 if raffle.total_tickets > 0 else 0
    
    return {
        "raffle_id": raffle_id,
        "title": raffle.title,
        "tickets_sold": raffle.tickets_sold,
        "tickets_reserved": raffle.tickets_reserved,
        "tickets_available": raffle.total_tickets - total_occupied,
        "completion_percentage": round(completion_percentage, 2),
        "total_sales": round(total_sales, 2),
        "potential_sales": round((raffle.tickets_reserved * raffle.ticket_price), 2),
        "ticket_price": raffle.ticket_price,
        "is_completed": raffle.is_completed
    }

# ========== RUTAS DE ADMINISTRACIÓN ==========
@router.post("/admin/admins/", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
def create_admin(
    admin_data: AdminCreate, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    existing_admin = db.query(Admin).filter(
        (Admin.username == admin_data.username) | (Admin.email == admin_data.email)
    ).first()
    if existing_admin:
        raise HTTPException(status_code=400, detail="El nombre de usuario o email ya existe")
    
    db_admin = Admin(
        username=admin_data.username,
        email=admin_data.email,
        phone=admin_data.phone,
        is_active=True,
        is_main_admin=False
    )
    db_admin.set_password(admin_data.password)
    
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

@router.put("/admin/admins/{admin_id}", response_model=AdminResponse)
def update_admin(
    admin_id: int,
    admin_data: AdminUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    admin_to_update = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin_to_update:
        raise HTTPException(status_code=404, detail="Administrador no encontrado")
    
    if current_admin.id != admin_id and not current_admin.is_main_admin:
        raise HTTPException(
            status_code=403, 
            detail="No tiene permisos para actualizar este administrador"
        )
    
    if admin_data.email:
        existing = db.query(Admin).filter(Admin.email == admin_data.email, Admin.id != admin_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="El email ya está en uso")
        admin_to_update.email = admin_data.email
    
    if admin_data.phone is not None:
        admin_to_update.phone = admin_data.phone
    
    if admin_data.password:
        admin_to_update.set_password(admin_data.password)
    
    db.commit()
    db.refresh(admin_to_update)
    return admin_to_update

@router.delete("/admin/admins/{admin_id}")
def delete_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    if current_admin.id == admin_id:
        raise HTTPException(status_code=400, detail="No puede eliminarse a sí mismo")
    
    admin_to_delete = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin_to_delete:
        raise HTTPException(status_code=404, detail="Administrador no encontrado")
    
    if admin_to_delete.is_main_admin:
        raise HTTPException(status_code=400, detail="No se puede eliminar al administrador principal")
    
    db.delete(admin_to_delete)
    db.commit()
    return {"message": "Administrador eliminado exitosamente"}

@router.get("/admin/admins/", response_model=List[AdminResponse])
def get_admins(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    admins = db.query(Admin).all()
    return admins

@router.get("/stats/overview")
def get_overview_stats(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    total_raffles = db.query(Raffle).count()
    active_raffles = db.query(Raffle).filter(Raffle.is_active == True).count()
    completed_raffles = db.query(Raffle).filter(Raffle.is_completed == True).count()
    
    total_users = db.query(User).count()
    total_tickets_sold = db.query(Ticket).filter(Ticket.status == TicketStatus.PAID).count()
    total_tickets_reserved = db.query(Ticket).filter(Ticket.status == TicketStatus.RESERVED).count()
    
    # Calcular ingresos totales de manera más eficiente
    from sqlalchemy import func
    revenue_result = db.query(func.sum(Raffle.tickets_sold * Raffle.ticket_price)).scalar()
    total_revenue = revenue_result if revenue_result else 0
    
    return {
        "total_raffles": total_raffles,
        "active_raffles": active_raffles,
        "completed_raffles": completed_raffles,
        "total_users": total_users,
        "total_tickets_sold": total_tickets_sold,
        "total_tickets_reserved": total_tickets_reserved,
        "total_revenue": round(total_revenue, 2),
        "potential_revenue": round((total_tickets_reserved * 10), 2),
        "last_updated": datetime.utcnow().isoformat()

    }



