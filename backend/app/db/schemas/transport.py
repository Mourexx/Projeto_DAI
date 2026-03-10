from pydantic import BaseModel
from typing import Optional
from app.db.models.transport import TransportType


class TransportCreate(BaseModel):
    name: str
    type: TransportType
    line: str
    capacity: int


class TransportUpdate(BaseModel):
    current_occupancy: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = None


class TransportOut(BaseModel):
    id: int
    name: str
    type: TransportType
    line: str
    capacity: int
    current_occupancy: int
    latitude: Optional[float]
    longitude: Optional[float]
    is_active: bool

    class Config:
        from_attributes = True
