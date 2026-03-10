import enum
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class TicketType(str, enum.Enum):
    single = "single"      # Bilhete simples (2h)
    daily = "daily"        # Bilhete diário (24h)
    monthly = "monthly"    # Passe mensal (30 dias)


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
