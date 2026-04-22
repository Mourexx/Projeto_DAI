# Package Seed — 4SRS SIBCP v3
# Cria dados de demonstração com coordenadas reais TUB (GTFS)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.db.database import get_db
from app.packages.p1_user_management.user import User
from app.packages.p4_monitoring.transport import Transport, TransportType
from app.packages.p2_ticketing.ticket import Ticket, TicketType, TicketStatus
from app.packages.p4_monitoring.linha import Linha
from app.core.security import hash_password

router = APIRouter()


def seed_db(db: Session) -> dict:
    """Lógica de seed — idempotente. Retorna lista do que foi criado."""
    if db.query(User).count() > 0:
        return {"created": []}

    created = []

    if not db.query(User).filter(User.email == "admin@tub.pt").first():
        db.add(User(
            email="admin@tub.pt", full_name="Administrador TUB",
            hashed_password=hash_password("admin123"),
            is_admin=True, is_active=True,
        ))
        created.append("admin user")

    if not db.query(User).filter(User.email == "user@tub.pt").first():
        db.add(User(
            email="user@tub.pt", full_name="Passageiro Demo",
            hashed_password=hash_password("user123"),
            is_admin=False, is_active=True,
        ))
        created.append("demo user")

    db.flush()

    if db.query(Linha).count() == 0:
        for code, nome in [
            ("L1", "Residência UM / Universidade do Minho"),
            ("L2", "Ponte de Prado / Bom Jesus"),
            ("L3", "Av. Central / Ruães"),
            ("L5", "Dume / Quinta da Capela"),
            ("L7", "S. Mamede d'Este / Celeirós"),
            ("L8", "Rua 25 de Abril / Sete Fontes"),
        ]:
            db.add(Linha(codigo=code, nome=nome, ativa=True))
        created.append("linhas")

    if db.query(Transport).count() == 0:
        for name, ttype, line, cap, occ, lat, lon in [
            ("TUB-001", TransportType.bus, "L1", 60, 48, 41.540798, -8.408466),
            ("TUB-002", TransportType.bus, "L1", 60, 15, 41.541254, -8.406142),
            ("TUB-003", TransportType.bus, "L2", 60, 42, 41.585380, -8.455420),
            ("TUB-004", TransportType.bus, "L3", 60, 52, 41.563328, -8.417568),
            ("TUB-005", TransportType.bus, "L3", 60, 10, 41.569326, -8.423281),
            ("TUB-006", TransportType.bus, "L5", 60, 38, 41.574310, -8.437940),
            ("TUB-007", TransportType.bus, "L7", 60, 71, 41.571870, -8.373190),
            ("TUB-008", TransportType.bus, "L8", 60, 51, 41.572350, -8.402650),
        ]:
            db.add(Transport(
                name=name, type=ttype, line=line,
                capacity=cap, current_occupancy=occ,
                latitude=lat, longitude=lon, is_active=True,
            ))
        created.append("transportes")

    db.commit()
    db.flush()

    now = datetime.now(timezone.utc)
    user = db.query(User).filter(User.email == "user@tub.pt").first()
    if user and db.query(Ticket).filter(Ticket.user_id == user.id).count() == 0:
        db.add_all([
            Ticket(user_id=user.id, type=TicketType.single_1coroa, price=1.55,
                   status=TicketStatus.active, valid_until=now + timedelta(minutes=60),
                   purchased_at=now - timedelta(minutes=10)),
            Ticket(user_id=user.id, type=TicketType.single_2coroa, price=2.00,
                   status=TicketStatus.used, valid_until=now - timedelta(minutes=30),
                   purchased_at=now - timedelta(hours=2), used_at=now - timedelta(hours=1)),
            Ticket(user_id=user.id, type=TicketType.transfer_1coroa, price=1.55,
                   status=TicketStatus.expired, valid_until=now - timedelta(hours=1),
                   purchased_at=now - timedelta(hours=3)),
        ])
        created.append("bilhetes demo user")

    admin = db.query(User).filter(User.email == "admin@tub.pt").first()
    if admin and db.query(Ticket).filter(Ticket.user_id == admin.id).count() == 0:
        db.add_all([
            Ticket(user_id=admin.id, type=TicketType.single_1coroa, price=1.55,
                   status=TicketStatus.active, valid_until=now + timedelta(minutes=55),
                   purchased_at=now - timedelta(minutes=5)),
            Ticket(user_id=admin.id, type=TicketType.transfer_2coroa, price=2.00,
                   status=TicketStatus.active, valid_until=now + timedelta(minutes=80),
                   purchased_at=now - timedelta(minutes=10)),
            Ticket(user_id=admin.id, type=TicketType.single_2coroa, price=2.00,
                   status=TicketStatus.used, valid_until=now - timedelta(minutes=15),
                   purchased_at=now - timedelta(hours=2), used_at=now - timedelta(hours=1)),
        ])
        created.append("bilhetes demo admin")

    db.commit()
    return {
        "created": created,
        "credenciais": {
            "admin": {"email": "admin@tub.pt", "password": "admin123"},
            "utilizador": {"email": "user@tub.pt", "password": "user123"},
        },
    }


@router.post("/", status_code=201)
def seed(db: Session = Depends(get_db)):
    """UC Demo — cria dados de demonstração (apenas na primeira execução)."""
    if db.query(User).count() > 0:
        raise HTTPException(status_code=403, detail="Seed já foi executado. Use as credenciais existentes.")
    result = seed_db(db)
    return {"message": "✅ Dados de demo criados com sucesso!", **result}
