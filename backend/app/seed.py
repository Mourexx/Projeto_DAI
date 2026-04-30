# Package Seed — 4SRS SIBCP v3
# Cria dados de demonstração com linhas reais TUB (fonte: GTFS oficial)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.db.database import get_db
from app.packages.p1_user_management.user import User
from app.packages.p4_monitoring.transport import Transport, TransportType
from app.packages.p2_ticketing.ticket import Ticket, TicketType, TicketStatus
from app.packages.p4_monitoring.linha import Linha
from app.core.security import hash_password
from app.packages.p7_devices.device import Device, DeviceType, DeviceEstado
from app.packages.p7_devices.device_status import DeviceStatus, StatusAtual
from app.packages.p7_devices.fault import FaultRecord, FaultEstado
from app.packages.p3_operational.viagem import Viagem
from app.packages.p3_operational.contagem import ContagemPassageiros, TipoEvento

router = APIRouter()

# 80 linhas reais TUB (fonte: GTFS oficial TUB)
LINHAS_TUB = [
    ('2',  'PONTE DE PRADO - BOM JESUS'),
    ('3',  'AVENIDA CENTRAL - RUÃES'),
    ('5',  'DUME - QUINTA DA CAPELA'),
    ('7',  "S. MAMEDE D'ESTE - CELEIRÓS"),
    ('8',  'RUA 25 DE ABRIL - SETE FONTES'),
    ('9',  'RUÃES - NOGUEIRA (BARRAL)'),
    ('12', 'AVENIDA DA LIBERDADE - LAGEOSA/PEDRALVA VIA GUALTAR'),
    ('14', 'PRAÇA CONDE DE AGROLONGO - PRISCOS'),
    ('40', 'CIRCUITO URBANO I'),
    ('41', 'CIRCUITO URBANO II'),
    ('42', 'RESIDÊNCIA UNIVERSITÁRIA - UNIVERSIDADE DO MINHO'),
    ('43', 'ESTAÇÃO CF - UNIVERSIDADE DO MINHO'),
    ('74', 'CAMÉLIAS - HOSPITAL'),
    ('87', 'ESTAÇÃO CF - HOSPITAL'),
    ('95', 'MINHO CENTER - NOVA ARCADA'),
]


