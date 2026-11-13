import { useEffect, useState } from 'react';
import Login from './components/Login';
import {
  fetchLeads,
  createLead as createLeadAPI,
  updateLeadStage as updateLeadStageAPI,
  deleteLead as deleteLeadAPI,
  type Lead
} from './services/leads';

import {
  Activity, ArrowUpRight, Bell, Building2, CalendarDays,
  ChartNoAxesCombined, CheckCircle2, ChevronDown, CircleDollarSign,
  ClipboardList, FileText, Filter, Handshake, House,
  LayoutDashboard, MapPin, Menu, MessageSquare,
  PanelLeftClose, Plus, Search, Settings, ShieldCheck,
  SlidersHorizontal, Target, UserRound, Users, Wallet, X
} from 'lucide-react';

const groups: [string, [string, any][]][] = [
  ['OVERVIEW', [['Dashboard', LayoutDashboard], ['Tasks & Calendar', CalendarDays]]],
  ['SALES & CRM', [['Leads', Users], ['Customers', UserRound], ['Sales Pipeline', Target], ['Site Visits', MapPin], ['Offers & Deals', Handshake]]],
  ['PROPERTIES', [['Property Listings', House], ['Availability', Building2], ['Owners & Developers', Building2], ['Brokers & Partners', Users]]],
  ['FINANCE', [['Commissions', CircleDollarSign], ['Invoices & Receipts', FileText], ['Partner Payouts', Wallet], ['Expenses', Activity], ['Reconciliation', Activity]]],
  ['COMPLIANCE', [['KYC & Documents', ShieldCheck], ['Agreements', FileText], ['Audit Logs', ClipboardList]]],
  ['INSIGHTS', [['Reports & Analytics', ChartNoAxesCombined], ['Users & Teams', Users], ['Settings', Settings]]
  ]
];

