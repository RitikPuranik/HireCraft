# CareerForge Backend API

AI-powered resume and interview platform backend built with Node.js, Express, MongoDB, and Google Gemini.

## 🚀 Quick Start

### 1. Clone & Install
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your real values (see Environment Variables below)
```

### 3. Run
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Min 32-char random secret for JWT signing |
| `GEMINI_API_KEY` | ✅ | Google Gemini AI key — [get free key](https://aistudio.google.com/app/apikey) |
| `RAZORPAY_KEY_ID` | Payment only | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Payment only | Razorpay key secret |
| `CLOUDINARY_CLOUD_NAME` | File upload only | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | File upload only | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | File upload only | Cloudinary API secret |
| `CORS_ORIGIN` | Prod | Comma-separated allowed frontend origins |
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |

---

## 📡 API Endpoints

### Auth (`/api/auth`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login, returns JWT |
| POST | `/logout` | ❌ | Logout (client clears token) |

### Users (`/api/users`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/profile` | ✅ | Get current user profile |
| PUT | `/profile` | ✅ | Update profile (name, phone, location, avatar) |

### Resumes (`/api/resumes`)
| Method | Route | Auth | Limit | Description |
|--------|-------|------|-------|-------------|
| POST | `/` | ✅ | Plan | Create resume |
| GET | `/` | ✅ | — | List all resumes |
| GET | `/:id` | ✅ | — | Get single resume |
| PUT | `/:id` | ✅ | — | Update resume |
| DELETE | `/:id` | ✅ | — | Delete resume |
| GET | `/:id/download` | ✅ | Plan | Download as PDF |
| PATCH | `/:id/default` | ✅ | — | Set as default resume |

### ATS Analysis (`/api/ats`)
| Method | Route | Auth | Limit | Description |
|--------|-------|------|-------|-------------|
| POST | `/analyze` | ✅ | 3/day | Analyze resume (upload PDF or pass `resumeId`) |
| GET | `/history` | ✅ | — | ATS analysis history |

### Interviews (`/api/interviews`)
| Method | Route | Auth | Limit | Description |
|--------|-------|------|-------|-------------|
| POST | `/setup` | ✅ | 2/day | Create interview session with AI questions |
| PATCH | `/:id/start` | ✅ | — | Start interview |
| PATCH | `/:id/answer` | ✅ | — | Submit answer `{ questionIndex, answer }` |
| PATCH | `/:id/complete` | ✅ | — | Mark interview complete |
| GET | `/history` | ✅ | — | Interview history |
| GET | `/:id` | ✅ | — | Get interview details |

### Evaluation (`/api/evaluation`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/evaluate/:interviewId` | ✅ | AI-score a completed interview |
| GET | `/:interviewId` | ✅ | Get evaluation result |

### Job Match (`/api/jobmatch`)
| Method | Route | Auth | Limit | Description |
|--------|-------|------|-------|-------------|
| POST | `/analyze` | ✅ | 1/day | Match resume against job description |
| GET | `/history` | ✅ | — | Match history |

### Cover Letter (`/api/coverletter`)
| Method | Route | Auth | Limit | Description |
|--------|-------|------|-------|-------------|
| POST | `/generate` | ✅ | 1/day | Generate cover letter |
| GET | `/` | ✅ | — | List cover letters |
| GET | `/:id` | ✅ | — | Get single cover letter |
| DELETE | `/:id` | ✅ | — | Delete cover letter |

### Progress (`/api/progress`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/dashboard` | ✅ | Full progress dashboard (readiness score, all metrics) |
| GET | `/history` | ✅ | Progress snapshot history for trend charts |

### Subscription (`/api/subscription`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/plans` | ❌ | List all plans with features & limits |
| GET | `/me` | ✅ | Current plan, usage, limits |
| GET | `/usage` | ✅ | Detailed usage counters with percentages |
| POST | `/create-order` | ✅ | Step 1 of Razorpay checkout — create order |
| POST | `/verify` | ✅ | Step 2 — verify payment signature, activate Pro |
| POST | `/cancel` | ✅ | Cancel Pro subscription at period end |

### Speech (`/api/speech`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/speak` | ✅ | TTS fallback (actual synthesis happens in browser) |

### Health
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Server health + uptime |

---

## 💳 Plan Limits

| Feature | Free | Pro |
|---------|------|-----|
| Resumes | 1 total | Unlimited |
| ATS checks | 3 / day | Unlimited |
| Interviews | 2 / day | Unlimited |
| Job matches | 1 / day | Unlimited |
| Cover letters | 1 / day | Unlimited |
| PDF downloads | ❌ | Unlimited |
| Price | Free | ₹999/month |

---

## 🚢 Deployment

### Render / Railway / Fly.io
1. Set all env vars in the dashboard
2. Set `NODE_ENV=production`
3. Build command: `npm install`
4. Start command: `npm start`

### Docker
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### MongoDB Atlas
Replace `MONGO_URI` with your Atlas connection string:
```
mongodb+srv://<user>:<password>@cluster.mongodb.net/careerforge?retryWrites=true&w=majority
```

---

## 🏗 Architecture

```
src/
├── app.js                    # Express app — middleware + routes
├── config/
│   ├── db.js                 # MongoDB connection + graceful shutdown
│   ├── gemini.js             # Gemini AI helpers
│   ├── cloudinary.js         # Cloudinary config
│   └── env.js                # Typed config object
├── modules/                  # Feature modules (controller/service/model/routes)
│   ├── auth/
│   ├── user/
│   ├── resume/
│   ├── ats/
│   ├── interview/
│   ├── evaluation/
│   ├── jobmatch/
│   ├── coverletter/
│   ├── progress/
│   ├── speech/
│   └── subscription/
└── shared/
    ├── constants/            # plans, roles, roundTypes
    ├── middlewares/          # protect, usageGuard, upload, error
    └── utils/                # ApiError, ApiResponse, asyncHandler
```
