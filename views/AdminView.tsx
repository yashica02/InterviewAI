
import React, { useState } from 'react';
import { InterviewSession, SessionStatus } from '../types';
import { LayoutDashboard, Users, Clock, FileText, Search, MoreVertical, RefreshCw, Send, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  sessions: InterviewSession[];
  updateSession: (id: string, updates: Partial<InterviewSession>) => void;
}

/**
 * Administrative dashboard for monitoring mock interviews.
 * Provides real-time status tracking and search across all candidate sessions.
 */
const AdminView: React.FC<Props> = ({ sessions, updateSession }) => {
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Filter sessions based on candidate email, company, or the 6-digit OTP.
   */
  const filteredSessions = sessions.filter(s => 
    s.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.otp.includes(searchTerm)
  );

  /**
   * Helper to determine badge styling based on the session status.
   */
  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.CREATED: return 'bg-slate-100 text-slate-600';
      case SessionStatus.QUESTIONS_READY: return 'bg-blue-100 text-blue-600';
      case SessionStatus.IN_INTERVIEW: return 'bg-amber-100 text-amber-600 animate-pulse';
      case SessionStatus.UPLOADED: return 'bg-indigo-100 text-indigo-600';
      case SessionStatus.SCORED: return 'bg-green-100 text-green-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Page Heading & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Console</h1>
          <p className="text-slate-500">Monitor and manage all candidate interview sessions.</p>
        </div>
        <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-slate-200 w-full md:w-96">
          <Search className="w-5 h-5 text-slate-400 m-2" />
          <input 
            type="text" 
            className="bg-transparent border-none outline-none w-full text-sm font-medium"
            placeholder="Search email, company, or OTP..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { icon: Users, label: "Total Sessions", value: sessions.length, color: "bg-indigo-500" },
          { icon: Clock, label: "Active Interviews", value: sessions.filter(s => s.status === SessionStatus.IN_INTERVIEW).length, color: "bg-amber-500" },
          { icon: FileText, label: "Reports Generated", value: sessions.filter(s => s.status === SessionStatus.SCORED).length, color: "bg-green-500" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-2xl text-white`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Session Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role / Company</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">OTP</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">{s.candidateEmail}</div>
                    <div className="text-xs text-slate-500">{s.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">{s.jobTitle}</div>
                    <div className="text-xs text-slate-500">{s.companyName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-mono font-bold text-indigo-600">{s.otp}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {s.status === SessionStatus.SCORED && (
                        <Link to={`/report/${s.id}`} className="p-2 hover:bg-white rounded-lg border border-slate-200 text-slate-600 shadow-sm transition-all" title="View Report">
                          <Eye className="w-4 h-4" />
                        </Link>
                      )}
                      <button className="p-2 hover:bg-white rounded-lg border border-slate-200 text-slate-600 shadow-sm transition-all" title="Retry Analysis">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-white rounded-lg border border-slate-200 text-slate-600 shadow-sm transition-all" title="Resend Report">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No matching sessions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
