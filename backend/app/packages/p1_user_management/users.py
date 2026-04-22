# Package {P1} User Management — 4SRS SIBCP v3
# Implements: {O1.1.c} registration validator, {O1.2.c} session management controller,
#             {O1.3.c} profile management controller, {O1.4.c} permission management controller
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.db.database import get_db
from app.packages.p1_user_management.user import User
from app.packages.p1_user_management.user_schema import UserCreate, UserOut, Token
from app.core.security import hash_password, verify_password, create_access_token, get_current_user, get_current_admin

router = APIRouter()


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None


ADMIN_EMAILS = {"admin@tub.pt", "admin@tub.com"}

@router.post("/register", response_model=UserOut, status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hash_password(user.password),
        is_admin=user.email in ADMIN_EMAILS,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/fix-admin", response_model=UserOut)
def fix_admin(db: Session = Depends(get_db)):
    """Promove admin@tub.pt a administrador se ainda não for."""
    user = db.query(User).filter(User.email == "admin@tub.pt").first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador admin@tub.pt não encontrado")
    user.is_admin = True
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if update.full_name is not None:
        current_user.full_name = update.full_name
    if update.password is not None:
        current_user.hashed_password = hash_password(update.password)
    db.commit()
    db.refresh(current_user)
    return current_user


# ── Rotas de administrador ──────────────────────────────────────────

@router.get("/", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return db.query(User).filter(User.is_active == True).all()


@router.patch("/{user_id}/permissions", response_model=UserOut)
def update_permissions(
    user_id: int,
    is_admin: bool,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    user.is_admin = is_admin
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    user.is_active = False
    db.commit()
