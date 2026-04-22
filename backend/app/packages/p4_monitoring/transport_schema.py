# Package {P4} Monitoring — 4SRS SIBCP v3
# Implements: {O4.2.d} real-time vehicle data (schema)
from pydantic import BaseModel, ConfigDict
from typing import Optional
from app.packages.p4_monitoring.transport import TransportType


class TransportCreate(BaseModel):
    name: str
    type: TransportType
    line: str
    capacity: int


class TransportUpdate(BaseModel):
    current_occupancy: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    speed: Optional[float] = None
    is_active: Optional[bool] = None


class TransportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: TransportType
    line: str
    capacity: int
    current_occupancy: int
    latitude: Optional[float]
    longitude: Optional[float]
    speed: Optional[float] = 0.0
    is_active: bool
