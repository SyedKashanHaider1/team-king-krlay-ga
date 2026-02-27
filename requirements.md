# AI Marketing Command Center — Requirements Document

---

## 1. Project Overview

The **AI Marketing Command Center** is a full-stack, AI-powered SaaS marketing platform built with **Python Flask** (backend), **SQLite** (database), and **Vanilla JavaScript + HTML + CSS** (frontend), secured with **Google OAuth**. It serves as a single intelligent brain for planning, generating, publishing, analysing, and optimising marketing campaigns across multiple channels including Instagram, Facebook, Twitter/X, LinkedIn, Email, and SMS.

The platform blends the familiar, high-engagement interaction patterns of **Instagram** (gradient visuals, card feeds), **Facebook** (structured post layouts), and **WhatsApp** (real-time chat interface) into one cohesive, modern dark-mode SaaS experience.

---

## 2. Problem Statement

Marketing teams today are fragmented across dozens of tools:

- Campaign planning in spreadsheets
- Content creation in separate editors
- Scheduling via third-party tools
- Analytics scattered across platform dashboards
- Responding to DMs and comments manually

**This causes:**
- Inconsistent brand voice
- Missed publishing windows
- Hours wasted on repetitive tasks
- Inability to act on real-time signals
- Poor cross-channel visibility

**The AI Marketing Command Center unifies all operations under one intelligent interface.**

---

## 3. Target Users

| Persona | Description |
|---|---|
| **Marketing Managers** | Campaign oversight, strategy, approvals, performance snapshots |
| **Content Creators** | AI-assisted content generation, calendar visibility |
| **Growth Hackers** | Analytics, A/B testing, optimisation recommendations |
| **Small Business Owners** | Guided, zero-technical-knowledge experience |
| **Agency Teams** | Multi-brand management, client reporting, scalable workflows |

---

## 4. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 | No frontend frameworks. Chart.js via CDN |
| **Backend** | Python Flask 3.x | REST API, Blueprint routing |
| **Database** | SQLite (via Python `sqlite3`) | Local file-based DB, no ORM |
| **Authentication** | Google OAuth 2.0 (Google Identity Services) | JWT tokens for session management |
| **AI Layer** | Mocked AI service (AIService class) | Replace with OpenAI/Anthropic in production |
| **Charts** | Chart.js 4.x | Loaded via CDN, no npm install |
| **Fonts** | Inter (Google Fonts CDN) | Loaded via CDN |

---

## 5. Authentication Flow (Google OAuth)

### Login Flow
```
User visits / → Login Page shown
↓
User clicks "Continue with Google"
↓
Google Identity Services (GIS) popup
↓
Google returns credential (JWT ID token)
↓
Frontend sends id_token to POST /api/auth/google
↓
Flask verifies token via google-auth library
↓
User created/updated in SQLite users table
↓
Backend returns JWT access token + user object
↓
Frontend stores token in localStorage
↓
All subsequent API calls use Bearer token
↓
App loads user-specific data (isolated per user)
```

### Demo Mode
- Users without a Google account can click **"Try Demo"**
- Calls `POST /api/auth/demo-login`
- Creates a persistent demo user with pre-seeded data
- Full app functionality without real Google OAuth

### Token Management
- JWT tokens expire after 24 hours (configurable)
- Token stored in `localStorage` as `mcc_token`
- 401 responses auto-logout the user
- `GET /api/auth/me` validates token on app load

### Security Notes
- All API endpoints (except auth) require `Authorization: Bearer <token>`
- User data is fully isolated by `user_id` in all queries
- CORS configured for local development (configure origins in production)

---

## 6. UI/UX Principles & Ease-of-Use Goals

### Visual Language
- **Instagram-inspired**: Purple-pink gradient palette, card-based feeds, story-style highlights
- **WhatsApp-inspired**: Chat bubbles for AI interactions, green accents, real-time message feel  
- **Facebook-inspired**: Feed layouts, engagement metrics, notification indicators

### Design Principles
1. **Minimal Friction** — Every core action reachable in ≤ 2 clicks
2. **Progressive Disclosure** — Show what's needed; expand on demand
3. **Consistency** — Uniform card styles, typography, spacing throughout
4. **Feedback First** — Every action triggers immediate visual feedback
5. **Mobile-First** — Designed for touch, enhanced on desktop

### Colour Palette
| Role | Value |
|---|---|
| Primary Gradient | `#667eea → #764ba2` |
| Instagram Gradient | `#f093fb → #f5576c` |
| WhatsApp Green | `#25d366` |
| Facebook Blue | `#1877f2` |
| Background Deep | `#0a0a14` |
| Surface/Card | `#161628` |
| Text Primary | `#ffffff` |
| Text Secondary | `#a0a0c0` |

---

## 7. Interaction & Animation Guidelines

| Interaction | Type | Duration |
|---|---|---|
| Page load/switch | Fade + slide up | 300ms |
| Card hover | Scale 1.02 + shadow | 200ms |
| Button click | Scale 0.97 + ripple | 150ms |
| Chat message | Slide from direction | 300ms |
| Typing indicator | 3-dot bounce | Infinite |
| Toast notifications | Slide in from right | 350ms |
| Modal open/close | Scale + fade | 250ms |
| Loading skeleton | Shimmer sweep | Infinite |
| Counter animation | Ease-out increment | 800ms |
| Sidebar toggle | Slide + width change | 250ms |

