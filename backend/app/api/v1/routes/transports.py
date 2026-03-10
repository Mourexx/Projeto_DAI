from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models.transport import Transport
from app.db.schemas.transport import TransportCreate, TransportOut, TransportUpdate
from app.core.security import get_current_admin

router = APIRouter()


@router.get("/", response_model=List[TransportOut])
def list_transports(db: Session = Depends(get_db)):
    return db.query(Transport).filter(Transport.is_active == True).all()


@router.get("/{transport_id}", response_model=TransportOut)
def get_transport(transport_id: int, db: Session = Depends(get_db)):
    transport = db.query(Transport).filter(Transport.id == transport_id).first()
    if not transport:
        raise HTTPException(status_code=404, detail="Transporte não encontrado")
    return transport


@router.post("/", response_model=TransportOut, status_code=201)
def create_transport(
    transport: TransportCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    db_transport = Transport(**transport.model_dump())
    db.add(db_transport)
    db.commit()
    db.refresh(db_transport)
    return db_transport


@router.patch("/{transport_id}", response_model=TransportOut)
def update_transport(
    transport_id: int,
    update: TransportUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    transport = db.query(Transport).filter(Transport.id == transport_id).first()
    if not transport:
        raise HTTPException(status_code=404, detail="Transporte não encontrado")
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(transport, field, value)
    db.commit()
    db.refresh(transport)
    return transport


@router.delete("/{transport_id}", status_code=204)
def delete_transport(
    transport_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    transport = db.query(Transport).filter(Transport.id == transport_id).first()
    if not transport:
        raise HTTPException(status_code=404, detail="Transporte não encontrado")
    transport.is_active = False
    db.commit()
