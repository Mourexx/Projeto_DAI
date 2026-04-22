# Package {P5} Analytics — 4SRS SIBCP v3
# Implements: {O5.1.c} KPI calculation controller, {O5.2.c} dashboard composition controller,
#             {O5.3.c} occupancy analysis controller, {O5.4.c} validation analysis controller,
#             {O5.5.c} historical query controller
# UC5 – Analisar Dados e Estatísticas
# UC5.1 – Visualizar KPIs
# UC5.2 – Visualizar Dashboard Analítico
# UC5.3 – Analisar Ocupação dos Veículos
# UC5.4 – Analisar Validações e Bilhetes
# UC5.5 – Analisar Histórico de Dados
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.packages.p2_ticketing.ticket import Ticket, TicketStatus
from app.packages.p4_monitoring.transport import Transport
from app.packages.p3_operational.viagem import Viagem
from app.packages.p3_operational.contagem import ContagemPassageiros, TipoEvento
from app.packages.p1_user_management.user import User
from app.core.security import get_current_user

router = APIRouter()


# UC5.1 – KPIs gerais
@router.get("/overview")
def get_overview(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
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


# UC5.4 – Análise de bilhetes por tipo
@router.get("/tickets-by-type")
def tickets_by_type(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    results = db.query(Ticket.type, func.count(Ticket.id)).group_by(Ticket.type).all()
    return [{"type": r[0], "count": r[1]} for r in results]


# UC5.3 – Ocupação dos veículos
@router.get("/occupancy")
def transport_occupancy(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    transports = db.query(Transport).filter(Transport.is_active == True).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "line": t.line,
            "type": t.type,
            "current_occupancy": t.current_occupancy,
            "capacity": t.capacity,
            "occupancy_pct": round((t.current_occupancy / t.capacity) * 100, 1) if t.capacity > 0 else 0,
        }
        for t in transports
    ]


# UC5.5 – Histórico e análise de viagens
@router.get("/viagens")
def viagens_stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
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
        "total_entradas": int(total_entradas),
        "total_saidas": int(total_saidas),
        "passageiros_a_bordo": int(total_entradas) - int(total_saidas),
    }
