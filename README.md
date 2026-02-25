# InterviewAI Pro - Technical Documentation

InterviewAI Pro is a sophisticated, browser-based mock interview platform. It utilizes a hybrid AI architecture to transform job descriptions into tailored experiences and deep analytics.

## 🚀 Tech Stack

- **Framework**: React 19 (via esm.sh)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts (Radar and Bar charts)
- **AI**: OpenAI GPT-4o for both question generation and performance analysis.
- **Routing**: React Router 7 (HashRouter)

## 📂 Project Structure

- `index.html`: Entry point with ESM import maps.
- `index.tsx`: React mounting logic.
- `App.tsx`: Global state and routing.
- `types.ts`: Shared domain models.
- `services/aiService.ts`: AI orchestration layer (OpenAI).
- `views/`:
    - `RegistrationView.tsx`: Intake and OpenAI-driven question prep.
    - `StartSessionView.tsx`: OTP and Privacy gate.
    - `InterviewView.tsx`: Real-time recording interface.
    - `ReportView.tsx`: Visual feedback dashboard.
    - `AdminView.tsx`: Operational control center.

## 🧠 AI Integration Details

### 1. Tailored Question Generation
In `RegistrationView`, the system calls OpenAI's Chat Completions API. The model acts as a "Technical Recruiter" to generate 5 specific categories of questions:
- Introduction
- Deep Technical
- Scenario/Decision Making
- Behavioral
- Closing

### 2. Deep Performance Analysis
After the interview, the transcript is analyzed by OpenAI GPT-4o. It evaluates:
- **Dimensions**: Ability, Knowledge, Skillset, Attitude (0-100).
- **Behavioral Rubric**: Clarity, Pace, Confidence, and more.

## 🔄 Core Workflows

1. **Registration**: Admin inputs JD -> OpenAI generates questions -> Session & OTP created.
2. **Onboarding**: Candidate enters OTP -> Consents to recording.
3. **Interview**: Candidate records responses for each question.
4. **Analysis**: Transcript is processed by OpenAI for comprehensive scoring.
5. **Insights**: Visual dashboard presents strengths, improvements, and summary scores.

## 🛡️ Reliability & Resilience

- **Hybrid Resilience**: Each AI service has individual timeout (10s/15s) and fallback logic.
- **Fallbacks**: If an API fails, a provisional completion report is generated to prevent session loss.
- **Data Security**: `process.env.API_KEY` is handled securely at the runtime level.

## 🛠️ Getting Started (For Beginners)

Follow these steps to get the project running on your local machine.

### 1. Prerequisites
Make sure you have the following installed:
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)

### 2. Installation
1. **Clone the repository** (if applicable) or download the source code.
2. **Open your terminal** and navigate to the project directory.
3. **Install dependencies**:
   ```bash
   npm install
   ```

### 3. Configuration
The application requires an **OpenAI API Key** to power the AI features.
1. Create a file named `.env` in the root directory.
2. Add your API key to the file:
   ```env
   OPENAI_API_KEY=your_api_key_here
   ```
   *You can get an API key from the [OpenAI Dashboard](https://platform.openai.com/).*

### 4. Running the Application
To start the development server:
```bash
npm run dev
```
Once the server starts, open your browser and go to `http://localhost:3000`.

### 5. Building for Production
To create a production-ready build:
```bash
npm run build
```
The optimized files will be generated in the `dist/` folder.