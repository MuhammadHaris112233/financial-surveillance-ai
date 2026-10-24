import { useEffect, useState } from 'react'
import { Activity, Bell, BrainCircuit, ChevronDown, CircleHelp, X, Database, FileText, LayoutDashboard, Search, ShieldCheck, ShieldAlert, SlidersHorizontal, Workflow } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import './App.css'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const navigation = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Transaction Explorer', icon: Search },
  { name: 'Hybrid Detection', icon: Workflow },
  { name: 'Investigation Centre', icon: ShieldAlert },
  { name: 'AI Investigation Reports', icon: BrainCircuit },
]
const colors = { 'Rule Only': '#ef555b', 'Rule + ML': '#15a49b', 'ML Only': '#3678ed' }
const fmt = n => new Intl.NumberFormat('en-GB').format(n ?? 0)
const truthy = v => v === true || String(v).toLowerCase() === 'true' || String(v) === '1'
const text = v => v === null || v === undefined || v === '' ? '—' : String(v)
const encode = params => new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)).toString()
async function request(path, signal) {
  const response = await fetch(`${API}${path}`, { signal })
  if (!response.ok) { let detail = ''; try { detail = (await response.json()).detail } catch {} throw new Error(detail || `API returned ${response.status}`) }
  return response.json()
}
function useApi(path) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  useEffect(() => {
    const controller = new AbortController()
    setState(s => ({ ...s, loading: true, error: '' }))
    request(path, controller.signal).then(data => setState({ data, loading: false, error: '' })).catch(error => {
      if (error.name !== 'AbortError') setState({ data: null, loading: false, error: error.message })
    })
    return () => controller.abort()
  }, [path])
  return state
}
function StatCard({ title, value, description, icon: Icon, tone = 'blue' }) {
  return <div className="stat-card"><div className="stat-head"><span>{title}</span><span className={`stat-icon ${tone}`}><Icon size={19}/></span></div><div className="stat-value">{value}</div><div className="stat-description">{description}</div></div>
}
function Panel({ title, subtitle, children, className = '' }) {
  return <section className={`panel ${className}`}><div className="panel-heading"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div><span className="panel-more">•••</span></div>{children}</section>
}
function StateMessage({ state }) {
  if (state.loading) return <div className="notice">Loading surveillance data…</div>
  if (state.error) return <div className="notice" role="alert">Unable to load data: {state.error}. Confirm FastAPI is running on port 8000.</div>
  return null
}
function RiskBadge({ value }) { return <span className="risk-badge">{text(value)}</span> }

// Presentation-only labels: no changes to transaction classification.
function DataBadge({ value, kind }) {
  const label = text(value)
  const key = String(value ?? '').trim().toUpperCase()
  const tone = kind === 'status'
    ? ({ REPORTED: 'success', PENDING: 'warning', REJECTED: 'danger' }[key] || 'neutral')
    : ({ 'RULE + ML': 'danger', 'RULE ONLY': 'warning', 'ML ONLY': 'info', 'NOT FLAGGED': 'neutral' }[key] || 'neutral')
  return <span className={`data-badge data-badge--${tone}`}>{label}</span>
}

