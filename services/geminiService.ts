
import { GoogleGenAI, Type } from "@google/genai";
import { InterviewQuestion, InterviewReport } from "../types";

/**
 * Initialize the Google GenAI client for analysis tasks.
 * Per user request, question generation now uses the OpenAI API via fetch.
 */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
 * Logs output to the console for developer verification.
 */
export const generateQuestions = async (jobDescription: string, companyName: string): Promise<InterviewQuestion[]> => {
  const prompt = `Act as an expert technical recruiter. Based on the following job description for a role at ${companyName}, generate exactly 5 interview questions.
  Return the output as a JSON array of objects with "category" and "text" keys.
  Categories MUST BE: introduction, technical, scenario, behavioral, closing.
  
  Format:
  [
    {"category": "introduction", "text": "..."},
    {"category": "technical", "text": "..."},
    ...
  ]

  Job Description: ${jobDescription}`;

  const openAIGenerator = async () => {
    try {
      console.log("--- STARTING OPENAI QUESTION GENERATION ---");
      console.log("Job Description Length:", jobDescription.length);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_KEY}` 
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a professional technical recruiter. You always respond with valid JSON arrays.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI API Error Status:", response.status);
        console.error("OpenAI API Error Body:", errText);
        throw new Error(`OpenAI API responded with status: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      console.log("--- RAW OPENAI RESPONSE CONTENT ---");
      console.log(content);

      // Clean markdown if present
      let jsonString = content.trim();
      if (jsonString.startsWith('```json')) jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '');
      else if (jsonString.startsWith('```')) jsonString = jsonString.replace(/^```/, '').replace(/```$/, '');

      const parsed = JSON.parse(jsonString);
      
      // Handle cases where AI might wrap the array in an object
      const questionsArray = Array.isArray(parsed) ? parsed : (parsed.questions || Object.values(parsed)[0]);

      console.log("--- PARSED QUESTIONS FOR VERIFICATION ---");
      console.table(questionsArray);

      if (!Array.isArray(questionsArray)) {
        console.error("Parsed data is not an array:", questionsArray);
        return [];
      }

      const formattedQuestions = questionsArray.map((q: any, index: number) => ({
        id: `q-${index}-${Date.now()}`,
        category: (q.category || 'technical').toLowerCase() as any,
        text: q.text || "Question content unavailable."
      }));

      console.log("--- FINAL FORMATTED QUESTIONS ---");
      console.log(formattedQuestions);
      console.log("--- END OPENAI QUESTION GENERATION ---");

      return formattedQuestions;
    } catch (error) {
      console.error("CRITICAL ERROR in generateQuestions:", error);
      return [];
    }
  };

  return withTimeout(openAIGenerator(), 15000, []);
};

/**
 * Analyzes an interview transcript using the Gemini 3 Pro model.
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

    Provide a detailed performance report in JSON format following the requested schema.
  `;

  const analyzer = async () => {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallDimensions: {
                  type: Type.OBJECT,
                  properties: {
                    ability: { type: Type.OBJECT, properties: { label: {type: Type.STRING}, score: {type: Type.NUMBER}, feedback: {type: Type.STRING} } },
                    knowledge: { type: Type.OBJECT, properties: { label: {type: Type.STRING}, score: {type: Type.NUMBER}, feedback: {type: Type.STRING} } },
                    skillset: { type: Type.OBJECT, properties: { label: {type: Type.STRING}, score: {type: Type.NUMBER}, feedback: {type: Type.STRING} } },
                    attitude: { type: Type.OBJECT, properties: { label: {type: Type.STRING}, score: {type: Type.NUMBER}, feedback: {type: Type.STRING} } }
                  }
                },
                technicalCommunication: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      criterion: { type: Type.STRING },
                      score: { type: Type.NUMBER },
                      comment: { type: Type.STRING }
                    }
                  }
                },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
                summary: { type: Type.STRING }
              }
            }
          }
        });

        let jsonString = response.text || "{}";
        jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "");
        
        const firstOpen = jsonString.indexOf('{');
        const lastClose = jsonString.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1) {
            jsonString = jsonString.substring(firstOpen, lastClose + 1);
        }

        return JSON.parse(jsonString) as InterviewReport;
      } catch (error) {
        console.error("Error analyzing interview with Gemini:", error);
        return FALLBACK_REPORT;
      }
  };

  return withTimeout(analyzer(), 20000, FALLBACK_REPORT);
};
