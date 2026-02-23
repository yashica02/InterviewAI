
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Briefcase, Video, Settings, LayoutDashboard, CheckCircle, ChevronRight, Menu, X } from 'lucide-react';
import { SessionStatus, InterviewSession } from './types';
import RegistrationView from './views/RegistrationView';
import InterviewView from './views/InterviewView';
import AdminView from './views/AdminView';
import ReportView from './views/ReportView';
import StartSessionView from './views/StartSessionView';

/**
 * Responsive navigation header component.
 * Manages its own mobile menu toggle state.
 */
const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              InterviewAI Pro
            </span>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Home</Link>
            <Link to="/start" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Start Interview</Link>
            <Link to="/admin" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Admin Dashboard</Link>
          </nav>

          <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-4">
          <Link to="/" onClick={() => setIsOpen(false)} className="block text-slate-600 font-medium">Home</Link>
          <Link to="/start" onClick={() => setIsOpen(false)} className="block text-slate-600 font-medium">Start Interview</Link>
          <Link to="/admin" onClick={() => setIsOpen(false)} className="block text-slate-600 font-medium">Admin Dashboard</Link>
        </div>
      )}
    </header>
  );
};

/**
 * Hero landing page for the application.
 * Highlights key features and provides call-to-actions.
 */
const HomeView: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
          Master Your Next Interview with <span className="text-indigo-600">AI</span>
        </h1>
        <p className="text-xl text-slate-600 mb-8 leading-relaxed">
          Upload a job description and get a tailored mock interview. Get instant, deep feedback on your communication, technical skills, and behavioral cues.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200">
            Create Session
            <ChevronRight className="ml-2 w-5 h-5" />
          </Link>
          <Link to="/start" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-indigo-600 bg-white border-2 border-indigo-600 rounded-xl hover:bg-indigo-50 transition-all">
            Join with OTP
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: Briefcase, title: "Tailored to the Job", desc: "Our AI parses any job description to generate role-specific questions just for you." },
          { icon: Video, title: "Video Interview", desc: "Experience a realistic browser-based video interview with timed questions and live recording." },
          { icon: LayoutDashboard, title: "Deep Analysis", desc: "Receive a comprehensive report covering technical accuracy, communication style, and non-verbal cues." }
        ].map((feature, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <feature.icon className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
            <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Root App component managing the global session state.
 * Implements simple persistence using browser LocalStorage.
 */
const App: React.FC = () => {
  // Initialize state from LocalStorage to maintain data between refreshes
  const [sessions, setSessions] = useState<InterviewSession[]>(() => {
    const saved = localStorage.getItem('interview_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist session list whenever it changes
  useEffect(() => {
    localStorage.setItem('interview_sessions', JSON.stringify(sessions));
  }, [sessions]);

  /**
   * Global helper to register a new interview session.
   */
  const addSession = (session: InterviewSession) => {
    setSessions(prev => [session, ...prev]);
  };

  /**
   * Global helper to update properties of an existing session.
   * Useful for updating status, transcript, or reports.
   */
  const updateSession = (id: string, updates: Partial<InterviewSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/register" element={<RegistrationView addSession={addSession} />} />
            <Route path="/start" element={<StartSessionView sessions={sessions} />} />
            <Route path="/interview/:id" element={<InterviewView sessions={sessions} updateSession={updateSession} />} />
            <Route path="/report/:id" element={<ReportView sessions={sessions} />} />
            <Route path="/admin" element={<AdminView sessions={sessions} updateSession={updateSession} />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-slate-200 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} InterviewAI Pro. All rights reserved.
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
