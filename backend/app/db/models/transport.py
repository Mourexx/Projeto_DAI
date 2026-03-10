import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base


class TransportType(str, enum.Enum):
    bus = "bus"
    tram = "tram"
    metro = "metro"


class Transport(Base):
    """Veículo de transporte urbano em operação."""
    __tablename__ = "transports"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(TransportType), nullable=False)
    line = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    tickets = relationship("Ticket", back_populates="transport")
