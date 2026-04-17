from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models.ticket import Ticket, TicketType, TicketStatus
from app.db.models.user import User
from app.db.schemas.ticket import TicketCreate, TicketOut
from app.core.security import get_current_user, get_current_admin

router = APIRouter()

PRICES = {
    # Legados
    TicketType.single: 1.50,
    TicketType.daily: 5.00,
    TicketType.monthly: 40.00,
    # Tarifas reais TUB
    TicketType.single_1coroa: 1.55,
    TicketType.single_2coroa: 2.00,
    TicketType.transfer_1coroa: 1.55,
    TicketType.transfer_2coroa: 2.00,
}
VALIDITY = {
    # Legados
    TicketType.single: timedelta(hours=2),
    TicketType.daily: timedelta(days=1),
    TicketType.monthly: timedelta(days=30),
    # Tarifas reais TUB
    TicketType.single_1coroa: timedelta(minutes=60),
    TicketType.single_2coroa: timedelta(minutes=90),
    TicketType.transfer_1coroa: timedelta(minutes=60),
    TicketType.transfer_2coroa: timedelta(minutes=90),
}


def utcnow() -> datetime:
    """Retorna a hora atual UTC sempre timezone-aware (compatível com PostgreSQL)."""
    return datetime.now(timezone.utc)


def is_expired(valid_until: datetime) -> bool:
    """Compara valid_until (pode ser aware ou naive) com agora de forma segura."""
    if valid_until is None:
        return False
    now = utcnow()
    # Se valid_until for naive, trata como UTC
    if valid_until.tzinfo is None:
        valid_until = valid_until.replace(tzinfo=timezone.utc)
    return valid_until < now


# ─── UC2.1 – Comprar Bilhete ────────────────────────────────────────────────
@router.post("/", response_model=TicketOut, status_code=201)
def buy_ticket(
    ticket: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = utcnow()
    db_ticket = Ticket(
        user_id=current_user.id,
        transport_id=ticket.transport_id,
        type=ticket.type,
        price=PRICES[ticket.type],
        status=TicketStatus.active,
        purchased_at=now,
        valid_until=now + VALIDITY[ticket.type],
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


# ─── UC2.2 – Consultar os meus bilhetes ─────────────────────────────────────
@router.get("/me", response_model=List[TicketOut])
def my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Auto-expire bilhetes cujo prazo já passou
    tickets = db.query(Ticket).filter(
        Ticket.user_id == current_user.id,
        Ticket.status == TicketStatus.active,
    ).all()

    changed = False
    for t in tickets:
        if is_expired(t.valid_until):
            t.status = TicketStatus.expired
            changed = True
    if changed:
        db.commit()

    return (
        db.query(Ticket)
        .filter(Ticket.user_id == current_user.id)
        .order_by(Ticket.purchased_at.desc())
        .all()
    )


# ─── UC2.3 – Validar Bilhete ────────────────────────────────────────────────
@router.post("/{ticket_id}/validate", response_model=TicketOut)
def validate_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Admin pode validar qualquer bilhete; utilizador normal só os seus
    query = db.query(Ticket).filter(Ticket.id == ticket_id)
    if not current_user.is_admin:
        query = query.filter(Ticket.user_id == current_user.id)

    ticket = query.first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Bilhete não encontrado")

    # Verificar expiração primeiro (com comparação timezone-safe)
    if is_expired(ticket.valid_until):
        ticket.status = TicketStatus.expired
        db.commit()
        raise HTTPException(status_code=400, detail="Bilhete expirado")

    if ticket.status == TicketStatus.used:
        raise HTTPException(status_code=400, detail="Bilhete já foi utilizado")

    if ticket.status != TicketStatus.active:
        raise HTTPException(status_code=400, detail="Bilhete inválido")

    ticket.status = TicketStatus.used
    ticket.used_at = utcnow()
    db.commit()
    db.refresh(ticket)
    return ticket


# ─── UC2.4 – Admin: ver todos os bilhetes ───────────────────────────────────
@router.get("/all", response_model=List[TicketOut])
def all_tickets(
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    return db.query(Ticket).order_by(Ticket.purchased_at.desc()).all()
