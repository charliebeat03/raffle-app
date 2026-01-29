from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import time
import logging
import socketio
from fastapi.responses import JSONResponse
from fastapi.requests import Request

from database import engine, Base, create_default_admin, init_db
from routes import router
from config import settings

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear servidor Socket.IO
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializar base de datos
    try:
        init_db()
        logger.info("Base de datos inicializada exitosamente")
    except Exception as e:
        logger.error(f"Error inicializando base de datos: {e}")
        raise
    
    yield
    
    logger.info("Apagando aplicación...")

# Crear aplicación FastAPI
app = FastAPI(
    title="Raffle Management API",
    description="API para gestión de rifas",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Incluir rutas API
app.include_router(router, prefix="/api")

# Eventos de Socket.IO
@sio.event
async def connect(sid, environ):
    logger.info(f"Cliente conectado: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Cliente desconectado: {sid}")

@sio.event
async def wheel_spin(sid, data):
    logger.info(f"Evento wheel_spin recibido de {sid}: {data}")
    await sio.emit('wheel_spin', data, skip_sid=sid)

@sio.event
async def winner_selected(sid, data):
    logger.info(f"Evento winner_selected recibido de {sid}: {data}")
    await sio.emit('winner_selected', data, skip_sid=sid)

# Ruta raíz
@app.get("/")
def read_root():
    return {
        "message": "Welcome to Raffle Management API",
        "docs": "/docs",
        "redoc": "/redoc",
        "version": "2.0.0",
        "database": "PostgreSQL",
        "socketio": "enabled"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "database": "connected" if engine else "disconnected"
    }

# Crear aplicación ASGI combinada
app.mount("/socket.io/", socketio.ASGIApp(sio))

# Handler para rutas no encontradas
@app.exception_handler(404)
async def not_found_exception_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"message": f"Ruta no encontrada: {request.url.path}"}
    )

# Si se ejecuta directamente
if __name__ == "__main__":
    uvicorn.run(
        "app:app",  # Ahora ejecutamos la app FastAPI normal
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )
