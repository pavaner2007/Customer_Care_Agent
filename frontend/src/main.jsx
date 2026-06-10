import React, { useEffect, useState, useRef, useCallback } from 'react';
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

// --- Home Route: Conversational AI Chatbot ---
function Home() {
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState('name'); // name | email | complaint | processing | followup | ended
  const [userData, setUserData] = useState({ customerName: '', email: '' });
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const stepRef = useRef('name');
  const userDataRef = useRef({ customerName: '', email: '' });

  const setStepSynced = (s) => { stepRef.current = s; setStep(s); };
  const setUserDataSynced = (d) => { userDataRef.current = d; setUserData(d); };

  const addBotMsg = useCallback((content, type = 'text', extra = {}, delay = 1050) => {
    setIsTyping(true);
    return new Promise(resolve => {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { id: `bot-${Date.now()}-${Math.random()}`, from: 'bot', content, type, ...extra }]);
        resolve();
      }, delay);
    });
  }, []);

  const addUserMsg = (content) =>
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, from: 'user', content, type: 'text' }]);

  // Initial bot greeting
  useEffect(() => {
    addBotMsg(
      "👋 Hi there! I'm **CareMind AI**, your 24/7 emotion-aware customer support assistant.\n\nI use **Groq AI + Python ML** to instantly analyze your concern, detect urgency, and ensure the fastest possible resolution.\n\nLet's begin — what's your **full name**?",
      'text', {}, 700
    );
  }, [addBotMsg]);

  // Auto-scroll on new messages
  useEffect(() => {
    const t = setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    return () => clearTimeout(t);
  }, [messages, isTyping]);

  // Re-focus input after bot finishes typing
  useEffect(() => {
    if (!isTyping && !isLoading) inputRef.current?.focus();
  }, [isTyping, isLoading]);

  // Parses **bold** markdown to JSX
  const parseBold = (text) =>
    text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part
    );

  const handleSend = async (override = null) => {
    const raw = (override !== null ? override : input).trim();
    if (!raw || isLoading || isTyping) return;
    setInput('');
    addUserMsg(raw);
    const currentStep = stepRef.current;

    if (currentStep === 'name') {
      const newData = { ...userDataRef.current, customerName: raw };
      setUserDataSynced(newData);
      setStepSynced('email');
      addBotMsg(`Great to meet you, **${raw}**! 😊\n\nCould you share your **email address**? I'll use it to track your case and send you updates.`);

    } else if (currentStep === 'email') {
      if (!raw.includes('@') || !raw.includes('.')) {
        addBotMsg("Hmm, that doesn't look like a valid email. Could you double-check it? 🤔", 'text', {}, 700);
        return;
      }
      const newData = { ...userDataRef.current, email: raw };
      setUserDataSynced(newData);
      setStepSynced('complaint');
      addBotMsg(`Perfect! ✅\n\nNow, please **describe your issue** in as much detail as possible. The more context you provide, the better I can analyze urgency and route it to the right team.`);

    } else if (currentStep === 'complaint') {
      if (raw.length < 8) {
        addBotMsg("Could you provide a bit more detail about your issue? The more I know, the better I can help. 🙏", 'text', {}, 700);
        return;
      }
      setStepSynced('processing');
      setIsLoading(true);
      setIsTyping(true);

      try {
        // Show intermediate thinking message
        await new Promise(r => setTimeout(r, 1300));
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: `bot-proc-${Date.now()}`, from: 'bot',
          content: '🔍 Running Groq LLM + Python ML analysis on your complaint...',
          type: 'text'
        }]);
        setIsTyping(true);

        const { data } = await api.post('/tickets', {
          customerName: userDataRef.current.customerName,
          email: userDataRef.current.email,
          message: raw
        });

        await new Promise(r => setTimeout(r, 500));
        setIsTyping(false);
        setIsLoading(false);

        // Show analysis card
        setMessages(prev => [...prev, {
          id: `bot-analysis-${Date.now()}`, from: 'bot',
          content: data, type: 'analysis'
        }]);

        // Follow-up message
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `bot-fu-${Date.now()}`, from: 'bot',
            content: `Your ticket is registered and our team has been notified! 🎉\n\nBased on urgency, expect a response within **${data.slaHours || 24} hours**.\n\nDo you have **another issue** I can help with?`,
            type: 'text',
            quickReplies: ['Yes, another issue', "No, I'm all done"]
          }]);
          setStepSynced('followup');
        }, 1300);

      } catch {
        setIsTyping(false);
        setIsLoading(false);
        setMessages(prev => [...prev, {
          id: `bot-err-${Date.now()}`, from: 'bot',
          content: "I'm sorry, something went wrong. Please describe your issue again.",
          type: 'text'
        }]);
        setStepSynced('complaint');
      }

    } else if (currentStep === 'followup') {
      if (/yes|another|more|issue|problem|help|again/i.test(raw)) {
        setStepSynced('complaint');
        addBotMsg("Of course! Please describe your next concern and I'll analyze it right away. 💪");
      } else {
        setStepSynced('ended');
        addBotMsg("Thank you for reaching out! 😊 Your case is in safe hands with our support team.\n\nHave a wonderful day! 🌟");
      }
    }
  };

  // ── Analysis Result Card ──────────────────────────────────────────
  const AnalysisCard = ({ data }) => (
    <div className="animate-fadeSlideUp space-y-3 bg-gradient-to-br from-slate-900/90 to-sky-950/50 border border-sky-500/25 rounded-2xl p-4 shadow-2xl shadow-sky-900/20">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span className="text-emerald-300 font-bold text-xs uppercase tracking-wide">Ticket Registered</span>
        </div>
        <span className="text-xs text-slate-500 font-mono bg-white/5 px-2 py-0.5 rounded-lg">
          #{(data._id || '').slice(-6).toUpperCase() || 'NEW'}
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge type={data.sentiment}>{data.sentiment}</Badge>
        <Badge type={data.priority}>{data.priority} Priority</Badge>
        <Badge type={data.churnRisk}>{data.churnRisk} Churn Risk</Badge>
        <Badge type={data.category}>{data.category}</Badge>
      </div>

      {/* Risk Score Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Churn Risk Score</span>
          <span className={`font-black ${
            data.riskScore >= 75 ? 'text-red-400' :
            data.riskScore >= 50 ? 'text-yellow-400' : 'text-green-400'
          }`}>{data.riskScore}/100</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`risk-bar-fill h-full rounded-full ${
              data.riskScore >= 75 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
              data.riskScore >= 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
              'bg-gradient-to-r from-green-400 to-emerald-400'
            }`}
            style={{ width: `${data.riskScore}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-white/5 rounded-xl p-2.5 text-center space-y-0.5">
          <Clock size={13} className="text-yellow-400 mx-auto" />
          <div className="text-slate-500">SLA</div>
          <div className="font-black text-white">{data.slaHours || 24}h</div>
        </div>
        <div className="bg-white/5 rounded-xl p-2.5 text-center space-y-0.5">
          <BrainCircuit size={13} className="text-purple-400 mx-auto" />
          <div className="text-slate-500">ML Conf.</div>
          <div className="font-black text-white">{Math.round((data.mlConfidence || 0) * 100)}%</div>
        </div>
        <div className={`rounded-xl p-2.5 text-center space-y-0.5 ${
          data.escalationRequired ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5'
        }`}>
          <AlertTriangle size={13} className={`mx-auto ${
            data.escalationRequired ? 'text-red-400' : 'text-slate-500'
          }`} />
          <div className="text-slate-500">Escalate</div>
          <div className={`font-black ${
            data.escalationRequired ? 'text-red-300' : 'text-green-300'
          }`}>{data.escalationRequired ? 'YES' : 'NO'}</div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-white/5 rounded-xl p-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">AI Summary</div>
        <p className="text-sm text-slate-200 leading-relaxed">{data.summary}</p>
      </div>

      {/* Suggested Reply */}
      <div className="bg-sky-950/40 border border-sky-500/15 rounded-xl p-3">
        <div className="flex items-center gap-1 text-xs font-bold text-sky-300 uppercase tracking-wider mb-1.5">
          <Sparkles size={11} /> AI Suggested Reply
        </div>
        <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{data.suggestedReply}&rdquo;</p>
      </div>

      <p className="text-right text-xs text-slate-600">⚡ {data.aiEngine || 'Groq LLM + Python ML'}</p>
    </div>
  );

  // ── Single message bubble ─────────────────────────────────────────
  const renderMessage = (msg) => {
    const isBot = msg.from === 'bot';

    if (msg.type === 'analysis') {
      return (
        <div key={msg.id} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0 mt-1">
            <BrainCircuit size={15} className="text-sky-400" />
          </div>
          <div className="flex-1 min-w-0"><AnalysisCard data={msg.content} /></div>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`flex items-end gap-2.5 animate-fadeSlideUp ${!isBot ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        {isBot ? (
          <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0 mb-1">
            <Bot size={15} className="text-sky-400" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center flex-shrink-0 mb-1">
            <User size={15} className="text-purple-300" />
          </div>
        )}

        <div className="space-y-2 max-w-[78%]">
          {/* Bubble */}
          <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
            isBot
              ? 'bg-white/5 border border-white/[0.08] text-slate-200 rounded-2xl rounded-bl-sm'
              : 'bg-sky-600/25 border border-sky-500/25 text-white rounded-2xl rounded-br-sm'
          }`}>
            {parseBold(msg.content)}
          </div>

          {/* Quick reply buttons */}
          {msg.quickReplies && step === 'followup' && (
            <div className="flex flex-wrap gap-2">
              {msg.quickReplies.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(r)}
                  className="px-3.5 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-semibold transition-all"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Step labels for progress bar
  const STEPS = ['name', 'email', 'complaint', 'done'];
  const stepIdx = { name: 0, email: 1, complaint: 2, processing: 2, followup: 3, ended: 3 }[step] ?? 0;

  const inputPlaceholder = {
    name: 'Type your full name…',
    email: 'Type your email address…',
    complaint: 'Describe your issue in detail…',
    followup: 'Type your reply…',
    processing: 'Analyzing…',
    ended: 'Session ended · refresh to start again'
  }[step] ?? 'Type a message…';

  const inputDisabled = isLoading || isTyping || step === 'processing' || step === 'ended';

  return (
    <main className="min-h-screen flex items-center justify-center p-3 md:p-6 bg-[#070b16] bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,#1e3a8a28,transparent),radial-gradient(ellipse_60%_50%_at_100%_100%,#9333ea22,transparent)]">
      <div className="w-full max-w-[560px] flex flex-col" style={{ height: 'min(88vh, 760px)' }}>

        {/* ── Chat Card ── */}
        <div className="flex flex-col h-full glass rounded-3xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] flex-shrink-0 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500/25 to-purple-600/20 border border-sky-400/30 flex items-center justify-center shadow-lg shadow-sky-500/10">
                  <BrainCircuit size={20} className="text-sky-300" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#070b16] shadow-lg shadow-emerald-400/30" />
              </div>
              <div>
                <p className="font-black text-white tracking-tight">CareMind AI</p>
                <p className="text-emerald-400 text-xs flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Online · Emotion-Aware Support
                </p>
              </div>
            </div>
            <Link
              to="/admin-dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all"
            >
              <Shield size={13} className="text-sky-300" />
              Admin <ArrowRight size={11} />
            </Link>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 chat-scroll">
            {messages.map(renderMessage)}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-end gap-2.5 animate-fadeIn">
                <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0">
                  <Bot size={15} className="text-sky-400" />
                </div>
                <div className="bg-white/5 border border-white/[0.08] rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-2 h-2 rounded-full bg-sky-400 dot-bounce" />
                    <span className="w-2 h-2 rounded-full bg-sky-400 dot-bounce-2" />
                    <span className="w-2 h-2 rounded-full bg-sky-400 dot-bounce-3" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Progress Bar */}
          <div className="px-5 pt-2 pb-1 flex-shrink-0">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 rounded-full transition-all duration-700 ${
                    i <= stepIdx ? 'bg-gradient-to-r from-sky-500 to-purple-500' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-1.5 text-center">
              {['Enter your name', 'Verify email', 'Describe your issue', 'Case registered'][stepIdx]}
            </p>
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-1 flex-shrink-0">
            <div className="flex gap-2">
              <input
                id="chat-input"
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={inputPlaceholder}
                disabled={inputDisabled}
                autoComplete="off"
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-none focus:border-sky-500/50 transition-all placeholder-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <button
                id="chat-send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim() || inputDisabled}
                className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-sky-500/25"
              >
                <Send size={15} className="text-white" />
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-700 mt-2">⚡ Groq LLM + scikit-learn ML · CareMind AI v1</p>
          </div>
        </div>
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
