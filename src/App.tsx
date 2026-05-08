import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Download,
  FileText,
  Lock,
  Mail,
  PackageCheck,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Truck,
} from 'lucide-react'
import './App.css'

type LeadStage = 'New' | 'Qualified' | 'Sample Sent' | 'Quoted' | 'Won' | 'Nurture'
type LeadPriority = 'Hot' | 'Warm' | 'Cold'
type SampleStatus = 'Not Requested' | 'Requested' | 'Packed' | 'Sent' | 'Delivered'
type QuoteStatus = 'Not Started' | 'Needs Pricing' | 'Drafting' | 'Sent' | 'Approved'
type TaskType = 'Call' | 'Email' | 'Send Samples' | 'Build Quote' | 'Check In'
type ActivityType = 'note' | 'workflow' | 'system'

type ActivityEntry = {
  id: string
  type: ActivityType
  label: string
  detail: string
  date: string
}
type View = 'crm' | 'capture'
type ProfileTab = 'profile' | 'misys'

type MisysProfile = {
  customerId: string
  accountingCustomerId: string
  customerType: string
  taxStatus: string
  freightTerms: string
  defaultWarehouse: string
  shipToName: string
  shippingAddress: string
  billingAddress: string
  productionContact: string
  targetSku: string
  customerPartNumber: string
  itemDescription: string
  productSpec: string
}

type Lead = {
  id: string
  company: string
  contact: string
  title: string
  email: string
  phone: string
  city: string
  showName: string
  packagingNeeds: string[]
  annualVolume: string
  timeline: string
  notes: string
  stage: LeadStage
  priority: LeadPriority
  owner: string
  nextStep: string
  sampleStatus: SampleStatus
  quoteStatus: QuoteStatus
  taskType: TaskType
  taskDue: string
  capturedAt: string
  activityLog: ActivityEntry[]
  misysProfile: MisysProfile
}

type Session = {
  access_token: string
  refresh_token?: string
}

const logoUrl =
  'https://static.wixstatic.com/media/067fd2_442e8edbc68c491ea121fea22fc5f107~mv2.png/v1/fill/w_918,h_218,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/067fd2_442e8edbc68c491ea121fea22fc5f107~mv2.png'
const heroImage = '/nexgen-hero-lifestyle-20260507.png'
const storageKey = 'nexgen-tradeshow-leads'
const sessionKey = 'nexgen-supabase-session'
const supabaseUrl = 'https://fbhernygpoapgilshsdq.supabase.co'
const anonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaGVybnlncG9hcGdpbHNoc2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NTI4MzAsImV4cCI6MjA5MzUyODgzMH0.8El4zrk3UxrLa_ARTSitVBLCw5dgf-MNBAsJJNBhPZQ'

const packagingNeeds = [
  'Custom printed cups',
  'Food containers',
  'Pizza packaging',
  'Sustainable packaging',
  'Retail packaging',
  'Samples',
]

const volumeOptions = ['Under 100k units', '100k-250k units', '250k-500k units', '500k-1M units', '1M+ units']
const timelineOptions = ['ASAP', '30-60 days', 'This quarter', '6+ months', 'Researching']
const pipelineSteps = ['Intake', 'Contacted', 'Samples', 'Quote', 'Setup', 'Nurture']

const emptyMisys: MisysProfile = {
  customerId: '',
  accountingCustomerId: '',
  customerType: 'Potential',
  taxStatus: 'Unknown',
  freightTerms: '',
  defaultWarehouse: '',
  shipToName: '',
  shippingAddress: '',
  billingAddress: '',
  productionContact: '',
  targetSku: '',
  customerPartNumber: '',
  itemDescription: '',
  productSpec: '',
}

const emptyLead: Lead = {
  id: '',
  company: '',
  contact: '',
  title: '',
  email: '',
  phone: '',
  city: '',
  showName: 'Trade Show',
  packagingNeeds: [],
  annualVolume: '',
  timeline: '',
  notes: '',
  stage: 'New',
  priority: 'Warm',
  owner: 'Bradley',
  nextStep: 'Review booth notes and send first follow-up.',
  sampleStatus: 'Not Requested',
  quoteStatus: 'Not Started',
  taskType: 'Email',
  taskDue: today(),
  capturedAt: new Date().toISOString(),
  activityLog: [],
  misysProfile: emptyMisys,
}

const seedLeads: Lead[] = [
  normalizeLead({
    id: crypto.randomUUID(),
    company: 'Summit Stadium Group',
    contact: 'Jordan Reyes',
    title: 'Director of Concessions',
    email: 'jordan@summitstadium.example',
    phone: '(312) 555-0184',
    city: 'Chicago, IL',
    showName: 'National Restaurant Association Show',
    packagingNeeds: ['Custom printed cups', 'Food containers'],
    annualVolume: '1M+ units',
    timeline: '30-60 days',
    notes: 'Needs clear cups and compostable food trays for three venues. Asked for samples and freight estimate.',
    stage: 'Sample Sent',
    priority: 'Hot',
    nextStep: 'Confirm sample delivery and ask for feedback on fit, material, and print needs.',
    sampleStatus: 'Sent',
    quoteStatus: 'Needs Pricing',
    taskType: 'Check In',
    taskDue: addDays(3),
    capturedAt: new Date().toISOString(),
  }),
  normalizeLead({
    id: crypto.randomUUID(),
    company: 'Bella Hearth Pizza',
    contact: 'Mina Patel',
    title: 'Founder',
    email: 'mina@bellahearth.example',
    phone: '(847) 555-0149',
    city: 'Naperville, IL',
    showName: 'Pizza Expo',
    packagingNeeds: ['Pizza packaging', 'Sustainable packaging'],
    annualVolume: '100k-250k units',
    timeline: 'This quarter',
    notes: 'Interested in branded boxes, liners, and grease resistance. Has three new stores opening.',
    stage: 'Qualified',
    priority: 'Warm',
    quoteStatus: 'Drafting',
    taskType: 'Build Quote',
    taskDue: addDays(2),
    capturedAt: new Date().toISOString(),
  }),
]

function App() {
  const params = new URLSearchParams(window.location.search)
  const initialView: View = params.get('capture') === 'true' ? 'capture' : 'crm'
  const [view, setView] = useState<View>(initialView)

  return view === 'capture' ? <CaptureApp onEmployee={() => setView('crm')} /> : <CrmApp onCapture={() => setView('capture')} />
}

function CrmApp({ onCapture }: { onCapture: () => void }) {
  const [session, setSession] = useState<Session | null>(() => readSession())
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [syncStatus, setSyncStatus] = useState(session ? 'Connected' : 'Login required')
  const [leads, setLeads] = useState<Lead[]>(() => loadLocalLeads())
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [eventFilter, setEventFilter] = useState('Event')
  const [sortDir, setSortDir] = useState<'az' | 'za'>('az')
  const [tab, setTab] = useState<ProfileTab>('profile')
  const [copied, setCopied] = useState('')
  const [emailDraft, setEmailDraft] = useState({ subject: '', body: '' })
  const [toast, setToast] = useState('')

  const persistSession = useCallback((nextSession: Session) => {
    setSession(nextSession)
    localStorage.setItem(sessionKey, JSON.stringify(nextSession))
  }, [])

  const refreshCurrentSession = useCallback(async (currentSession: Session) => {
    if (!currentSession.refresh_token) throw new Error('Missing refresh token.')
    const nextSession = await supabaseRefreshSession(currentSession.refresh_token)
    persistSession(nextSession)
    return nextSession
  }, [persistSession])

  const fetchLeadsWithSession = useCallback(
    async (currentSession: Session) => {
      try {
        return { remote: await fetchLeads(currentSession.access_token), activeSession: currentSession, refreshed: false }
      } catch (error) {
        if (!isAuthError(error)) throw error
        if (!currentSession.refresh_token) throw error
        const activeSession = await supabaseRefreshSession(currentSession.refresh_token)
        return { remote: await fetchLeads(activeSession.access_token), activeSession, refreshed: true }
      }
    },
    [],
  )

  useEffect(() => {
    if (!session) return
    let cancelled = false
    fetchLeadsWithSession(session)
      .then(({ remote, activeSession, refreshed }) => {
        if (cancelled) return
        if (refreshed) persistSession(activeSession)
        setLeads(remote)
        setSelectedId(remote[0]?.id ?? '')
        saveLocalLeads(remote)
        setSyncStatus('Connected')
      })
      .catch((error) => {
        if (cancelled) return
        if (isAuthError(error)) {
          localStorage.removeItem(sessionKey)
          setSession(null)
          setSyncStatus('Login required')
          return
        }
        setSyncStatus('Offline - showing local backup')
      })
    return () => {
      cancelled = true
    }
  }, [fetchLeadsWithSession, persistSession, session])

  const stats = useMemo(() => {
    return {
      total: leads.length,
      hot: leads.filter((lead) => lead.priority === 'Hot').length,
      open: leads.filter((lead) => !['Won', 'Nurture'].includes(lead.stage)).length,
      samples: leads.filter((lead) => ['Requested', 'Packed', 'Sent'].includes(lead.sampleStatus)).length,
    }
  }, [leads])

  const events = useMemo(() => {
    return ['Event', ...Array.from(new Set(leads.map((lead) => lead.showName).filter(Boolean))).sort()]
  }, [leads])

  const filteredLeads = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...leads]
      .filter((lead) => eventFilter === 'Event' || lead.showName === eventFilter)
      .filter((lead) => {
        if (!q) return true
        return [lead.company, lead.contact, lead.email, lead.showName].join(' ').toLowerCase().includes(q)
      })
      .sort((a, b) => (sortDir === 'az' ? a.company.localeCompare(b.company) : b.company.localeCompare(a.company)))
  }, [eventFilter, leads, query, sortDir])

  const selectedLead = leads.find((lead) => lead.id === selectedId) ?? leads[0]
  const syncIsWarning = syncStatus.toLowerCase().includes('offline') || syncStatus.toLowerCase().includes('failed')
  const syncIsBusy = syncStatus.toLowerCase().includes('checking') || syncStatus.toLowerCase().includes('refreshing')
  const syncClassName = `sync-strip${syncIsWarning ? ' warning' : syncIsBusy ? ' busy' : ''}`

  async function signIn(event: React.FormEvent) {
    event.preventDefault()
    setAuthError('')
    setSyncStatus('Checking connection...')
    try {
      const nextSession = await supabaseSignIn(authForm.email, authForm.password)
      persistSession(nextSession)
      setAuthForm({ email: '', password: '' })
      setSyncStatus('Checking connection...')
    } catch {
      setAuthError('Unable to sign in. Check the email and password for your Supabase user.')
      setSyncStatus('Login required')
    }
  }

  async function signOut() {
    const token = session?.access_token
    localStorage.removeItem(sessionKey)
    setSession(null)
    setSyncStatus('Login required')
    if (token) await supabaseSignOut(token)
  }

  async function refreshLeads() {
    if (!session) return
    setSyncStatus('Refreshing...')
    try {
      const { remote, activeSession, refreshed } = await fetchLeadsWithSession(session)
      if (refreshed) persistSession(activeSession)
      setLeads(remote)
      saveLocalLeads(remote)
      setSelectedId((current) => (remote.some((lead) => lead.id === current) ? current : remote[0]?.id ?? ''))
      setSyncStatus('Connected')
    } catch {
      setSyncStatus('Offline - showing local backup')
    }
  }

  async function updateLead(id: string, patch: Partial<Lead>) {
    const nextLeads = leads.map((lead) => (lead.id === id ? normalizeLead({ ...lead, ...patch }) : lead))
    setLeads(nextLeads)
    saveLocalLeads(nextLeads)

    if (session) {
      const updated = nextLeads.find((lead) => lead.id === id)
      if (!updated) return
      try {
        let saved: Lead
        try {
          saved = await patchLead(updated, session.access_token)
        } catch (error) {
          if (!isAuthError(error)) throw error
          const activeSession = await refreshCurrentSession(session)
          saved = await patchLead(updated, activeSession.access_token)
        }
        const synced = nextLeads.map((lead) => (lead.id === id ? saved : lead))
        setLeads(synced)
        saveLocalLeads(synced)
        setSyncStatus('Connected')
      } catch {
        setSyncStatus('Offline - changes saved locally')
      }
    }
  }

  function updateMisys(patch: Partial<MisysProfile>) {
    if (!selectedLead) return
    updateLead(selectedLead.id, { misysProfile: { ...selectedLead.misysProfile, ...patch } })
  }

  function applyAction(action: WorkflowAction) {
    if (!selectedLead) return
    const patch = workflowPatch(action)
    updateLead(selectedLead.id, patch)
    showToast(`${actionLabel(action)} saved`)
  }

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  function buildEmail(template: string) {
    if (!selectedLead) return
    setEmailDraft(makeEmailDraft(selectedLead, template))
    setCopied('')
  }

  async function copyDraft() {
    if (!emailDraft.subject && !emailDraft.body) return
    await navigator.clipboard.writeText(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`)
    setCopied('Copied')
  }

  function downloadMisysCsv() {
    downloadCsv('nexgen-misys-customer-intake.csv', buildMisysRows(leads))
  }

  if (!session) {
    return (
      <main className="auth-screen" id="top">
        <section className="auth-card">
          <img className="hero-logo" src={logoUrl} alt="NexGen Packaging" />
          <span className="auth-icon">
            <Lock size={22} />
          </span>
          <p className="eyebrow">Admin Access</p>
          <h1>Sign in to manage trade show leads.</h1>
          <p>The booth capture form remains public for QR scans. The CRM dashboard uses Supabase Auth before reading or updating lead data.</p>
          <form onSubmit={signIn}>
            <label>
              Email
              <input
                required
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                placeholder="you@nexgenpackaging.com"
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                placeholder="Supabase user password"
              />
            </label>
            {authError && <strong className="auth-error">{authError}</strong>}
            <button className="primary-action" type="submit">
              <Lock size={18} /> Sign In
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <main className="crm-screen" id="top">
        <header className="topbar">
          <div className="topbar-copy">
            <img className="hero-logo" src={logoUrl} alt="NexGen Packaging" />
            <p className="eyebrow">Pipeline Command Center</p>
            <h1>Trade show leads, ready for the next move.</h1>
            <p>Capture booth conversations, qualify packaging needs, and move every opportunity into a clear next step.</p>
          </div>
          <div className="hero-photo" aria-hidden="true">
            <img src={heroImage} alt="" />
          </div>
          <div className="topbar-actions">
            <button type="button" onClick={onCapture}>
              <Plus size={18} /> Add Lead
            </button>
            <button type="button" onClick={refreshLeads}>
              <RefreshCw size={18} /> Refresh
            </button>
            <button type="button" onClick={downloadMisysCsv}>
              <Download size={18} /> MISYS
            </button>
            <button type="button" className="sign-out-inline" onClick={signOut}>
              Sign Out
            </button>
          </div>
        </header>

        <section className="stats-grid" aria-label="CRM metrics">
          <StatCard icon={<ClipboardList />} label="Total leads" value={stats.total} />
          <StatCard icon={<CheckCircle2 />} label="Hot leads" value={stats.hot} />
          <StatCard icon={<CalendarDays />} label="Open pipeline" value={stats.open} />
          <StatCard icon={<PackageCheck />} label="Sample follow-ups" value={stats.samples} />
        </section>

        <section className={syncClassName} aria-live="polite">
          <strong>Database</strong>
          <span>{syncStatus}</span>
        </section>

        <section className="workspace">
          <aside className="lead-list-panel">
            <div className="filters">
              <label className="search-field">
                <Search size={17} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads" />
              </label>
              <label>
                <select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}>
                  {events.map((event) => (
                    <option key={event}>{event}</option>
                  ))}
                </select>
              </label>
              <button className="sort-toggle" type="button" onClick={() => setSortDir((current) => (current === 'az' ? 'za' : 'az'))}>
                {sortDir === 'az' ? 'A-Z' : 'Z-A'}
              </button>
            </div>
            <div className="lead-list">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <button
                    className={lead.id === selectedLead?.id ? 'lead-row active' : 'lead-row'}
                    key={lead.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(lead.id)
                      setTab('profile')
                    }}
                  >
                    <span className={`priority-dot ${lead.priority.toLowerCase()}`} />
                    <span>
                      <strong>{lead.company}</strong>
                      <small>
                        {lead.contact} · {lead.showName}
                      </small>
                    </span>
                  </button>
                ))
              ) : (
                <div className="empty-state">
                  <strong>No leads match this view.</strong>
                  <span>Clear search or choose another event.</span>
                </div>
              )}
            </div>
          </aside>

          {selectedLead && (
            <article className="detail-panel">
              <div className="detail-heading">
                <div>
                  <p className="eyebrow">{selectedLead.priority} Lead</p>
                  <h2>{selectedLead.company}</h2>
                  <span>
                    {selectedLead.contact} · {selectedLead.title || 'Contact'}
                  </span>
                </div>
                <div className="profile-status-card">
                  <small>Current Stage</small>
                  <strong>{statusLabel(selectedLead.stage)}</strong>
                </div>
              </div>

              <div className="detail-tabs" aria-label="Customer profile pages">
                <button className={tab === 'profile' ? 'active' : ''} type="button" onClick={() => setTab('profile')}>
                  Customer Profile
                </button>
                <button className={tab === 'misys' ? 'active' : ''} type="button" onClick={() => setTab('misys')}>
                  MISYS Details
                </button>
              </div>

              {tab === 'profile' ? (
                <ProfilePanel
                  lead={selectedLead}
                  onUpdate={(patch) => updateLead(selectedLead.id, patch)}
                  onAction={applyAction}
                  onEmailTemplate={buildEmail}
                  emailDraft={emailDraft}
                  onDraftChange={setEmailDraft}
                  onCopyDraft={copyDraft}
                  copied={copied}
                />
              ) : (
                <MisysPanel lead={selectedLead} onChange={updateMisys} onDownload={downloadMisysCsv} />
              )}
            </article>
          )}
        </section>
      </main>
      <div className={toast ? 'client-toast show' : 'client-toast'}>{toast}</div>
    </div>
  )
}

function ProfilePanel({
  lead,
  onUpdate,
  onAction,
  onEmailTemplate,
  emailDraft,
  onDraftChange,
  onCopyDraft,
  copied,
}: {
  lead: Lead
  onUpdate: (patch: Partial<Lead>) => void
  onAction: (action: WorkflowAction) => void
  onEmailTemplate: (template: string) => void
  emailDraft: { subject: string; body: string }
  onDraftChange: (draft: { subject: string; body: string }) => void
  onCopyDraft: () => void
  copied: string
}) {
  const phase = phaseForLead(lead)
  const primaryActions = primaryActionsForLead(lead)
  const secondaryActions = allActions.filter((action) => !primaryActions.includes(action))

  return (
    <>
      <section className="customer-flow-panel" aria-label="Customer flow management">
        <div className="flow-summary">
          <div>
            <p className="eyebrow">Customer Status</p>
            <h3>{statusLabel(lead.stage)}</h3>
            <p>{summaryForLead(lead)}</p>
          </div>
        </div>

        <div className="pipeline-summary-bar">
          <SummaryItem label="Customer Status" value={statusLabel(lead.stage)} />
          <SummaryItem label="Phase" value={phase} />
          <SummaryItem label="Next Touch" value={lead.taskType} />
          <SummaryItem label="Due" value={formatDate(lead.taskDue)} className={dueClass(lead.taskDue)} />
        </div>

        <div className="pipeline-tracker" aria-label={`Current phase ${phase}`}>
          {pipelineSteps.map((step, index) => {
            const active = pipelineSteps.indexOf(phase)
            return (
              <span className={index === active ? 'pipeline-step active' : index < active ? 'pipeline-step complete' : 'pipeline-step'} key={step}>
                {step}
              </span>
            )
          })}
        </div>

        <div className="flow-next-step">
          <strong>Recommended Next Action</strong>
          <p>{recommendedAction(lead)}</p>
          <button className="recommended-action-button" type="button" onClick={() => document.querySelector('.email-builder')?.scrollIntoView({ behavior: 'smooth' })}>
            Create Follow-Up
          </button>
        </div>

        <div className="action-grid" aria-label="Customer interaction actions">
          {primaryActions.map((action) => (
            <ActionButton action={action} key={action} onClick={() => onAction(action)} />
          ))}
          <details className="more-actions">
            <summary>More Actions <ChevronDown size={16} /></summary>
            <div className="more-actions-content">
              {secondaryActions.map((action) => (
                <ActionButton action={action} key={action} onClick={() => onAction(action)} />
              ))}
            </div>
          </details>
        </div>
      </section>

      <ClientDetailsForm lead={lead} onUpdate={onUpdate} />

      <NotesNeedsSection lead={lead} onUpdate={onUpdate} />

      <ActivityTimeline lead={lead} />

      <section className="detail-section email-builder">
        <div className="email-heading">
          <div>
            <h3>Email Templates</h3>
            <p>Generate a draft from the selected lead details, then edit before sending from your email client.</p>
          </div>
          <button type="button" onClick={onCopyDraft}>
            <FileText size={17} /> {copied || 'Copy Draft'}
          </button>
        </div>
        <div className="template-grid">
          {['First follow-up', 'Samples', 'Quote next step', 'Nurture check-in'].map((template) => (
            <button type="button" onClick={() => onEmailTemplate(template)} key={template}>
              <Mail size={17} /> {template}
            </button>
          ))}
        </div>
        <label>
          Subject
          <input value={emailDraft.subject} onChange={(event) => onDraftChange({ ...emailDraft, subject: event.target.value })} />
        </label>
        <label>
          Body
          <textarea value={emailDraft.body} onChange={(event) => onDraftChange({ ...emailDraft, body: event.target.value })} />
        </label>
      </section>
    </>
  )
}

function NotesNeedsSection({ lead, onUpdate }: { lead: Lead; onUpdate: (patch: Partial<Lead>) => void }) {
  const [noteDraft, setNoteDraft] = useState('')

  function toggleNeed(need: string) {
    const nextNeeds = lead.packagingNeeds.includes(need) ? lead.packagingNeeds.filter((item) => item !== need) : [...lead.packagingNeeds, need]
    onUpdate({ packagingNeeds: nextNeeds })
  }

  function saveNote() {
    const detail = noteDraft.trim()
    if (!detail) return
    const existingLog =
      lead.activityLog.length > 0 || !lead.notes.trim() ? lead.activityLog : [makeActivityEntry('Original note', lead.notes, lead.capturedAt, 'note')]
    onUpdate({
      notes: appendNote(lead.notes, detail),
      activityLog: [makeActivityEntry('Note added', detail), ...existingLog],
    })
    setNoteDraft('')
  }

  return (
    <section className="notes-needs-section detail-section">
      <div className="section-heading">
        <div>
          <h3>Notes & Needs</h3>
          <p>Select packaging interests and add timestamped notes to the customer timeline.</p>
        </div>
        <span>Timeline notes</span>
      </div>

      <div className="editable-need-grid" aria-label="Packaging interests">
        {packagingNeeds.map((need) => (
          <button className={lead.packagingNeeds.includes(need) ? 'need-chip active' : 'need-chip'} key={need} type="button" onClick={() => toggleNeed(need)}>
            <CheckCircle2 size={16} /> {need}
          </button>
        ))}
      </div>

      <div className="note-composer">
        <label>
          Add note
          <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Add supplier details, product dimensions, sample requests, pricing notes, or follow-up context..." />
        </label>
        <button type="button" onClick={saveNote} disabled={!noteDraft.trim()}>
          <Plus size={17} /> Save Note
        </button>
      </div>
    </section>
  )
}

function ClientDetailsForm({ lead, onUpdate }: { lead: Lead; onUpdate: (patch: Partial<Lead>) => void }) {
  return (
    <section className="client-edit-section detail-section">
      <div className="client-edit-heading">
        <div>
          <h3>Client Details</h3>
          <p>Update contact and trade show information as the relationship develops.</p>
        </div>
        <span>Changes save automatically</span>
      </div>
      <form className="client-edit-form" key={lead.id} onSubmit={(event) => event.preventDefault()}>
        <label>
          Company
          <input defaultValue={lead.company} onBlur={(event) => onUpdate({ company: event.target.value })} />
        </label>
        <label>
          Contact
          <input defaultValue={lead.contact} onBlur={(event) => onUpdate({ contact: event.target.value })} />
        </label>
        <label>
          Title
          <input defaultValue={lead.title} onBlur={(event) => onUpdate({ title: event.target.value })} />
        </label>
        <label>
          Email
          <input type="email" defaultValue={lead.email} onBlur={(event) => onUpdate({ email: event.target.value })} />
        </label>
        <label>
          Phone
          <input defaultValue={lead.phone} onBlur={(event) => onUpdate({ phone: event.target.value })} />
        </label>
        <label>
          City / State
          <input defaultValue={lead.city} onBlur={(event) => onUpdate({ city: event.target.value })} />
        </label>
        <label>
          Event
          <input defaultValue={lead.showName} onBlur={(event) => onUpdate({ showName: event.target.value })} />
        </label>
        <label>
          Annual volume
          <select defaultValue={lead.annualVolume} onChange={(event) => onUpdate({ annualVolume: event.target.value })}>
            {volumeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Buying timeline
          <select defaultValue={lead.timeline} onChange={(event) => onUpdate({ timeline: event.target.value, taskDue: dueForLead(lead.capturedAt, event.target.value) })}>
            {timelineOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Captured
          <input readOnly value={formatDate(lead.capturedAt)} />
        </label>
      </form>
    </section>
  )
}

function MisysPanel({ lead, onChange, onDownload }: { lead: Lead; onChange: (patch: Partial<MisysProfile>) => void; onDownload: () => void }) {
  const profile = lead.misysProfile

  return (
    <section className="detail-section misys-section">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">MISYS Intake</p>
          <h3>Customer and manufacturing setup</h3>
        </div>
        <button type="button" onClick={onDownload}>
          <Download size={17} /> MISYS
        </button>
      </div>
      <div className="misys-grid" key={lead.id}>
        <label>
          Customer ID
          <input value={profile.customerId} onChange={(event) => onChange({ customerId: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })} placeholder={customerId(lead.company)} />
        </label>
        <label>
          Accounting customer ID
          <input value={profile.accountingCustomerId} onChange={(event) => onChange({ accountingCustomerId: event.target.value })} />
        </label>
        <label>
          Customer type
          <select value={profile.customerType} onChange={(event) => onChange({ customerType: event.target.value })}>
            {['Potential', 'Active', 'Distributor', 'Foodservice', 'Retail', 'Private Label'].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          Tax status
          <select value={profile.taxStatus} onChange={(event) => onChange({ taxStatus: event.target.value })}>
            {['Unknown', 'Taxable', 'Exempt'].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label>
          Freight terms
          <input value={profile.freightTerms} onChange={(event) => onChange({ freightTerms: event.target.value })} />
        </label>
        <label>
          Default warehouse
          <input value={profile.defaultWarehouse} onChange={(event) => onChange({ defaultWarehouse: event.target.value })} />
        </label>
        <label>
          Ship-to name
          <input value={profile.shipToName} onChange={(event) => onChange({ shipToName: event.target.value })} />
        </label>
        <label>
          Shipping address
          <input value={profile.shippingAddress} onChange={(event) => onChange({ shippingAddress: event.target.value })} />
        </label>
        <label>
          Billing address
          <input value={profile.billingAddress} onChange={(event) => onChange({ billingAddress: event.target.value })} />
        </label>
        <label>
          Production contact
          <input value={profile.productionContact} onChange={(event) => onChange({ productionContact: event.target.value })} />
        </label>
        <label>
          Target SKU
          <input value={profile.targetSku} onChange={(event) => onChange({ targetSku: event.target.value })} />
        </label>
        <label>
          Customer part #
          <input value={profile.customerPartNumber} onChange={(event) => onChange({ customerPartNumber: event.target.value })} />
        </label>
        <label className="wide-field">
          Item description
          <input value={profile.itemDescription} onChange={(event) => onChange({ itemDescription: event.target.value })} />
        </label>
        <label className="wide-field">
          Product / manufacturing spec
          <textarea value={profile.productSpec} onChange={(event) => onChange({ productSpec: event.target.value })} />
        </label>
      </div>
    </section>
  )
}

function CaptureApp({ onEmployee }: { onEmployee: () => void }) {
  const [form, setForm] = useState<Lead>(() => ({ ...emptyLead, id: crypto.randomUUID(), showName: 'Trade Show' }))
  const [status, setStatus] = useState('')
  const [scanStatus, setScanStatus] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function toggleNeed(need: string) {
    setForm((current) => ({
      ...current,
      packagingNeeds: current.packagingNeeds.includes(need) ? current.packagingNeeds.filter((item) => item !== need) : [...current.packagingNeeds, need],
    }))
  }

  async function scanCard(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setScanStatus('Reading card...')
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng')
      const result = await worker.recognize(file)
      await worker.terminate()
      const parsed = parseBusinessCard(result.data.text)
      setForm((current) => ({
        ...current,
        company: current.company || parsed.company,
        contact: current.contact || parsed.contact,
        title: current.title || parsed.title,
        email: current.email || parsed.email,
        phone: current.phone || parsed.phone,
        city: current.city || parsed.city,
        notes: current.notes || (parsed.rawText ? `Business card scan:\n${parsed.rawText}` : current.notes),
      }))
      setScanStatus('Card scanned. Please review the details before sending.')
    } catch {
      setScanStatus('Could not read the card. You can still enter the details manually.')
    } finally {
      event.target.value = ''
    }
  }

  async function submitLead(event: React.FormEvent) {
    event.preventDefault()
    setSubmitted(false)
    setStatus('Saving lead...')
    const capturedAt = new Date().toISOString()
    const lead = normalizeLead({
      ...form,
      id: crypto.randomUUID(),
      capturedAt,
      stage: 'New',
      priority: form.timeline === 'ASAP' || form.timeline === '30-60 days' ? 'Hot' : 'Warm',
      nextStep: 'Review booth notes and send first follow-up.',
      sampleStatus: /sample/i.test(form.notes) ? 'Requested' : 'Not Requested',
      quoteStatus: /quote|pricing|price/i.test(form.notes) ? 'Needs Pricing' : 'Not Started',
      taskType: /sample/i.test(form.notes) ? 'Send Samples' : 'Email',
      taskDue: dueForLead(capturedAt, form.timeline),
      misysProfile: {
        ...form.misysProfile,
        customerId: form.misysProfile.customerId || customerId(form.company),
        shipToName: form.misysProfile.shipToName || form.company,
        shippingAddress: form.misysProfile.shippingAddress || form.city,
        productionContact: form.misysProfile.productionContact || form.contact,
        itemDescription: form.misysProfile.itemDescription || form.packagingNeeds.join(', '),
      },
    })

    try {
      await insertLead(lead)
      const nextLocal = [lead, ...loadLocalLeads()]
      saveLocalLeads(nextLocal)
      setStatus('Thanks. Your information was sent to NexGen.')
      setSubmitted(true)
      setForm({ ...emptyLead, id: crypto.randomUUID(), showName: form.showName || 'Trade Show' })
    } catch {
      setStatus('Could not send from this device. Please try again or tell the NexGen team.')
    }
  }

  return (
    <main className="capture-screen" id="top">
      <button className="employee-link" type="button" onClick={onEmployee} aria-label="Employee portal">
        <Lock size={16} />
      </button>
      <header className="capture-brandbar">
        <img src={logoUrl} alt="NexGen Packaging" />
      </header>
      <section className="capture-hero">
        <div>
          <p className="eyebrow">NexGen Packaging</p>
          <h1>Tell us what you are packaging next.</h1>
          <p>Share a few details and the NexGen team will follow up with samples, specs, or a custom quote.</p>
        </div>
        <PackageCheck size={72} />
      </section>

      {submitted ? (
        <section className="capture-thank-you">
          <span>
            <CheckCircle2 size={34} />
          </span>
          <p className="eyebrow">Thank you</p>
          <h2>Your information was sent to NexGen.</h2>
          <p>Our team will review your packaging needs and follow up with samples, specs, or quote details.</p>
          <button className="primary-action" type="button" onClick={() => setSubmitted(false)}>
            <Plus size={18} /> Submit another contact
          </button>
        </section>
      ) : (
        <form className="lead-form" onSubmit={submitLead}>
          <div className="scan-card">
            <div>
              <p className="eyebrow">Smart Scan</p>
              <strong>Scan a business card to prefill contact details.</strong>
              <span>Take a clear photo, then review the fields before submitting.</span>
            </div>
            <label className="scan-button">
              <Camera size={18} /> Scan Card
              <input accept="image/*" capture="environment" type="file" onChange={scanCard} />
            </label>
            {scanStatus && <small>{scanStatus}</small>}
          </div>

          <div className="form-grid">
            <label>
              Company name
              <input required value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
            </label>
            <label>
              Contact name
              <input required value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} />
            </label>
            <label>
              Job title
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </label>
            <label>
              Email
              <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            <label>
              City / State
              <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            </label>
            <label>
              Trade show
              <input value={form.showName} onChange={(event) => setForm({ ...form, showName: event.target.value })} />
            </label>
            <label>
              Annual packaging volume
              <select required value={form.annualVolume} onChange={(event) => setForm({ ...form, annualVolume: event.target.value })}>
                <option value="">Select volume</option>
                {volumeOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              Buying timeline
              <select required value={form.timeline} onChange={(event) => setForm({ ...form, timeline: event.target.value })}>
                <option value="">Select timeline</option>
                {timelineOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <fieldset>
            <legend>Packaging interest</legend>
            <div className="need-grid">
              {packagingNeeds.map((need) => (
                <button className={form.packagingNeeds.includes(need) ? 'need active' : 'need'} key={need} type="button" onClick={() => toggleNeed(need)}>
                  <CheckCircle2 size={17} /> {need}
                </button>
              ))}
            </div>
          </fieldset>

          <label>
            Notes
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Current supplier, product dimensions, sustainability goals, sample requests..." />
          </label>
          <button className="primary-action" type="submit">
            <Send size={18} /> Send to NexGen
          </button>
          {status && <strong className="capture-status">{status}</strong>}
        </form>
      )}
    </main>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}

function SummaryItem({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`pipeline-summary-item ${className}`}>
      <small>{label}</small>
      <strong>{value || 'Not set'}</strong>
    </div>
  )
}

function ActionButton({ action, onClick }: { action: WorkflowAction; onClick: () => void }) {
  const icons: Record<WorkflowAction, React.ReactNode> = {
    reviewed: <CheckCircle2 size={17} />,
    contacted: <Phone size={17} />,
    requestSamples: <Box size={17} />,
    samplesSent: <Truck size={17} />,
    startQuote: <FileText size={17} />,
    quoteSent: <Send size={17} />,
    won: <ClipboardCheck size={17} />,
    nurture: <ClipboardList size={17} />,
  }
  return (
    <button type="button" onClick={onClick}>
      {icons[action]} {actionLabel(action)}
    </button>
  )
}

function ActivityTimeline({ lead }: { lead: Lead }) {
  const loggedItems = lead.activityLog.map((entry) => ({
    id: entry.id,
    label: entry.label,
    date: entry.date,
    detail: entry.detail,
  }))
  const legacyNote = lead.notes.trim() && lead.activityLog.length === 0 ? [{ id: 'legacy-note', label: 'Original note', date: lead.capturedAt, detail: lead.notes }] : []
  const items = [
    ...loggedItems,
    ...legacyNote,
    { label: 'Lead created', date: lead.capturedAt, detail: `Captured from ${lead.showName || 'trade show'}.` },
    { label: 'First follow-up due', date: lead.taskDue, detail: `${lead.taskType} should happen by ${formatDate(lead.taskDue)}.` },
    lead.sampleStatus !== 'Not Requested' ? { label: `Samples ${lead.sampleStatus.toLowerCase()}`, date: lead.taskDue, detail: 'Sample workflow is active for this customer.' } : null,
    lead.quoteStatus !== 'Not Started' ? { label: `Quote ${lead.quoteStatus.toLowerCase()}`, date: lead.taskDue, detail: 'Quote workflow is active for this customer.' } : null,
  ].filter(Boolean) as { id?: string; label: string; date: string; detail: string }[]

  return (
    <section className="detail-section timeline-section">
      <h3>Activity Timeline</h3>
      <div className="timeline-list">
        {items.map((item) => (
          <div className="timeline-item" key={item.id ?? `${item.label}-${item.detail}`}>
            <span />
            <div>
              <strong>{item.label}</strong>
              <small>{formatDate(item.date)}</small>
              <p>{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

type WorkflowAction = 'reviewed' | 'contacted' | 'requestSamples' | 'samplesSent' | 'startQuote' | 'quoteSent' | 'won' | 'nurture'
const allActions: WorkflowAction[] = ['reviewed', 'contacted', 'requestSamples', 'samplesSent', 'startQuote', 'quoteSent', 'won', 'nurture']

function primaryActionsForLead(lead: Lead): WorkflowAction[] {
  if (lead.stage === 'Quoted') return ['quoteSent', 'won', 'nurture']
  if (lead.stage === 'Sample Sent') return ['samplesSent', 'startQuote', 'quoteSent', 'nurture']
  if (lead.stage === 'Qualified') return ['contacted', 'requestSamples', 'startQuote', 'nurture']
  return ['reviewed', 'contacted', 'requestSamples', 'startQuote']
}

function workflowPatch(action: WorkflowAction): Partial<Lead> {
  const patches: Record<WorkflowAction, Partial<Lead>> = {
    reviewed: { stage: 'Qualified', taskType: 'Email', taskDue: addDays(1), nextStep: 'Send the first follow-up and confirm the best product path.' },
    contacted: { stage: 'Qualified', taskType: 'Check In', taskDue: addDays(2), nextStep: 'Follow up on the first conversation and confirm whether samples or pricing should come next.' },
    requestSamples: { stage: 'Qualified', sampleStatus: 'Requested', taskType: 'Send Samples', taskDue: addDays(1), nextStep: 'Pull sample options, confirm shipping details, and send tracking.' },
    samplesSent: { stage: 'Sample Sent', sampleStatus: 'Sent', taskType: 'Check In', taskDue: addDays(3), nextStep: 'Confirm sample delivery and ask for feedback on fit, material, and print needs.' },
    startQuote: { stage: 'Qualified', quoteStatus: 'Drafting', taskType: 'Build Quote', taskDue: addDays(2), nextStep: 'Build pricing around volume, specs, artwork, and delivery timing.' },
    quoteSent: { stage: 'Quoted', quoteStatus: 'Sent', taskType: 'Check In', taskDue: addDays(3), nextStep: 'Follow up on the quote and ask what needs to change for approval.' },
    won: { stage: 'Won', quoteStatus: 'Approved', taskType: 'Check In', taskDue: addDays(1), nextStep: 'Start customer setup: billing, shipping, tax documents, artwork, and first order details.' },
    nurture: { stage: 'Nurture', priority: 'Cold', taskType: 'Check In', taskDue: addDays(30), nextStep: 'Add to nurture and check back when timing or supplier needs change.' },
  }
  return patches[action]
}

function actionLabel(action: WorkflowAction) {
  const labels: Record<WorkflowAction, string> = {
    reviewed: 'Mark Reviewed',
    contacted: 'Contacted',
    requestSamples: 'Request Samples',
    samplesSent: 'Samples Sent',
    startQuote: 'Start Quote',
    quoteSent: 'Quote Sent',
    won: 'Won / Setup',
    nurture: 'Nurture',
  }
  return labels[action]
}

function phaseForLead(lead: Lead) {
  if (lead.stage === 'Nurture') return 'Nurture'
  if (lead.stage === 'Won') return 'Setup'
  if (lead.stage === 'Quoted' || lead.quoteStatus !== 'Not Started') return 'Quote'
  if (lead.stage === 'Sample Sent' || lead.sampleStatus !== 'Not Requested') return 'Samples'
  if (lead.stage === 'Qualified') return 'Contacted'
  return 'Intake'
}

function statusLabel(stage: LeadStage) {
  return stage === 'New' ? 'New Lead' : stage
}

function summaryForLead(lead: Lead) {
  if (lead.stage === 'Nurture') return 'This lead is not ready for active selling. Keep them in a light follow-up rhythm until timing improves.'
  if (lead.stage === 'Won') return 'This customer is ready for setup, billing, artwork, and first-order details.'
  if (lead.stage === 'Quoted') return 'Pricing has been sent or is ready for a follow-up decision.'
  if (lead.stage === 'Sample Sent') return 'Samples are in motion. Confirm delivery and collect fit, material, and print feedback.'
  if (lead.stage === 'Qualified') return 'The lead has been reviewed. Move them toward samples, pricing, or nurture.'
  return 'This profile was captured from the QR form or manually added. Review the notes and send first follow-up.'
}

function recommendedAction(lead: Lead) {
  if (lead.stage === 'Nurture') return 'Check timing, supplier changes, and whether their packaging needs have moved forward.'
  if (lead.stage === 'Won') return 'Start setup details for billing, shipping, artwork, and first production handoff.'
  if (lead.stage === 'Quoted') return 'Follow up on the quote and ask what needs to change for approval.'
  if (lead.sampleStatus === 'Requested') return 'Pull sample options, confirm shipping details, and send tracking.'
  if (lead.quoteStatus === 'Drafting') return 'Finish pricing around volume, specs, artwork, and delivery timing.'
  return 'Review booth notes and send first follow-up.'
}

function dueForLead(capturedAt: string, timeline: string) {
  const captured = new Date(capturedAt || new Date())
  if (Number.isNaN(captured.getTime())) captured.setTime(Date.now())
  const offset: Record<string, number> = {
    ASAP: 1,
    '30-60 days': 4,
    'This quarter': 7,
    '6+ months': 30,
    Researching: 21,
  }
  captured.setDate(captured.getDate() + (offset[timeline] ?? 7))
  return captured.toISOString().slice(0, 10)
}

function dueClass(date: string) {
  const due = new Date(date)
  if (Number.isNaN(due.getTime())) return ''
  const current = new Date()
  current.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  if (due < current) return 'due-overdue'
  if (due.getTime() === current.getTime()) return 'due-today'
  return ''
}

function makeActivityEntry(label: string, detail: string, date = new Date().toISOString(), type: ActivityType = 'note'): ActivityEntry {
  return {
    id: crypto.randomUUID(),
    type,
    label,
    detail,
    date,
  }
}

function appendNote(currentNotes: string, nextNote: string) {
  const trimmed = nextNote.trim()
  if (!trimmed) return currentNotes
  const stampedNote = `${formatDate(new Date().toISOString())}: ${trimmed}`
  return currentNotes.trim() ? `${currentNotes.trim()}\n\n${stampedNote}` : stampedNote
}

function normalizeActivityLog(value: unknown): ActivityEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const item = entry as Partial<ActivityEntry>
      return {
        id: String(item.id || crypto.randomUUID()),
        type: item.type === 'workflow' || item.type === 'system' ? item.type : 'note',
        label: String(item.label || 'Note added'),
        detail: String(item.detail || ''),
        date: String(item.date || new Date().toISOString()),
      }
    })
    .filter((entry): entry is ActivityEntry => Boolean(entry && entry.detail))
}

function normalizeLead(input: Partial<Lead>): Lead {
  return {
    ...emptyLead,
    ...input,
    id: input.id || crypto.randomUUID(),
    taskDue: input.taskDue || dueForLead(input.capturedAt || new Date().toISOString(), input.timeline || ''),
    capturedAt: input.capturedAt || new Date().toISOString(),
    activityLog: normalizeActivityLog(input.activityLog),
    misysProfile: { ...emptyMisys, ...(input.misysProfile ?? {}) },
  }
}

function readSession() {
  try {
    const raw = localStorage.getItem(sessionKey)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function loadLocalLeads() {
  try {
    const raw = localStorage.getItem(storageKey)
    return (raw ? JSON.parse(raw) : seedLeads).map(normalizeLead)
  } catch {
    return seedLeads
  }
}

function saveLocalLeads(leads: Lead[]) {
  localStorage.setItem(storageKey, JSON.stringify(leads))
}

async function supabaseRequest(path: string, options: RequestInit = {}, token?: string): Promise<unknown> {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token ?? anonKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!response.ok) {
    const text = await response.text()
    const error = new Error(`Supabase request failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`) as Error & { status?: number }
    error.status = response.status
    throw error
  }
  if (response.status === 204) return undefined
  const text = await response.text()
  return text ? JSON.parse(text) : undefined
}

async function supabaseSignIn(email: string, password: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new Error('Unable to sign in.')
  return (await response.json()) as Session
}

async function supabaseRefreshSession(refreshToken: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!response.ok) {
    const error = new Error('Unable to refresh Supabase session.') as Error & { status?: number }
    error.status = response.status
    throw error
  }
  return (await response.json()) as Session
}

async function supabaseSignOut(token: string) {
  await fetch(`${supabaseUrl}/auth/v1/logout`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  })
}

function isAuthError(error: unknown) {
  return error instanceof Error && ((error as Error & { status?: number }).status === 401 || error.message.includes('401'))
}

async function fetchLeads(token: string): Promise<Lead[]> {
  const rows = (await supabaseRequest('leads?select=*&order=captured_at.desc', {}, token)) as Record<string, unknown>[]
  return rows.map(fromSupabase)
}

async function insertLead(lead: Lead) {
  let lastError: unknown
  for (const row of supabasePayloadVariants(lead)) {
    try {
      await supabaseRequest('leads', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) })
      return
    } catch (error) {
      if (!isOptionalColumnError(error)) throw error
      lastError = error
    }
  }
  throw lastError
}

async function patchLead(lead: Lead, token: string) {
  let lastError: unknown
  for (const row of supabasePayloadVariants(lead)) {
    try {
      const rows = (await supabaseRequest(`leads?id=eq.${encodeURIComponent(lead.id)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) }, token)) as Record<string, unknown>[]
      return fromSupabase(rows[0])
    } catch (error) {
      if (!isOptionalColumnError(error)) throw error
      lastError = error
    }
  }
  throw lastError
}

