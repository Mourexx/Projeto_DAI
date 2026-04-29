# Importar todos os modelos para o SQLAlchemy os registar corretamente
# Caminhos atualizados para a nova estrutura de packages 4SRS SIBCP v3
from app.packages.p1_user_management.user import User
from app.packages.p4_monitoring.transport import Transport
from app.packages.p2_ticketing.ticket import Ticket
from app.packages.p4_monitoring.linha import Linha
from app.packages.p3_operational.viagem import Viagem
from app.packages.p3_operational.contagem import ContagemPassageiros
from app.packages.p2_ticketing.validacao import ValidacaoBilhete
from app.packages.p7_devices.device import Device
from app.packages.p7_devices.device_status import DeviceStatus
from app.packages.p7_devices.fault import FaultRecord
from app.packages.p8_export.export_artifact import ExportArtifact
