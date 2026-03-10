from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models.ticket import Ticket, TicketType, TicketStatus
from app.db.models.user import User
from app.db.schemas.ticket import TicketCreate, TicketOut
from app.core.security import get_current_user

router = APIRouter()

PRICES = {
    TicketType.single: 1.50,
    TicketType.daily: 5.00,
    TicketType.monthly: 40.00,
}

VALIDITY = {
    TicketType.single: timedelta(hours=2),
    TicketType.daily: timedelta(days=1),
    TicketType.monthly: timedelta(days=30),
}


@router.post("/", response_model=TicketOut, status_code=201)
def buy_ticket(
    ticket: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.utcnow()
    db_ticket = Ticket(
        user_id=current_user.id,
        transport_id=ticket.transport_id,
        type=ticket.type,
        price=PRICES[ticket.type],
        valid_until=now + VALIDITY[ticket.type],
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


@router.get("/me", response_model=List[TicketOut])
def my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Ticket).filter(Ticket.user_id == current_user.id).all()


@router.post("/{ticket_id}/validate", response_model=TicketOut)
def validate_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id,
        Ticket.user_id == current_user.id,
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Bilhete não encontrado")
    if ticket.status != TicketStatus.active:
        raise HTTPException(status_code=400, detail="Bilhete inválido ou já utilizado")
    ticket.status = TicketStatus.used
    ticket.used_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    return ticket
