import OpenAI from "openai";
import { InterviewQuestion } from "../types";

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
 * Generates tailored interview questions using the OpenAI API.
 * Generates exactly 9 questions (no intro) + hard-coded intro added in RegistrationView.
 */
export const generateQuestions = async (
  jobDescription: string,
  companyName: string,
  jobTitle: string
): Promise<InterviewQuestion[]> => {
  // Truncate JD to save tokens
  const shortenedJD =
    jobDescription.length > 1500
      ? jobDescription.slice(0, 1500)
      : jobDescription;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are an experienced technical recruiter. Given a job description and company context, you generate concise, role-appropriate interview questions as JSON."
    },
    {
      role: "user",
      content: `
Job title: ${jobTitle}
Company: ${companyName}

Job description:
${shortenedJD}

Task:
1. Do NOT include any introduction questions like "Tell me about yourself". We already handle that separately.
2. Generate exactly 9 interview questions for this role, divided across these categories:
   - technical: 4 questions
   - scenario: 3 questions
   - behavioral: 2 questions
3. Each question must be 1–2 sentences, no extra explanation.
4. Return ONLY valid JSON in this shape (no prose, no markdown):

{
  "questions": [
    { "category": "DEEP_TECHNICAL", "text": "..." },
    { "category": "SCENARIO", "text": "..." }
  ]
}
`
    }
  ];

  const generator = async () => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.4,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content || "{}";
      const parsed = JSON.parse(content);
      
      // Handle cases where AI might wrap the array in an object
      const questionsArray = Array.isArray(parsed) 
        ? parsed 
        : (parsed.questions || Object.values(parsed)[0]);

      if (!Array.isArray(questionsArray)) {
        return [];
      }

      const now = Date.now();
      return questionsArray.map((q: any, index: number) => ({
        id: `q-${now}-${index}`,
        category: q.category || 'technical',
        text: q.text || "Question content unavailable.",
        guidance: "",
        suggestedTimeMinutes: 3
      }));
    } catch (error) {
      console.error("Error generating questions:", error);
      return [];
    }
  };

  return withTimeout(generator(), 15000, []);
};

/**
 * Utility function to prevent API calls from hanging the UI indefinitely.
 */
const withTimeout = <T>(
  promise: Promise<T>, 
  ms: number, 
  fallback: T
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => {
      console.warn(`Operation timed out after ${ms}ms`);
      resolve(fallback);
    }, ms))
  ]);
};