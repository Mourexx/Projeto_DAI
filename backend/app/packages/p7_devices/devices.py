from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.packages.p7_devices.device import Device, DeviceType, DeviceEstado
from app.packages.p7_devices.device_status import DeviceStatus, StatusAtual
from app.packages.p7_devices.fault import FaultRecord, FaultEstado

router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class DeviceCreate(BaseModel):
    device_id: str
    tipo: DeviceType
    fabricante: str
    numero_serie: str
    veiculo_id: Optional[str] = None
    notas: Optional[str] = None


class DeviceUpdate(BaseModel):
    estado: Optional[DeviceEstado] = None
    veiculo_id: Optional[str] = None
    notas: Optional[str] = None


class FaultCreate(BaseModel):
    tipo_falha: str
    descricao: str


class FaultUpdate(BaseModel):
    estado: Optional[FaultEstado] = None
    acao_corretiva: Optional[str] = None


# ── Serializers ───────────────────────────────────────────────────────────────

def _device_dict(d: Device) -> dict:
    return {
        "id": d.id,
        "device_id": d.device_id,
        "tipo": d.tipo,
        "fabricante": d.fabricante,
        "numero_serie": d.numero_serie,
        "veiculo_id": d.veiculo_id,
        "estado": d.estado,
        "data_registo": d.data_registo.isoformat() if d.data_registo else None,
        "notas": d.notas,
    }


def _status_dict(s: DeviceStatus) -> dict:
    return {
        "id": s.id,
        "device_id": s.device_id,
        "estado_atual": s.estado_atual,
        "ultimo_heartbeat": s.ultimo_heartbeat.isoformat() if s.ultimo_heartbeat else None,
        "latencia_media_ms": s.latencia_media_ms,
        "uptime_percentagem": s.uptime_percentagem,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }


def _fault_dict(f: FaultRecord) -> dict:
    return {
        "id": f.id,
        "device_id": f.device_id,
        "tipo_falha": f.tipo_falha,
        "descricao": f.descricao,
        "estado": f.estado,
        "acao_corretiva": f.acao_corretiva,
        "criado_em": f.criado_em.isoformat() if f.criado_em else None,
        "resolvido_em": f.resolvido_em.isoformat() if f.resolvido_em else None,
        "criado_por_email": f.criado_por_email,
    }


# ── {O7.2.c} Static sub-paths — MUST be declared before /{device_id} ─────────

@router.get("/status/all")
def get_all_statuses(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """UC7.2 — Estado atual de todos os dispositivos; marca offline se heartbeat > 5 min."""
    now = datetime.now(timezone.utc)
    statuses = db.query(DeviceStatus).all()
    result = []
    for s in statuses:
        device = db.query(Device).filter(Device.device_id == s.device_id).first()
        hb = s.ultimo_heartbeat
        if hb is not None and hb.tzinfo is None:
            hb = hb.replace(tzinfo=timezone.utc)

        if device and device.estado == DeviceEstado.falha:
            effective = StatusAtual.erro
        elif hb is None or (now - hb) > timedelta(minutes=5):
            effective = StatusAtual.offline
        else:
            effective = s.estado_atual

        row = _status_dict(s)
        row["estado_atual"] = effective
        row["veiculo_id"] = device.veiculo_id if device else None
        result.append(row)
    return result


# ── {O7.3.c} Fault sub-paths — MUST be declared before /{device_id} ──────────

@router.get("/faults/open")
def get_open_faults(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    """UC7.3 — Lista todos os tickets de falha abertos."""
    faults = db.query(FaultRecord).filter(FaultRecord.estado == FaultEstado.aberto).all()
    return [_fault_dict(f) for f in faults]


@router.patch("/faults/{fault_id}")
def update_fault(
    fault_id: int,
    body: FaultUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """UC7.3 — Atualiza estado ou ação corretiva de uma falha."""
    fault = db.query(FaultRecord).filter(FaultRecord.id == fault_id).first()
    if not fault:
        raise HTTPException(status_code=404, detail="Falha não encontrada")
    if body.estado is not None:
        fault.estado = body.estado
        if body.estado == FaultEstado.resolvido:
            fault.resolvido_em = datetime.now(timezone.utc)
    if body.acao_corretiva is not None:
        fault.acao_corretiva = body.acao_corretiva
    db.commit()
    db.refresh(fault)
    return _fault_dict(fault)


# ── {O7.1.c} Device CRUD ──────────────────────────────────────────────────────

@router.post("/", status_code=201)
def create_device(body: DeviceCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    """UC7.1 — Registar novo dispositivo."""
    if db.query(Device).filter(Device.device_id == body.device_id).first():
        raise HTTPException(status_code=409, detail="device_id já existe")
    device = Device(**body.model_dump())
    db.add(device)
    status = DeviceStatus(device_id=body.device_id)
    db.add(status)
    db.commit()
    db.refresh(device)
    return _device_dict(device)


@router.get("/")
def list_devices(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """UC7.1 — Listar todos os dispositivos."""
    return [_device_dict(d) for d in db.query(Device).all()]


@router.get("/{device_id}")
def get_device(device_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """UC7.1 — Detalhe de um dispositivo."""
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
    return _device_dict(device)


@router.patch("/{device_id}")
def update_device(
    device_id: str,
    body: DeviceUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """UC7.1 — Atualizar estado ou associação de um dispositivo."""
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(device, field, value)
    db.commit()
    db.refresh(device)
    return _device_dict(device)


@router.delete("/{device_id}")
def deactivate_device(device_id: str, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    """UC7.1 — Desativar dispositivo (soft delete: estado=inativo)."""
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
    device.estado = DeviceEstado.inativo
    db.commit()
    return {"message": f"Dispositivo {device_id} desativado"}


# ── {O7.2.c} Heartbeat ────────────────────────────────────────────────────────

@router.post("/{device_id}/heartbeat")
def heartbeat(device_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """UC7.2 — Receber sinal de heartbeat e marcar dispositivo como online."""
    if not db.query(Device).filter(Device.device_id == device_id).first():
        raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
    now = datetime.now(timezone.utc)
    status = db.query(DeviceStatus).filter(DeviceStatus.device_id == device_id).first()
    if status:
        status.estado_atual = StatusAtual.online
        status.ultimo_heartbeat = now
        status.updated_at = now
    else:
        status = DeviceStatus(device_id=device_id, estado_atual=StatusAtual.online, ultimo_heartbeat=now)
        db.add(status)
    db.commit()
    db.refresh(status)
    return _status_dict(status)


# ── {O7.3.c} Per-device faults ───────────────────────────────────────────────

@router.get("/{device_id}/faults")
def get_device_faults(device_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """UC7.3 — Listar falhas de um dispositivo."""
    if not db.query(Device).filter(Device.device_id == device_id).first():
        raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
    faults = db.query(FaultRecord).filter(FaultRecord.device_id == device_id).all()
    return [_fault_dict(f) for f in faults]


@router.post("/{device_id}/faults", status_code=201)
def create_fault(
    device_id: str,
    body: FaultCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """UC7.3 — Criar ticket de falha para um dispositivo."""
    if not db.query(Device).filter(Device.device_id == device_id).first():
        raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
    fault = FaultRecord(device_id=device_id, criado_por_email=current_user.email, **body.model_dump())
    db.add(fault)
    db.commit()
    db.refresh(fault)
    return _fault_dict(fault)
