# Package {P7} Device & Infrastructure Management — 4SRS SIBCP v3
# Implements: {O7.1.d} device registry data
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Enum, DateTime
from app.db.database import Base


class DeviceType(str, enum.Enum):
    sensor_contagem = "sensor_contagem"
    sistema_bordo = "sistema_bordo"


class DeviceEstado(str, enum.Enum):
    ativo = "ativo"
    inativo = "inativo"
    falha = "falha"


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True, nullable=False)
    tipo = Column(Enum(DeviceType), nullable=False)
    fabricante = Column(String, nullable=False)
    numero_serie = Column(String, nullable=False)
    veiculo_id = Column(String, nullable=True)
    estado = Column(Enum(DeviceEstado), default=DeviceEstado.ativo)
    data_registo = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    notas = Column(String, nullable=True)
