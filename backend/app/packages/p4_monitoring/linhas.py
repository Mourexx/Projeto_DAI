from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.packages.p4_monitoring.linha import Linha

router = APIRouter()


@router.get("/")
def list_linhas(db: Session = Depends(get_db)):
    """UC4.4 — Listar linhas ativas ({O4.4.d} line repository)."""
    linhas = db.query(Linha).filter(Linha.ativa == True).all()
    return [{"id": l.id, "codigo": l.codigo, "nome": l.nome, "ativa": l.ativa} for l in linhas]
