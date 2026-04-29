# Package {P8} Data Export & Normalization — 4SRS SIBCP v3
# Implements: {O8.1.c} data export controller,
#             {O8.2.c} report generation controller,
#             {O8.3.c} data normalization controller
import csv
import io
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_current_admin
from app.packages.p2_ticketing.ticket import Ticket, TicketStatus
from app.packages.p4_monitoring.transport import Transport
from app.packages.p2_ticketing.validacao import ValidacaoBilhete
from app.packages.p8_export.export_artifact import ExportArtifact, ArtifactTipo, ArtifactEstado

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _save_artifact(db: Session, tipo: ArtifactTipo, filtros: dict | None,
                   num_registos: int, email: str, conteudo: str) -> ExportArtifact:
    artifact = ExportArtifact(
        tipo=tipo,
        filtros_aplicados=json.dumps(filtros) if filtros else None,
        num_registos=num_registos,
        tamanho_bytes=len(conteudo.encode("utf-8")) if conteudo else 0,
        executado_por_email=email,
        estado=ArtifactEstado.concluido,
        conteudo=conteudo,
    )
    db.add(artifact)
    db.commit()
    db.refresh(artifact)
    return artifact


def _csv_response(rows: list, headers: list, filename: str) -> tuple[str, Response]:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)
    content = output.getvalue()
    resp = Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
    return content, resp


def _json_file_response(data: list | dict, filename: str) -> tuple[str, Response]:
    content = json.dumps(data, ensure_ascii=False, indent=2)
    resp = Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
    return content, resp


# ── {O8.1.c} Raw data export ──────────────────────────────────────────────────

