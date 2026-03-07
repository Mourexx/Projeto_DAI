from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class TicketStatus(str, enum.Enum):
    active = "active"
    used = "used"
    expired = "expired"
    cancelled = "cancelled"

class TicketType(str, enum.Enum):
    single = "single"
    daily = "daily"
    monthly = "monthly"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transport_id = Column(Integer, ForeignKey("transports.id"))
    type = Column(Enum(TicketType), nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.active)
    price = Column(Float, nullable=False)
    purchased_at = Column(DateTime(timezone=True), server_default=func.now())
    valid_until = Column(DateTime(timezone=True))
    used_at = Column(DateTime(timezone=True))

    user = relationship("User")
    transport = relationship("Transport")