function supabasePayloadVariants(lead: Lead) {
  return [
    toSupabase(lead, { includeMisys: true, includeActivity: true }),
    toSupabase(lead, { includeMisys: true, includeActivity: false }),
    toSupabase(lead, { includeMisys: false, includeActivity: true }),
    toSupabase(lead, { includeMisys: false, includeActivity: false }),
  ]
}

function isOptionalColumnError(error: unknown) {
  return error instanceof Error && (error.message.includes('misys_profile') || error.message.includes('activity_log'))
}

function toSupabase(lead: Lead, options: { includeMisys: boolean; includeActivity: boolean }) {
  const row: Record<string, unknown> = {
    id: lead.id,
    company: lead.company,
    contact: lead.contact,
    title: lead.title || null,
    email: lead.email,
    phone: lead.phone || null,
    city: lead.city || null,
    show_name: lead.showName,
    packaging_needs: lead.packagingNeeds,
    annual_volume: lead.annualVolume,
    timeline: lead.timeline,
    notes: lead.notes || null,
    stage: lead.stage,
    priority: lead.priority,
    owner: lead.owner,
    next_step: lead.nextStep,
    sample_status: lead.sampleStatus,
    quote_status: lead.quoteStatus,
    task_type: lead.taskType,
    task_due: lead.taskDue,
    captured_at: lead.capturedAt,
  }
  if (options.includeMisys) row.misys_profile = lead.misysProfile
  if (options.includeActivity) row.activity_log = lead.activityLog
  return row
}

