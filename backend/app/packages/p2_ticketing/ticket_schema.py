from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from app.packages.p2_ticketing.ticket import TicketType, TicketStatus


class TicketCreate(BaseModel):
    type: TicketType
    transport_id: Optional[int] = None


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    transport_id: Optional[int]
    type: TicketType
    status: TicketStatus
    price: float
    purchased_at: datetime
    valid_until: Optional[datetime]
    used_at: Optional[datetime]
