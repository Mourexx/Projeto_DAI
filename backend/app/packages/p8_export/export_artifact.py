import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Enum, DateTime
from app.db.database import Base


class ArtifactTipo(str, enum.Enum):
    raw_csv            = "raw_csv"
    raw_json           = "raw_json"
    report_json        = "report_json"
    report_pdf         = "report_pdf"
    report_excel       = "report_excel"
    normalized_ngsi_ld = "normalized_ngsi_ld"
    normalized_gtfs    = "normalized_gtfs"


class ArtifactEstado(str, enum.Enum):
    pendente = "pendente"
    concluido = "concluido"
    erro = "erro"


class ExportArtifact(Base):
    __tablename__ = "export_artifacts"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(Enum(ArtifactTipo), nullable=False)
    filtros_aplicados = Column(String, nullable=True)
    num_registos = Column(Integer, nullable=True)
    tamanho_bytes = Column(Integer, nullable=True)
    executado_por_email = Column(String, nullable=False)
    criado_em = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    estado = Column(Enum(ArtifactEstado), default=ArtifactEstado.concluido)
    conteudo = Column(Text, nullable=True)
