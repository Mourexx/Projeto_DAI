from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.api.v1.routes import tickets, transports, stats, users, seed
from app.db.database import engine, Base, get_db
import app.db.models  # noqa: F401

Base.metadata.create_all(bind=engine)

# Adiciona novos valores ao enum tickettype no PostgreSQL (idempotente)
_NEW_TICKET_TYPES = ['single_1coroa', 'single_2coroa', 'transfer_1coroa', 'transfer_2coroa']
with engine.connect() as _conn:
    for _val in _NEW_TICKET_TYPES:
        try:
            _conn.execute(text(f"ALTER TYPE tickettype ADD VALUE IF NOT EXISTS '{_val}'"))
            _conn.commit()
        except Exception as e:
            print(f"⚠️  Failed to add enum value '{_val}': {e}")
            _conn.rollback()

app = FastAPI(
    title="Sistema de Bilhética - API",
    description="API para gestão de bilhetes e monitorização de transportes urbanos (TUB - Braga)",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router,      prefix="/api/v1/users",      tags=["Utilizadores"])
app.include_router(tickets.router,    prefix="/api/v1/tickets",    tags=["Bilhetes"])
app.include_router(transports.router, prefix="/api/v1/transports", tags=["Transportes"])
app.include_router(stats.router,      prefix="/api/v1/stats",      tags=["Estatísticas"])
app.include_router(seed.router,       prefix="/api/v1/seed",       tags=["Demo"])


@app.on_event("startup")
def auto_seed():
    """Corre o seed automaticamente quando o backend arranca."""
    db = next(get_db())
    try:
        from app.api.v1.routes.seed import seed as run_seed
        result = run_seed(db)
        if result["created"]:
            print(f"✅ Seed automático: {result['created']}")
        else:
            print("ℹ️  Seed: dados já existem, nada criado.")
    except Exception as e:
        print(f"⚠️  Seed automático falhou: {e}")
    finally:
        db.close()


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "API TUB a funcionar!",
        "version": "2.0.0",
        "docs": "/docs",
    }