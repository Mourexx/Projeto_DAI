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

router = APIRouter()

# 80 linhas reais TUB (fonte: GTFS oficial TUB)
LINHAS_TUB = [
    ('2',   'PONTE DE PRADO - BOM JESUS'),
    ('3',   'AVENIDA CENTRAL - RUÃES'),
    ('5',   'DUME - QUINTA DA CAPELA'),
    ('6',   'AVENIDA GENERAL NORTON DE MATOS - GONDIZALVES/SEMELHE'),
    ('7',   "S. MAMEDE D'ESTE - CELEIRÓS"),
    ('8',   'RUA 25 DE ABRIL - SETE FONTES'),
    ('9',   'RUÃES - NOGUEIRA (BARRAL)'),
    ('12',  'AVENIDA DA LIBERDADE - LAGEOSA/PEDRALVA VIA GUALTAR'),
    ('13',  'AVENIDA GENERAL NORTON DE MATOS- LAGEOSA/PEDRALVA'),
    ('14',  'PRAÇA CONDE DE AGROLONGO - PRISCOS'),
    ('18',  'RUA DO RAIO - PINHEIRO DO BICHO VIA ESPORÕES'),
    ('19',  'AREAL - BOAVISTA'),
    ('20',  'AVENIDA DA LIBERDADE - ESCUDEIROS VIA PONTE NOVA'),
    ('21',  'PRAÇA CONDE DE AGROLONGO - TADIM'),
    ('23',  'AVENIDA GENERAL NORTON DE MATOS - ESPINHO/SAMEIRO'),
    ('24',  'SEQUEIRA - GUALTAR'),
    ('31',  "RUA 25 DE ABRIL - S. MAMEDE D'ESTE (ROLA)"),
    ('32',  'PRAÇA CONDE DE AGROLONGO - AVELEDA'),
    ('33',  'AVENIDA CENTRAL - CABREIROS'),
    ('34',  'AVENIDA DA LIBERDADE - GUISANDE'),
    ('35',  'PRAÇA CONDE DE AGROLONGO - TEBOSA/GUISANDE'),
    ('36',  'AVENIDA GENERAL NORTON DE MATOS - S. JULIÃO DE PASSOS'),
    ('37',  'AVENIDA GENERAL NORTON DE MATOS - CUNHA/ARENTIM'),
    ('38',  'RUA DO RAIO - MORREIRA'),
    ('39',  'RUA DO RAIO - TRANDEIRAS VIA ESPORÕES'),
    ('40',  'CIRCUITO URBANO I'),
    ('41',  'CIRCUITO URBANO II'),
    ('42',  'RESIDÊNCIA UNIVERSITÁRIA - UNIVERSIDADE DO MINHO'),
    ('43',  'ESTAÇÃO CF - UNIVERSIDADE DO MINHO'),
    ('45',  'NOGUEIRA (HOSPITAL PRIVADO) - PONTE DO BICO'),
    ('46',  'PRAÇA CONDE DE AGROLONGO - PÓVOA'),
    ('50',  'PRAÇA CONDE DE AGROLONGO - MOSTEIRO DE TIBÃES/PADIM DA GRAÇA'),
    ('52',  "MONTE D'ARCOS - MERELIM (S. ROQUE)"),
    ('53',  'AVENIDA GENERAL NORTON DE MATOS - SEMELHE/GONDIZALVES'),
    ('54',  'PRAÇA CONDE DE AGROLONGO - MISERICÓRDIA'),
    ('57',  'RUA DO RAIO - SANTA MARTA'),
    ('58',  'RUA DO RAIO - PINHEIRO DO BICHO VIA PONTE NOVA'),
    ('59',  'AVENIDA DA LIBERDADE - ESCUDEIROS VIA ESPORÕES'),
    ('60',  'AVENIDA DA LIBERDADE - FIGUEIREDO (SOBRADO)'),
    ('63',  "RUA 25 DE ABRIL - S. PEDRO D'ESTE"),
    ('66',  'CABREIROS - GUALTAR'),
    ('70',  'RUA DO RAIO - TRANDEIRAS VIA PINHEIRO DO BICHO'),
    ('72',  'AVENIDA CENTRAL - MONTE DO OURO'),
    ('73',  'AVENIDA CENTRAL - NAVARRA/POUSADA'),
    ('74',  'CAMÉLIAS - HOSPITAL'),
    ('76',  'AVENIDA DA LIBERDADE - CELEIRÓS VIA PINHEIRO DO BICHO'),
    ('80',  'SETE FONTES - ESPÍRITO SANTO'),
    ('81',  'AVENIDA CENTRAL - MOÍNHOS VIA ADAÚFE'),
    ('83',  'AVENIDA DA LIBERDADE - LAGEOSA/PEDRALVA'),
    ('84',  'PRAÇA CONDE DE AGROLONGO - RUÍLHE'),
    ('85',  'CIRCUITO URBANO III'),
    ('87',  'ESTAÇÃO CF - HOSPITAL'),
    ('88',  'RUA DO RAIO - ESPINHO/SAMEIRO'),
    ('89',  'GONDIZALVES/SEMELHE - NOGUEIRA (BARRAL)'),
    ('90',  'PADIM DA GRAÇA - NOGUEIRÓ'),
    ('91',  "PRISCOS - S. PEDRO D'ESTE"),
    ('92',  'AVENIDA CENTRAL - MONTE DO OURO/MOINHOS'),
    ('93',  'AVENIDA CENTRAL - CUNHA/ARENTIM'),
    ('94',  'PONTE PEDRINHA - MONTÉLIOS'),
    ('95',  'MINHO CENTER - NOVA ARCADA'),
    ('96',  'HOTEL DE LAMAÇÃES - E.LECLERC'),
    ('97',  'RUA DO RAIO - CELEIRÓS'),
    ('98',  "MONTE D'ARCOS - MERELIM S.PEDRO (EB23 CÁVADO)"),
    ('99',  'AVENIDA CENTRAL - SANTA LUCRÉCIA'),
    ('315', 'AVENIDA CENTRAL - MAZAGAO'),
    ('501', 'AVENIDA CENTRAL - PARQUE INDUSTRIAL ADAÚFE (VIA PINTANCINHOS)'),
    ('900', 'AVENIDA CENTRAL - HOSPITAL'),
    ('907', "MISERICÓRDIA - S. MAMEDE D'ESTE"),
    ('911', 'AVENIDA CENTRAL - PADIM DA GRAÇA'),
    ('914', 'AVENIDA CENTRAL - PRISCOS'),
    ('920', 'AVENIDA CENTRAL - ESCUDEIROS VIA PONTE NOVA'),
    ('928', 'AVENIDA CENTRAL - NAVARRA'),
    ('933', 'AVENIDA CENTRAL - CABREIROS'),
    ('935', 'AVENIDA CENTRAL - GUISANDE'),
    ('937', 'AVENIDA CENTRAL - ARENTIM'),
    ('942', 'UNIVERSIDADE MINHO - AVENIDA CENTRAL'),
    ('943', 'ESTAÇÃO CF - UNIVERSIDADE DO MINHO'),
    ('945', 'AVENIDA CENTRAL - PONTE DO BICO'),
    ('949', 'AVENIDA CENTRAL - RUÃES'),
    ('995', 'MINHO CENTER - NOVA ARCADA'),
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
