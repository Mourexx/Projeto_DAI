// Package {P7} Device & Infrastructure Management — 4SRS SIBCP v3
// Implements: {O7.1.i} device registration interface,
//             {O7.2.i} device monitoring dashboard interface,
//             {O7.3.i} inventory and fault management interface
import { useState, useEffect } from 'react'
import { devicesApi, transportsApi } from '../../shared/services/api'
import { useAuth } from '../../shared/Context/AuthContext'

const B = '#005BAC'

function Badge({ estado }) {
  const map = {
    online:       { bg: '#DCFCE7', color: '#15803D', label: 'Online' },
    offline:      { bg: '#F3F4F6', color: '#6B7280', label: 'Offline' },
    erro:         { bg: '#FEE2E2', color: '#DC2626', label: 'Erro' },
    ativo:        { bg: '#DBEAFE', color: '#1D4ED8', label: 'Ativo' },
    inativo:      { bg: '#F3F4F6', color: '#6B7280', label: 'Inativo' },
    falha:        { bg: '#FEE2E2', color: '#DC2626', label: 'Falha' },
    aberto:       { bg: '#FEF3C7', color: '#B45309', label: 'Aberto' },
    em_resolucao: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Em Resolução' },
    resolvido:    { bg: '#DCFCE7', color: '#15803D', label: 'Resolvido' },
  }
  const cfg = map[estado] || { bg: '#F3F4F6', color: '#6B7280', label: estado }
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  )
}

function timeAgo(isoStr) {
  if (!isoStr) return 'Nunca'
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (diff < 60) return `há ${diff}s`
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
  return `há ${Math.floor(diff / 3600)}h`
}

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: '1px solid #E2E8F0', fontSize: 13,
  fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
}

const labelStyle = {
  fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4,
}

const btnPrimary = {
  padding: '8px 20px', borderRadius: 8, border: 'none', background: B,
  color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700,
  fontFamily: "'DM Sans', sans-serif",
}

const btnSecondary = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0',
  background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  color: '#64748B', fontFamily: "'DM Sans', sans-serif",
}

const TABS = [
  { id: 'dispositivos', label: 'Dispositivos' },
  { id: 'status',       label: 'Estado em Tempo Real' },
  { id: 'falhas',       label: 'Falhas e Inventário' },
]

const EMPTY_DEVICE_FORM = { device_id: '', tipo: 'sensor_contagem', fabricante: '', numero_serie: '', veiculo_id: '' }
const EMPTY_FAULT_FORM  = { tipo_falha: '', descricao: '' }

