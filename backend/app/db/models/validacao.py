from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class PerfilPassageiro(str, enum.Enum):
    normal = "normal"
    estudante = "estudante"
    sénior = "sénior"
    crianca = "crianca"
    portador_deficiencia = "portador_deficiencia"


class TipoTitulo(str, enum.Enum):
    passe_mensal = "passe_mensal"
    bilhete_simples = "bilhete_simples"
    bilhete_diario = "bilhete_diario"
    passe_estudante = "passe_estudante"


class ValidacaoBilhete(Base):
    """
    Regista cada validação de título de transporte feita num autocarro.
    Inclui validações válidas e inválidas (para alertas).
    Dados anonimizados — sem identificação pessoal direta (RGPD).
    """
    __tablename__ = "validacoes_bilhetes"

    id = Column(Integer, primary_key=True, index=True)
    viagem_id = Column(Integer, ForeignKey("viagens.id"), nullable=True)
    linha_id = Column(Integer, ForeignKey("linhas.id"), nullable=False)

    # Dados do título (anonimizados — sem nome ou NIF)
    tipo_titulo = Column(Enum(TipoTitulo), nullable=False)
    perfil_passageiro = Column(Enum(PerfilPassageiro), nullable=False)
    paragem = Column(String, nullable=False)               # Paragem onde validou

    # Resultado da validação
    valida = Column(Boolean, default=True)                 # False = alerta!
    motivo_invalida = Column(String, nullable=True)        # Ex: "Título expirado"

    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relações
    viagem = relationship("Viagem", back_populates="validacoes")
    linha = relationship("Linha", back_populates="validacoes")
