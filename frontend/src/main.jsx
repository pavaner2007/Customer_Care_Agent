import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { 
  Bot, LayoutDashboard, Send, Sparkles, AlertTriangle, 
  CheckCircle2, BrainCircuit, Gauge, LogOut, Database, 
  Inbox, User, Filter, X, Clock, HelpCircle, Shield, ArrowRight
} from 'lucide-react';
import api from './api/axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLogin from './pages/AdminLogin';
import StatCard from './components/analytics/StatCard';
import SentimentPieChart from './components/analytics/SentimentPieChart';
import CategoryBarChart from './components/analytics/CategoryBarChart';
import PriorityPieChart from './components/analytics/PriorityPieChart';
import DailyTicketsLineChart from './components/analytics/DailyTicketsLineChart';
import ChurnRiskChart from './components/analytics/ChurnRiskChart';
import './index.css';

const Badge = ({ children, type }) => {
  const map = { 
    High: 'bg-red-500/20 text-red-200 border border-red-500/30', 
    Medium: 'bg-yellow-500/20 text-yellow-100 border border-yellow-500/30', 
    Low: 'bg-green-500/20 text-green-100 border border-green-500/30', 
    Angry: 'bg-red-500/20 text-red-200 border border-red-500/30', 
    Frustrated: 'bg-orange-500/20 text-orange-100 border border-orange-500/30', 
    Positive: 'bg-green-500/20 text-green-100 border border-green-500/30',
    Open: 'bg-sky-500/20 text-sky-200 border border-sky-500/30',
    'In Progress': 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30',
    Resolved: 'bg-green-500/20 text-green-200 border border-green-500/30'
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${map[type] || 'bg-slate-500/20 text-slate-100 border border-slate-500/30'}`}>{children}</span>;
};

// --- Home Route: Public Customer Complaint Intake ---
function Home() {
  const [form, setForm] = useState({ customerName: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault(); 
    if (!form.customerName || !form.email || !form.message) {
      alert('Please fill out all fields.');
      return;
    }
    setLoading(true); 
    setResult(null);
    try {
      const { data } = await api.post('/tickets', form);
      setResult(data); 
      setForm({ customerName: '', email: '', message: '' });
    } catch (err) { 
      alert(err.response?.data?.message || 'Failed to submit complaint'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <main className="min-h-screen p-5 md:p-10 bg-[radial-gradient(circle_at_top_left,#1e3a8a35,transparent_40%),radial-gradient(circle_at_bottom_right,#9333ea35,transparent_40%)]">
      <header className="max-w-4xl mx-auto mb-10 flex flex-wrap justify-between items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <p className="text-sky-300 font-semibold text-sm tracking-wider uppercase">CareMind AI</p>
          <h1 className="text-4xl md:text-5xl font-black gradient-text">Customer Support Portal</h1>
        </div>
        <Link 
          to="/admin-dashboard" 
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-sm font-semibold tracking-wide transition-all"
        >
          <Shield size={16} className="text-sky-300" />
          <span>Admin Portal</span>
          <ArrowRight size={14} />
        </Link>
      </header>

      <div className="max-w-3xl mx-auto">
        <section className="glass rounded-3xl p-6 md:p-8 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-sky-500 to-purple-500"></div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
              <Bot className="text-sky-400 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Emotion-Aware Support Intake</h2>
              <p className="text-slate-400 text-xs mt-0.5">Submit your concern. Our AI analyzes priority, sentiment, and category for rapid resolution.</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Name</label>
                <input 
                  required
                  className="w-full rounded-xl bg-white/5 border border-white/10 p-3 outline-none text-white focus:border-sky-500/50 transition-all text-sm" 
                  placeholder="e.g. John Doe" 
                  value={form.customerName} 
                  onChange={e=>setForm({...form, customerName:e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Email</label>
                <input 
                  required
                  type="email"
                  className="w-full rounded-xl bg-white/5 border border-white/10 p-3 outline-none text-white focus:border-sky-500/50 transition-all text-sm" 
                  placeholder="john@example.com" 
                  value={form.email} 
                  onChange={e=>setForm({...form, email:e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Describe your issue</label>
              <textarea 
                required
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3 outline-none min-h-36 text-white focus:border-sky-500/50 transition-all text-sm" 
                placeholder="What went wrong? E.g. Refund pending, damaged item, app error..." 
                value={form.message} 
                onChange={e=>setForm({...form, message:e.target.value})}
              />
            </div>
            <button 
              className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 py-3.5 font-bold flex justify-center items-center gap-2 shadow-lg shadow-sky-500/20 active:translate-y-[1px] transition-all disabled:opacity-50" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Analyzing Ticket with Groq + Python ML...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit Complaint</span>
                </>
              )}
            </button>
          </form>

          {result && (
            <div className="mt-8 rounded-2xl bg-black/30 border border-white/5 p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 size={18} />
                <span>Ticket Registered Successfully!</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge type={result.sentiment}>{result.sentiment}</Badge>
                <Badge type={result.priority}>{result.priority} Priority</Badge>
                <Badge type={result.churnRisk}>{result.churnRisk} Churn Risk</Badge>
                <Badge>{result.riskScore || 0}/100 Risk Score</Badge>
                <Badge>{result.category}</Badge>
              </div>
              <div className="space-y-2 border-t border-white/5 pt-3 text-sm text-slate-300">
                <p><b>AI Summary:</b> {result.summary}</p>
                <p><b>Expected SLA:</b> {result.slaHours || 24} hours · <b>Confidence:</b> {Math.round((result.mlConfidence || 0) * 100)}%</p>
                <p className="bg-white/5 p-3 rounded-xl border border-white/5 mt-2">
                  <span className="text-sky-300 font-semibold block text-xs tracking-wider uppercase mb-1">AI Suggested Reply:</span>
                  {result.suggestedReply}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// --- Protected Route: Manager Dashboard ---
function Dashboard() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyLoading, setReplyLoading] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    sentiment: ''
  });

  const loadDashboardData = async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        api.get('/tickets'),
        api.get('/analytics/summary')
      ]);
      setTickets(ticketsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/tickets/${id}`, { status });
      if (selectedTicket && selectedTicket._id === id) {
        setSelectedTicket(data);
      }
      loadDashboardData();
    } catch (err) {
      alert('Failed to update ticket status.');
    }
  };

  const regenerateReply = async (id) => {
    setReplyLoading(true);
    try {
      const { data } = await api.post(`/tickets/${id}/reply`);
      if (selectedTicket && selectedTicket._id === id) {
        setSelectedTicket(data);
      }
      loadDashboardData();
    } catch (err) {
      alert('Failed to regenerate AI reply.');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  // Filter logic
  const filteredTickets = tickets.filter(t => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.sentiment && t.sentiment !== filters.sentiment) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b16] text-white flex flex-col justify-center items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-sky-500/20 border-t-sky-400 animate-spin"></div>
        <p className="text-slate-400 font-medium">Loading Dashboard Data...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[radial-gradient(circle_at_top_left,#1e3a8a30,transparent_40%),radial-gradient(circle_at_bottom_right,#9333ea30,transparent_40%)]">
      {/* Header */}
      <header className="glass rounded-3xl p-5 mb-6 flex flex-wrap justify-between items-center gap-4 shadow-xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
            <LayoutDashboard className="text-sky-300 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">CareMind AI Admin</h1>
            <p className="text-slate-400 text-xs mt-0.5">Manager retention intelligence workspace.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-sm text-slate-300">
            <User size={16} className="text-sky-400" />
            <span className="font-semibold">{admin?.name || 'Administrator'}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-200 text-sm font-semibold transition-all"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Stats Section */}
      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <StatCard title="Total Tickets" value={stats.totalTickets} icon={Database} colorClass="text-sky-400" bgClass="bg-sky-500/10" />
          <StatCard title="Open Tickets" value={stats.openTickets} icon={Inbox} colorClass="text-yellow-400" bgClass="bg-yellow-500/10" />
          <StatCard title="Resolved" value={stats.resolvedTickets} icon={CheckCircle2} colorClass="text-emerald-400" bgClass="bg-emerald-500/10" />
          <StatCard title="Escalations" value={stats.escalatedTickets} icon={AlertTriangle} colorClass="text-orange-400" bgClass="bg-orange-500/10" />
          <StatCard title="High Priority" value={stats.highPriorityTickets} icon={Sparkles} colorClass="text-red-400" bgClass="bg-red-500/10" />
          <StatCard title="Avg Risk Score" value={`${stats.averageRiskScore}/100`} icon={Gauge} colorClass="text-pink-400" bgClass="bg-pink-500/10" />
        </section>
      )}

      {/* Dashboard Insights Banner */}
      {stats?.mlInsights && (
        <section className="glass rounded-3xl p-5 border border-purple-500/20 bg-purple-950/10 mb-6 flex items-start gap-4 shadow-xl">
          <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400 flex-shrink-0 animate-pulse">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Python ML-Powered Risk Analysis</h3>
            <p className="text-slate-300 text-sm mt-1">{stats.mlInsights.recommendation}</p>
            <div className="flex flex-wrap gap-4 mt-2.5 text-xs text-slate-400">
              <span>Top Risk Category: <b className="text-purple-300">{stats.mlInsights.topRiskCategory}</b></span>
              <span>Escalation Rate: <b className="text-purple-300">{stats.mlInsights.escalationRate}%</b></span>
              <span>Open High-Risk Tickets: <b className="text-purple-300">{stats.mlInsights.openHighRiskTickets}</b></span>
            </div>
          </div>
        </section>
      )}

      {/* Charts Section */}
      {stats && (
        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          <SentimentPieChart data={stats.sentimentDistribution} />
          <CategoryBarChart data={stats.categoryDistribution} />
          <PriorityPieChart data={stats.priorityDistribution} />
          <DailyTicketsLineChart data={stats.dailyTickets} />
          <ChurnRiskChart data={stats.churnRiskDistribution} />
        </section>
      )}

      {/* Tickets List Section */}
      <section className="glass rounded-3xl p-6 border border-white/10 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-sky-400" />
            <h2 className="text-xl font-bold text-white">Ticket Registry</h2>
          </div>
          
          {/* Filters controls */}
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-sky-500/50"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select 
              value={filters.priority}
              onChange={e => setFilters({ ...filters, priority: e.target.value })}
              className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-sky-500/50"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <select 
              value={filters.sentiment}
              onChange={e => setFilters({ ...filters, sentiment: e.target.value })}
              className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-sky-500/50"
            >
              <option value="">All Sentiments</option>
              <option value="Positive">Positive</option>
              <option value="Neutral">Neutral</option>
              <option value="Frustrated">Frustrated</option>
              <option value="Angry">Angry</option>
            </select>

            {(filters.status || filters.priority || filters.sentiment) && (
              <button 
                onClick={() => setFilters({ status: '', priority: '', sentiment: '' })}
                className="p-2 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                title="Clear Filters"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Tickets Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-3">Customer</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Sentiment</th>
                <th className="pb-3">Priority</th>
                <th className="pb-3">Churn Risk</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Submitted</th>
                <th className="pb-3 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredTickets.map(ticket => (
                <tr 
                  key={ticket._id} 
                  className="hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <td className="py-4 pl-3">
                    <p className="font-bold text-white">{ticket.customerName}</p>
                    <p className="text-xs text-slate-400 font-medium">{ticket.email}</p>
                  </td>
                  <td className="py-4">{ticket.category}</td>
                  <td className="py-4"><Badge type={ticket.sentiment}>{ticket.sentiment}</Badge></td>
                  <td className="py-4"><Badge type={ticket.priority}>{ticket.priority}</Badge></td>
                  <td className="py-4"><Badge type={ticket.churnRisk}>{ticket.churnRisk}</Badge></td>
                  <td className="py-4"><Badge type={ticket.status}>{ticket.status}</Badge></td>
                  <td className="py-4 text-slate-400 text-xs">
                    {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-4 pr-3 text-right" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => setSelectedTicket(ticket)}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 text-sky-300 text-xs font-semibold tracking-wide transition-all"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredTickets.length && (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-500">
                    No tickets match the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl relative p-6 md:p-8 animate-scaleIn">
            {/* Close */}
            <button 
              onClick={() => setSelectedTicket(null)}
              className="absolute top-6 right-6 p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex flex-wrap gap-4 items-start justify-between border-b border-white/5 pb-4 mb-6 pr-8">
              <div>
                <span className="text-slate-400 text-xs">CUSTOMER CARE TICKET</span>
                <h2 className="text-2xl font-black text-white mt-1">{selectedTicket.customerName}</h2>
                <p className="text-slate-400 text-xs">{selectedTicket.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge type={selectedTicket.priority}>{selectedTicket.priority} Priority</Badge>
                <Badge type={selectedTicket.sentiment}>{selectedTicket.sentiment}</Badge>
                <Badge type={selectedTicket.status}>{selectedTicket.status}</Badge>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Original Complaint</h4>
                <div className="p-4 rounded-2xl bg-black/45 border border-white/5 text-slate-200 text-sm leading-relaxed">
                  {selectedTicket.message}
                </div>
              </div>

              {/* AI Analysis metrics */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 uppercase tracking-wider block">AI Engine</span>
                    <span className="text-sm font-semibold text-sky-300">{selectedTicket.aiEngine || 'Groq LLM'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 uppercase tracking-wider block">Category Classifier</span>
                    <span className="text-sm font-semibold text-white">{selectedTicket.category || 'General'}</span>
                  </div>
                  <div className="space-y-1 flex items-center gap-2">
                    <Gauge size={16} className="text-pink-400" />
                    <div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider block">Churn Risk Score</span>
                      <span className="text-sm font-semibold text-white">{selectedTicket.riskScore}/100 ({selectedTicket.churnRisk})</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1 flex items-center gap-2">
                    <Clock size={16} className="text-yellow-400" />
                    <div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider block">Predicted SLA Response</span>
                      <span className="text-sm font-semibold text-white">{selectedTicket.slaHours || 24} hours</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 uppercase tracking-wider block">ML Confidence Level</span>
                    <span className="text-sm font-semibold text-white">{Math.round((selectedTicket.mlConfidence || 0) * 100)}%</span>
                  </div>
                  <div className="space-y-1 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-400" />
                    <div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider block">Escalation Required</span>
                      <span className="text-sm font-semibold text-white">{selectedTicket.escalationRequired ? 'YES' : 'NO'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary and Escalation Reason */}
              <div className="space-y-4 border-t border-white/5 pt-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block">AI Generated Summary</span>
                  <p className="text-sm text-slate-200">{selectedTicket.summary}</p>
                </div>
                {selectedTicket.escalationReason && (
                  <div className="p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/10 flex gap-2">
                    <BrainCircuit size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-orange-200 block uppercase tracking-wider">Escalation Reasoning</span>
                      <p className="text-slate-300 mt-0.5">{selectedTicket.escalationReason}</p>
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block">Recommended Resolution Action</span>
                  <p className="text-sm text-slate-200">{selectedTicket.recommendedAction}</p>
                </div>
              </div>

              {/* Suggested Reply box */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suggested Care Reply</h4>
                  <button 
                    onClick={() => regenerateReply(selectedTicket._id)}
                    disabled={replyLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    <Sparkles size={14} className={replyLoading ? 'animate-spin' : ''} />
                    <span>{replyLoading ? 'Regenerating...' : 'Regenerate'}</span>
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-sky-950/10 border border-sky-500/15 text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                  {selectedTicket.suggestedReply}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 border-t border-white/5 pt-5 justify-end">
                {selectedTicket.status !== 'In Progress' && (
                  <button 
                    onClick={() => updateStatus(selectedTicket._id, 'In Progress')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 text-yellow-300 text-sm font-semibold transition-all"
                  >
                    <Clock size={16} />
                    <span>Mark In Progress</span>
                  </button>
                )}
                {selectedTicket.status !== 'Resolved' && (
                  <button 
                    onClick={() => updateStatus(selectedTicket._id, 'Resolved')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-300 text-sm font-semibold transition-all"
                  >
                    <CheckCircle2 size={16} />
                    <span>Mark Resolved</span>
                  </button>
                )}
                {selectedTicket.status !== 'Open' && (
                  <button 
                    onClick={() => updateStatus(selectedTicket._id, 'Open')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 text-sky-300 text-sm font-semibold transition-all"
                  >
                    <Inbox size={16} />
                    <span>Reopen Ticket</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// --- App Root Component with Routing configuration ---
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public customer complaint chatbot */}
          <Route path="/" element={<Home />} />
          
          {/* Admin gate login page */}
          <Route path="/admin-login" element={<AdminLogin />} />
          
          {/* Protected admin dashboard */}
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
