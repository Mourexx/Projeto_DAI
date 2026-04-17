"""
Rota de seed — cria dados de demonstração.
Coordenadas reais da TUB extraídas dos dados GTFS (dados_tun.zip).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.db.database import get_db
from app.db.models.user import User
from app.db.models.transport import Transport, TransportType
from app.db.models.ticket import Ticket, TicketType, TicketStatus
from app.db.models.linha import Linha
from app.core.security import hash_password

router = APIRouter()


@router.post("/", status_code=201)
def seed(db: Session = Depends(get_db)):
    """Cria dados de demonstração — só funciona uma vez (primeira execução)."""
    if db.query(User).count() > 0:
        raise HTTPException(status_code=403, detail="Seed já foi executado. Use as credenciais existentes.")

    created = []

    # Admin
    if not db.query(User).filter(User.email == "admin@tub.pt").first():
        db.add(User(
            email="admin@tub.pt",
            full_name="Administrador TUB",
            hashed_password=hash_password("admin123"),
            is_admin=True,
            is_active=True,
        ))
        created.append("admin user")

    # Utilizador normal
    if not db.query(User).filter(User.email == "user@tub.pt").first():
        db.add(User(
            email="user@tub.pt",
            full_name="Passageiro Demo",
            hashed_password=hash_password("user123"),
            is_admin=False,
            is_active=True,
        ))
        created.append("demo user")

    db.flush()

    # Linhas — nomes reais da TUB (fonte: routes.txt do GTFS)
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

    # Transportes — coordenadas reais extraídas do GTFS (shapes.txt + stops.txt)
    if db.query(Transport).count() == 0:
        transportes = [
            # L1 — Residência UM / Universidade do Minho
            ("TUB-001", TransportType.bus, "L1", 60, 48, 41.540798, -8.408466),
            ("TUB-002", TransportType.bus, "L1", 60, 15, 41.541254, -8.406142),
            # L2 — Ponte de Prado / Bom Jesus
            ("TUB-003", TransportType.bus, "L2", 60, 42, 41.585380, -8.455420),
            # L3 — Av. Central / Ruães
            ("TUB-004", TransportType.bus, "L3", 60, 52, 41.563328, -8.417568),
            ("TUB-005", TransportType.bus, "L3", 60, 10, 41.569326, -8.423281),
            # L5 — Dume / Quinta da Capela
            ("TUB-006", TransportType.bus, "L5", 60, 38, 41.574310, -8.437940),
            # L7 — S. Mamede d'Este / Celeirós
            ("TUB-007", TransportType.bus, "L7", 60, 71, 41.571870, -8.373190),
            # L8 — Rua 25 de Abril / Sete Fontes
            ("TUB-008", TransportType.bus, "L8", 60, 51, 41.572350, -8.402650),
        ]
        for name, ttype, line, cap, occ, lat, lon in transportes:
            db.add(Transport(
                name=name, type=ttype, line=line,
                capacity=cap, current_occupancy=occ,
                latitude=lat, longitude=lon, is_active=True,
            ))
        created.append("transportes")

    db.commit()
    db.flush()

    # Bilhetes de demo para o utilizador normal
    now = datetime.now(timezone.utc)
    user = db.query(User).filter(User.email == "user@tub.pt").first()
    if user and db.query(Ticket).filter(Ticket.user_id == user.id).count() == 0:
        bilhetes = [
            Ticket(user_id=user.id, type=TicketType.single_1coroa, price=1.55,
                   status=TicketStatus.active, valid_until=now + timedelta(minutes=60),
                   purchased_at=now - timedelta(minutes=10)),
            Ticket(user_id=user.id, type=TicketType.single_2coroa, price=2.00,
                   status=TicketStatus.used, valid_until=now - timedelta(minutes=30),
                   purchased_at=now - timedelta(hours=2), used_at=now - timedelta(hours=1)),
            Ticket(user_id=user.id, type=TicketType.transfer_1coroa, price=1.55,
                   status=TicketStatus.expired, valid_until=now - timedelta(hours=1),
                   purchased_at=now - timedelta(hours=3)),
        ]
        for b in bilhetes:
            db.add(b)
        created.append("bilhetes demo user")

    # Bilhetes de demo para o admin
    admin = db.query(User).filter(User.email == "admin@tub.pt").first()
    if admin and db.query(Ticket).filter(Ticket.user_id == admin.id).count() == 0:
        bilhetes_admin = [
            Ticket(user_id=admin.id, type=TicketType.single_1coroa, price=1.55,
                   status=TicketStatus.active, valid_until=now + timedelta(minutes=55),
                   purchased_at=now - timedelta(minutes=5)),
            Ticket(user_id=admin.id, type=TicketType.transfer_2coroa, price=2.00,
                   status=TicketStatus.active, valid_until=now + timedelta(minutes=80),
                   purchased_at=now - timedelta(minutes=10)),
            Ticket(user_id=admin.id, type=TicketType.single_2coroa, price=2.00,
                   status=TicketStatus.used, valid_until=now - timedelta(minutes=15),
                   purchased_at=now - timedelta(hours=2), used_at=now - timedelta(hours=1)),
        ]
        for b in bilhetes_admin:
            db.add(b)
        created.append("bilhetes demo admin")

    db.commit()

    return {
        "message": "✅ Dados de demo criados com sucesso!",
        "created": created,
        "credenciais": {
            "admin": {"email": "admin@tub.pt", "password": "admin123"},
            "utilizador": {"email": "user@tub.pt", "password": "user123"},
        }
    }
