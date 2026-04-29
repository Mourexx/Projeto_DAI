import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db

# BD em memória para testes (sem precisar de PostgreSQL)
DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def create_user_and_login(email="user@test.com", password="pass123", admin=False):
    client.post("/api/v1/users/register", json={
        "email": email, "full_name": "Teste", "password": password
    })
    if admin:
        # Promover a admin diretamente na BD de teste
        db = TestingSessionLocal()
        from app.packages.p1_user_management.user import User
        u = db.query(User).filter(User.email == email).first()
        u.is_admin = True
        db.commit()
        db.close()
    resp = client.post("/api/v1/users/login", data={"username": email, "password": password})
    return resp.json()["access_token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ─── Root ─────────────────────────────────────────────────────────────────────

def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["version"] == "2.0.0"


# ─── Utilizadores ─────────────────────────────────────────────────────────────

def test_register_ok():
    r = client.post("/api/v1/users/register", json={
        "email": "novo@test.com", "full_name": "Novo", "password": "abc123"
    })
    assert r.status_code == 201
    assert r.json()["email"] == "novo@test.com"
    assert r.json()["is_admin"] is False


def test_register_duplicate():
    client.post("/api/v1/users/register", json={"email": "dup@test.com", "password": "abc"})
    r = client.post("/api/v1/users/register", json={"email": "dup@test.com", "password": "xyz"})
    assert r.status_code == 400


def test_login_ok():
    client.post("/api/v1/users/register", json={"email": "login@test.com", "password": "pw"})
    r = client.post("/api/v1/users/login", data={"username": "login@test.com", "password": "pw"})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password():
    client.post("/api/v1/users/register", json={"email": "w@test.com", "password": "certa"})
    r = client.post("/api/v1/users/login", data={"username": "w@test.com", "password": "errada"})
    assert r.status_code == 401


def test_me_endpoint():
    token = create_user_and_login("me@test.com")
    r = client.get("/api/v1/users/me", headers=auth(token))
    assert r.status_code == 200
    assert r.json()["email"] == "me@test.com"


def test_me_no_token():
    r = client.get("/api/v1/users/me")
    assert r.status_code == 401


# ─── Transportes ──────────────────────────────────────────────────────────────

def test_list_transports_public():
    r = client.get("/api/v1/transports/")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_create_transport_requires_admin():
    token = create_user_and_login("user_transp@test.com")
    r = client.post("/api/v1/transports/", json={
        "name": "Bus 1", "type": "bus", "line": "L1", "capacity": 60
    }, headers=auth(token))
    assert r.status_code == 403


def test_create_transport_admin_ok():
    token = create_user_and_login("admin@test.com", admin=True)
    r = client.post("/api/v1/transports/", json={
        "name": "Autocarro 42", "type": "bus", "line": "L1", "capacity": 60
    }, headers=auth(token))
    assert r.status_code == 201
    assert r.json()["name"] == "Autocarro 42"


def test_get_transport_not_found():
    r = client.get("/api/v1/transports/99999")
    assert r.status_code == 404


def test_update_transport_occupancy():
    token = create_user_and_login("admin2@test.com", admin=True)
    create = client.post("/api/v1/transports/", json={
        "name": "Bus X", "type": "bus", "line": "L2", "capacity": 40
    }, headers=auth(token))
    tid = create.json()["id"]
    r = client.patch(f"/api/v1/transports/{tid}", json={"current_occupancy": 20}, headers=auth(token))
    assert r.status_code == 200
    assert r.json()["current_occupancy"] == 20


def test_delete_transport():
    token = create_user_and_login("admin3@test.com", admin=True)
    create = client.post("/api/v1/transports/", json={
        "name": "Bus Y", "type": "bus", "line": "L3", "capacity": 30
    }, headers=auth(token))
    tid = create.json()["id"]
    r = client.delete(f"/api/v1/transports/{tid}", headers=auth(token))
    assert r.status_code == 204
    r2 = client.get("/api/v1/transports/")
    ids = [t["id"] for t in r2.json()]
    assert tid not in ids


# ─── Bilhetes ─────────────────────────────────────────────────────────────────

def test_buy_ticket_no_auth():
    r = client.post("/api/v1/tickets/", json={"type": "single"})
    assert r.status_code == 401


def test_buy_single_ticket():
    token = create_user_and_login("buyer@test.com")
    r = client.post("/api/v1/tickets/", json={"type": "single"}, headers=auth(token))
    assert r.status_code == 201
    assert r.json()["price"] == 1.50
    assert r.json()["status"] == "active"


def test_buy_daily_ticket():
    token = create_user_and_login("daily@test.com")
    r = client.post("/api/v1/tickets/", json={"type": "daily"}, headers=auth(token))
    assert r.status_code == 201
    assert r.json()["price"] == 5.00


def test_buy_monthly_ticket():
    token = create_user_and_login("monthly@test.com")
    r = client.post("/api/v1/tickets/", json={"type": "monthly"}, headers=auth(token))
    assert r.status_code == 201
    assert r.json()["price"] == 40.00


def test_my_tickets_empty():
    token = create_user_and_login("empty@test.com")
    r = client.get("/api/v1/tickets/me", headers=auth(token))
    assert r.status_code == 200
    assert r.json() == []


def test_my_tickets_after_purchase():
    token = create_user_and_login("twotickets@test.com")
    client.post("/api/v1/tickets/", json={"type": "single"}, headers=auth(token))
    client.post("/api/v1/tickets/", json={"type": "daily"}, headers=auth(token))
    r = client.get("/api/v1/tickets/me", headers=auth(token))
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_validate_ticket():
    token = create_user_and_login("val@test.com")
    buy = client.post("/api/v1/tickets/", json={"type": "single"}, headers=auth(token))
    tid = buy.json()["id"]
    r = client.post(f"/api/v1/tickets/{tid}/validate", headers=auth(token))
    assert r.status_code == 200
    assert r.json()["status"] == "used"


def test_validate_ticket_twice():
    token = create_user_and_login("val2@test.com")
    buy = client.post("/api/v1/tickets/", json={"type": "single"}, headers=auth(token))
    tid = buy.json()["id"]
    client.post(f"/api/v1/tickets/{tid}/validate", headers=auth(token))
    r = client.post(f"/api/v1/tickets/{tid}/validate", headers=auth(token))
    assert r.status_code == 400


def test_cannot_validate_other_users_ticket():
    token1 = create_user_and_login("u1@test.com")
    token2 = create_user_and_login("u2@test.com")
    buy = client.post("/api/v1/tickets/", json={"type": "single"}, headers=auth(token1))
    tid = buy.json()["id"]
    r = client.post(f"/api/v1/tickets/{tid}/validate", headers=auth(token2))
    assert r.status_code == 404


# ─── Estatísticas ─────────────────────────────────────────────────────────────

def test_stats_overview():
    token = create_user_and_login("statsov@test.com")
    r = client.get("/api/v1/stats/overview", headers=auth(token))
    assert r.status_code == 200
    data = r.json()
    for key in ["total_tickets", "active_tickets", "total_revenue", "active_transports", "viagens_em_curso"]:
        assert key in data


def test_stats_tickets_by_type():
    token = create_user_and_login("stats@test.com")
    client.post("/api/v1/tickets/", json={"type": "single"}, headers=auth(token))
    client.post("/api/v1/tickets/", json={"type": "monthly"}, headers=auth(token))
    r = client.get("/api/v1/stats/tickets-by-type", headers=auth(token))
    assert r.status_code == 200
    types = [item["type"] for item in r.json()]
    assert "single" in types
    assert "monthly" in types


def test_stats_occupancy():
    token = create_user_and_login("adminocc@test.com", admin=True)
    client.post("/api/v1/transports/", json={
        "name": "Bus Occ", "type": "bus", "line": "L9", "capacity": 50
    }, headers=auth(token))
    r = client.get("/api/v1/stats/occupancy", headers=auth(token))
    assert r.status_code == 200
    assert len(r.json()) >= 1
    assert "occupancy_pct" in r.json()[0]


def test_stats_viagens():
    token = create_user_and_login("statsviagens@test.com")
    r = client.get("/api/v1/stats/viagens", headers=auth(token))
    assert r.status_code == 200
    data = r.json()
    for key in ["total_viagens", "viagens_em_curso", "total_entradas", "total_saidas"]:
        assert key in data


# ─── Dispositivos {P7} ────────────────────────────────────────────────────────

def test_list_devices_requires_auth():
    r = client.get("/api/v1/devices/")
    assert r.status_code == 401

def test_create_device_requires_admin():
    token = create_user_and_login("u_dev1@test.com")
    r = client.post("/api/v1/devices/", json={
        "device_id": "DEV-T01", "tipo": "sensor_contagem",
        "fabricante": "TestCo", "numero_serie": "SN-001"
    }, headers=auth(token))
    assert r.status_code == 403

def test_create_device_admin_ok():
    token = create_user_and_login("a_dev1@test.com", admin=True)
    r = client.post("/api/v1/devices/", json={
        "device_id": "DEV-T02", "tipo": "sensor_contagem",
        "fabricante": "TestCo", "numero_serie": "SN-002"
    }, headers=auth(token))
    assert r.status_code == 201
    assert r.json()["device_id"] == "DEV-T02"

def test_device_heartbeat():
    token_admin = create_user_and_login("a_dev2@test.com", admin=True)
    token_user  = create_user_and_login("u_dev2@test.com")
    client.post("/api/v1/devices/", json={
        "device_id": "DEV-HB1", "tipo": "sistema_bordo",
        "fabricante": "TestCo", "numero_serie": "SN-003"
    }, headers=auth(token_admin))
    r = client.post("/api/v1/devices/DEV-HB1/heartbeat", headers=auth(token_user))
    assert r.status_code == 200
    assert r.json()["estado_atual"] == "online"

def test_create_fault_and_list():
    token_admin = create_user_and_login("a_dev3@test.com", admin=True)
    token_user  = create_user_and_login("u_dev3@test.com")
    client.post("/api/v1/devices/", json={
        "device_id": "DEV-FL1", "tipo": "sensor_contagem",
        "fabricante": "TestCo", "numero_serie": "SN-004"
    }, headers=auth(token_admin))
    r = client.post("/api/v1/devices/DEV-FL1/faults", json={
        "tipo_falha": "Teste", "descricao": "Falha de teste"
    }, headers=auth(token_user))
    assert r.status_code == 201
    assert r.json()["estado"] == "aberto"

def test_open_faults_admin_only():
    token = create_user_and_login("u_dev4@test.com")
    r = client.get("/api/v1/devices/faults/open", headers=auth(token))
    assert r.status_code == 403


# ─── Exportação {P8} ──────────────────────────────────────────────────────────

def test_export_requires_admin():
    token = create_user_and_login("u_exp1@test.com")
    r = client.get("/api/v1/export/raw/tickets?format=csv", headers=auth(token))
    assert r.status_code == 403

def test_export_tickets_csv():
    token = create_user_and_login("a_exp1@test.com", admin=True)
    r = client.get("/api/v1/export/raw/tickets?format=csv", headers=auth(token))
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]

