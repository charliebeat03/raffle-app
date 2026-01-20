import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import time

from database import engine, Base, create_default_admin
from routes import router
from config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas
    Base.metadata.create_all(bind=engine)
    print("Tablas de base de datos creadas")
    
    # Esperar un momento
    time.sleep(0.5)
    
    # Crear admin
    try:
        create_default_admin()
    except Exception as e:
        print(f"Error creando admin: {e}")
    
    yield
    print("Apagando...")

app = FastAPI(
    title="Raffle Management API",
    description="API para gestión de rifas",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "message": "Welcome to Raffle Management API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )

