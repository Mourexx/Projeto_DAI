from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db.models.ticket import Ticket, TicketStatus
from app.db.models.transport import Transport
from app.db.models.viagem import Viagem
from app.db.models.contagem import ContagemPassageiros, TipoEvento

router = APIRouter()


@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    total_tickets = db.query(func.count(Ticket.id)).scalar() or 0
    active_tickets = db.query(func.count(Ticket.id)).filter(Ticket.status == TicketStatus.active).scalar() or 0
    total_revenue = db.query(func.sum(Ticket.price)).scalar() or 0.0
    active_transports = db.query(func.count(Transport.id)).filter(Transport.is_active == True).scalar() or 0
    viagens_em_curso = db.query(func.count(Viagem.id)).filter(Viagem.em_curso == True).scalar() or 0

    return {
        "total_tickets": total_tickets,
        "active_tickets": active_tickets,
        "total_revenue": round(float(total_revenue), 2),
        "active_transports": active_transports,
        "viagens_em_curso": viagens_em_curso,
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
            "current_occupancy": t.current_occupancy,
            "capacity": t.capacity,
            "occupancy_pct": round((t.current_occupancy / t.capacity) * 100, 1) if t.capacity > 0 else 0,
        }
        for t in transports
    ]


@router.get("/viagens")
def viagens_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Viagem.id)).scalar() or 0
    em_curso = db.query(func.count(Viagem.id)).filter(Viagem.em_curso == True).scalar() or 0
    total_entradas = db.query(func.sum(ContagemPassageiros.quantidade)).filter(
        ContagemPassageiros.tipo_evento == TipoEvento.entrada
    ).scalar() or 0
    total_saidas = db.query(func.sum(ContagemPassageiros.quantidade)).filter(
        ContagemPassageiros.tipo_evento == TipoEvento.saida
    ).scalar() or 0

    return {
        "total_viagens": total,
        "viagens_em_curso": em_curso,
        "total_entradas": total_entradas,
        "total_saidas": total_saidas,
    }
