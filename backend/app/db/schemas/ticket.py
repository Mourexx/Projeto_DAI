from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.db.models.ticket import TicketType, TicketStatus


class TicketCreate(BaseModel):
    type: TicketType
    transport_id: Optional[int] = None


class TicketOut(BaseModel):
    id: int
    user_id: int
    transport_id: Optional[int]
    type: TicketType
    status: TicketStatus
    price: float
    purchased_at: datetime
    valid_until: Optional[datetime]
    used_at: Optional[datetime]

    class Config:
        from_attributes = True
