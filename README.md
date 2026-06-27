# SpotFix AI 🚀 — Hyperlocal Civic Auditing & Reporting

SpotFix AI is a citizen-first platform that lets anybody report neighborhood infrastructure damages (such as potholes, water leaks, streetlights, illegal dumping) in less than 30 seconds. Powered by the Gemini 3.5 Flash vision engine, it classifies issues, estimates urgency level, and suggests local municipal departments instantly without any manual overhead.

This project was built as a full-stack, lightweight hackathon prototype with built-in smart duplicate detection to minimize redundant municipal reporting.

---

## 🌟 Core Features & Architecture

1. **AI Vision & Description Inspection**: Analyzes user photos using Gemini 3.5 Flash to automatically extract category, priority, and responsibility.
2. **Smart Duplicate Detection**: Scans nearby reports (within 300 meters) and prompts users to support the existing claim to double municipal priority instead of spamming duplicates.
3. **Hyperlocal Geolocation**: Automatic device GPS positioning with reverse address labeling, and simple manual coordinate overrides.
4. **Interactive Dashboard**: Modern public audit trail showing Resolved, In Progress, Verified, and Reported metrics with instant community vote signature support.
5. **Zero-Database Persistence**: Uses browser `localStorage` as a fast local store, ideal for sandboxed demos and client-only web pages.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Lucide Icons, Framer Motion
- **CSS Utility**: Tailwind CSS (v4)
- **AI Integration**: Node.js, Express, `@google/genai` (SDK v2)
- **Model**: `gemini-3.5-flash`

---

## ⚙️ Local Development Setup

To run SpotFix AI locally on your machine, follow these steps:

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- A Google Gemini API Key (get one from [Google AI Studio](https://aistudio.google.com/))

### Steps
1. **Clone or Download the Repository**:
   Extract files into a folder of your choice.

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your secret:
   ```env
   GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🌐 GitHub Pages Deployment Guide

Since SpotFix AI relies on a secure server-side proxy route (`/api/analyze-report`) to shield your secret `GEMINI_API_KEY` from client browsers, a standard serverless host like **GitHub Pages** will only serve the static frontend part.

Follow these options to deploy the code securely:

### Option A: Fully Serverless Client-Side Fallback
If you wish to deploy the whole app purely to GitHub Pages as a serverless static site, you must prompt the user to paste their own Gemini API key in the UI:

1. Build static production bundle:
   ```bash
   npm run build
   ```
2. Deploy the generated `/dist` static folder content to GitHub Pages or Netlify.
3. (Optional) Customize the frontend code to load `GEMINI_API_KEY` directly from client local state if server route returns 404.

### Option B: Deploy to Render or Koyeb or Vercel
Since it contains a Node.js Express server (`server.ts`), it is highly recommended to deploy to a free node-hosting provider like **Render** or **Vercel** with the environment variable set:

1. Create a free account on [Render.com](https://render.com).
2. Connect your GitHub repository.
3. Set the Environment variable key: `GEMINI_API_KEY` = your secret key.
4. Configure Build Command: `npm run build` and Start Command: `npm run start`.
5. Your full-stack SpotFix AI instance will go live instantly.