export default function Devices() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('dispositivos')

  const [devices,       setDevices]       = useState([])
  const [statuses,      setStatuses]      = useState([])
  const [faults,        setFaults]        = useState([])
  const [vehicles,      setVehicles]      = useState([])
  const [loadingDev,    setLoadingDev]    = useState(true)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [loadingFaults, setLoadingFaults] = useState(false)

  const [showModal,    setShowModal]    = useState(false)
  const [modalForm,    setModalForm]    = useState(EMPTY_DEVICE_FORM)
  const [creating,     setCreating]     = useState(false)

  const [showFaultForm, setShowFaultForm] = useState(false)
  const [faultDevice,   setFaultDevice]   = useState('')
  const [faultForm,     setFaultForm]     = useState(EMPTY_FAULT_FORM)

  const loadDevices = () => {
    setLoadingDev(true)
    devicesApi.list()
      .then(r => setDevices(r.data))
      .catch(() => setDevices([]))
      .finally(() => setLoadingDev(false))
  }

  const loadStatus = () => {
    setLoadingStatus(true)
    devicesApi.statusAll()
      .then(r => setStatuses(r.data))
      .catch(() => setStatuses([]))
      .finally(() => setLoadingStatus(false))
  }

  const loadFaults = () => {
    setLoadingFaults(true)
    devicesApi.getOpenFaults()
      .then(r => setFaults(r.data))
      .catch(() => setFaults([]))
      .finally(() => setLoadingFaults(false))
  }

  useEffect(() => {
    loadDevices()
    loadStatus()
    transportsApi.list()
      .then(r => setVehicles(r.data.map(t => t.name)))
      .catch(() => setVehicles([]))
  }, [])

  useEffect(() => {
    if (activeTab === 'status')  loadStatus()
    if (activeTab === 'falhas')  loadFaults()
  }, [activeTab])

  const kpiTotal   = devices.length
  const kpiOnline  = statuses.filter(s => s.estado_atual === 'online').length
  const kpiOffline = statuses.filter(s => s.estado_atual === 'offline').length
  const kpiFalha   = devices.filter(d => d.estado === 'falha').length

  const handleHeartbeat = (deviceId) => {
    devicesApi.heartbeat(deviceId)
      .then(() => { loadDevices(); if (activeTab === 'status') loadStatus() })
      .catch(console.error)
  }

  const handleCreate = () => {
    setCreating(true)
    devicesApi.create(modalForm)
      .then(() => { setShowModal(false); setModalForm(EMPTY_DEVICE_FORM); loadDevices() })
      .catch(console.error)
      .finally(() => setCreating(false))
  }

  const handleResolveFault = (faultId) => {
    devicesApi.updateFault(faultId, { estado: 'resolvido' })
      .then(() => loadFaults())
      .catch(console.error)
  }

  const handleCreateFault = () => {
    if (!faultDevice || !faultForm.tipo_falha) return
    devicesApi.createFault(faultDevice, faultForm)
      .then(() => { setShowFaultForm(false); setFaultForm(EMPTY_FAULT_FORM); loadFaults() })
      .catch(console.error)
  }

  const thStyle = {
    textAlign: 'left', padding: '10px 12px', fontWeight: 700,
    color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4,
  }

  const tdStyle = { padding: '12px' }

  return (
    <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', background: '#F4F6F9', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: -0.3 }}>
          Dispositivos e Infraestrutura
        </h1>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Dispositivos', value: kpiTotal,   color: B,        icon: '🖥️' },
          { label: 'Online',             value: kpiOnline,  color: '#15803D', icon: '✅' },
          { label: 'Offline',            value: kpiOffline, color: '#6B7280', icon: '⭕' },
          { label: 'Em Falha',           value: kpiFalha,   color: '#DC2626', icon: '❌' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: kpi.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{kpi.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>{kpi.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginTop: 1 }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'white', borderRadius: 10, border: '1px solid #E2E8F0', padding: 4, width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            background: activeTab === tab.id ? B : 'transparent',
            color: activeTab === tab.id ? 'white' : '#64748B',
            transition: 'all 0.15s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Dispositivos ─────────────────────────────────────── */}
      {activeTab === 'dispositivos' && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
              Lista de Dispositivos ({devices.length})
            </h3>
            {user?.is_admin && (
              <button onClick={() => setShowModal(true)} style={{ ...btnPrimary, padding: '8px 14px' }}>
                + Registar Dispositivo
              </button>
            )}
          </div>

          {loadingDev ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>A carregar dispositivos...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                    {['ID Dispositivo', 'Tipo', 'Fabricante', 'Veículo', 'Estado', 'Data Registo', 'Ações'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {devices.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Sem dispositivos registados</td></tr>
                  ) : devices.map(d => (
                    <tr key={d.device_id} style={{ borderBottom: '1px solid #F8FAFC' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#1E293B' }}>{d.device_id}</td>
                      <td style={{ ...tdStyle, color: '#475569' }}>{d.tipo === 'sensor_contagem' ? 'Sensor Contagem' : 'Sistema Bordo'}</td>
                      <td style={{ ...tdStyle, color: '#475569' }}>{d.fabricante}</td>
                      <td style={{ ...tdStyle, color: '#475569' }}>{d.veiculo_id || '—'}</td>
                      <td style={tdStyle}><Badge estado={d.estado} /></td>
                      <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 12 }}>
                        {d.data_registo ? new Date(d.data_registo).toLocaleDateString('pt-PT') : '—'}
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => handleHeartbeat(d.device_id)} style={{
                          padding: '4px 10px', borderRadius: 6, border: '1px solid #E2E8F0',
                          background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                          color: '#475569', fontFamily: "'DM Sans', sans-serif",
                        }}>
                          Heartbeat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Estado em Tempo Real ─────────────────────────────── */}
      {activeTab === 'status' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
              Estado em Tempo Real
            </h3>
            <button onClick={loadStatus} style={btnSecondary}>Atualizar</button>
          </div>

          {loadingStatus ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>A carregar estado...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {statuses.length === 0 ? (
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 40, textAlign: 'center', color: '#9CA3AF', gridColumn: '1 / -1' }}>
                  Sem dados de estado disponíveis
                </div>
              ) : statuses.map(s => (
                <div key={s.device_id} style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{s.device_id}</div>
                    <Badge estado={s.estado_atual} />
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>Último heartbeat: <strong>{timeAgo(s.ultimo_heartbeat)}</strong></div>
                    <div>Uptime: <strong>{s.uptime_percentagem != null ? s.uptime_percentagem.toFixed(1) + '%' : 'N/A'}</strong></div>
                    {s.latencia_media_ms != null && (
                      <div>Latência média: <strong>{s.latencia_media_ms.toFixed(0)} ms</strong></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Falhas e Inventario ──────────────────────────────── */}
      {activeTab === 'falhas' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
              Falhas e Inventário ({faults.length} abertas)
            </h3>
            <button onClick={() => setShowFaultForm(v => !v)} style={{ ...btnSecondary, background: '#FEF3C7', borderColor: '#FDE68A', color: '#B45309' }}>
              Reportar Falha
            </button>
          </div>

          {showFaultForm && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>Reportar Nova Falha</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Dispositivo</label>
                  <select value={faultDevice} onChange={e => setFaultDevice(e.target.value)} style={inputStyle}>
                    <option value="">Selecionar...</option>
                    {devices.map(d => <option key={d.device_id} value={d.device_id}>{d.device_id}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tipo de Falha</label>
                  <input value={faultForm.tipo_falha} onChange={e => setFaultForm(f => ({ ...f, tipo_falha: e.target.value }))}
                    placeholder="Ex: Falha de Sensor" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Descrição</label>
                <textarea value={faultForm.descricao} onChange={e => setFaultForm(f => ({ ...f, descricao: e.target.value }))}
                  rows={3} placeholder="Descrever a falha observada..."
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCreateFault} style={btnPrimary}>Registar Falha</button>
                <button onClick={() => setShowFaultForm(false)} style={btnSecondary}>Cancelar</button>
              </div>
            </div>
          )}

          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px 22px' }}>
            {loadingFaults ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>A carregar falhas...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                      {['Dispositivo', 'Tipo Falha', 'Descrição', 'Estado', 'Criado em', 'Ação Corretiva', 'Reportado por', ...(user?.is_admin ? ['Ações'] : [])].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {faults.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Sem falhas abertas</td></tr>
                    ) : faults.map(f => (
                      <tr key={f.id} style={{ borderBottom: '1px solid #F8FAFC' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ ...tdStyle, fontWeight: 600, color: '#1E293B' }}>{f.device_id}</td>
                        <td style={{ ...tdStyle, color: '#475569' }}>{f.tipo_falha}</td>
                        <td style={{ ...tdStyle, color: '#64748B', maxWidth: 200 }}>{f.descricao}</td>
                        <td style={tdStyle}><Badge estado={f.estado} /></td>
                        <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 12 }}>
                          {f.criado_em ? new Date(f.criado_em).toLocaleDateString('pt-PT') : '—'}
                        </td>
                        <td style={{ ...tdStyle, color: '#64748B' }}>{f.acao_corretiva || '—'}</td>
                        <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 12 }}>{f.criado_por_email || '—'}</td>
                        {user?.is_admin && (
                          <td style={tdStyle}>
                            <button onClick={() => handleResolveFault(f.id)} style={{
                              padding: '4px 10px', borderRadius: 6, border: 'none',
                              background: '#DCFCE7', color: '#15803D', cursor: 'pointer',
                              fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                            }}>
                              Resolver
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Criar Dispositivo ────────────────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800, color: '#1A1A1A' }}>Registar Novo Dispositivo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>ID Dispositivo *</label>
                <input value={modalForm.device_id} onChange={e => setModalForm(f => ({ ...f, device_id: e.target.value }))}
                  placeholder="DEV-XXX-001" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Tipo *</label>
                <select value={modalForm.tipo} onChange={e => setModalForm(f => ({ ...f, tipo: e.target.value }))} style={inputStyle}>
                  <option value="sensor_contagem">Sensor de Contagem</option>
                  <option value="sistema_bordo">Sistema de Bordo</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Fabricante *</label>
                <input value={modalForm.fabricante} onChange={e => setModalForm(f => ({ ...f, fabricante: e.target.value }))}
                  placeholder="Ex: Wayfair" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Número de Série *</label>
                <input value={modalForm.numero_serie} onChange={e => setModalForm(f => ({ ...f, numero_serie: e.target.value }))}
                  placeholder="SN-00000" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Veículo (opcional)</label>
                <select value={modalForm.veiculo_id} onChange={e => setModalForm(f => ({ ...f, veiculo_id: e.target.value }))} style={inputStyle}>
                  <option value="">Sem associação</option>
                  {vehicles.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={btnSecondary}>Cancelar</button>
              <button onClick={handleCreate} disabled={creating} style={{ ...btnPrimary, opacity: creating ? 0.7 : 1 }}>
                {creating ? 'A registar...' : 'Registar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
