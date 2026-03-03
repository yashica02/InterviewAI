import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InterviewSession, SessionStatus } from '../types';
import { getSessionByEmailOtp } from '../services/dynamodbService';
import { ShieldCheck, ArrowRight, Camera } from 'lucide-react';

interface Props {
  sessions: InterviewSession[]; // Keep for backward compatibility if needed
}

/**
 * Gatekeeper view for candidates.
 * Requires a valid OTP to proceed and enforces privacy consent for recording.
 */
const StartSessionView: React.FC<Props> = ({ sessions }) => {
  const [otp, setOtp] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const navigate = useNavigate();

  /**
   * Verifies the OTP against DynamoDB.
   */
  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    if (!candidateEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setError(null);
      const foundSession = await getSessionByEmailOtp(candidateEmail, otp);

      if (foundSession) {
        // ✅ foundSession is already typed as GetSessionResult!
        setSession({
          id: foundSession.sessionId,
          otp,
          candidateEmail: foundSession.candidateEmail,
          companyName: foundSession.companyName,
          jobTitle: foundSession.jobTitle,
          companyWebsite: '',
          jobDescription: '',
          status: foundSession.status as SessionStatus || SessionStatus.QUESTIONS_READY,
          questions: foundSession.questions,
          transcript: '',
          report: undefined,
          createdAt: foundSession.createdAt
        });
        setError(null);
        return; // Exit early - consent screen shows next
      } else {
        setError("Invalid email or OTP. Please check and try again.");
      }
    } catch (error) {
      console.error('DynamoDB lookup failed:', error);
      setError("Session lookup failed. Please check your connection and try again.");
    }
  };

  /**
   * Finalizes session entry and redirects to the live interview room.
   */
  const handleStart = () => {
  if (session && consent) {
    navigate(`/interview/${session.id}`, { 
      state: { session } 
    });
  }
};


  // Step 2: Confirmation & Consent screen
  if (session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-indigo-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-indigo-600 p-3 rounded-2xl">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Setup Your Interview</h2>
              <p className="text-slate-500">{session.jobTitle} at {session.companyName}</p>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">Consent & Data Usage</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0" />
                  Your video and audio will be recorded for analysis.
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0" />
                  AI will transcribe your speech and evaluate non-verbal cues.
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0" />
                  A feedback report will be generated and shared via email.
                </li>
              </ul>
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <input 
                type="checkbox" 
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 text-sm font-medium group-hover:text-indigo-600 transition-colors">
                I consent to being recorded and agree to the platform's terms of service regarding AI analysis of my data.
              </span>
            </label>
          </div>

          <button 
            disabled={!consent}
            onClick={handleStart}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
          >
            Enter Interview Room
          </button>
        </div>
      </div>
    );
  }

  // Step 1: OTP Entry screen
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8">
        <ShieldCheck className="w-10 h-10 text-indigo-600" />
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-4">Start Your Session</h2>
      <p className="text-slate-600 mb-8">Enter the 6-digit OTP provided by your instructor or system administrator.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 text-left">Candidate Email</label>
          <input 
            type="email"
            required
            className="w-full text-left px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 outline-none transition-all"
            placeholder="candidate@example.com"
            value={candidateEmail}
            onChange={e => setCandidateEmail(e.target.value)}
          />
        </div>

        <input 
          type="text"
          maxLength={6}
          className="w-full text-center text-4xl font-mono font-bold tracking-[0.4em] py-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-200"
          placeholder="000000"
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => e.key === 'Enter' && handleVerify()}
        />
        
        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

        <button 
          onClick={handleVerify}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
        >
          Verify OTP
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default StartSessionView;