// Package {P8} Data Export & Normalization — 4SRS SIBCP v3
// Implements: {O8.1.i} raw data export interface,
//             {O8.2.i} report export interface,
//             {O8.3.i} normalized data export interface
import { useState } from 'react'
import { exportApi } from '../../shared/services/api'
import { useAuth } from '../../shared/Context/AuthContext'

const B = '#005BAC'

const TABS = [
  { id: 'raw',        label: 'Dados Brutos' },
  { id: 'report',     label: 'Relatorios' },
  { id: 'normalized', label: 'Dados Normalizados' },
]

const cardStyle = {
  background: 'white', borderRadius: 12, border: '1px solid #E2E8F0',
  padding: '22px 24px',
}

const btnPrimary = (disabled) => ({
  padding: '8px 16px', borderRadius: 8, border: 'none', background: disabled ? '#94A3B8' : B,
  color: 'white', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700,
  fontFamily: "'DM Sans', sans-serif", opacity: disabled ? 0.8 : 1,
})

const btnOutline = {
  padding: '8px 16px', borderRadius: 8, border: `1px solid ${B}`, background: 'white',
  color: B, cursor: 'pointer', fontSize: 13, fontWeight: 700,
  fontFamily: "'DM Sans', sans-serif",
}

function triggerBlobDownload(blob, contentType, filename) {
  const url = URL.createObjectURL(new Blob([blob], { type: contentType }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function triggerJsonDownload(data, filename) {
  const content = JSON.stringify(data, null, 2)
  triggerBlobDownload(content, 'application/json', filename)
}

export default function Export() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('raw')

  // Loading states: keyed by operation identifier
  const [loading, setLoading] = useState({})
  const setLoad = (key, val) => setLoading(prev => ({ ...prev, [key]: val }))

  // Report state
  const [report, setReport] = useState(null)
  const [reportError, setReportError] = useState(false)

  // History
  const [history, setHistory] = useState([])
  const [historyLoaded, setHistoryLoaded] = useState(false)

  if (!user?.is_admin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>Acesso reservado a administradores</p>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Esta pagina requer permissoes de administrador.</p>
        </div>
      </div>
    )
  }

  const handleRawDownload = async (resource, format) => {
    const key = `${resource}_${format}`
    setLoad(key, true)
    try {
      const apiFn = { tickets: exportApi.rawTickets, transports: exportApi.rawTransports, validacoes: exportApi.rawValidacoes }[resource]
      const resp = await apiFn(format)
      const ext = format === 'json' ? 'json' : 'csv'
      const contentType = format === 'json' ? 'application/json' : 'text/csv'
      triggerBlobDownload(resp.data, contentType, `${resource}.${ext}`)
    } catch (err) {
      console.error(err)
    } finally {
      setLoad(key, false)
    }
  }

  const handleReportOverview = async () => {
    setLoad('report', true)
    setReportError(false)
    try {
      const resp = await exportApi.reportOverview()
      setReport(resp.data)
    } catch {
      setReportError(true)
    } finally {
      setLoad('report', false)
    }
  }

  const handleGtfsDownload = async () => {
    setLoad('gtfs', true)
    try {
      const resp = await exportApi.normalizedGtfs()
      triggerBlobDownload(resp.data, 'text/csv', 'gtfs_export.csv')
    } catch (err) {
      console.error(err)
    } finally {
      setLoad('gtfs', false)
    }
  }

  const handleNgsiDownload = async () => {
    setLoad('ngsi', true)
    try {
      const resp = await exportApi.normalizedNgsi()
      triggerJsonDownload(resp.data, 'ngsi-ld-export.jsonld')
    } catch (err) {
      console.error(err)
    } finally {
      setLoad('ngsi', false)
    }
  }

  const loadHistory = async () => {
    setLoad('history', true)
    try {
      const resp = await exportApi.history()
      setHistory(resp.data)
      setHistoryLoaded(true)
    } catch {
      setHistory([])
    } finally {
      setLoad('history', false)
    }
  }

  const RAW_CARDS = [
    {
      id: 'tickets',
      title: 'Bilhetes',
      desc: 'Exportar todos os bilhetes registados no sistema — inclui tipo, preco, estado, datas de compra e validade.',
    },
    {
      id: 'transports',
      title: 'Transportes',
      desc: 'Exportar a frota de veiculos urbanos — inclui linha, capacidade, ocupacao atual e coordenadas GPS.',
    },
    {
      id: 'validacoes',
      title: 'Validacoes',
      desc: 'Exportar registos de validacao de titulos — dados anonimizados (RGPD) com paragem, perfil e tipo de titulo.',
    },
  ]

  return (
    <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', background: '#F4F6F9', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: -0.3 }}>
          Exportacao de Dados
        </h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
          P8 · Exportar dados brutos, relatorios e formatos normalizados GTFS / NGSI-LD
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'white', borderRadius: 10, border: '1px solid #E2E8F0', padding: 4, width: 'fit-content' }}>
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

      {/* ── Tab 1: Dados Brutos ──────────────────────────────────────── */}
      {activeTab === 'raw' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {RAW_CARDS.map(card => (
            <div key={card.id} style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>{card.title}</h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px', lineHeight: 1.5 }}>{card.desc}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleRawDownload(card.id, 'csv')}
                  disabled={loading[`${card.id}_csv`]}
                  style={btnPrimary(loading[`${card.id}_csv`])}
                >
                  {loading[`${card.id}_csv`] ? 'A exportar...' : 'Exportar CSV'}
                </button>
                <button
                  onClick={() => handleRawDownload(card.id, 'json')}
                  disabled={loading[`${card.id}_json`]}
                  style={btnPrimary(loading[`${card.id}_json`])}
                >
                  {loading[`${card.id}_json`] ? 'A exportar...' : 'Exportar JSON'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab 2: Relatorios ────────────────────────────────────────── */}
      {activeTab === 'report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>Relatorio de Overview</h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px', lineHeight: 1.5 }}>
              Agrega KPIs principais, distribuicao de bilhetes por tipo e ocupacao atual dos veiculos.
              O resultado e mostrado abaixo e pode ser descarregado em JSON.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: report ? 20 : 0 }}>
              <button onClick={handleReportOverview} disabled={loading.report} style={btnPrimary(loading.report)}>
                {loading.report ? 'A gerar...' : 'Gerar Relatorio'}
              </button>
              {report && (
                <button onClick={() => triggerJsonDownload(report, 'relatorio_overview.json')} style={btnOutline}>
                  Descarregar JSON
                </button>
              )}
            </div>

            {reportError && (
              <p style={{ color: '#DC2626', fontSize: 13 }}>Erro ao gerar relatorio. Tente novamente.</p>
            )}

            {report && (
              <div style={{ marginTop: 8 }}>
                {/* KPIs section */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>KPIs</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {Object.entries(report.kpis).map(([k, v]) => (
                      <div key={k} style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px 14px', border: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: B }}>{typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(2) + ' €' : v}</div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{k.replace(/_/g, ' ')}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bilhetes section */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Bilhetes por Tipo</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {report.bilhetes.map(b => (
                      <div key={b.tipo} style={{ background: '#EBF4FF', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
                        <strong style={{ color: B }}>{b.quantidade}</strong>
                        <span style={{ color: '#475569', marginLeft: 6 }}>{b.tipo}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ocupacao section */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Ocupacao dos Veiculos</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                          {['Veiculo', 'Linha', 'Ocupacao', 'Capacidade', '%'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {report.ocupacao.map(o => (
                          <tr key={o.veiculo} style={{ borderBottom: '1px solid #F8FAFC' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>{o.veiculo}</td>
                            <td style={{ padding: '8px 10px', color: '#475569' }}>{o.linha}</td>
                            <td style={{ padding: '8px 10px', color: '#475569' }}>{o.ocupacao_atual}</td>
                            <td style={{ padding: '8px 10px', color: '#475569' }}>{o.capacidade}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 3, minWidth: 60 }}>
                                  <div style={{ width: `${o.percentagem}%`, height: '100%', background: o.percentagem >= 90 ? '#DC2626' : o.percentagem >= 75 ? '#F59E0B' : B, borderRadius: 3 }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{o.percentagem}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 16, marginBottom: 0 }}>
                  Gerado em: {new Date(report.gerado_em).toLocaleString('pt-PT')}
                </p>
              </div>
            )}
          </div>

          {/* Export History */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Historico de Exportacoes</h3>
              <button onClick={loadHistory} disabled={loading.history} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748B', fontFamily: "'DM Sans', sans-serif" }}>
                {loading.history ? 'A carregar...' : 'Carregar Historico'}
              </button>
            </div>
            {historyLoaded && (
              history.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sem exportacoes registadas.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                        {['Tipo', 'Registos', 'Tamanho', 'Executado por', 'Data', 'Estado'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(a => (
                        <tr key={a.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>{a.tipo}</td>
                          <td style={{ padding: '8px 10px', color: '#475569' }}>{a.num_registos ?? '—'}</td>
                          <td style={{ padding: '8px 10px', color: '#475569' }}>{a.tamanho_bytes ? (a.tamanho_bytes / 1024).toFixed(1) + ' KB' : '—'}</td>
                          <td style={{ padding: '8px 10px', color: '#64748B' }}>{a.executado_por_email}</td>
                          <td style={{ padding: '8px 10px', color: '#9CA3AF', fontSize: 12 }}>{a.criado_em ? new Date(a.criado_em).toLocaleString('pt-PT') : '—'}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                              {a.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ── Tab 3: Dados Normalizados ────────────────────────────────── */}
      {activeTab === 'normalized' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>

          {/* GTFS card */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Formato GTFS</h3>
              <span style={{ fontSize: 10, fontWeight: 700, background: '#EBF4FF', color: B, padding: '2px 8px', borderRadius: 4, letterSpacing: 0.3 }}>
                GTFS-RT
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 10px', lineHeight: 1.5 }}>
              General Transit Feed Specification — formato aberto para dados de transporte publico.
              Exporta a frota com campos normalizados: trip_id, vehicle_id, route_id, coordenadas e ocupacao.
            </p>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 18px' }}>
              Compativel com Google Maps, OpenTripPlanner e outras plataformas de mobilidade.
            </p>
            <button onClick={handleGtfsDownload} disabled={loading.gtfs} style={btnPrimary(loading.gtfs)}>
              {loading.gtfs ? 'A exportar...' : 'Exportar GTFS (CSV)'}
            </button>
          </div>

          {/* NGSI-LD card */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Formato NGSI-LD</h3>
              <span style={{ fontSize: 10, fontWeight: 700, background: '#F0FDF4', color: '#15803D', padding: '2px 8px', borderRadius: 4, letterSpacing: 0.3 }}>
                Smart Data Models
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 10px', lineHeight: 1.5 }}>
              Next Generation Service Interfaces — Linked Data (NGSI-LD). Formato da ETSI para sistemas
              de cidades inteligentes. Mapeia cada veiculo para entidade Vehicle com GeoProperty e Properties.
            </p>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 18px' }}>
              Compativel com FIWARE Orion-LD e outras plataformas de Smart Cities baseadas em NGSI-LD.
            </p>
            <button onClick={handleNgsiDownload} disabled={loading.ngsi} style={btnPrimary(loading.ngsi)}>
              {loading.ngsi ? 'A exportar...' : 'Exportar NGSI-LD (JSON-LD)'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
