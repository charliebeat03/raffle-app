from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import bcrypt

from config import settings
from database import get_db
from models import Admin

# Configuración de seguridad
security = HTTPBearer()

# Funciones de token JWT
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
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
    except JWTError:
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
    admin = db.query(Admin).filter(Admin.username == username).first()
    if not admin:
        return None
    if not admin.verify_password(password):
        return None
    return admin