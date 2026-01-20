from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

from models import Base

engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_default_admin():
    from models import Admin
    db = SessionLocal()
    try:
        admin = db.query(Admin).filter(Admin.username == settings.ADMIN_USERNAME).first()
        if not admin:
            print(f"Creando admin por defecto: {settings.ADMIN_USERNAME}")
            default_admin = Admin(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                phone=None,  # Admin principal sin teléfono
                is_active=True,
                is_main_admin=True  # Marcar como admin principal
            )
            default_admin.set_password(settings.ADMIN_PASSWORD)
            db.add(default_admin)
            db.commit()
            print(f"Admin creado exitosamente. Usuario: {settings.ADMIN_USERNAME}")
        else:
            print(f"Admin por defecto ya existe: {settings.ADMIN_USERNAME}")
    except Exception as e:
        print(f"Error creando admin: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()