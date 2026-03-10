from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base


class Linha(Base):
    """
    Representa uma linha de transporte urbano do TUB.
    Ex: Linha 1 - Braga Centro / Universidade
    """
    __tablename__ = "linhas"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, nullable=False)   # Ex: "L1", "L5"
    nome = Column(String, nullable=False)                  # Ex: "Braga Centro / Universidade"
    ativa = Column(Boolean, default=True)

    # Relações
    viagens = relationship("Viagem", back_populates="linha")
    validacoes = relationship("ValidacaoBilhete", back_populates="linha")