const statusCls = (s: string) => s.toLowerCase().replaceAll(' ', '-');

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem('pz-erp-token'))
  );

  const [page, setPage] = useState('Dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [q, setQ] = useState('');
  const [stage, setStage] = useState('All');
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [toast, setToast] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  };

  // Load leads from PostgreSQL
  const loadLeads = async () => {
    setLoadingLeads(true);

    try {
      const data = await fetchLeads();
      setLeads(data);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Failed to load leads');
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadLeads();
    }
  }, [isLoggedIn]);

  // Create lead in PostgreSQL
  const add = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const d = new FormData(e.currentTarget);

    try {
      await createLeadAPI({
        name: String(d.get('name')),
        phone: String(d.get('phone')),
        source: String(d.get('source')),
        budget: String(d.get('budget')),
        project: String(d.get('project') || '')
      });

      setModal(false);
      await loadLeads();
      notify('Lead created successfully');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Failed to create lead');
    }
  };

  // Update lead stage in PostgreSQL
  const changeStage = async (lead: Lead, newStage: string) => {
    try {
      await updateLeadStageAPI(lead.id, newStage);
      await loadLeads();

      setSelected({ ...lead, status: newStage });
      notify('Lead stage updated successfully');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Failed to update stage');
    }
  };

  // Delete lead from PostgreSQL
  const removeLead = async (lead: Lead) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${lead.name}?`
    );

    if (!confirmed) return;

    try {
      await deleteLeadAPI(lead.id);
      setSelected(null);
      await loadLeads();
      notify('Lead deleted successfully');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Failed to delete lead');
    }
  };

  const filtered = leads.filter(
    l =>
      (stage === 'All' || l.status === stage) &&
      [l.name, l.phone, l.project, l.owner, l.source]
        .join(' ')
        .toLowerCase()
        .includes(q.toLowerCase())
  );

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="shell">

      <aside className={collapsed ? 'side slim' : 'side'}>
        <div className="brand">
          <Building2 size={27} />
          {!collapsed && <div><b>PARKZONE</b><small>ERP REAL</small></div>}
          <button onClick={() => setCollapsed(!collapsed)}>
            <PanelLeftClose size={16} />
          </button>
        </div>

        <div className="workspace">● {!collapsed && 'ParkZone Realty  ⌄'}</div>

        <nav>
          {groups.map(([g, items]) => (
            <section key={g}>
              <label>{!collapsed && g}</label>
              {items.map(([name, Icon]) => (
                <button
                  key={name}
                  className={page === name ? 'active' : ''}
                  onClick={() => {
                    setPage(name);
                    setSelected(null);
                  }}
                  title={name}
                >
                  <Icon size={18} />
                  {!collapsed && name}
                  {!collapsed && name === 'Leads' && <em>{leads.length}</em>}
                </button>
              ))}
            </section>
          ))}
        </nav>

        <div className="side-foot">◉ {!collapsed && 'Help centre'}</div>
      </aside>

      <main>
        <header>
          <button className="hamb" onClick={() => setCollapsed(!collapsed)}>
            <Menu />
          </button>

          <div className="search">
            <Search size={17} />
            <input
              placeholder="Search leads, properties, deals, customers, partners..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>

          <div className="top-right">
            <button onClick={() => setModal(true)}><Plus /></button>
            <button onClick={() => notify('No new notifications')}><Bell /></button>
            <button onClick={() => notify('No new messages')}><MessageSquare /></button>

            <div className="user">
              <b>RS</b>
              <span>Rahul Sharma<small>Sales Manager</small></span>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>

        <div className="body">

          <div className="page-head">
            <div>
              <small>WORKSPACE / {page.toUpperCase()}</small>
              <h1>{page}</h1>
              <p>
                {page === 'Dashboard'
                  ? 'Welcome back, Rahul. Here’s what’s happening with your real estate business today.'
                  : page === 'Leads'
                    ? 'Manage prospects, track engagement and move opportunities forward.'
                    : 'Manage ' + page.toLowerCase() + ' across all brokerage teams and projects.'}
              </p>
            </div>

            <div className="head-actions">
              <button>01 Oct – 30 Oct 2026⌄</button>
              <button>All Projects⌄</button>
              <button onClick={() => notify('Filters opened')}>
                <SlidersHorizontal />
              </button>
              <button className="primary" onClick={() => setModal(true)}>
                <Plus size={16} /> Add {page === 'Dashboard' ? 'Lead' : page.replace(/s$/, '')}
              </button>
            </div>
          </div>

          {page === 'Dashboard' ? (
            <>
              <div className="metrics">
                {([
                  ['Total Leads', String(leads.length), '+12%', Users, 'blue'],
                  ['Active Listings', '1,326', '+8%', House, 'green'],
                  ['Deals in Pipeline', '64', '+14%', Handshake, 'blue'],
                  ['Deals Closed', '18', '+50%', FileText, 'purple'],
                  ['Commission Earned', '₹42.8L', '+28%', CircleDollarSign, 'orange'],
                  ['Receivables Outstanding', '₹31.4L', '+6%', Wallet, 'red']
                ] as [string, string, string, any, string][]).map(([t, v, d, I, c]) => (
                  <div className="metric" key={t}>
                    <i className={'mi ' + c}><I size={19} /></i>
                    <div>
                      <small>{t}</small>
                      <b>{v}</b>
                      <span><ArrowUpRight size={13} />{d}</span>
                    </div>
                    <div className="spark"><i /><i /><i /><i /><i /><i /></div>
                  </div>
                ))}
              </div>

              <div className="three">
                <section className="panel">
                  <div className="panel-title">
                    <div><b>Sales Pipeline</b><small>Opportunity conversion by stage</small></div>
                    <button>All Teams⌄</button>
                  </div>
                  <div className="funnel">
                    <div className="funnel-bars">
                      {[100, 86, 70, 56, 42, 29, 19].map((w, i) => (
                        <i key={i} style={{ width: w + '%' }} />
                      ))}
                    </div>
                    <div className="funnel-labels">
                      {[
                        ['248', 'New Leads'], ['192', 'Contacted'],
                        ['134', 'Qualified'], ['82', 'Site Visit Scheduled'],
                        ['64', 'Negotiation'], ['28', 'Deal Confirmed'], ['18', 'Won']
                      ].map(x => <div key={x[1]}><b>{x[0]}</b>{x[1]}</div>)}
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-title">
                    <div><b>Lead Source</b><small>Where prospects come from</small></div>
                    <button>This Month⌄</button>
                  </div>
                  <div className="donut-area">
                    <div className="donut">
                      <div><b>{leads.length}</b><small>Leads</small></div>
                    </div>
                    <ul>
                      {[
                        ['Website', '32%', 'blue'],
                        ['Property Portal', '20%', 'teal'],
                        ['Referrals', '18%', 'orange'],
                        ['Walk-in', '12%', 'purple'],
                        ['Partner/Broker', '10%', 'red'],
                        ['Social Media', '6%', 'sky'],
                        ['Other', '2%', 'gray']
                      ].map(x => <li key={x[0]}><i className={x[2]} />{x[0]}<b>{x[1]}</b></li>)}
                    </ul>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-title">
                    <div><b>Property Types</b><small>Active listings by category</small></div>
                    <button>All Projects⌄</button>
                  </div>
                  <div className="donut-area">
                    <div className="donut property">
                      <div><b>1,326</b><small>Listings</small></div>
                    </div>
                    <ul>
                      {[
                        ['Residential – Sale', '48%', 'blue'],
                        ['Residential – Rent', '18%', 'teal'],
                        ['Commercial', '20%', 'purple'],
                        ['Plots & Land', '8%', 'orange'],
                        ['Other', '6%', 'gray']
                      ].map(x => <li key={x[0]}><i className={x[2]} />{x[0]}<b>{x[1]}</b></li>)}
                    </ul>
                  </div>
                </section>
              </div>

              <div className="three lower">
                <section className="panel">
                  <div className="panel-title">
                    <div><b>Upcoming Tasks</b><small>Stay on top of priorities</small></div>
                    <a onClick={() => setPage('Tasks & Calendar')}>View all ›</a>
                  </div>
                  <div className="tabs">
                    <b>My Tasks (8)</b><span>Team (24)</span><span>Overdue (6)</span>
                  </div>
                  {[
                    ['Call – Priya Mehta', 'Follow up on 2BHK options', '10:00 AM', 'high'],
                    ['Site Visit – Kumar Family', 'Sunrise Heights · Tower B', '11:30 AM', 'normal'],
                    ['Review Offer', 'DEAL-458 · Discount approval', '02:00 PM', 'high'],
                    ['Partner Meeting', 'ABC Realty · New inventory', '04:00 PM', 'normal'],
                    ['Update Documents', 'KYC pending for Manoj Reddy', '05:00 PM', 'low']
                  ].map((x, i) => (
                    <div className="task" key={x[0]}>
                      <i>{['☎', '▣', '▤', '♧', '✓'][i]}</i>
                      <div><b>{x[0]}</b><small>{x[1]}</small></div>
                      <time>{x[2]}</time>
                      <em className={x[3]}>{x[3]}</em>
                    </div>
                  ))}
                </section>

                <section className="panel">
                  <div className="panel-title">
                    <div><b>Recent Leads</b><small>Latest prospect activity</small></div>
                    <a onClick={() => setPage('Leads')}>View all ›</a>
                  </div>
                  <table>
                    <thead>
                      <tr><th>Name</th><th>Source</th><th>Budget</th><th>Status</th><th>Owner</th></tr>
                    </thead>
                    <tbody>
                      {leads.slice(0, 5).map(l => (
                        <tr key={l.id} onClick={() => { setPage('Leads'); setSelected(l); }}>
                          <td><b>{l.name}</b></td>
                          <td>{l.source}</td>
                          <td>{l.budget}</td>
                          <td><span className={'status ' + statusCls(l.status)}>{l.status}</span></td>
                          <td>{l.owner.split(' ')[0]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section className="panel">
                  <div className="panel-title">
                    <div><b>Recent Deals</b><small>Latest deal movement</small></div>
                    <a onClick={() => setPage('Offers & Deals')}>View all ›</a>
                  </div>
                  {[
                    ['Sunrise Heights', 'Ananya Patel', '₹1.1Cr', 'Negotiation'],
                    ['Green View Villa', 'Kumar Family', '₹2.8Cr', 'Deal Confirmed'],
                    ['Central Plaza', 'Tech Solutions', '₹3.2Cr', 'Documentation'],
                    ['Lakeside Residency', 'Rohan Kumar', '₹1.5Cr', 'Negotiation']
                  ].map(x => (
                    <div className="deal" key={x[0]}>
                      <i><Building2 size={17} /></i>
                      <div><b>{x[0]}</b><small>{x[1]}</small></div>
                      <strong>{x[2]}</strong>
                      <span className="status">{x[3]}</span>
                    </div>
                  ))}
                </section>
              </div>

              <div className="two">
                <section className="panel">
                  <div className="panel-title">
                    <div><b>Commission Overview</b><small>Monthly brokerage performance</small></div>
                    <button>This Month⌄</button>
                  </div>
                  <div className="commission-stats">
                    {[
                      ['Estimated', '₹68.5L'], ['Approved', '₹42.8L'],
                      ['Invoiced', '₹36.2L'], ['Collected', '₹28.4L']
                    ].map(x => <div key={x[0]}><small>{x[0]}</small><b>{x[1]}</b></div>)}
                  </div>
                  <div className="bars">
                    {[38, 58, 47, 72, 54, 66].map((v, i) => (
                      <div key={i}>
                        <i style={{ height: v + '%' }} />
                        <i style={{ height: v * .72 + '%' }} />
                        <small>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}</small>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-title">
                    <div><b>Team Performance</b><small>Sales leaderboard</small></div>
                    <button>This Month⌄</button>
                  </div>
                  <div className="team-head">Employee <span>Leads　Visits　Deals　Conversion　Commission</span></div>
                  {[
                    ['RS', 'Ravi Sharma', '48', '18', '6', '12.5%', '₹14.8L'],
                    ['NP', 'Neha Patel', '42', '15', '5', '11.9%', '₹11.2L'],
                    ['AG', 'Amit Gupta', '38', '14', '4', '10.5%', '₹8.6L'],
                    ['PS', 'Priya Singh', '34', '12', '3', '9.4%', '₹5.8L'],
                    ['VK', 'Vikram K', '28', '10', '2', '7.1%', '₹3.4L']
                  ].map(x => (
                    <div className="team-row" key={x[0]}>
                      <b><i>{x[0]}</i>{x[1]}</b>
                      <span>{x.slice(2).join('　')}</span>
                    </div>
                  ))}
                </section>
              </div>
            </>
          ) : page === 'Leads' ? (
            <section className="panel leads">
              <div className="panel-title">
                <div>
                  <b>Lead Register</b>
                  <small>
                    {loadingLeads ? 'Loading leads...' : `${leads.length} prospects · PostgreSQL records`}
                  </small>
                </div>

                <div className="table-tools">
                  <select value={stage} onChange={e => setStage(e.target.value)}>
                    <option>All</option>
                    {['New', 'Contacted', 'Qualified', 'Site Visit', 'Negotiation', 'Won', 'Lost'].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <button onClick={() => { setStage('All'); setQ(''); }}>
                    <Filter size={15} /> Clear
                  </button>
                  <button className="primary" onClick={() => setModal(true)}>
                    <Plus size={15} /> Add lead
                  </button>
                </div>
              </div>

              {loadingLeads ? (
                <div className="empty">Loading leads from database...</div>
              ) : (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>Prospect</th><th>Source</th><th>Budget</th>
                        <th>Interested project</th><th>Stage</th><th>Assigned to</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(l => (
                        <tr key={l.id} onClick={() => setSelected(l)}>
                          <td><b>{l.name}</b><small>{l.phone}</small></td>
                          <td>{l.source}</td>
                          <td>{l.budget}</td>
                          <td>{l.project}</td>
                          <td><span className={'status ' + statusCls(l.status)}>{l.status}</span></td>
                          <td>{l.owner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!filtered.length && (
                    <div className="empty">No leads found. Try another search or add a prospect.</div>
                  )}
                </>
              )}
            </section>
          ) : (
            <section className="panel coming">
              <ClipboardList size={32} />
              <h2>{page} workspace</h2>
              <p>
                This module is present in the ERP navigation. Its detailed records,
                permissions and workflows are planned for the next implementation increment.
              </p>
              <button className="primary" onClick={() => notify('Module request noted')}>
                <Plus size={15} /> Request module setup
              </button>
            </section>
          )}

          <footer>
            © 2026 ParkZone ERP Real
            <span>Brokerage operations workspace · Preview build 0.1.0</span>
          </footer>
        </div>
      </main>

      {modal && (
        <div className="overlay" onClick={e => {
          if (e.target === e.currentTarget) setModal(false);
        }}>
          <form className="modal" onSubmit={add}>
            <div className="modal-head">
              <div>
                <h2>Add new lead</h2>
                <p>Capture a prospect and create a follow-up record.</p>
              </div>
              <button type="button" onClick={() => setModal(false)}><X /></button>
            </div>

            <label>Full name<input name="name" required placeholder="e.g. Priya Mehta" /></label>
            <label>Phone number<input name="phone" required placeholder="+91 98xxx xxxxx" /></label>

            <div className="form-two">
              <label>Lead source
                <select name="source">
                  <option>Website</option>
                  <option>Referral</option>
                  <option>Property Portal</option>
                  <option>Walk-in</option>
                  <option>Partner</option>
                  <option>Social Media</option>
                </select>
              </label>
              <label>Budget<input name="budget" placeholder="₹80L–1.2Cr" /></label>
            </div>

            <label>Interested project<input name="project" placeholder="Project / property name" /></label>

            <div className="modal-actions">
              <button type="button" onClick={() => setModal(false)}>Cancel</button>
              <button className="primary" type="submit">
                <Plus size={15} /> Create lead
              </button>
            </div>
          </form>
        </div>
      )}

      {selected && (
        <div className="overlay" onClick={e => {
          if (e.target === e.currentTarget) setSelected(null);
        }}>
          <aside className="drawer">
            <button className="close" onClick={() => setSelected(null)}><X /></button>
            <small>LEAD PROFILE</small>
            <h2>{selected.name}</h2>
            <p>{selected.phone}</p>
            <hr />

            <div className="detail">
              <small>Source</small><b>{selected.source}</b>
              <small>Budget</small><b>{selected.budget}</b>
              <small>Project</small><b>{selected.project}</b>
              <small>Owner</small><b>{selected.owner}</b>
            </div>

            <label>Pipeline stage
              <select
                value={selected.status}
                onChange={e => changeStage(selected, e.target.value)}
              >
                {['New', 'Contacted', 'Qualified', 'Site Visit', 'Negotiation', 'Won', 'Lost'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>

            <button className="primary full" onClick={() => notify('Follow-up task queued in preview')}>
              <CalendarDays size={16} /> Schedule follow-up
            </button>

            <button
              className="full"
              style={{ marginTop: '12px', color: '#dc2626' }}
              onClick={() => removeLead(selected)}
            >
              Delete Lead
            </button>
          </aside>
        </div>
      )}

      {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  );
}