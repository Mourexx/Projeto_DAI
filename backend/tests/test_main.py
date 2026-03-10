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
        from app.db.models.user import User
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
    r = client.get("/api/v1/stats/overview")
    assert r.status_code == 200
    data = r.json()
    for key in ["total_tickets", "active_tickets", "total_revenue", "active_transports", "viagens_em_curso"]:
        assert key in data


def test_stats_tickets_by_type():
    token = create_user_and_login("stats@test.com")
    client.post("/api/v1/tickets/", json={"type": "single"}, headers=auth(token))
    client.post("/api/v1/tickets/", json={"type": "monthly"}, headers=auth(token))
    r = client.get("/api/v1/stats/tickets-by-type")
    assert r.status_code == 200
    types = [item["type"] for item in r.json()]
    assert "single" in types
    assert "monthly" in types


def test_stats_occupancy():
    token = create_user_and_login("adminocc@test.com", admin=True)
    client.post("/api/v1/transports/", json={
        "name": "Bus Occ", "type": "bus", "line": "L9", "capacity": 50
    }, headers=auth(token))
    r = client.get("/api/v1/stats/occupancy")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    assert "occupancy_pct" in r.json()[0]


def test_stats_viagens():
    r = client.get("/api/v1/stats/viagens")
    assert r.status_code == 200
    data = r.json()
    for key in ["total_viagens", "viagens_em_curso", "total_entradas", "total_saidas"]:
        assert key in data