def test_export_tickets_json():
    token = create_user_and_login("a_exp2@test.com", admin=True)
    r = client.get("/api/v1/export/raw/tickets?format=json", headers=auth(token))
    assert r.status_code == 200

def test_export_ngsi_ld_structure():
    token = create_user_and_login("a_exp3@test.com", admin=True)
    r = client.get("/api/v1/export/normalized/ngsi-ld", headers=auth(token))
    assert r.status_code == 200
    data = r.json()
    if len(data) > 0:
        assert data[0]["id"].startswith("urn:ngsi-ld:")
        assert data[0]["type"] == "Vehicle"
        assert data[0]["location"]["type"] == "GeoProperty"

def test_export_gtfs():
    token = create_user_and_login("a_exp4@test.com", admin=True)
    r = client.get("/api/v1/export/normalized/gtfs", headers=auth(token))
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]

def test_export_history_records():
    token = create_user_and_login("a_exp5@test.com", admin=True)
    client.get("/api/v1/export/raw/tickets?format=csv", headers=auth(token))
    r = client.get("/api/v1/export/history", headers=auth(token))
    assert r.status_code == 200
    assert len(r.json()) >= 1

def test_report_overview_structure():
    token = create_user_and_login("a_exp6@test.com", admin=True)
    r = client.get("/api/v1/export/report/overview", headers=auth(token))
    assert r.status_code == 200
    data = r.json()
    assert "kpis" in data
    assert "bilhetes" in data
    assert "ocupacao" in data
    assert "gerado_em" in data


# ─── Linhas {P4} ──────────────────────────────────────────────────────────────

def test_list_linhas():
    r = client.get("/api/v1/linhas/")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