@router.get("/raw/tickets")
def export_raw_tickets(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """UC8.1 — Exportar bilhetes em CSV ou JSON."""
    tickets = db.query(Ticket).all()
    if format == "json":
        data = [
            {
                "id": t.id, "user_id": t.user_id, "type": str(t.type),
                "price": t.price, "status": str(t.status),
                "purchased_at": t.purchased_at.isoformat() if t.purchased_at else None,
                "used_at": t.used_at.isoformat() if t.used_at else None,
                "valid_until": t.valid_until.isoformat() if t.valid_until else None,
            }
            for t in tickets
        ]
        content, resp = _json_file_response(data, "tickets.json")
        _save_artifact(db, ArtifactTipo.raw_json, {"resource": "tickets"}, len(tickets), current_user.email, content)
    else:
        rows = [
            [t.id, t.user_id, str(t.type), t.price, str(t.status),
             t.purchased_at, t.used_at, t.valid_until]
            for t in tickets
        ]
        content, resp = _csv_response(
            rows,
            ["id", "user_id", "type", "price", "status", "purchased_at", "used_at", "valid_until"],
            "tickets.csv",
        )
        _save_artifact(db, ArtifactTipo.raw_csv, {"resource": "tickets"}, len(tickets), current_user.email, content)
    return resp


@router.get("/raw/transports")
def export_raw_transports(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """UC8.1 — Exportar transportes em CSV ou JSON."""
    transports = db.query(Transport).all()
    if format == "json":
        data = [
            {
                "id": t.id, "name": t.name, "type": str(t.type), "line": t.line,
                "capacity": t.capacity, "current_occupancy": t.current_occupancy,
                "is_active": t.is_active, "latitude": t.latitude,
                "longitude": t.longitude, "speed": t.speed,
            }
            for t in transports
        ]
        content, resp = _json_file_response(data, "transports.json")
        _save_artifact(db, ArtifactTipo.raw_json, {"resource": "transports"}, len(transports), current_user.email, content)
    else:
        rows = [
            [t.id, t.name, str(t.type), t.line, t.capacity,
             t.current_occupancy, t.is_active, t.latitude, t.longitude, t.speed]
            for t in transports
        ]
        content, resp = _csv_response(
            rows,
            ["id", "name", "type", "line", "capacity", "current_occupancy",
             "is_active", "latitude", "longitude", "speed"],
            "transports.csv",
        )
        _save_artifact(db, ArtifactTipo.raw_csv, {"resource": "transports"}, len(transports), current_user.email, content)
    return resp


@router.get("/raw/validacoes")
def export_raw_validacoes(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """UC8.1 — Exportar validações em CSV ou JSON."""
    validacoes = db.query(ValidacaoBilhete).all()
    if format == "json":
        data = [
            {
                "id": v.id, "viagem_id": v.viagem_id, "linha_id": v.linha_id,
                "tipo_titulo": str(v.tipo_titulo), "perfil_passageiro": str(v.perfil_passageiro),
                "paragem": v.paragem, "valida": v.valida,
                "motivo_invalida": v.motivo_invalida,
                "timestamp": v.timestamp.isoformat() if v.timestamp else None,
            }
            for v in validacoes
        ]
        content, resp = _json_file_response(data, "validacoes.json")
        _save_artifact(db, ArtifactTipo.raw_json, {"resource": "validacoes"}, len(validacoes), current_user.email, content)
    else:
        rows = [
            [v.id, v.viagem_id, v.linha_id, str(v.tipo_titulo),
             str(v.perfil_passageiro), v.paragem, v.valida, v.motivo_invalida, v.timestamp]
            for v in validacoes
        ]
        content, resp = _csv_response(
            rows,
            ["id", "viagem_id", "linha_id", "tipo_titulo", "perfil_passageiro",
             "paragem", "valida", "motivo_invalida", "timestamp"],
            "validacoes.csv",
        )
        _save_artifact(db, ArtifactTipo.raw_csv, {"resource": "validacoes"}, len(validacoes), current_user.email, content)
    return resp


# ── {O8.2.c} Report generation ────────────────────────────────────────────────

@router.get("/report/overview")
def report_overview(db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    """UC8.2 — Gerar relatório de overview e persistir como artefacto."""
    total_tickets = db.query(func.count(Ticket.id)).scalar() or 0
    active_tickets = db.query(func.count(Ticket.id)).filter(Ticket.status == TicketStatus.active).scalar() or 0
    total_revenue = db.query(func.sum(Ticket.price)).scalar() or 0.0
    active_transports = db.query(func.count(Transport.id)).filter(Transport.is_active == True).scalar() or 0

    ticket_types = db.query(Ticket.type, func.count(Ticket.id)).group_by(Ticket.type).all()
    transports = db.query(Transport).filter(Transport.is_active == True).all()

    report = {
        "kpis": {
            "total_bilhetes": total_tickets,
            "bilhetes_ativos": active_tickets,
            "receita_total": round(float(total_revenue), 2),
            "transportes_ativos": active_transports,
        },
        "bilhetes": [{"tipo": str(r[0]), "quantidade": r[1]} for r in ticket_types],
        "ocupacao": [
            {
                "veiculo": t.name,
                "linha": t.line,
                "ocupacao_atual": t.current_occupancy,
                "capacidade": t.capacity,
                "percentagem": round((t.current_occupancy / t.capacity) * 100, 1) if t.capacity > 0 else 0,
            }
            for t in transports
        ],
        "gerado_em": datetime.now(timezone.utc).isoformat(),
    }

    content = json.dumps(report, ensure_ascii=False, indent=2)
    _save_artifact(
        db, ArtifactTipo.report_json, None,
        total_tickets + len(transports), current_user.email, content,
    )
    return report


# ── {O8.3.c} Normalized export ────────────────────────────────────────────────

@router.get("/normalized/gtfs")
def export_gtfs(db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    """UC8.3 — Exportar transportes em formato GTFS simplificado (CSV)."""
    transports = db.query(Transport).filter(Transport.is_active == True).all()
    rows = [
        [t.id, t.name, t.line, t.latitude, t.longitude, t.current_occupancy]
        for t in transports
    ]
    content, resp = _csv_response(
        rows,
        ["trip_id", "vehicle_id", "route_id", "shape_pt_lat", "shape_pt_lon", "current_occupancy"],
        "gtfs_export.csv",
    )
    _save_artifact(db, ArtifactTipo.normalized_gtfs, None, len(transports), current_user.email, content)
    return resp


@router.get("/normalized/ngsi-ld")
def export_ngsi_ld(db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    """UC8.3 — Exportar transportes em formato NGSI-LD (Smart Data Models)."""
    transports = db.query(Transport).filter(Transport.is_active == True).all()
    entities = [
        {
            "id": f"urn:ngsi-ld:Vehicle:{t.name}",
            "type": "Vehicle",
            "vehicleType": {"type": "Property", "value": "urbanTransit"},
            "currentOccupancy": {"type": "Property", "value": t.current_occupancy},
            "location": {
                "type": "GeoProperty",
                "value": {"type": "Point", "coordinates": [t.longitude, t.latitude]},
            },
            "speed": {"type": "Property", "value": t.speed or 0},
            "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
        }
        for t in transports
    ]
    content = json.dumps(entities, ensure_ascii=False, indent=2)
    _save_artifact(db, ArtifactTipo.normalized_ngsi_ld, None, len(transports), current_user.email, content)
    return entities


# ── Export history ────────────────────────────────────────────────────────────

@router.get("/history")
def export_history(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    """UC8 — Lista todos os artefactos de exportação."""
    artifacts = db.query(ExportArtifact).order_by(ExportArtifact.criado_em.desc()).all()
    return [
        {
            "id": a.id,
            "tipo": a.tipo,
            "filtros_aplicados": a.filtros_aplicados,
            "num_registos": a.num_registos,
            "tamanho_bytes": a.tamanho_bytes,
            "executado_por_email": a.executado_por_email,
            "criado_em": a.criado_em.isoformat() if a.criado_em else None,
            "estado": a.estado,
        }
        for a in artifacts
    ]
