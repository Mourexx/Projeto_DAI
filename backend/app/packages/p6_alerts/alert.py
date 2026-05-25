# Package {P6} Alerts — 4SRS SIBCP v3
# Implements: {O6.1.d} system alert data, {O6.4.c} notification controller
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean
from app.db.database import Base


class AlertSeverity(str, enum.Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


class AlertType(str, enum.Enum):
    sobrelotacao = "sobrelotacao"
    sobrelotacao_critica = "sobrelotacao_critica"
    anomalia_procura = "anomalia_procura"
    falha_sensor = "falha_sensor"


class SystemAlert(Base):
    __tablename__ = "system_alerts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(AlertType), nullable=False, index=True)
    severity = Column(Enum(AlertSeverity), nullable=False)
    message = Column(String, nullable=False)
    transport_id = Column(Integer, nullable=True)
    device_id = Column(String, nullable=True)
    line = Column(String, nullable=True)
    payload_json = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by = Column(Integer, nullable=True)
