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
from app.db.models.ticket import Ticket, TicketStatus
from app.db.models.transport import Transport
from app.db.models.viagem import Viagem
from app.db.models.contagem import ContagemPassageiros, TipoEvento
from app.db.models.user import User
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


# UC6 – Alertas: endpoint de sobrelotação
@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """UC6.1 – Detetar Sobrelotação | UC6.2 – Anomalias | UC6.3 – Falhas de leitura"""
    transports = db.query(Transport).filter(Transport.is_active == True).all()
    alerts = []

    for t in transports:
        if t.capacity <= 0:
            continue
        pct = (t.current_occupancy / t.capacity) * 100

        # UC6.1 – Sobrelotação
        if pct >= 90:
            alerts.append({
                "type": "sobrelotacao_critica",
                "transport_id": t.id,
                "transport_name": t.name,
                "line": t.line,
                "occupancy_pct": round(pct, 1),
                "severity": "critical",
                "message": f"Veículo {t.name} com ocupação crítica ({round(pct,1)}%)",
            })
        elif pct >= 75:
            alerts.append({
                "type": "sobrelotacao",
                "transport_id": t.id,
                "transport_name": t.name,
                "line": t.line,
                "occupancy_pct": round(pct, 1),
                "severity": "warning",
                "message": f"Veículo {t.name} com ocupação elevada ({round(pct,1)}%)",
            })

        # UC6.2 – Anomalia de procura (ocupação anormalmente baixa)
        if pct < 5 and t.current_occupancy == 0:
            alerts.append({
                "type": "anomalia_procura",
                "transport_id": t.id,
                "transport_name": t.name,
                "line": t.line,
                "occupancy_pct": round(pct, 1),
                "severity": "info",
                "message": f"Veículo {t.name} sem passageiros — possível anomalia de leitura",
            })

    return {
        "total": len(alerts),
        "critical": sum(1 for a in alerts if a["severity"] == "critical"),
        "warning": sum(1 for a in alerts if a["severity"] == "warning"),
        "alerts": alerts,
    }
