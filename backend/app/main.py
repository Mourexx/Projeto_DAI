from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.packages.p1_user_management.users import router as users_router
from app.packages.p2_ticketing.tickets import router as tickets_router
from app.packages.p4_monitoring.transports import router as transports_router
from app.packages.p5_analytics.stats import router as stats_router
from app.packages.p6_alerts.alerts import router as alerts_router
from app.packages.p7_devices.devices import router as devices_router
from app.packages.p8_export.export import router as export_router
from app.seed import router as seed_router, seed_db
from app.db.database import engine, Base, get_db
import app.db.models  # noqa: F401 — regista todos os modelos no SQLAlchemy

_NEW_TICKET_TYPES = ['single_1coroa', 'single_2coroa', 'transfer_1coroa', 'transfer_2coroa']


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        for val in _NEW_TICKET_TYPES:
            try:
                conn.execute(text(f"ALTER TYPE tickettype ADD VALUE IF NOT EXISTS '{val}'"))
                conn.commit()
            except Exception as e:
                print(f"⚠️  Enum '{val}': {e}")
                conn.rollback()

    db = next(get_db())
    try:
        result = seed_db(db)
        if result["created"]:
            print(f"✅ Seed: {result['created']}")
        else:
            print("ℹ️  Seed: dados já existem.")
    except Exception as e:
        print(f"⚠️  Seed falhou: {e}")
    finally:
        db.close()

    yield


app = FastAPI(
    title="Sistema de Bilhética — API",
    description="API para gestão de bilhetes e monitorização de transportes urbanos (TUB — Braga)",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router,      prefix="/api/v1/users",      tags=["Utilizadores"])
app.include_router(tickets_router,    prefix="/api/v1/tickets",    tags=["Bilhetes"])
app.include_router(transports_router, prefix="/api/v1/transports", tags=["Transportes"])
app.include_router(stats_router,      prefix="/api/v1/stats",      tags=["Estatísticas"])
app.include_router(alerts_router,     prefix="/api/v1/stats",      tags=["Alertas"])
app.include_router(devices_router,    prefix="/api/v1/devices",    tags=["Dispositivos"])
app.include_router(export_router,     prefix="/api/v1/export",     tags=["Exportação"])
app.include_router(seed_router,       prefix="/api/v1/seed",       tags=["Demo"])


@app.get("/", tags=["Root"])
def root():
    return {"message": "API TUB a funcionar!", "version": "2.0.0", "docs": "/docs"}
