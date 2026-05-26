import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class TipoEvento(str, enum.Enum):
    entrada = "entrada"
    saida = "saida"


class ContagemPassageiros(Base):
    """Evento de entrada/saída detetado pelos sensores de bordo."""
    __tablename__ = "contagens_passageiros"

    id = Column(Integer, primary_key=True, index=True)
    viagem_id = Column(Integer, ForeignKey("viagens.id"), nullable=False)
    paragem = Column(String, nullable=False)
    tipo_evento = Column(Enum(TipoEvento), nullable=False)
    quantidade = Column(Integer, default=1)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    viagem = relationship("Viagem", back_populates="contagens")
