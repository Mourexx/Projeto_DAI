from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.packages.p4_monitoring.transport import Transport
from app.packages.p1_user_management.user import User
from app.packages.p7_devices.device import Device, DeviceEstado
from app.packages.p7_devices.device_status import DeviceStatus, StatusAtual
from app.core.security import get_current_user
from app.packages.p6_alerts.alert import SystemAlert, AlertType, AlertSeverity

router = APIRouter()

_DEDUP_WINDOW = timedelta(minutes=5)

def _persist_and_dispatch(db: Session, alert_dict: dict) -> SystemAlert:
    """UC6.4 — {O6.4.c} notification controller: persiste e despacha alerta.

    Deduplicação: não cria registo duplicado se já existir um alerta não-reconhecido
    com o mesmo type e transport_id criado nos últimos 5 minutos.
    O print estruturado representa o dispatcher Observer em Modo Demonstração.
    """
    alert_type_str = alert_dict.get("type")
    transport_id = alert_dict.get("transport_id")

    # Só tenta deduplicar tipos que existem no enum AlertType
    try:
        alert_type = AlertType(alert_type_str)
    except ValueError:
        alert_type = None

    if alert_type is not None:
        cutoff = datetime.now(timezone.utc) - _DEDUP_WINDOW
        existing = (
            db.query(SystemAlert)
            .filter(
                SystemAlert.type == alert_type,
                SystemAlert.transport_id == transport_id,
                SystemAlert.acknowledged == False,  # noqa: E712
                SystemAlert.created_at >= cutoff,
            )
            .first()
        )
        if existing:
            return existing

    severity_str = alert_dict.get("severity", "info")
    try:
        severity = AlertSeverity(severity_str)
    except ValueError:
        severity = AlertSeverity.info

    record = SystemAlert(
        type=alert_type,
        severity=severity,
        message=alert_dict.get("message", ""),
        transport_id=transport_id,
        device_id=alert_dict.get("device_id"),
        line=alert_dict.get("line"),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    print(f"[NOTIFICATION] {severity_str.upper()} | {alert_type_str} | {record.message}")
    return record


@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """UC6.1 – Detetar Sobrelotação | UC6.2 – Anomalias | UC6.3 – Falhas de leitura"""
    transports = db.query(Transport).filter(Transport.is_active == True).all()  # noqa: E712
    alerts = []

    for t in transports:
        if t.capacity <= 0:
            continue
        pct = (t.current_occupancy / t.capacity) * 100

        # UC6.1 – Sobrelotação
        if pct >= 90:
            alert_dict = {
                "type": "sobrelotacao_critica",
                "transport_id": t.id,
                "transport_name": t.name,
                "line": t.line,
                "occupancy_pct": round(pct, 1),
                "severity": "critical",
                "message": f"Veículo {t.name} com ocupação crítica ({round(pct,1)}%)",
            }
            _persist_and_dispatch(db, alert_dict)
            alerts.append(alert_dict)
        elif pct >= 75:
            alert_dict = {
                "type": "sobrelotacao",
                "transport_id": t.id,
                "transport_name": t.name,
                "line": t.line,
                "occupancy_pct": round(pct, 1),
                "severity": "warning",
                "message": f"Veículo {t.name} com ocupação elevada ({round(pct,1)}%)",
            }
            _persist_and_dispatch(db, alert_dict)
            alerts.append(alert_dict)

        # UC6.2 – Anomalia de procura (ocupação anormalmente baixa)
        if pct < 5 and t.current_occupancy == 0:
            alert_dict = {
                "type": "anomalia_procura",
                "transport_id": t.id,
                "transport_name": t.name,
                "line": t.line,
                "occupancy_pct": round(pct, 1),
                "severity": "info",
                "message": f"Veículo {t.name} sem passageiros — possível anomalia de leitura",
            }
            _persist_and_dispatch(db, alert_dict)
            alerts.append(alert_dict)

    # UC6.3 — sensor failure detection controller {O6.3.c}
    # consulta device registry data {O7.1.d} e device status data {O7.2.d}
    devices_falha = db.query(Device).filter(Device.estado == DeviceEstado.falha).all()
    for d in devices_falha:
        alert_dict = {
            "type": "falha_sensor",
            "device_id": d.device_id,
            "transport_name": d.veiculo_id or "Desconhecido",
            "line": None,
            "severity": "critical",
            "message": f"Dispositivo {d.device_id} em estado de falha (veículo: {d.veiculo_id or 'N/A'})",
        }
        _persist_and_dispatch(db, alert_dict)
        alerts.append(alert_dict)

    devices_offline = db.query(DeviceStatus).filter(DeviceStatus.estado_atual == StatusAtual.offline).all()
    for s in devices_offline:
        device = db.query(Device).filter(
            Device.device_id == s.device_id,
            Device.estado == DeviceEstado.ativo,
        ).first()
        if device:
            alert_dict = {
                "type": "sensor_offline",
                "device_id": s.device_id,
                "transport_name": device.veiculo_id or "Desconhecido",
                "line": None,
                "severity": "warning",
                "message": f"Dispositivo {s.device_id} offline (veículo: {device.veiculo_id or 'N/A'})",
            }
            # sensor_offline não está no enum AlertType — _persist_and_dispatch trata graciosamente
            _persist_and_dispatch(db, alert_dict)
            alerts.append(alert_dict)

    return {
        "total": len(alerts),
        "critical": sum(1 for a in alerts if a["severity"] == "critical"),
        "warning":  sum(1 for a in alerts if a["severity"] == "warning"),
        "info":     sum(1 for a in alerts if a["severity"] == "info"),
        "alerts":   alerts,
    }


@router.get("/alerts/history")
def get_alerts_history(
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """UC6.4 — {O6.4.c} Histórico de alertas persistidos ({O6.1.d} system alert data)."""
    records = (
        db.query(SystemAlert)
        .order_by(SystemAlert.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "type": r.type,
            "severity": r.severity,
            "message": r.message,
            "transport_id": r.transport_id,
            "device_id": r.device_id,
            "line": r.line,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "acknowledged": r.acknowledged,
            "acknowledged_at": r.acknowledged_at.isoformat() if r.acknowledged_at else None,
            "acknowledged_by": r.acknowledged_by,
        }
        for r in records
    ]


@router.patch("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """UC6.4 — {O6.4.c} Reconhecer alerta: fecha o ciclo de notificação."""
    record = db.query(SystemAlert).filter(SystemAlert.id == alert_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")

    record.acknowledged = True
    record.acknowledged_at = datetime.now(timezone.utc)
    record.acknowledged_by = current_user.id
    db.commit()

    return {"ok": True, "alert_id": alert_id}
