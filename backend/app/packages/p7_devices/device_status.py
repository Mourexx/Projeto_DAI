import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey
from app.db.database import Base


class StatusAtual(str, enum.Enum):
    online = "online"
    offline = "offline"
    erro = "erro"


class DeviceStatus(Base):
    __tablename__ = "device_statuses"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, ForeignKey("devices.device_id"), nullable=False, index=True)
    estado_atual = Column(Enum(StatusAtual), default=StatusAtual.online)
    ultimo_heartbeat = Column(DateTime(timezone=True), nullable=True)
    latencia_media_ms = Column(Float, nullable=True)
    uptime_percentagem = Column(Float, nullable=True, default=100.0)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
