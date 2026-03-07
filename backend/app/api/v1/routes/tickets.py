from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models.ticket import Ticket, TicketType, TicketStatus
from app.db.schemas.ticket import TicketCreate, TicketOut
from datetime import datetime, timedelta

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

router = APIRouter()

@router.post("/", response_model=TicketOut, status_code=201)
def buy_ticket(ticket: TicketCreate, user_id: int, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    db_ticket = Ticket(
        user_id=user_id,
        transport_id=ticket.transport_id,
        type=ticket.type,
        price=PRICES[ticket.type],
        valid_until=now + VALIDITY[ticket.type],
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

@router.get("/user/{user_id}", response_model=List[TicketOut])
def user_tickets(user_id: int, db: Session = Depends(get_db)):
    return db.query(Ticket).filter(Ticket.user_id == user_id).all()

@router.post("/{ticket_id}/validate", response_model=TicketOut)
def validate_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Bilhete não encontrado")
    if ticket.status != TicketStatus.active:
        raise HTTPException(status_code=400, detail="Bilhete inválido ou já utilizado")
    ticket.status = TicketStatus.used
    ticket.used_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    return ticket
