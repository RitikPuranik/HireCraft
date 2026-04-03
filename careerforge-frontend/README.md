# CareerForge Frontend

AI-powered career platform frontend — built with React + Vite.

## Setup

```bash
npm install
```

## Configure API URL

Create `.env` file:
```
VITE_API_URL=https://your-backend-url.com/api
```

## Development

```bash
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Set environment variable: `VITE_API_URL=https://your-backend.railway.app/api`
4. Deploy — `vercel.json` handles SPA routing automatically

## Features

- 🔐 Auth (register, login, JWT)
- 📄 Resume Builder (multi-section, CRUD)
- 🎯 ATS Checker (PDF upload + AI score)
- 🎤 Mock Interview (AI-generated Q&A + scoring)
- 🔍 Job Match Analyzer
- ✉️ Cover Letter Generator
- 📊 Progress Dashboard with charts
- ⭐ Subscription (Free vs Pro with Razorpay)
- 👤 User Profile management
