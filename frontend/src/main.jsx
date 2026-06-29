import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { 
  Bot, LayoutDashboard, Send, Sparkles, AlertTriangle, 
  CheckCircle2, BrainCircuit, Gauge, LogOut, Database, 
  Inbox, User, Filter, X, Clock, Shield, ArrowRight,
  ArrowLeft, Lock, Mail
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
  const { admin, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('portal') === 'admin' ? 'admin_form' : 'select';
  });

  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState('name'); // name | email | complaint | processing | followup | ended
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const stepRef = useRef('name');
  const userDataRef = useRef({ customerName: '', email: '' });

  // CSAT rating states
  const [ticketId, setTicketId] = useState(null);
  const [csatRatingValue, setCsatRatingValue] = useState(0);
  const [csatSubmitted, setCsatSubmitted] = useState(false);

  const setStepSynced = (s) => { stepRef.current = s; setStep(s); };

  const handleCsatRating = async (rating) => {
    setCsatRatingValue(rating);
    setCsatSubmitted(true);
    if (ticketId) {
      try {
        await api.patch(`/tickets/${ticketId}/csat`, { csatRating: rating });
        addBotMsg(
          "Thank you for rating your support experience! 💖\n\nIf you have any **additional comments or feedback**, please type them below. Otherwise, you're all set!",
          'text', {}, 850
        );
      } catch (err) {
        console.error("CSAT submission failed:", err);
      }
    }
  };

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

  const startCustomerChat = (name, email) => {
    userDataRef.current = { customerName: name, email: email };
    setStepSynced('complaint');
    setView('chatbot');
    addBotMsg(
      `👋 Welcome, **${name}**! I've loaded your verified details (**${email}**).\n\nI use **Groq AI + Python ML** to instantly analyze your concern, detect urgency, and ensure the fastest possible resolution.\n\nPlease **describe your issue** in as much detail as possible so I can analyze and route it to the right team.`,
      'text', {}, 500
    );
  };

  const triggerSimulation = (type) => {
    let name = '';
    let email = '';
    let complaint = '';
    
    if (type === 'double_charge') {
      name = 'David Lee';
      email = 'david.lee@example.com';
      complaint = "I paid for a premium subscription 5 days ago, but the payment failed twice on my bank statement and I was charged twice. I still have no access to the premium features and nobody is answering support! Refund my money now or I'm disputing the charges!";
    } else if (type === 'hindi_late_delivery') {
      name = 'Aarav Sharma';
      email = 'aarav.sharma@example.com';
      complaint = "मेरा ऑर्डर 4 दिन से डिले है। (My order is delayed by 4 days. This was a birthday gift and now it is completely ruined. Extremely unhappy with your service. cancel my order and give me refund!)";
    } else if (type === 'locked_account') {
      name = 'Emma Watson';
      email = 'emma.watson@example.com';
      complaint = "I can't log in to my account. It says 'account locked due to security'. Please unlock it, I have urgent reports to submit today.";
    }

    setCustName(name);
    setCustEmail(email);
    startCustomerChat(name, email);
    
    setTimeout(() => {
      handleSend(complaint);
    }, 1500);
  };

  // Auto-scroll on new messages
  useEffect(() => {
    if (view === 'chatbot') {
      const t = setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
      return () => clearTimeout(t);
    }
  }, [messages, isTyping, view]);

  // Re-focus input after bot finishes typing
  useEffect(() => {
    if (view === 'chatbot' && !isTyping && !isLoading) {
      inputRef.current?.focus();
    }
  }, [isTyping, isLoading, view]);

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

    if (currentStep === 'complaint') {
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

        setTicketId(data._id);

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
        setStepSynced('csat');
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, {
            id: `bot-csat-${Date.now()}`,
            from: 'bot',
            type: 'csat',
            content: 'How would you rate your experience with CareMind AI today?'
          }]);
        }, 800);
      }
    } else if (currentStep === 'csat') {
      if (ticketId) {
        api.patch(`/tickets/${ticketId}/csat`, { csatFeedback: raw }).catch(e => console.error(e));
      }
      setStepSynced('ended');
      addBotMsg("Thank you for your valuable feedback! 😊 Have a wonderful day! 🌟");
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

    if (msg.type === 'csat') {
      return (
        <div key={msg.id} className="flex items-end gap-2.5 animate-fadeSlideUp">
          <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0 mb-1">
            <Bot size={15} className="text-sky-400" />
          </div>
          <div className="space-y-2 max-w-[78%]">
            <div className="px-4 py-3 text-sm leading-relaxed bg-white/5 border border-white/[0.08] text-slate-200 rounded-2xl rounded-bl-sm">
              <p className="font-semibold mb-3">{msg.content}</p>
              
              {!csatSubmitted ? (
                <div className="flex gap-2 justify-center py-1 bg-black/25 rounded-xl border border-white/5 p-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={(e) => { e.preventDefault(); handleCsatRating(star); }}
                      className="text-2xl hover:scale-125 active:scale-95 transition-transform duration-150 focus:outline-none"
                    >
                      {star <= csatRatingValue ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 mt-1">
                  <CheckCircle2 size={13} /> Rating submitted! Thank you.
                </p>
              )}
            </div>
            {!csatSubmitted && (
              <p className="text-[10px] text-slate-600 pl-1 italic">Tap a star to rate</p>
            )}
          </div>
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

  // ── RENDER PATHS ──

  if (view === 'select') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[#070b16] bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,#1e3a8a28,transparent),radial-gradient(ellipse_60%_50%_at_100%_100%,#9333ea22,transparent)]">
        <div className="w-full max-w-4xl flex flex-col items-center">
          {/* Logo / Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-sky-500/20 to-purple-600/10 border border-sky-400/25 mb-4 animate-pulse">
              <BrainCircuit className="text-sky-300 w-10 h-10" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              CareMind <span className="bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">AI Portal</span>
            </h1>
            <p className="text-slate-400 mt-3 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              Welcome to the CareMind AI gateway. Please choose your path below to begin.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
            {/* Customer Portal Card */}
            <div 
              onClick={() => setView('customer_form')}
              className="glass hover:bg-white/[0.08] border border-white/10 hover:border-sky-500/30 rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-2xl group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-6 group-hover:bg-sky-500/20 group-hover:border-sky-500/40 transition-all">
                  <Bot className="text-sky-400 w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Customer Support</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Report billing, technical, or product issues. Interact with our real-time emotion-aware assistant.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Start Support Chat</span>
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Administrator Portal Card */}
            <div 
              onClick={() => setView('admin_form')}
              className="glass hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/30 rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-2xl group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 group-hover:border-purple-500/40 transition-all">
                  <Shield className="text-purple-400 w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Manager Workspace</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Access retention metrics, resolve complaints, monitor churn risks, and view Python ML-powered analytics.
                </p>
              </div>
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Access Admin Gate</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>

          {/* Admin Logged In Quick Link */}
          {admin && (
            <div className="mt-8">
              <button 
                onClick={() => navigate('/admin-dashboard')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold transition-all"
              >
                <LayoutDashboard size={14} />
                <span>Logged in as {admin.name} — Go to Dashboard</span>
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (view === 'customer_form') {
    const handleCustomerSubmit = (e) => {
      e.preventDefault();
      if (!custName.trim() || !custEmail.trim()) return;
      if (!custEmail.includes('@') || !custEmail.includes('.')) {
        alert("Please enter a valid email address.");
        return;
      }
      startCustomerChat(custName, custEmail);
    };

    return (
      <main className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[#070b16] bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,#1e3a8a28,transparent),radial-gradient(ellipse_60%_50%_at_100%_100%,#9333ea22,transparent)]">
        <div className="w-full max-w-md">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 mb-3 animate-pulse">
              <Bot className="text-sky-400 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Customer Support Gate</h2>
            <p className="text-slate-400 mt-2 text-xs">Enter your details to initiate a live care chat</p>
          </div>

          {/* Form Card */}
          <div className="glass rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-sky-500/0 via-sky-500/50 to-sky-500/0"></div>
            
            <button 
              onClick={() => setView('select')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-all"
            >
              <ArrowLeft size={12} />
              <span>Back to Selection</span>
            </button>

            {/* Simulation chips */}
            <div className="mb-6 p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-widest block mb-2">Hackathon Demo Simulator</span>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => triggerSimulation('double_charge')}
                  className="text-left px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-sky-500/30 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="font-semibold block text-sky-300">Scenario 1: Double Charged (High Risk)</span>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[280px]">"charged twice... refund money now..."</span>
                  </div>
                  <Sparkles size={12} className="text-slate-500 group-hover:text-sky-300 transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => triggerSimulation('hindi_late_delivery')}
                  className="text-left px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="font-semibold block text-purple-300">Scenario 2: Hindi Late Delivery (Multilingual)</span>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[280px]">"मेरा ऑर्डर डिले है... जन्मदिन का उपहार..."</span>
                  </div>
                  <Sparkles size={12} className="text-slate-500 group-hover:text-purple-300 transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => triggerSimulation('locked_account')}
                  className="text-left px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="font-semibold block text-emerald-300">Scenario 3: Account Locked (Urgent SLA)</span>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[280px]">"It says account locked. Need report submission..."</span>
                  </div>
                  <Sparkles size={12} className="text-slate-500 group-hover:text-emerald-300 transition-colors" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCustomerSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm"
                    placeholder="jane.doe@example.com"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-sky-500/20 active:translate-y-[1px] transition-all flex items-center justify-center gap-2"
              >
                <span>Start Live Support</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  if (view === 'admin_form') {
    const handleAdminSubmit = async (e) => {
      e.preventDefault();
      setLoginError('');

      if (!adminEmail || !adminPassword) {
        setLoginError('Please enter both email and password.');
        return;
      }

      const res = await login(adminEmail, adminPassword);
      if (res.success) {
        navigate('/admin-dashboard');
      } else {
        setLoginError(res.message);
      }
    };

    return (
      <main className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[#070b16] bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,#1e3a8a28,transparent),radial-gradient(ellipse_60%_50%_at_100%_100%,#9333ea22,transparent)]">
        <div className="w-full max-w-md">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-3 animate-pulse">
              <Shield className="text-purple-400 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Administrator Gate</h2>
            <p className="text-slate-400 mt-2 text-xs">Verify credentials to access retention console</p>
          </div>

          {/* Form Card */}
          <div className="glass rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0"></div>
            
            <button 
              onClick={() => setView('select')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-all"
            >
              <ArrowLeft size={12} />
              <span>Back to Selection</span>
            </button>

            {loginError && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
                    placeholder="admin@caremind.ai"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-purple-500/20 active:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Access Dashboard</span>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Demo Admin Account: <span className="text-slate-400">admin@caremind.ai</span> / <span className="text-slate-400">Admin@123</span>
            </p>
          </div>
        </div>
      </main>
    );
  }

  // view === 'chatbot'
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
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setView('select');
                  setMessages([]);
                  setCustName('');
                  setCustEmail('');
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all"
              >
                <ArrowLeft size={13} className="text-slate-400" />
                <span>Exit</span>
              </button>
              <Link
                to="/admin-dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all"
              >
                <Shield size={13} className="text-sky-300" />
                Admin <ArrowRight size={11} />
              </Link>
            </div>
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

  // Real-time alerts, polling, and email response states
  const [modalReply, setModalReply] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailSentText, setEmailSentText] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const ticketIdsRef = useRef(new Set());

  // Filters state
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    sentiment: ''
  });

  const addToast = (ticket) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, ticket }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const loadDashboardData = async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        api.get('/tickets'),
        api.get('/analytics/summary')
      ]);
      setTickets(ticketsRes.data);
      setStats(statsRes.data);
      
      // Initialize existing ticket IDs
      ticketsRes.data.forEach(t => ticketIdsRef.current.add(t._id));
    } catch (err) {
      console.error('Failed to load dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardDataSilent = async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        api.get('/tickets'),
        api.get('/analytics/summary')
      ]);
      
      const newTickets = ticketsRes.data;
      if (ticketIdsRef.current.size > 0) {
        newTickets.forEach(ticket => {
          if (!ticketIdsRef.current.has(ticket._id)) {
            ticketIdsRef.current.add(ticket._id);
            addToast(ticket);
          }
        });
      } else {
        newTickets.forEach(t => ticketIdsRef.current.add(t._id));
      }

      setTickets(newTickets);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Silent refresh failed:', err.message);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Poll every 15 seconds for real-time live refresh
    const timer = setInterval(loadDashboardDataSilent, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      setModalReply(selectedTicket.suggestedReply || '');
      setEmailSent(false);
      setEmailSentText('');
    }
  }, [selectedTicket]);

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
        <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
          <StatCard title="Total Tickets" value={stats.totalTickets} icon={Database} colorClass="text-sky-400" bgClass="bg-sky-500/10" />
          <StatCard title="Open Tickets" value={stats.openTickets} icon={Inbox} colorClass="text-yellow-400" bgClass="bg-yellow-500/10" />
          <StatCard title="Resolved" value={stats.resolvedTickets} icon={CheckCircle2} colorClass="text-emerald-400" bgClass="bg-emerald-500/10" />
          <StatCard title="Escalations" value={stats.escalatedTickets} icon={AlertTriangle} colorClass="text-orange-400" bgClass="bg-orange-500/10" />
          <StatCard title="High Priority" value={stats.highPriorityTickets} icon={Sparkles} colorClass="text-red-400" bgClass="bg-red-500/10" />
          <StatCard title="Avg Risk Score" value={`${stats.averageRiskScore}/100`} icon={Gauge} colorClass="text-pink-400" bgClass="bg-pink-500/10" />
          <StatCard title="Average CSAT" value={stats.averageCsat ? `⭐ ${stats.averageCsat}/5.0` : 'N/A'} icon={Sparkles} colorClass="text-yellow-300" bgClass="bg-yellow-500/10" />
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 font-medium">{ticket.email}</span>
                      {ticket.csatRating && (
                        <span className="text-[10px] text-yellow-400 font-black bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                          ⭐ {ticket.csatRating}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-col gap-0.5">
                      <span>{ticket.category}</span>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5">
                        🌐 {ticket.detectedLanguage || 'English'}
                      </span>
                    </div>
                  </td>
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
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Original Complaint</h4>
                  {selectedTicket.detectedLanguage && (
                    <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-lg font-bold">
                      Detected Language: <span className="text-sky-300 uppercase">{selectedTicket.detectedLanguage}</span>
                    </span>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-black/45 border border-white/5 text-slate-200 text-sm leading-relaxed">
                  {selectedTicket.message}
                </div>
              </div>

              {selectedTicket.detectedLanguage && selectedTicket.detectedLanguage.toLowerCase() !== 'english' && selectedTicket.translatedMessage && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                    🌐 English Translation
                  </h4>
                  <div className="p-4 rounded-2xl bg-sky-950/15 border border-sky-500/10 text-slate-200 text-sm leading-relaxed italic">
                    "{selectedTicket.translatedMessage}"
                  </div>
                </div>
              )}

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

              {/* Suggested Reply box with Templates & Dispatch */}
              <div className="space-y-3 border-t border-white/5 pt-4">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suggested Care Reply (Editable)</h4>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">Template:</span>
                    <select
                      onChange={e => {
                        const val = e.target.value;
                        const name = selectedTicket?.customerName || 'Customer';
                        const cat = selectedTicket?.category || 'General';
                        const templates = {
                          refund: `Dear ${name},

Thank you for reaching out. We have approved a full refund for your transaction. 

The funds will reflect in your account within 3 to 5 business days. We appreciate your patience.

Best regards,
CareMind Support Team`,
                          investigate: `Dear ${name},

We are writing to acknowledge your concern regarding your ${cat} issue. 

Our engineering team is actively investigating. We expect to have an update for you within 4 hours.

Best regards,
CareMind Support Team`,
                          escalation: `Dear ${name},

We have escalated your concern directly to our senior customer success manager. 

They will contact you personally within the hour to resolve this. We apologize for the frustration caused.

Best regards,
CareMind Support Team`
                        };
                        if (templates[val]) setModalReply(templates[val]);
                      }}
                      defaultValue=""
                      className="bg-black/35 border border-white/10 rounded-xl px-2 py-1 text-[11px] text-slate-300 outline-none focus:border-sky-500/50"
                    >
                      <option value="" disabled>Choose a template...</option>
                      <option value="refund">Refund Approved</option>
                      <option value="investigate">Under Investigation</option>
                      <option value="escalation">Urgent Escalation</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => regenerateReply(selectedTicket._id)}
                    disabled={replyLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    <Sparkles size={14} className={replyLoading ? 'animate-spin' : ''} />
                    <span>{replyLoading ? 'Regenerating...' : 'Regenerate'}</span>
                  </button>
                </div>

                <textarea
                  value={modalReply}
                  onChange={e => setModalReply(e.target.value)}
                  className="w-full h-36 p-4 rounded-2xl bg-black/45 border border-white/10 text-slate-200 text-sm leading-relaxed focus:outline-none focus:border-sky-500/50 resize-none font-sans"
                  placeholder="Type your response email here..."
                />

                <div className="flex justify-between items-center border-t border-white/5 pt-3">
                  {emailSent ? (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-fadeIn">
                      <CheckCircle2 size={14} /> {emailSentText}
                    </span>
                  ) : (
                    <button
                      onClick={async () => {
                        setSendLoading(true);
                        try {
                          const res = await api.post(`/tickets/${selectedTicket._id}/send-response`, { message: modalReply });
                          if (res.data.responseStatus === 'sent') {
                            setEmailSentText("Response sent successfully");
                          } else {
                            setEmailSentText("Response saved in demo mode");
                          }
                          setEmailSent(true);
                          loadDashboardData();
                        } catch (err) {
                          alert("Failed to send response");
                        } finally {
                          setSendLoading(false);
                        }
                      }}
                      disabled={sendLoading || !modalReply.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {sendLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Send Response Email</span>
                      )}
                    </button>
                  )}
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

      {/* Floating real-time alert notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className="animate-fadeSlideUp flex items-start gap-3 p-4 rounded-2xl bg-slate-900 border border-purple-500/40 shadow-2xl shadow-purple-950/20 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 h-full w-[4px] bg-gradient-to-b from-sky-400 to-purple-500"></div>
            <div className="p-1.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
              <BrainCircuit size={18} />
            </div>
            <div className="flex-1 text-xs text-left">
              <p className="font-bold text-white mb-0.5 text-left">🚨 Critical Alert: New Ticket</p>
              <p className="text-slate-300 text-left">
                Customer <strong className="text-white">{toast.ticket.customerName}</strong> submitted a <strong className="text-white">{toast.ticket.category}</strong> complaint.
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                  {toast.ticket.priority} Priority
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Risk: {toast.ticket.churnRisk}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
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