---

## 8. Functional Requirements

### FR-1: Authentication
- Google OAuth 2.0 sign-in via Google Identity Services
- Demo login without Google account (for testing)
- JWT-based session management (24h expiry)
- Secure logout with localStorage cleanup
- User data isolation per account

### FR-2: Campaign Strategy Layer
- Create campaigns with goal, budget, audience, channels, dates
- AI generates multi-phase campaign strategies
- Strategy includes phases, KPIs, budget allocation, posting times, audience segments
- Campaign status tracking (Draft → Active → Scheduled → Completed)
- Filter campaigns by status

### FR-3: Content Generation
- AI generates content for: Instagram, Facebook, Twitter, LinkedIn, Email, SMS
- Tone selection: Professional, Casual, Urgent, Playful, Inspirational
- Includes hashtags, CTAs, emoji suggestions, AI tips
- Engagement prediction and estimated reach
- Save generated content to library
- Direct publish from generator
- Content library with filter by channel/status

### FR-4: Publishing Layer (Simulation)
- Publishing queue with Draft/Scheduled/Published tabs
- One-click publish simulation with status update
- Status counts displayed prominently
- Link to Content Studio for creation

### FR-5: Analytics & Optimisation
- Overview metrics: reach, impressions, conversions, revenue, engagement rate
- 30-day engagement timeline chart
- Channel breakdown with engagement rates and growth
- Top performing content ranking
- Conversion funnel visualisation
- Audience demographics (age, gender)
- AI optimisation tips per channel
- Dynamic date range selector

### FR-6: AI Chat (Strategist)
- Full chat interface with WhatsApp-like message bubbles
- AI responses for: campaigns, content, analytics, scheduling, audience, budget
- Quick action chips for common queries
- Persistent chat history per user
- Typing indicator animation
- Clear chat history

### FR-7: Marketing Calendar
- Monthly calendar grid view
- AI generates a full month of content events
- Events colour-coded by channel
- Click day to view/add events
- Navigate between months
- Add custom events with time and channel

### FR-8: Auto-Reply Manager
- Create keyword-triggered auto-reply rules
- Toggle rules active/inactive
- Match count tracking per rule
- FAQ knowledge base (Q&A pairs)
- Reply simulator to test auto-reply logic
- Custom rules take priority over AI rules
- Escalation flag for negative messages

---

## 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Page render < 1s; API response < 500ms |
| **Responsiveness** | 320px–2560px viewport support |
| **Accessibility** | ARIA labels; keyboard navigable |
| **Scalability** | Modular Blueprint routes; service layer separation |
| **Security** | JWT auth; input sanitisation; user data isolation |
| **Reliability** | Graceful error handling; retry buttons on failure |
| **Maintainability** | Commented code; consistent naming conventions |
| **Browser Support** | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| **Offline Feedback** | Clear error messages when server is unreachable |

---

## 10. Success Metrics

| Metric | Target |
|---|---|
| Time to first campaign | < 3 minutes for new user |
| Content generation speed | < 2 seconds per piece |
| Feature discoverability | 85% found without tutorial |
| Mobile usability | Full functionality on 375px |
| AI chat response time | < 1 second (mocked) |
| Publishing simulation accuracy | 100% status reflected in UI |
| Error recovery | 100% of errors have retry path |

---

## 11. Project Structure

```
ai-marketing-command-center/
├── requirements.md          ← This file
├── README.md                ← Setup guide
├── .env.example             ← Environment template
│
├── backend/
│   ├── app.py               ← Flask application entry point
│   ├── config.py            ← Configuration (reads .env)
│   ├── database.py          ← SQLite init + get_db()
│   ├── requirements.txt     ← Python dependencies
│   ├── routes/
│   │   ├── auth.py          ← Google OAuth + JWT + demo login
│   │   ├── campaigns.py     ← Campaign CRUD + AI strategy
│   │   ├── content.py       ← Content generation + library
│   │   ├── analytics.py     ← Metrics, charts, insights
│   │   ├── chat.py          ← AI chat messages
│   │   ├── calendar.py      ← Marketing calendar events
│   │   └── auto_reply.py    ← Rules, FAQs, simulator
│   └── services/
│       ├── ai_service.py    ← Mocked AI (replace with real LLM)
│       └── analytics_service.py ← Analytics data generation
│
└── frontend/
    ├── index.html           ← Single HTML file (login + app)
    ├── css/
    │   ├── main.css         ← All styles (variables, layout, components)
    │   └── animations.css   ← Micro-interactions and effects
    └── js/
        ├── api.js           ← Backend API client
        ├── utils.js         ← Toast, Modal, Loader, formatters
        ├── auth.js          ← Authentication logic
        ├── app.js           ← Router, sidebar, navigation
        ├── dashboard.js     ← Dashboard page
        ├── campaigns.js     ← Campaigns CRUD + strategy
        ├── content.js       ← Content generator + library
        ├── chat.js          ← AI chat interface
        ├── analytics.js     ← Analytics charts + metrics
        ├── calendar.js      ← Calendar + publishing queue
        └── auto-reply.js    ← Rules, FAQs, simulator
```

---

*Document Version: 1.0 | AI Marketing Command Center — Flask + SQLite + Vanilla JS + Google OAuth*
