# 🎯 PREP Master - English Structured Speaking & Writing Coach

> Master structured English speaking and writing through the proven **PREP Framework** (Point, Reason, Example, Point). Powered by **DeepSeek-V3** and **Google Gemini**.

---

## ✨ Features

- 🧩 **Dual Practice Modes**:
  - **Step-by-Step Guided Mode**: Break down your thoughts into Point, Reason, Example, and Restated Point with instant sentence starters.
  - **Full-Text Free Flow Mode**: Write naturally with real-time word counting, timing, and structure indicators.
- 🤖 **Comprehensive AI Evaluation**:
  - 5-Dimensional Scoring: Structure & Logic, Argument Strength, Grammar Accuracy, Vocabulary Richness, and Native Delivery.
  - Instant diagnostic feedback, polished native revisions, and shadowing read-aloud scripts.
- 📖 **Interactive Vocabulary Notebook**:
  - Select any word or phrase in feedback for instant dictionary lookups with IPA phonetics, Chinese nuances, and high-yield collocations.
- 📱 **Mobile-First Responsive Design**:
  - Optimized for touch devices, bottom sheets, sticky action docks, and safe area insets.
- ⚡ **High Availability Multi-LLM Engine**:
  - Primary: **DeepSeek-V3** (`deepseek-chat`) for high-speed, cost-effective evaluation.
  - Backup Fallback: **Google Gemini** for seamless failover redundancy.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: Node.js, Express, TypeScript
- **Deployment**: Vercel Serverless Ready

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/yixing23/Jayanpreppractise.git
cd Jayanpreppractise
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```

---

## ☁️ Deployment (Vercel)

1. Import this repository in [Vercel](https://vercel.com).
2. Set Environment Variables under **Project Settings -> Environment Variables**:
   - `DEEPSEEK_API_KEY`: your DeepSeek API key
3. Deploy! Vercel handles static build and Serverless Functions automatically.