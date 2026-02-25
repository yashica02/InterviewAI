import OpenAI from "openai";
import { InterviewQuestion, InterviewReport } from "../types";

/**
 * Initialize the OpenAI client.
 * We use process.env.API_KEY which is mapped to GEMINI_API_KEY in vite.config.ts,
 * but for clarity in a real app, you'd use OPENAI_API_KEY.
 * The platform provides the key in process.env.API_KEY.
 */
const openai = new OpenAI({
  apiKey: process.env.API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

/**
 * Fallback report used when AI analysis fails or times out.
 */
const FALLBACK_REPORT: InterviewReport = {
  overallDimensions: {
    ability: { label: "Ability", score: 75, feedback: "Analysis timed out. Good effort on completing the interview." },
    knowledge: { label: "Knowledge", score: 75, feedback: "Analysis timed out. Good effort on completing the interview." },
    skillset: { label: "Skillset", score: 75, feedback: "Analysis timed out. Good effort on completing the interview." },
    attitude: { label: "Attitude", score: 85, feedback: "Great attitude throughout the session." }
  },
  technicalCommunication: [
    { criterion: "Clarity", score: 4, comment: "Generally clear responses." },
    { criterion: "Pace", score: 4, comment: "Good speaking pace maintained." },
    { criterion: "Confidence", score: 3, comment: "Maintained reasonable confidence." }
  ],
  strengths: ["Completed the full interview session", "Maintained professional demeanor"],
  improvements: ["Review technical concepts for deeper answers", "Try to elaborate more on scenario questions"],
  summary: "We encountered a timeout while generating your detailed AI report. A provisional score has been assigned based on completion."
};

/**
 * Utility function to prevent API calls from hanging the UI indefinitely.
 */
const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => {
      console.warn(`Operation timed out after ${ms}ms`);
      resolve(fallback);
    }, ms))
  ]);
};

/**
 * Generates tailored interview questions using the OpenAI API.
 */
export const generateQuestions = async (jobDescription: string, companyName: string): Promise<InterviewQuestion[]> => {
  const prompt = `Act as an expert technical recruiter. Based on the following job description for a role at ${companyName}, generate exactly 10 interview questions.
  
  CRITICAL INSTRUCTIONS:
  1. The FIRST question (index 0) MUST be a generic "Tell me about yourself" introduction question.
  2. The remaining 9 questions MUST be specific to the job description provided below, covering technical skills, scenario-based challenges, and behavioral traits.
  
  Return the output as a JSON array of objects with "category" and "text" keys.
  Categories for the 10 questions should be: introduction (for the first one), technical, scenario, behavioral, and closing (for the last one).
  
  Format:
  [
    {"category": "introduction", "text": "Tell me about yourself and your background..."},
    {"category": "technical", "text": "..."},
    ...
  ]

  Job Description: ${jobDescription}`;

  const generator = async () => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a professional technical recruiter. You always respond with valid JSON arrays." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content || "[]";
      const parsed = JSON.parse(content);
      
      // Handle cases where AI might wrap the array in an object
      const questionsArray = Array.isArray(parsed) ? parsed : (parsed.questions || Object.values(parsed)[0]);

      if (!Array.isArray(questionsArray)) {
        return [];
      }

      return questionsArray.map((q: any, index: number) => ({
        id: `q-${index}-${Date.now()}`,
        category: (q.category || 'technical').toLowerCase() as any,
        text: q.text || "Question content unavailable."
      }));
    } catch (error) {
      console.error("Error generating questions:", error);
      return [];
    }
  };

  return withTimeout(generator(), 15000, []);
};

/**
 * Analyzes an interview transcript using OpenAI.
 */
export const analyzeInterview = async (
  sessionData: any,
  transcript: string
): Promise<InterviewReport> => {
  const safeTranscript = transcript && transcript.length > 10 ? transcript : "The candidate provided very brief responses.";
  
  const prompt = `
    Analyze the following mock interview session.
    Candidate Role: ${sessionData.jobDescription.substring(0, 100)}... at ${sessionData.companyName}
    Transcript: "${safeTranscript}"

    Provide a detailed performance report in JSON format following this schema:
    {
      "overallDimensions": {
        "ability": { "label": "Ability", "score": number, "feedback": "string" },
        "knowledge": { "label": "Knowledge", "score": number, "feedback": "string" },
        "skillset": { "label": "Skillset", "score": number, "feedback": "string" },
        "attitude": { "label": "Attitude", "score": number, "feedback": "string" }
      },
      "technicalCommunication": [
        { "criterion": "string", "score": number, "comment": "string" }
      ],
      "strengths": ["string"],
      "improvements": ["string"],
      "summary": "string"
    }
  `;

  const analyzer = async () => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert interview coach. You provide detailed, constructive feedback in JSON format." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content || "{}";
      return JSON.parse(content) as InterviewReport;
    } catch (error) {
      console.error("Error analyzing interview:", error);
      return FALLBACK_REPORT;
    }
  };

  return withTimeout(analyzer(), 25000, FALLBACK_REPORT);
};