function fromSupabase(row: Record<string, unknown>): Lead {
  return normalizeLead({
    id: String(row.id ?? ''),
    company: String(row.company ?? ''),
    contact: String(row.contact ?? ''),
    title: String(row.title ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    city: String(row.city ?? ''),
    showName: String(row.show_name ?? 'Trade Show'),
    packagingNeeds: Array.isArray(row.packaging_needs) ? row.packaging_needs.map(String) : [],
    annualVolume: String(row.annual_volume ?? ''),
    timeline: String(row.timeline ?? ''),
    notes: String(row.notes ?? ''),
    stage: (row.stage as LeadStage) ?? 'New',
    priority: (row.priority as LeadPriority) ?? 'Warm',
    owner: String(row.owner ?? 'Bradley'),
    nextStep: String(row.next_step ?? ''),
    sampleStatus: (row.sample_status as SampleStatus) ?? 'Not Requested',
    quoteStatus: (row.quote_status as QuoteStatus) ?? 'Not Started',
    taskType: (row.task_type as TaskType) ?? 'Email',
    taskDue: String(row.task_due ?? ''),
    capturedAt: String(row.captured_at ?? ''),
    activityLog: normalizeActivityLog(row.activity_log),
    misysProfile: (row.misys_profile as MisysProfile) ?? emptyMisys,
  })
}

function parseBusinessCard(text: string) {
  const lines = Array.from(
    new Set(
      text
        .split(/\r?\n/)
        .map((line) => line.replace(/[|•]/g, ' ').replace(/\s+/g, ' ').trim())
        .filter((line) => line.length > 1),
    ),
  )
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? ''
  const phone = text.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/)?.[0] ?? ''
  const titleRegex = /owner|founder|president|director|manager|sales|procurement|buyer|operations|chef|ceo|coo|cfo|vp|partner/i
  const companyRegex = /llc|inc|corp|co\.|company|group|foods|restaurant|market|packaging|holdings|enterprises|solutions|industries|distribution/i
  const stateRegex = /\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV|WY)\b/
  const cleanLines = lines.filter((line) => !line.includes('@') && !phone.includes(line) && !/www\.|https?:\/\//i.test(line))
  return {
    email,
    phone,
    contact:
      cleanLines.find((line) => {
        const parts = line.split(' ').filter(Boolean)
        return parts.length >= 2 && parts.length <= 4 && !titleRegex.test(line) && !companyRegex.test(line) && !/\d/.test(line)
      }) ?? '',
    title: cleanLines.find((line) => titleRegex.test(line)) ?? '',
    company: cleanLines.find((line) => companyRegex.test(line)) ?? cleanLines[0] ?? '',
    city: cleanLines.find((line) => stateRegex.test(line)) ?? '',
    rawText: lines.join('\n'),
  }
}

