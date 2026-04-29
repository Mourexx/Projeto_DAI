# Package {P7} Device & Infrastructure Management — 4SRS SIBCP v3
# Implements: {O7.3.d} inventory and fault records
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey
from app.db.database import Base


class FaultEstado(str, enum.Enum):
    aberto = "aberto"
    em_resolucao = "em_resolucao"
    resolvido = "resolvido"


class FaultRecord(Base):
    __tablename__ = "fault_records"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, ForeignKey("devices.device_id"), nullable=False, index=True)
    tipo_falha = Column(String, nullable=False)
    descricao = Column(String, nullable=False)
    estado = Column(Enum(FaultEstado), default=FaultEstado.aberto)
    acao_corretiva = Column(String, nullable=True)
    criado_em = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    resolvido_em = Column(DateTime(timezone=True), nullable=True)
