
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { InterviewSession, ScoreDimension } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Download, Share2, CheckCircle2, AlertTriangle, MessageSquare, Award, ArrowLeft } from 'lucide-react';

interface Props {
  sessions: InterviewSession[];
}

/**
 * Visual feedback dashboard for interview performance.
 * Uses Recharts to visualize AI-driven scores across multiple dimensions.
 */
const ReportView: React.FC<Props> = ({ sessions }) => {
  const { id } = useParams();
  const session = sessions.find(s => s.id === id);

  // Guard: Ensure session and report data are available
  if (!session || !session.report) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p>Report not found or still processing.</p>
        <Link to="/" className="text-indigo-600 mt-4 block">Back Home</Link>
      </div>
    );
  }

  const { overallDimensions, technicalCommunication, strengths, improvements, summary } = session.report;

  /**
   * Transforms dimension data into the Radar Chart format.
   */
  const radarData = [
    { subject: 'Ability', A: overallDimensions.ability.score, fullMark: 100 },
    { subject: 'Knowledge', A: overallDimensions.knowledge.score, fullMark: 100 },
    { subject: 'Skillset', A: overallDimensions.skillset.score, fullMark: 100 },
    { subject: 'Attitude', A: overallDimensions.attitude.score, fullMark: 100 },
  ];

  /**
   * Transforms communication criteria into the Horizontal Bar Chart format.
   */
  const barData = technicalCommunication.map(tc => ({
    name: tc.criterion,
    score: tc.score,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Page Header with Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <Link to="/" className="inline-flex items-center text-indigo-600 font-medium mb-4 hover:gap-2 transition-all">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-slate-900">Performance Report</h1>
          <p className="text-slate-500">Interview for {session.companyName} • {new Date(session.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Main Text Summary and Dimension Progress Bars */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-slate-900">Executive Summary</h2>
          </div>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">{summary}</p>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {(Object.entries(overallDimensions) as [string, ScoreDimension][]).map(([key, dim]) => (
              <div key={key} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{dim.label}</span>
                  <span className="text-2xl font-bold text-indigo-600">{dim.score}/100</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full mb-4">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${dim.score}%` }} />
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{dim.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Performance Visualization */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center">
          <h3 className="text-xl font-bold text-slate-900 mb-8 self-start">Performance Balance</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                <Radar name="Candidate" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-4 w-full">
             <div className="p-4 bg-indigo-50 rounded-2xl">
               <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-1">Top Dimension</span>
               <p className="font-bold text-slate-900 capitalize">
                {(Object.entries(overallDimensions) as [string, ScoreDimension][]).sort((a,b) => b[1].score - a[1].score)[0][1].label}
               </p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Detailed Behavioral Criteria Rubric Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-slate-900">Communication & Behavior Rubric</h2>
          </div>
          <div className="w-full h-96 overflow-x-auto">
            <div className="min-w-[600px] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 5]} hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    width={150}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Qualitative Findings List */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-xl font-bold">Key Strengths</h3>
            </div>
            <ul className="space-y-4">
              {strengths.map((s, i) => (
                <li key={i} className="flex gap-3 text-slate-600 leading-relaxed">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-xl font-bold">Areas to Improve</h3>
            </div>
            <ul className="space-y-4">
              {improvements.map((im, i) => (
                <li key={i} className="flex gap-3 text-slate-600 leading-relaxed">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                  {im}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
