import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class PerfilPassageiro(str, enum.Enum):
    normal = "normal"
    estudante = "estudante"
    senior = "senior"
    crianca = "crianca"
    portador_deficiencia = "portador_deficiencia"


class TipoTitulo(str, enum.Enum):
    passe_mensal = "passe_mensal"
    bilhete_simples = "bilhete_simples"
    bilhete_diario = "bilhete_diario"
    passe_estudante = "passe_estudante"


class ValidacaoBilhete(Base):
    """
    Validação de título num autocarro.
    Dados anonimizados (RGPD) — sem nome ou NIF.
    """
    __tablename__ = "validacoes_bilhetes"

    id = Column(Integer, primary_key=True, index=True)
    viagem_id = Column(Integer, ForeignKey("viagens.id"), nullable=True)
    linha_id = Column(Integer, ForeignKey("linhas.id"), nullable=False)
    tipo_titulo = Column(Enum(TipoTitulo), nullable=False)
    perfil_passageiro = Column(Enum(PerfilPassageiro), nullable=False)
    paragem = Column(String, nullable=False)
    valida = Column(Boolean, default=True)
    motivo_invalida = Column(String, nullable=True)   # Ex: "Título expirado"
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    viagem = relationship("Viagem", back_populates="validacoes")
    linha = relationship("Linha", back_populates="validacoes")
