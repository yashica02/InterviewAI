
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InterviewSession, SessionStatus, InterviewQuestion } from '../types';
// import { analyzeInterview } from '../services/aiService';
import { Camera, Mic, Timer, ChevronRight, CheckCircle, Loader2, VideoOff, RefreshCw, AlertTriangle, Video } from 'lucide-react';

interface Props {
  sessions: InterviewSession[];
  updateSession: (id: string, updates: Partial<InterviewSession>) => void;
}

/**
 * Main interview recording interface.
 * Manages video/audio hardware, session timers, and the AI feedback loop.
 */
const InterviewView: React.FC<Props> = ({ sessions, updateSession }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = sessions.find(s => s.id === id);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45 * 60); // Total session limit (45 mins)
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [transcriptData, setTranscriptData] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  /**
   * Initializes the browser media stream for video/audio.
   * Handles user permission rejection gracefully.
   */
  const startCamera = async () => {
    try {
      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
      return true;
    } catch (err: any) {
      console.error("Camera access failed", err);
      setCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError("Camera access denied. Please allow permissions in your browser settings.");
      } else {
        setPermissionError("Could not access camera. Please check your device.");
      }
      return false;
    }
  };

  const handleStartInterview = async () => {
    const success = await startCamera();
    if (success) {
      setHasStarted(true);
      updateSession(session!.id, { status: SessionStatus.IN_INTERVIEW });
    }
  };

  /**
   * Component mounting logic:
   * 1. Validates the session exists.
   * 2. Starts the countdown timer (only after hasStarted is true).
   */
  useEffect(() => {
    if (!session) {
      navigate('/start');
      return;
    }

    let interval: NodeJS.Timeout;
    if (hasStarted) {
      interval = setInterval(() => {
        setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
      // Clean up hardware resources on exit
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [id, session, navigate, hasStarted]);

  if (!session) return null;

  // Initial "Start Mock Interview" screen
  if (!hasStarted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-white p-12 rounded-3xl shadow-xl border border-indigo-100">
          <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Video className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Begin?</h2>
          <p className="text-slate-600 mb-8">
            You are about to start your mock interview for <strong>{session.companyName}</strong>. 
            We will ask for camera and microphone permissions once you click the button below.
          </p>
          
          {permissionError && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-left">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{permissionError}</p>
            </div>
          )}

          <button 
            onClick={handleStartInterview}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
          >
            <Camera className="w-6 h-6" />
            Start Mock Interview
          </button>
        </div>
      </div>
    );
  }

  // Guard: Ensure questions were successfully generated before proceeding
  if (!session.questions || session.questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-amber-50 p-8 rounded-3xl border border-amber-200 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-amber-900 mb-2">Questions Unavailable</h2>
          <p className="text-amber-700 mb-6">
            We couldn't load the interview questions. They may not have been generated correctly.
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => navigate('/register')} 
              className="bg-amber-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-700 transition-colors"
            >
              Create New Session
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="bg-white border border-amber-200 text-amber-800 px-6 py-2 rounded-xl font-bold hover:bg-amber-50 transition-colors"
            >
              Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  
  /**
   * Converts seconds into a user-friendly MM:SS format.
   */
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Advances the interview progress.
   * Collects current response and triggers the final report if it's the last question.
   */
  const handleNext = () => {
    if (!currentQuestion) return;

    // Simulate transcript ingestion for the current response
    setTranscriptData(prev => [...prev, `Response to ${currentQuestion.category}: [Simulated candidate response text...]`]);

    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  /**
   * Finalizes the interview session.
   * 1. Updates status to Uploading/Analyzing.
   * 2. Calls the Gemini analysis service.
   * 3. Redirects to the visual report dashboard.
   */
  const handleFinish = async () => {
    setIsFinishing(true);
    updateSession(session.id, { status: SessionStatus.UPLOADING });

    // Simulate network delay for video/audio processing
    await new Promise(r => setTimeout(r, 2000));
    updateSession(session.id, { status: SessionStatus.UPLOADED });

    setIsProcessing(true);
    updateSession(session.id, { status: SessionStatus.ANALYZING });

    try {
      const fullTranscript = transcriptData.join(" ");
      // The service has a built-in timeout and fallback mechanism
      const report = await analyzeInterview(session, fullTranscript || "Sample transcript for analysis purposes.");
      
      updateSession(session.id, { 
        status: SessionStatus.SCORED, 
        report,
        transcript: fullTranscript
      });
      
      navigate(`/report/${session.id}`);
    } catch (err) {
      console.error("Finalization error:", err);
      updateSession(session.id, { status: SessionStatus.REPORT_SENT }); 
      navigate(`/report/${session.id}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state during processing
  if (isFinishing || isProcessing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-white p-12 rounded-3xl shadow-xl border border-indigo-100">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-8" />
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {isProcessing ? "Finalizing Results..." : "Uploading Interview..."}
          </h2>
          <p className="text-slate-600">
            {isProcessing 
              ? "Our AI is gathering your performance metrics. This should take less than 15 seconds." 
              : "We're stitching together your video chunks and preparing them for our analysis engine."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 flex flex-col lg:flex-row gap-8">
      {/* Sidebar: Question Progress Tracking */}
      <div className="w-full lg:w-80 space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-4">
            <Timer className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Total Time Remaining</span>
          </div>
          <div className="text-4xl font-mono font-bold text-slate-900 mb-6">{formatTime(timeLeft)}</div>
          
          <div className="space-y-3">
            {session.questions.map((q, idx) => (
              <div 
                key={q.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  idx === currentQuestionIndex 
                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' 
                    : idx < currentQuestionIndex 
                      ? 'text-green-600' 
                      : 'text-slate-400'
                }`}
              >
                {idx < currentQuestionIndex ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                    idx === currentQuestionIndex ? 'border-indigo-600' : 'border-slate-300'
                  }`}>
                    {idx + 1}
                  </div>
                )}
                <span className="text-sm font-medium capitalize">{q.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Recording Component */}
      <div className="flex-grow space-y-6">
        <div className="bg-slate-900 rounded-3xl aspect-video relative overflow-hidden shadow-2xl group">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover mirror transition-opacity duration-300 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* Permission Overlay */}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-900 z-10">
              <div className="bg-slate-800 p-6 rounded-full">
                <VideoOff className="w-12 h-12" />
              </div>
              <p className="text-lg font-medium">{permissionError || "Camera access required"}</p>
              <button 
                onClick={startCamera}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                <Camera className="w-5 h-5" />
                Enable Camera
              </button>
            </div>
          )}
          
          {/* Active Status Overlays */}
          {cameraActive && (
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center z-20">
              <div className="flex gap-3">
                <div className="bg-slate-800/80 backdrop-blur p-3 rounded-xl flex items-center gap-2 border border-slate-700">
                  <Mic className="w-4 h-4 text-green-400" />
                  <div className="flex gap-0.5">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className={`w-1 h-3 rounded-full ${i < 3 ? 'bg-green-400' : 'bg-slate-600'}`} />
                    ))}
                  </div>
                </div>
                <div className="bg-red-500/80 backdrop-blur px-4 py-2 rounded-xl flex items-center gap-2 border border-red-400/50">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Recording</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Question Display Card */}
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider mb-4">
              Question {currentQuestionIndex + 1} of {session.questions.length}: {currentQuestion?.category || 'General'}
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
              {currentQuestion?.text || "Loading question..."}
            </h3>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleNext}
              className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
            >
              {currentQuestionIndex === session.questions.length - 1 ? 'End Interview' : 'Next Question'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewView;