function makeEmailDraft(lead: Lead, template: string) {
  const firstName = lead.contact.split(' ')[0] || lead.contact
  const subjectMap: Record<string, string> = {
    'First follow-up': `Following up from ${lead.showName}`,
    Samples: `Sample options for ${lead.company}`,
    'Quote next step': `Quote next steps for ${lead.company}`,
    'Nurture check-in': `Checking in on packaging timing`,
  }
  const bodyMap: Record<string, string> = {
    'First follow-up': `Hi ${firstName},\n\nThanks for stopping by the NexGen booth. I wanted to follow up on your interest in ${lead.packagingNeeds.join(', ') || 'packaging options'} and confirm whether samples or a quote would be most helpful next.\n\nBest,\nNexGen Packaging`,
    Samples: `Hi ${firstName},\n\nI can pull together sample options for ${lead.company}. Can you confirm the best ship-to address and any size/material preferences?\n\nBest,\nNexGen Packaging`,
    'Quote next step': `Hi ${firstName},\n\nI am working through quote details for ${lead.company}. To tighten pricing, can you confirm expected volume, artwork needs, and delivery timing?\n\nBest,\nNexGen Packaging`,
    'Nurture check-in': `Hi ${firstName},\n\nJust checking in to see whether your packaging timing has changed since ${lead.showName}. Happy to revisit samples or pricing whenever helpful.\n\nBest,\nNexGen Packaging`,
  }
  return { subject: subjectMap[template] ?? '', body: bodyMap[template] ?? '' }
}

