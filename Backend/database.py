from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from config import settings
import os
import logging

logger = logging.getLogger(__name__)

from models import Base

# Configurar logging
logging.basicConfig(level=logging.INFO)

# Manejo de URLs de PostgreSQL
def get_database_url():
    """Obtiene y formatea la URL de la base de datos"""
    if "DATABASE_URL" in os.environ:
        database_url = os.environ["DATABASE_URL"]
        # Render y otros servicios usan postgres:// que SQLAlchemy necesita como postgresql://
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        return database_url
    else:
        return settings.DATABASE_URL

# Configurar engine para PostgreSQL
database_url = get_database_url()

# Configuración específica para PostgreSQL
engine = create_engine(
    database_url,
    poolclass=QueuePool,  # Usar QueuePool para PostgreSQL
    pool_size=5,  # Número de conexiones en el pool
    max_overflow=10,  # Máximo de conexiones adicionales
    pool_pre_ping=True,  # Verificar conexión antes de usar
    pool_recycle=300,  # Reciclar conexiones cada 300 segundos
    echo=False,  # Cambiar a True para debug
    connect_args={
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
)

SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine,
    expire_on_commit=False
)

def get_db():
    """Dependency para obtener sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_default_admin():
    """Crear administrador por defecto si no existe"""
    from models import Admin
    from sqlalchemy.exc import IntegrityError
    
    db = SessionLocal()
    try:
        admin = db.query(Admin).filter(Admin.username == settings.ADMIN_USERNAME).first()
        if not admin:
            logger.info(f"Creando admin por defecto: {settings.ADMIN_USERNAME}")
            default_admin = Admin(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                phone=None,
                is_active=True,
                is_main_admin=True
            )
            default_admin.set_password(settings.ADMIN_PASSWORD)
            db.add(default_admin)
            db.commit()
            logger.info(f"Admin creado exitosamente. Usuario: {settings.ADMIN_USERNAME}")
        else:
            logger.info(f"Admin por defecto ya existe: {settings.ADMIN_USERNAME}")
    except IntegrityError as e:
        db.rollback()
        logger.warning(f"El admin ya existe o hay conflicto de datos: {e}")
    except Exception as e:
        logger.error(f"Error creando admin: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

def init_db():
    """Inicializar la base de datos (crear tablas)"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Tablas de base de datos creadas exitosamente")
        
        # Crear admin por defecto
        create_default_admin()
        
    except Exception as e:
        logger.error(f"Error inicializando base de datos: {e}")
        raise