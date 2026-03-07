from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db.models.ticket import Ticket, TicketStatus, TicketType
from app.db.models.transport import Transport

router = APIRouter()

@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    total_tickets = db.query(func.count(Ticket.id)).scalar()
    active_tickets = db.query(func.count(Ticket.id)).filter(Ticket.status == TicketStatus.active).scalar()
    total_revenue = db.query(func.sum(Ticket.price)).scalar() or 0
    active_transports = db.query(func.count(Transport.id)).filter(Transport.is_active == True).scalar()

    return {
        "total_tickets": total_tickets,
        "active_tickets": active_tickets,
        "total_revenue": round(total_revenue, 2),
        "active_transports": active_transports,
    }

@router.get("/tickets-by-type")
def tickets_by_type(db: Session = Depends(get_db)):
    results = db.query(Ticket.type, func.count(Ticket.id)).group_by(Ticket.type).all()
    return [{"type": r[0], "count": r[1]} for r in results]

@router.get("/occupancy")
def transport_occupancy(db: Session = Depends(get_db)):
    transports = db.query(Transport).filter(Transport.is_active == True).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "line": t.line,
            "occupancy_pct": round((t.current_occupancy / t.capacity) * 100, 1) if t.capacity > 0 else 0
        }
        for t in transports
    ]
