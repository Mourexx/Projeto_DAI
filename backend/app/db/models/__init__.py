# Importar todos os modelos para o SQLAlchemy os registar corretamente
from app.db.models.user import User
from app.db.models.transport import Transport
from app.db.models.ticket import Ticket
from app.db.models.linha import Linha
from app.db.models.viagem import Viagem
from app.db.models.contagem import ContagemPassageiros
from app.db.models.validacao import ValidacaoBilhete
