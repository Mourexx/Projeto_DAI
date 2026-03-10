from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Viagem(Base):
    """Viagem concreta de um autocarro numa linha."""
    __tablename__ = "viagens"

    id = Column(Integer, primary_key=True, index=True)
    linha_id = Column(Integer, ForeignKey("linhas.id"), nullable=False)
    matricula_autobus = Column(String, nullable=False)         # Ex: "00-AA-00"
    data_inicio = Column(DateTime(timezone=True), nullable=False)
    data_fim = Column(DateTime(timezone=True), nullable=True)
    em_curso = Column(Boolean, default=True)

    # Contagem em tempo real
    total_entradas = Column(Integer, default=0)
    total_saidas = Column(Integer, default=0)
    ocupacao_atual = Column(Integer, default=0)
    capacidade_maxima = Column(Integer, default=60)

    # Localização GPS em tempo real
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    linha = relationship("Linha", back_populates="viagens")
    contagens = relationship("ContagemPassageiros", back_populates="viagem")
    validacoes = relationship("ValidacaoBilhete", back_populates="viagem")