def seed_db(db: Session) -> dict:
    """Seed idempotente com dados reais TUB."""
    if db.query(User).count() > 0:
        return {"created": []}

    created = []

    db.add(User(
        email="admin@tub.pt", full_name="Administrador TUB",
        hashed_password=hash_password("admin123"),
        is_admin=True, is_active=True,
    ))
    db.add(User(
        email="user@tub.pt", full_name="Passageiro Demo",
        hashed_password=hash_password("user123"),
        is_admin=False, is_active=True,
    ))
    created.append("utilizadores")
    db.flush()

    if db.query(Linha).count() == 0:
        for code, nome in LINHAS_TUB:
            db.add(Linha(codigo=code, nome=nome, ativa=True))
        created.append(f"linhas ({len(LINHAS_TUB)} linhas reais TUB)")

    if db.query(Transport).count() == 0:
        transportes = [
            # (name, type, line_id, capacity, occupancy, lat, lon)
            ("TUB-001", TransportType.bus, "42", 60, 48, 41.540798, -8.408466),
            ("TUB-002", TransportType.bus, "42", 60, 15, 41.541254, -8.406142),
            ("TUB-003", TransportType.bus, "2",  60, 42, 41.585380, -8.455420),
            ("TUB-004", TransportType.bus, "3",  60, 52, 41.563328, -8.417568),
            ("TUB-005", TransportType.bus, "40", 55, 10, 41.552170, -8.427270),
            ("TUB-006", TransportType.bus, "5",  60, 38, 41.574310, -8.437940),
            ("TUB-007", TransportType.bus, "74", 60, 71, 41.554462, -8.381193),
            ("TUB-008", TransportType.bus, "87", 60, 51, 41.551570, -8.409610),
            ("TUB-009", TransportType.bus, "7",  60, 22, 41.548120, -8.395840),
            ("TUB-010", TransportType.bus, "8",  60, 35, 41.553620, -8.423050),
            ("TUB-011", TransportType.bus, "9",  60, 18, 41.567240, -8.412380),
            ("TUB-012", TransportType.bus, "12", 60, 44, 41.561940, -8.418720),
            ("TUB-013", TransportType.bus, "14", 60, 28, 41.546880, -8.426110),
            ("TUB-014", TransportType.bus, "41", 55, 12, 41.554120, -8.420450),
            ("TUB-015", TransportType.bus, "43", 60, 33, 41.557310, -8.398200),
        ]
        for name, ttype, line, cap, occ, lat, lon in transportes:
            db.add(Transport(
                name=name, type=ttype, line=line,
                capacity=cap, current_occupancy=occ,
                latitude=lat, longitude=lon, is_active=True,
            ))
        created.append("transportes (linhas reais TUB)")

    db.commit()
    db.flush()

    now = datetime.now(timezone.utc)
    user = db.query(User).filter(User.email == "user@tub.pt").first()
    if user and db.query(Ticket).filter(Ticket.user_id == user.id).count() == 0:
        db.add_all([
            Ticket(user_id=user.id, type=TicketType.single_1coroa, price=1.55,
                   status=TicketStatus.active, valid_until=now + timedelta(minutes=60),
                   purchased_at=now - timedelta(minutes=10)),
            Ticket(user_id=user.id, type=TicketType.single_2coroa, price=2.00,
                   status=TicketStatus.used, valid_until=now - timedelta(minutes=30),
                   purchased_at=now - timedelta(hours=2), used_at=now - timedelta(hours=1)),
            Ticket(user_id=user.id, type=TicketType.transfer_1coroa, price=1.55,
                   status=TicketStatus.expired, valid_until=now - timedelta(hours=1),
                   purchased_at=now - timedelta(hours=3)),
        ])
        created.append("bilhetes demo user")

    admin = db.query(User).filter(User.email == "admin@tub.pt").first()
    if admin and db.query(Ticket).filter(Ticket.user_id == admin.id).count() == 0:
        db.add_all([
            Ticket(user_id=admin.id, type=TicketType.single_1coroa, price=1.55,
                   status=TicketStatus.active, valid_until=now + timedelta(minutes=55),
                   purchased_at=now - timedelta(minutes=5)),
            Ticket(user_id=admin.id, type=TicketType.transfer_2coroa, price=2.00,
                   status=TicketStatus.active, valid_until=now + timedelta(minutes=80),
                   purchased_at=now - timedelta(minutes=10)),
            Ticket(user_id=admin.id, type=TicketType.single_2coroa, price=2.00,
                   status=TicketStatus.used, valid_until=now - timedelta(minutes=15),
                   purchased_at=now - timedelta(hours=2), used_at=now - timedelta(hours=1)),
        ])
        created.append("bilhetes demo admin")

    if db.query(Device).count() == 0:
        devices_seed = [
            Device(device_id="DEV-SC-001", tipo=DeviceType.sensor_contagem, fabricante="Wayfair",   numero_serie="WF-12345", veiculo_id="TUB-001", estado=DeviceEstado.ativo),
            Device(device_id="DEV-SC-003", tipo=DeviceType.sensor_contagem, fabricante="Wayfair",   numero_serie="WF-12346", veiculo_id="TUB-003", estado=DeviceEstado.ativo),
            Device(device_id="DEV-SC-007", tipo=DeviceType.sensor_contagem, fabricante="Wayfair",   numero_serie="WF-12347", veiculo_id="TUB-007", estado=DeviceEstado.falha),
            Device(device_id="DEV-SB-002", tipo=DeviceType.sistema_bordo,   fabricante="Teltronic", numero_serie="TT-98001", veiculo_id="TUB-002", estado=DeviceEstado.ativo),
            Device(device_id="DEV-SB-004", tipo=DeviceType.sistema_bordo,   fabricante="Teltronic", numero_serie="TT-98002", veiculo_id="TUB-004", estado=DeviceEstado.ativo),
            Device(device_id="DEV-SB-006", tipo=DeviceType.sistema_bordo,   fabricante="Teltronic", numero_serie="TT-98003", veiculo_id="TUB-006", estado=DeviceEstado.ativo),
        ]
        db.add_all(devices_seed)
        db.flush()

        db.add_all([
            DeviceStatus(device_id="DEV-SC-001", estado_atual=StatusAtual.online,  ultimo_heartbeat=now, uptime_percentagem=99.5),
            DeviceStatus(device_id="DEV-SC-003", estado_atual=StatusAtual.online,  ultimo_heartbeat=now, uptime_percentagem=98.2),
            DeviceStatus(device_id="DEV-SC-007", estado_atual=StatusAtual.offline, ultimo_heartbeat=None, uptime_percentagem=72.1),
            DeviceStatus(device_id="DEV-SB-002", estado_atual=StatusAtual.online,  ultimo_heartbeat=now, uptime_percentagem=100.0),
            DeviceStatus(device_id="DEV-SB-004", estado_atual=StatusAtual.online,  ultimo_heartbeat=now, uptime_percentagem=99.8),
            DeviceStatus(device_id="DEV-SB-006", estado_atual=StatusAtual.online,  ultimo_heartbeat=now, uptime_percentagem=97.5),
        ])
        db.add(FaultRecord(
            device_id="DEV-SC-007",
            tipo_falha="Falha de Sensor",
            descricao="Sensor de contagem não responde — possível falha de hardware",
            estado=FaultEstado.aberto,
        ))
        db.flush()
        created.append("dispositivos demo")

    if db.query(Viagem).count() == 0:
        transportes_db = db.query(Transport).all()
        linhas_db = {l.codigo: l for l in db.query(Linha).all()}

        viagens_demo = []

        for i, t in enumerate(transportes_db[:5]):
            linha = linhas_db.get(t.line)
            if not linha:
                continue
            v = Viagem(
                linha_id=linha.id,
                matricula_autobus=t.name,
                data_inicio=now - timedelta(minutes=15 + i * 5),
                data_fim=None,
                em_curso=True,
                total_entradas=t.current_occupancy + 8,
                total_saidas=8,
                ocupacao_atual=t.current_occupancy,
                capacidade_maxima=t.capacity,
                latitude=t.latitude,
                longitude=t.longitude,
            )
            db.add(v)
            viagens_demo.append(v)

        for i, t in enumerate(transportes_db[:10]):
            linha = linhas_db.get(t.line)
            if not linha:
                continue
            entradas = 25 + (i * 3) % 30
            saidas = entradas - (i % 5)
            v = Viagem(
                linha_id=linha.id,
                matricula_autobus=t.name,
                data_inicio=now - timedelta(hours=2 + i, minutes=10),
                data_fim=now - timedelta(hours=1 + i, minutes=20),
                em_curso=False,
                total_entradas=entradas,
                total_saidas=saidas,
                ocupacao_atual=0,
                capacidade_maxima=t.capacity,
                latitude=t.latitude,
                longitude=t.longitude,
            )
            db.add(v)
            viagens_demo.append(v)

        db.flush()

        paragens_demo = ['Praça da República', 'Av. Central', 'Universidade do Minho',
                         'Hospital de Braga', 'Estação CF', 'Sete Fontes', 'Bom Jesus']
        for v in viagens_demo:
            n_paragens = min(len(paragens_demo), max(2, v.total_entradas // 5))
            for j in range(n_paragens):
                qty_in = max(1, v.total_entradas // n_paragens)
                qty_out = max(1, v.total_saidas // n_paragens) if v.total_saidas > 0 else 0
                db.add(ContagemPassageiros(
                    viagem_id=v.id,
                    paragem=paragens_demo[j % len(paragens_demo)],
                    tipo_evento=TipoEvento.entrada,
                    quantidade=qty_in,
                    timestamp=v.data_inicio + timedelta(minutes=j * 4),
                ))
                if qty_out > 0:
                    db.add(ContagemPassageiros(
                        viagem_id=v.id,
                        paragem=paragens_demo[j % len(paragens_demo)],
                        tipo_evento=TipoEvento.saida,
                        quantidade=qty_out,
                        timestamp=v.data_inicio + timedelta(minutes=j * 4 + 2),
                    ))

        created.append("viagens demo (5 em curso + 10 concluídas)")

    db.commit()
    return {
        "created": created,
        "credenciais": {
            "admin":      {"email": "admin@tub.pt", "password": "admin123"},
            "utilizador": {"email": "user@tub.pt",  "password": "user123"},
        },
    }


@router.post("/", status_code=201)
def seed(db: Session = Depends(get_db)):
    """UC Demo — cria dados de demonstração (apenas na primeira execução)."""
    if db.query(User).count() > 0:
        raise HTTPException(status_code=403, detail="Seed já foi executado.")
    result = seed_db(db)
    return {"message": "✅ Dados de demo criados com sucesso!", **result}
