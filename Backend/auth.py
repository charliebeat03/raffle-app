from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import bcrypt
import logging

from config import settings
from database import get_db
from models import Admin

# Configurar logging
logger = logging.getLogger(__name__)

# Configuración de seguridad
security = HTTPBearer()

# Funciones de token JWT
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales de autenticación inválidas",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return username
    except JWTError as e:
        logger.error(f"Error de JWT: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_admin(
    username: str = Depends(verify_token),
    db: Session = Depends(get_db)
) -> Admin:
    admin = db.query(Admin).filter(Admin.username == username).first()
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Administrador no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cuenta de administrador inactiva",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return admin

def authenticate_admin(db: Session, username: str, password: str) -> Union[Admin, None]:
    logger.info(f"Intento de autenticación para usuario: {username}")
    
    admin = db.query(Admin).filter(Admin.username == username).first()
    
    if not admin:
        logger.warning(f"Admin '{username}' no encontrado en la base de datos")
        return None
    
    logger.info(f"Admin encontrado: {admin.username}, email: {admin.email}")
    logger.info(f"Estado activo: {admin.is_active}, es admin principal: {admin.is_main_admin}")
    
    # Verificar si la cuenta está activa
    if not admin.is_active:
        logger.warning(f"Cuenta de admin '{username}' inactiva")
        return None
    
    logger.info(f"Verificando contraseña para {username}")
    
    # Verificar contraseña
    try:
        if admin.verify_password(password):
            logger.info(f"Contraseña válida para {username}")
            return admin
        else:
            logger.warning(f"Contraseña incorrecta para {username}")
            return None
    except Exception as e:
        logger.error(f"Error al verificar contraseña: {e}")
        return None
