# Package {P6} Alerts — 4SRS SIBCP v3
# Implements: {O6.1.c} overcrowding detection controller, {O6.2.c} demand anomaly detection controller,
#             {O6.3.c} sensor failure detection controller, {O6.1.d} system alert data
# UC6 – Alertas: endpoint de sobrelotação
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.packages.p4_monitoring.transport import Transport
from app.packages.p1_user_management.user import User
from app.packages.p7_devices.device import Device, DeviceEstado
from app.packages.p7_devices.device_status import DeviceStatus, StatusAtual
from app.core.security import get_current_user

router = APIRouter()


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

    # UC6.3 — sensor failure detection controller {O6.3.c}
    # consults device registry data {O7.1.d} and device status data {O7.2.d}
    devices_falha = db.query(Device).filter(Device.estado == DeviceEstado.falha).all()
    for d in devices_falha:
        alerts.append({
            "type": "falha_sensor",
            "device_id": d.device_id,
            "transport_name": d.veiculo_id or "Desconhecido",
            "line": None,
            "severity": "critical",
            "message": f"Dispositivo {d.device_id} em estado de falha (veículo: {d.veiculo_id or 'N/A'})",
        })

    devices_offline = db.query(DeviceStatus).filter(DeviceStatus.estado_atual == StatusAtual.offline).all()
    for s in devices_offline:
        device = db.query(Device).filter(
            Device.device_id == s.device_id,
            Device.estado == DeviceEstado.ativo
        ).first()
        if device:
            alerts.append({
                "type": "sensor_offline",
                "device_id": s.device_id,
                "transport_name": device.veiculo_id or "Desconhecido",
                "line": None,
                "severity": "warning",
                "message": f"Dispositivo {s.device_id} offline (veículo: {device.veiculo_id or 'N/A'})",
            })

    return {
        "total": len(alerts),
        "critical": sum(1 for a in alerts if a["severity"] == "critical"),
        "warning":  sum(1 for a in alerts if a["severity"] == "warning"),
        "info":     sum(1 for a in alerts if a["severity"] == "info"),
        "alerts":   alerts,
    }