function Pager({ total, offset, limit, setOffset }) {
  return <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 0',gap:12}}><span>Showing {total ? offset + 1 : 0}–{Math.min(offset + limit, total)} of {fmt(total)}</span><div style={{display:'flex',gap:8}}><button className="text-button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>← Previous</button><button className="text-button" disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)}>Next →</button></div></div>
}
function downloadCsv(items, filename) {
  if (!items.length) return
  const keys = [...new Set(items.flatMap(Object.keys))]
  const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`
  const csv = [keys.join(','), ...items.map(row => keys.map(k => escape(row[k])).join(','))].join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url)
}
function Overview({ overview, setPage }) {
  const distribution = useApi('/api/anomaly-distribution')
  const queue = useApi('/api/investigations?limit=5')
  const assets = Object.entries(overview.asset_counts || {}).map(([name, value]) => ({ name, value }))
  const sources = ['Rule Only','Rule + ML','ML Only'].map(name => ({ name, value: overview.detection_sources?.[name] || 0, color: colors[name] }))
  const scores = distribution.data?.items || []
  return <>
    <div className="section-top"><h2>Key performance indicators</h2><span>Surveillance snapshot</span></div>
    <div className="stats-grid"><StatCard title="Transactions Monitored" value={fmt(overview.transactions)} description="Independent test transactions" icon={Database}/><StatCard title="Unique Alerts" value={fmt(overview.unique_hybrid_alerts)} description={`${((overview.unique_hybrid_alerts / (overview.transactions || 1)) * 100).toFixed(1)}% of monitored transactions`} icon={ShieldAlert} tone="red"/><StatCard title="Rule-Based Alerts" value={fmt(overview.rule_alerts)} description="Rule-only and combined detection" icon={SlidersHorizontal} tone="teal"/><StatCard title="AI Reports Available" value={fmt(overview.ai_reports_available)} description="Pre-generated investigation reports" icon={FileText} tone="purple"/></div>
    <div className="section-top"><h2>Rule-based monitoring metrics</h2><span>Same definitions as the Streamlit overview</span></div>
    <div className="stats-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))'}}>
      <StatCard title="Not Rule-Flagged" value={fmt(overview.transactions - overview.rule_alerts)} description="Transactions without a rule-based alert (may include ML-only alerts)" icon={ShieldCheck} tone="teal"/>
      <StatCard title="Rule Exception Rate" value={`${overview.transactions ? ((overview.rule_alerts / overview.transactions) * 100).toFixed(2) : '0.00'}%`} description="Rule-flagged transactions as a percentage of all transactions" icon={Activity} tone="blue"/>
    </div>
    <div className="section-top analytics-title"><h2>Monitoring analytics</h2><span>Visual risk intelligence</span></div>
    <div className="chart-grid">
      <Panel title="Transaction Volume by Asset Class" subtitle="Distribution across synthetic trade categories"><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={assets} margin={{top:15,right:10,left:-16,bottom:0}}><CartesianGrid stroke="#eaf0f8" vertical={false}/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#8292ab',fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#8292ab',fontSize:12}}/><Tooltip/><Bar dataKey="value" fill="#3579ed" radius={[5,5,0,0]} maxBarSize={62}/></BarChart></ResponsiveContainer></div></Panel>
      <Panel title="Alerts by Detection Source" subtitle={`${fmt(overview.unique_hybrid_alerts)} unique flagged transactions`}><div className="chart-box donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sources} dataKey="value" nameKey="name" innerRadius={74} outerRadius={105} paddingAngle={3} stroke="none">{sources.map(s => <Cell key={s.name} fill={s.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{fmt(overview.unique_hybrid_alerts)}</strong><span>TOTAL ALERTS</span></div></div><div className="legend">{sources.map(s => <span key={s.name}><i style={{background:s.color}}/>{s.name} <strong>{s.value}</strong></span>)}</div></Panel>
      <Panel title="Anomaly Score Distribution" subtitle="Calculated from actual synthetic test predictions"><div className="chart-box">{distribution.error ? <StateMessage state={distribution}/> : <ResponsiveContainer width="100%" height="100%"><AreaChart data={scores} margin={{top:15,right:8,left:-16,bottom:0}}><defs><linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3678ed" stopOpacity={0.25}/><stop offset="100%" stopColor="#3678ed" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid stroke="#eaf0f8" vertical={false}/><XAxis dataKey="score" axisLine={false} tickLine={false} tick={{fill:'#8292ab',fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#8292ab',fontSize:12}}/><Tooltip/><Area dataKey="count" stroke="#3678ed" strokeWidth={3} fill="url(#scoreFill)"/></AreaChart></ResponsiveContainer>}</div></Panel>
    </div>
    <div className="section-top"><h2>Priority investigation queue</h2><button className="text-button" onClick={() => setPage('Investigation Centre')}>View investigations →</button></div>
    <Panel title="Recently prioritised transactions" subtitle="Highest-risk records from the synthetic investigation dataset"><StateMessage state={queue}/>{queue.data && <div className="table-scroll"><table><thead><tr><th>TRADE ID</th><th>ASSET CLASS</th><th>DETECTION</th><th>RISK SCORE</th><th>PRIORITY</th></tr></thead><tbody>{queue.data.items.map(c => <tr key={c.record_id}><td className="trade-id">{c.trade_id}</td><td>{text(c.asset_class)}</td><td>{text(c.detection_source)}</td><td>{text(c.risk_score)}</td><td><RiskBadge value={c.risk_priority}/></td></tr>)}</tbody></table></div>}</Panel>
  </>
}
function TransactionExplorer() {
  const [search, setSearch] = useState(''), [asset, setAsset] = useState('ALL'), [status, setStatus] = useState('ALL'), [source, setSource] = useState('ALL'), [flagged, setFlagged] = useState(false), [offset, setOffset] = useState(0)
  const limit = 25
  const path = `/api/transactions?${encode({limit,offset,search,asset_class:asset,reporting_status:status,detection_source:source,flagged_only:flagged})}`
  const state = useApi(path)
  const update = (setter, value) => { setter(value); setOffset(0) }
  return <Panel title="Transaction Explorer" subtitle="Search and filter original synthetic trade records"><div style={{display:'flex',gap:12,flexWrap:'wrap',padding:'12px 0'}}><input className="search-input" placeholder="Search trade or record ID" value={search} onChange={e => update(setSearch,e.target.value)}/><select value={asset} onChange={e => update(setAsset,e.target.value)}><option value="ALL">All asset classes</option>{['FX','RATES','BONDS'].map(x => <option key={x}>{x}</option>)}</select><select value={status} onChange={e => update(setStatus,e.target.value)}><option value="ALL">All reporting statuses</option>{['REPORTED','PENDING','REJECTED'].map(x => <option key={x}>{x}</option>)}</select><select value={source} onChange={e => update(setSource,e.target.value)}><option value="ALL">All detection sources</option>{['Rule Only','Rule + ML','ML Only','Not Flagged'].map(x => <option key={x}>{x}</option>)}</select><label style={{display:'flex',alignItems:'center',gap:6}}><input type="checkbox" checked={flagged} onChange={e => update(setFlagged,e.target.checked)}/> Flagged only</label></div><StateMessage state={state}/>{state.data && <><div className="table-scroll"><table><thead><tr><th>RECORD</th><th>TRADE ID</th><th>ASSET</th><th>COUNTERPARTY</th><th>SIDE</th><th>NOTIONAL</th><th>CURRENCY</th><th>TRADE TIMESTAMP</th><th>STATUS</th><th>DETECTION</th><th>ANOMALY SCORE</th></tr></thead><tbody>{state.data.items.map(r => <tr key={r.record_id}><td>{r.record_id}</td><td className="trade-id">{r.trade_id}</td><td>{text(r.asset_class)}</td><td>{text(r.counterparty_id)}</td><td>{text(r.trade_side)}</td><td>{r.notional_amount == null ? "—" : fmt(r.notional_amount)}</td><td>{text(r.currency)}</td><td>{text(r.trade_timestamp)}</td><td><DataBadge value={r.reporting_status} kind="status"/></td><td><DataBadge value={r.detection_source} kind="detection"/></td><td>{r.anomaly_score == null ? "—" : Number(r.anomaly_score).toFixed(4)}</td></tr>)}</tbody></table></div><Pager {...state.data} setOffset={setOffset}/><button className="text-button" onClick={() => downloadCsv(state.data.items,'transactions_current_page.csv')}>Download current page CSV ↓</button></>}</Panel>
}
function HybridDetection({ overview }) {
  const sources = ['Rule Only','Rule + ML','ML Only'].map(name => ({ name, value: overview.detection_sources?.[name] || 0, color: colors[name] }))
  const [asset, setAsset] = useState('ALL')
  const [source, setSource] = useState('ALL')
  const [offset, setOffset] = useState(0)
  const limit = 25
  const alerts = useApi(`/api/transactions?${encode({ limit, offset, asset_class: asset, detection_source: source, flagged_only: true })}`)
  const [mlAssets, setMlAssets] = useState({ data: null, loading: true, error: '' })

  // Read existing model predictions in API-sized batches; do not recalculate ML predictions.
  useEffect(() => {
    const controller = new AbortController()
    async function loadMlCounts() {
      try {
        const counts = {}
        let offset = 0
        let total = Infinity
        while (offset < total) {
          const response = await request(`/api/transactions?${encode({ limit: 200, offset })}`, controller.signal)
          total = response.total
          for (const row of response.items) {
            if (truthy(row.ml_flag)) {
              const assetClass = text(row.asset_class)
              counts[assetClass] = (counts[assetClass] || 0) + 1
            }
          }
          if (!response.items.length) break
          offset += response.items.length
        }
        if (!controller.signal.aborted) {
          setMlAssets({ data: Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => ({ name, value })), loading: false, error: '' })
        }
      } catch (error) {
        if (error.name !== 'AbortError') setMlAssets({ data: null, loading: false, error: error.message })
      }
    }
    loadMlCounts()
    return () => controller.abort()
  }, [])

  const updateFilter = (setter, value) => { setter(value); setOffset(0) }
  return <>
    <div className="stats-grid">
      <StatCard title="Rule Alerts" value={fmt(overview.rule_alerts)} description="All rule-flagged transactions" icon={ShieldAlert} tone="red"/>
      <StatCard title="ML Alerts" value={fmt(overview.ml_alerts)} description="All Isolation Forest alerts" icon={BrainCircuit}/>
      <StatCard title="Hybrid Alerts" value={fmt(overview.unique_hybrid_alerts)} description="Unique transactions flagged" icon={Workflow} tone="teal"/>
      <StatCard title="Flagged by Both" value={fmt(overview.rule_and_ml)} description="Rule and machine learning" icon={ShieldCheck} tone="purple"/>
    </div>
    <div className="chart-grid two-col">
      <Panel title="ML Anomalies by Asset Class" subtitle="Existing ML-flagged transactions by asset class">
        <div className="chart-box">
          {mlAssets.loading ? <p>Loading ML anomaly counts…</p> : mlAssets.error ? <p role="alert">Unable to load ML anomaly counts: {mlAssets.error}</p> :
            <ResponsiveContainer width="100%" height="100%"><BarChart data={mlAssets.data || []} margin={{top:12,right:10,left:-12,bottom:0}}><CartesianGrid stroke="#24445d" vertical={false}/><XAxis dataKey="name" tick={{fill:'#a4bfd4',fontSize:12}}/><YAxis allowDecimals={false} tick={{fill:'#a4bfd4',fontSize:12}}/><Tooltip/><Bar dataKey="value" name="ML anomalies" fill="#3678ed" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>}
        </div>
      </Panel>
      <Panel title="Rule-Based vs ML Detection" subtitle="Distinct flagged transactions by detection method">
        <div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={sources} margin={{top:12,right:10,left:-12,bottom:0}}><CartesianGrid stroke="#24445d" vertical={false}/><XAxis dataKey="name" tick={{fill:'#a4bfd4',fontSize:11}}/><YAxis allowDecimals={false} tick={{fill:'#a4bfd4',fontSize:12}}/><Tooltip/><Bar dataKey="value" name="Alerts" radius={[5,5,0,0]}>{sources.map(s => <Cell key={s.name} fill={s.color}/>)}</Bar></BarChart></ResponsiveContainer></div>
      </Panel>
    </div>
    <div className="section-top"><h2>Hybrid Detection Alerts</h2><span>Existing flagged transactions · {fmt(overview.unique_hybrid_alerts)} total</span></div>
    <Panel title="Flagged transaction details" subtitle="Filter by asset class or detection source; data from the existing API">
      <div style={{display:'flex',gap:12,flexWrap:'wrap',padding:'12px 0'}}>
        <select aria-label="Filter alerts by asset class" value={asset} onChange={e => updateFilter(setAsset,e.target.value)}><option value="ALL">All asset classes</option>{['FX','RATES','BONDS'].map(x => <option key={x} value={x}>{x}</option>)}</select>
        <select aria-label="Filter alerts by detection source" value={source} onChange={e => updateFilter(setSource,e.target.value)}><option value="ALL">All detection sources</option>{['Rule Only','Rule + ML','ML Only'].map(x => <option key={x} value={x}>{x}</option>)}</select>
      </div>
      <StateMessage state={alerts}/>
      {alerts.data && <>
        <div className="table-scroll"><table><thead><tr><th>RECORD</th><th>TRADE ID</th><th>ASSET CLASS</th><th>NOTIONAL</th><th>CURRENCY</th><th>RULE FLAG</th><th>ML FLAG</th><th>DETECTION SOURCE</th><th>ANOMALY SCORE</th></tr></thead><tbody>{alerts.data.items.map(r => <tr key={r.record_id}><td>{r.record_id}</td><td className="trade-id">{text(r.trade_id)}</td><td>{text(r.asset_class)}</td><td>{r.notional_amount == null ? '—' : fmt(r.notional_amount)}</td><td>{text(r.currency)}</td><td>{truthy(r.rule_flag) ? 'Yes' : 'No'}</td><td>{truthy(r.ml_flag) ? 'Yes' : 'No'}</td><td><DataBadge value={r.detection_source} kind="detection"/></td><td>{r.anomaly_score == null ? '—' : Number(r.anomaly_score).toFixed(4)}</td></tr>)}</tbody></table></div>
        <Pager {...alerts.data} setOffset={setOffset}/>
        <button className="text-button" onClick={() => downloadCsv(alerts.data.items,'hybrid_alerts_current_page.csv')}>Download current page CSV ↓</button>
      </>}
    </Panel>
    <div className="section-top"><h2>Validation Failures</h2><span>Rule-based data-quality checks</span></div>
    <Panel title="Validation failures" subtitle="Counts from the original rule-based checks"><div className="table-scroll"><table><thead><tr><th>VALIDATION RULE</th><th>FLAGGED RECORDS</th></tr></thead><tbody>{Object.entries(overview.validation_failures || {}).map(([name,count]) => <tr key={name}><td>{name.replaceAll('_',' ')}</td><td>{fmt(count)}</td></tr>)}</tbody></table></div></Panel>
  </>
}

function InvestigationCentre({ overview }) {
  const [search,setSearch] = useState(''), [priority,setPriority] = useState('ALL'), [source,setSource] = useState('ALL'), [offset,setOffset] = useState(0), [selected,setSelected] = useState(null)
  const limit = 25
  const state = useApi(`/api/investigations?${encode({limit,offset,search,priority,detection_source:source})}`)
  const detail = useApi(selected === null ? '/api/health' : `/api/investigations/${selected}`)
  const update = (setter,value) => { setter(value); setOffset(0); setSelected(null) }
  return <><div className="stats-grid"><StatCard title="Investigation Records" value={fmt(overview.investigations)} description="Flagged test transactions" icon={Database}/>{['HIGH','MEDIUM','LOW'].map((level,i) => <StatCard key={level} title={`${level[0]}${level.slice(1).toLowerCase()} Priority`} value={fmt(overview.risk_priorities?.[level])} description="Investigation priority" icon={i===0 ? ShieldAlert : Activity} tone={i===0 ? 'red' : 'teal'}/>)}</div><Panel title="Investigation queue" subtitle="Search and inspect actual prioritised investigation records"><div style={{display:'flex',gap:12,flexWrap:'wrap',padding:'12px 0'}}><input className="search-input" placeholder="Search trade or record ID" value={search} onChange={e => update(setSearch,e.target.value)}/><select value={priority} onChange={e => update(setPriority,e.target.value)}><option value="ALL">All priorities</option>{['CRITICAL','HIGH','MEDIUM','LOW'].map(x => <option key={x}>{x}</option>)}</select><select value={source} onChange={e => update(setSource,e.target.value)}><option value="ALL">All detection sources</option>{['Rule Only','Rule + ML','ML Only'].map(x => <option key={x}>{x}</option>)}</select></div><StateMessage state={state}/>{state.data && <><div className="table-scroll"><table><thead><tr><th>TRADE ID</th><th>ASSET</th><th>DETECTION</th><th>RISK SCORE</th><th>PRIORITY</th><th>ACTION</th></tr></thead><tbody>{state.data.items.map(c => <tr key={c.record_id}><td className="trade-id">{c.trade_id}</td><td>{text(c.asset_class)}</td><td>{text(c.detection_source)}</td><td>{text(c.risk_score)}</td><td><RiskBadge value={c.risk_priority}/></td><td><button className="text-button" onClick={() => setSelected(c.record_id)}>View details →</button></td></tr>)}</tbody></table></div><Pager {...state.data} setOffset={setOffset}/><button className="text-button" onClick={() => downloadCsv(state.data.items,'investigations_current_page.csv')}>Download current page CSV ↓</button></>}</Panel>{selected !== null && <CaseDrawer title={`Investigation · Record ${selected}`} subtitle="Risk evidence and investigation intelligence" onClose={() => setSelected(null)}><StateMessage state={detail}/>{detail.data && <>
  <div className="case-summary"><div><span>TRADE ID</span><strong>{text(detail.data.trade_id)}</strong></div><div><span>RISK SCORE</span><strong>{text(detail.data.risk_score)}</strong></div><div><span>PRIORITY</span><RiskBadge value={detail.data.risk_priority}/></div><div><span>DETECTION</span><strong>{text(detail.data.detection_source)}</strong></div></div>
  <section className="case-section"><h3>Investigation summary</h3><p>{text(detail.data.investigation_summary)}</p></section>
  <section className="case-section"><h3>Risk factors</h3><div className="risk-factors">{String(detail.data.risk_factors || '').split(/[,;]+/).map(x => x.trim()).filter(Boolean).map(x => <span key={x}>{x.replaceAll('_',' ')}</span>)}</div></section>
  <section className="case-section"><h3>AI investigation report</h3>{detail.data.ai_report ? <ReportContent content={detail.data.ai_report}/> : <p>No pre-generated AI report is available for this record.</p>}</section>
  <div className="case-disclaimer">Portfolio demonstration using synthetic data. Alerts and AI-generated reports require human verification and do not establish fraud.</div>
</>}</CaseDrawer>}</>
}
// Render the simple Markdown syntax used by generated investigation reports.
// React escapes all report text, so no raw HTML is injected.
function InlineReportText({ value }) {
  return String(value ?? '').split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    return <span key={index}>{part}</span>
  })
}

function ReportContent({ content }) {
  const lines = String(content || '').split(/\r?\n/)
  return <div className="report-content">{lines.map((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return <div className="report-spacer" key={i}/>
    const heading = trimmed.match(/^#{1,6}\s+(.+)$/)
    if (heading) return <h3 key={i}><InlineReportText value={heading[1]}/></h3>
    const bullet = trimmed.match(/^[-*]\s+(.+)$/)
    if (bullet) return <div className="report-bullet" key={i}><span className="report-bullet-mark" aria-hidden="true">•</span><span><InlineReportText value={bullet[1]}/></span></div>
    const numbered = trimmed.match(/^(\d+)\.\s+(.+)$/)
    if (numbered) return <p key={i}><InlineReportText value={trimmed}/></p>
    return <p key={i}><InlineReportText value={trimmed}/></p>
  })}</div>
}

function CaseDrawer({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const onKeyDown = event => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previous }
  }, [onClose])
  return <div className="case-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <aside className="case-drawer" role="dialog" aria-modal="true" aria-label={title}>
      <div className="case-drawer-header"><div><span className="case-kicker">FINANCIAL SURVEILLANCE AI</span><h2>{title}</h2><p>{subtitle}</p></div><button className="case-close" onClick={onClose} aria-label="Close details"><X size={21}/></button></div>
      <div className="case-drawer-body">{children}</div>
    </aside>
  </div>
}

function AIReports() {
  const state = useApi('/api/reports')
  const [selected,setSelected] = useState(null)
  const items = (state.data?.items || []).filter(r => r.ai_status === 'SUCCESS')
  const current = items.find(r => String(r.record_id) === String(selected))
  return <><Panel title="AI Investigation Reports" subtitle="Pre-generated reports from the independent synthetic test dataset"><StateMessage state={state}/>{state.data && <><div className="table-scroll"><table><thead><tr><th>RECORD</th><th>TRADE ID</th><th>RISK SCORE</th><th>PRIORITY</th><th>REPORT STATUS</th><th>ACTION</th></tr></thead><tbody>{items.map(r => <tr key={r.record_id}><td>{r.record_id}</td><td className="trade-id">{r.trade_id}</td><td>{text(r.risk_score)}</td><td><RiskBadge value={r.risk_priority}/></td><td>{r.ai_status}</td><td><button className="text-button" onClick={() => setSelected(r.record_id)}>Read report →</button></td></tr>)}</tbody></table></div><p style={{fontSize:12}}>Showing {items.length} successfully generated reports. Reports are drafts and require human review.</p></>}</Panel>{current && <CaseDrawer title={`AI report · ${current.trade_id}`} subtitle="Evidence-grounded draft · human review required" onClose={() => setSelected(null)}><div className="case-summary"><div><span>RECORD ID</span><strong>{current.record_id}</strong></div><div><span>RISK SCORE</span><strong>{text(current.risk_score)}</strong></div><div><span>PRIORITY</span><RiskBadge value={current.risk_priority}/></div></div><section className="case-section"><ReportContent content={current.ai_report}/></section><button className="case-download" onClick={() => {const url=URL.createObjectURL(new Blob([current.ai_report || ''],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download=`investigation_${current.record_id}.txt`;a.click();URL.revokeObjectURL(url)}}>Download report ↓</button><div className="case-disclaimer">AI-generated draft based on synthetic test data. Verify all findings before use.</div></CaseDrawer>}</>
}
function App() {
  const [page,setPage] = useState('Overview')
  const overview = useApi('/api/overview')
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-icon"><ShieldCheck size={25}/></div><div><strong>Financial<br/>Surveillance AI</strong><small>INTELLIGENT RISK MONITORING</small></div></div><div className="sidebar-label">WORKSPACE</div><nav className="nav-list">{navigation.map(({name,icon:Icon}) => <button key={name} className={`nav-item ${page===name?'active':''}`} onClick={() => setPage(name)}><Icon size={19}/><span>{name}</span>{page===name&&<span className="nav-active-indicator"/>}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-rule"/><div className="demo-tag"><span className="demo-dot"/> LIVE DEMONSTRATION</div><p>Built using synthetic financial transactions. No customer data.</p><div className="sidebar-help"><CircleHelp size={17}/> About this demo</div></div></aside><main className="main-area"><header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div><div className="top-actions"><span className="environment"><span/> DEMO ENVIRONMENT</span><button className="icon-button" aria-label="Notifications" title="Demo environment — notifications not enabled"><Bell size={18}/></button><div className="avatar">FA</div></div></header><div className="content"><div className="workspace-tabs" role="navigation" aria-label="Dashboard sections">{navigation.map(({name}) => <button key={name} className={`workspace-tab ${page===name?'selected':''}`} onClick={() => setPage(name)}>{name === 'Overview' ? 'Dashboard' : name === 'Transaction Explorer' ? 'Monitoring' : name === 'Hybrid Detection' ? 'Detection' : name === 'Investigation Centre' ? 'Investigations' : 'AI Reports'}</button>)}</div><div className="page-heading"><div><div className="eyebrow"><Activity size={15}/> FINANCIAL SURVEILLANCE & RISK ANALYTICS</div><h1>{page==='Overview'?'Surveillance Overview':page}</h1><p>{page==='Overview'?'Monitor transaction activity, identify anomalies and prioritize financial investigations.':'Explore the surveillance workflow and investigation intelligence.'}</p></div><div className="heading-side"><span className="asof">SYNTHETIC TEST DATA</span><div className="date-chip">Independent test dataset <ChevronDown size={15}/></div></div></div><div className="notice"><ShieldCheck size={18}/><span><strong>Portfolio demonstration.</strong> All records are synthetic. Detection alerts indicate items for analyst review, not confirmed fraud or regulatory breaches.</span></div><StateMessage state={overview}/>{overview.data && (page==='Overview'?<Overview overview={overview.data} setPage={setPage}/>:page==='Transaction Explorer'?<TransactionExplorer/>:page==='Hybrid Detection'?<HybridDetection overview={overview.data}/>:page==='Investigation Centre'?<InvestigationCentre overview={overview.data}/>:<AIReports/>)}<footer>FINANCIAL SURVEILLANCE AI <span>•</span> PORTFOLIO DEMONSTRATION <span>•</span> SYNTHETIC DATA ONLY</footer></div></main></div>
}
export default App
