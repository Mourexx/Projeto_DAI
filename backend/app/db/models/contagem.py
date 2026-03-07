from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class TipoEvento(str, enum.Enum):
    entrada = "entrada"    # Passageiro entrou no autocarro
    saida = "saida"        # Passageiro saiu do autocarro


class ContagemPassageiros(Base):
    """
    Regista cada evento de entrada/saída de passageiros detetado
    pelos sensores de bordo do autocarro.
    Cada registo = 1 evento de sensor numa paragem.
    """
    __tablename__ = "contagens_passageiros"

    id = Column(Integer, primary_key=True, index=True)
    viagem_id = Column(Integer, ForeignKey("viagens.id"), nullable=False)
    paragem = Column(String, nullable=False)               # Nome da paragem
    tipo_evento = Column(Enum(TipoEvento), nullable=False) # Entrada ou Saída
    quantidade = Column(Integer, default=1)                # Nº de passageiros no evento
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relação
    viagem = relationship("Viagem", back_populates="contagens")
