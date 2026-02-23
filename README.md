# InterviewAI Pro - Technical Documentation

InterviewAI Pro is a sophisticated, browser-based mock interview platform. It utilizes a hybrid AI architecture to transform job descriptions into tailored experiences and deep analytics.

## 🚀 Tech Stack

- **Framework**: React 19 (via esm.sh)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts (Radar and Bar charts)
- **AI (Hybrid)**: 
    - **OpenAI API**: Powering custom question generation.
    - **Google Gemini 3 Flash**: Driving deep performance analysis and scoring.
- **Routing**: React Router 7 (HashRouter)

## 📂 Project Structure

- `index.html`: Entry point with ESM import maps.
- `index.tsx`: React mounting logic.
- `App.tsx`: Global state and routing.
- `types.ts`: Shared domain models.
- `services/geminiService.ts`: AI orchestration layer (OpenAI + Gemini).
- `views/`:
    - `RegistrationView.tsx`: Intake and OpenAI-driven question prep.
    - `StartSessionView.tsx`: OTP and Privacy gate.
    - `InterviewView.tsx`: Real-time recording interface.
    - `ReportView.tsx`: Visual feedback dashboard.
    - `AdminView.tsx`: Operational control center.

## 🧠 AI Integration Details

### 1. Tailored Question Generation (OpenAI)
In `RegistrationView`, the system calls OpenAI's Chat Completions API. The model acts as a "Technical Recruiter" to generate 5 specific categories of questions:
- Introduction
- Deep Technical
- Scenario/Decision Making
- Behavioral
- Closing

### 2. Deep Performance Analysis (Google Gemini)
After the interview, the transcript is analyzed by `gemini-3-flash-preview`. It evaluates:
- **Dimensions**: Ability, Knowledge, Skillset, Attitude (0-100).
- **Behavioral Rubric**: 14 criteria (1-5 scale) including Clarity, Pace, and grammar.

## 🔄 Core Workflows

1. **Registration**: Admin inputs JD -> OpenAI generates questions -> Session & OTP created.
2. **Onboarding**: Candidate enters OTP -> Consents to recording.
3. **Interview**: Candidate records responses for each question.
4. **Analysis**: Transcript is processed by Gemini for comprehensive scoring.
5. **Insights**: Visual dashboard presents strengths, improvements, and summary scores.

## 🛡️ Reliability & Resilience

- **Hybrid Resilience**: Each AI service has individual timeout (10s/15s) and fallback logic.
- **Fallbacks**: If an API fails, a provisional completion report is generated to prevent session loss.
- **Data Security**: `process.env.API_KEY` is handled securely at the runtime level.

---
*Powered by OpenAI & Google Gemini.*
