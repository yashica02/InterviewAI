
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InterviewSession, SessionStatus } from '../types';
import { generateQuestions } from '../services/geminiService';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  addSession: (session: InterviewSession) => void;
}

/**
 * View for creating a new mock interview session.
 * Collects job data and uses AI to prepare specific questions.
 */
const RegistrationView: React.FC<Props> = ({ addSession }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local form state
  const [formData, setFormData] = useState({
    candidateEmail: '',
    companyName: '',
    companyWebsite: '',
    jobDescription: ''
  });

  const [successOTP, setSuccessOTP] = useState<string | null>(null);

  /**
   * Orchestrates the session creation process.
   * 1. Generates a unique ID and OTP.
   * 2. Calls AI service to analyze JD and generate questions.
   * 3. Commits session to global state.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const sessionId = Math.random().toString(36).substring(2, 11);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Trigger the AI generation before completing the registration
      const questions = await generateQuestions(formData.jobDescription, formData.companyName);
      
      if (!questions || questions.length === 0) {
        throw new Error("Failed to generate questions. Please try again.");
      }

      const newSession: InterviewSession = {
        id: sessionId,
        otp,
        ...formData,
        status: SessionStatus.QUESTIONS_READY,
        questions: questions,
        createdAt: Date.now()
      };

      // Add to global shared state (LocalStorage backed)
      addSession(newSession);

      // Show the success screen with the OTP
      setSuccessOTP(otp);
    } catch (err) {
      setError("Failed to generate interview questions. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Success view (After OTP generation)
  if (successOTP) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-12 rounded-3xl shadow-xl border border-indigo-100">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Sparkles className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Session Created!</h2>
          <p className="text-slate-600 mb-8">Your mock interview is ready. Please share this OTP with the candidate or use it to start now.</p>
          
          <div className="bg-slate-50 p-6 rounded-2xl mb-8 border-2 border-dashed border-slate-200">
            <span className="text-5xl font-mono font-bold tracking-[0.5em] text-indigo-600">{successOTP}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/start')}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Go to Start Page
            </button>
            <button 
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
            >
              Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Initial form view
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Interview Session</h2>
        <p className="text-slate-600 mb-8">Fill in the details below to generate a tailored AI interview.</p>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Candidate Email</label>
              <input 
                required
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="candidate@example.com"
                value={formData.candidateEmail}
                onChange={e => setFormData({...formData, candidateEmail: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name</label>
              <input 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="e.g. Acme Corp"
                value={formData.companyName}
                onChange={e => setFormData({...formData, companyName: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Company Website (Optional)</label>
            <input 
              type="url"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="https://company.com"
              value={formData.companyWebsite}
              onChange={e => setFormData({...formData, companyWebsite: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Job Description</label>
            <textarea 
              required
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder="Paste the full job description here..."
              value={formData.jobDescription}
              onChange={e => setFormData({...formData, jobDescription: e.target.value})}
            />
          </div>

          <button 
            disabled={isLoading}
            type="submit"
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-indigo-100"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Analyzing Job & Generating Questions...
              </>
            ) : (
              'Generate Mock Interview'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationView;