function buildMisysRows(leads: Lead[]) {
  const headers = [
    'Customer ID',
    'Company',
    'Contact',
    'Email',
    'Phone',
    'Customer Type',
    'Tax Status',
    'Freight Terms',
    'Default Warehouse',
    'Ship-to Name',
    'Shipping Address',
    'Billing Address',
    'Production Contact',
    'Target SKU',
    'Customer Part #',
    'Item Description',
    'Product Spec',
  ]
  const rows = leads.map((lead) => [
    lead.misysProfile.customerId || customerId(lead.company),
    lead.company,
    lead.contact,
    lead.email,
    lead.phone,
    lead.misysProfile.customerType,
    lead.misysProfile.taxStatus,
    lead.misysProfile.freightTerms,
    lead.misysProfile.defaultWarehouse,
    lead.misysProfile.shipToName || lead.company,
    lead.misysProfile.shippingAddress || lead.city,
    lead.misysProfile.billingAddress,
    lead.misysProfile.productionContact || lead.contact,
    lead.misysProfile.targetSku,
    lead.misysProfile.customerPartNumber,
    lead.misysProfile.itemDescription || lead.packagingNeeds.join('; '),
    lead.misysProfile.productSpec,
  ])
  return [headers, ...rows]
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function escapeCsv(value: string) {
  return `"${String(value ?? '').replaceAll('"', '""').replaceAll('\n', ' ')}"`
}

function customerId(company: string) {
  return company.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatDate(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export default App
