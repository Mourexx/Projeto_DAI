# Package {P2} Ticketing — 4SRS SIBCP v3
# Implements: {O2.1.d} ticket repository
import enum
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class TicketType(str, enum.Enum):
    # Tipos legados — mantidos para compatibilidade com registos existentes
    single = "single"
    daily = "daily"
    monthly = "monthly"
    # Tarifas reais TUB (GTFS fare_attributes.txt)
    single_1coroa = "single_1coroa"       # 1 zona, 60 min
    single_2coroa = "single_2coroa"       # 2 zonas, 90 min
    transfer_1coroa = "transfer_1coroa"   # 1 zona + transbordo, 60 min
    transfer_2coroa = "transfer_2coroa"   # 2 zonas + transbordo, 90 min


class TicketStatus(str, enum.Enum):
    active = "active"      # Válido, ainda não utilizado
    used = "used"          # Já validado/utilizado
    expired = "expired"    # Expirado sem uso


class Ticket(Base):
    """Bilhete de transporte comprado por um utilizador."""
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transport_id = Column(Integer, ForeignKey("transports.id"), nullable=True)
    type = Column(Enum(TicketType), nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.active)
    price = Column(Float, nullable=False)
    purchased_at = Column(DateTime(timezone=True), server_default=func.now())
    valid_until = Column(DateTime(timezone=True), nullable=True)
    used_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="tickets")
    transport = relationship("Transport", back_populates="tickets")
