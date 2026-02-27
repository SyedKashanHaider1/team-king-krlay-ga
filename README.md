# AI Marketing Command Center

> **AI-powered marketing platform** — Plan, generate, publish, analyse, and optimise campaigns with a single intelligent brain.

Built with: **Python Flask** · **SQLite** · **Vanilla JS/HTML/CSS** · **Google OAuth**

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- A modern web browser (Chrome 90+, Firefox 88+, Safari 14+)
- Optional: Google Cloud project with OAuth Client ID (or use Demo mode)

---

### Step 1 — Clone / Extract the Project

```bash
# If downloaded as ZIP:
unzip ai-marketing-command-center.zip
cd ai-marketing-command-center
```

---

### Step 2 — Configure Environment

```bash
# Copy the template
cp .env.example .env
```

Edit `.env` with your values:

```env
SECRET_KEY=your-strong-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
FLASK_DEBUG=true
```

> **No Google Client ID?** Use **Demo Mode** — click "Try Demo" on the login page. No setup needed!

---

### Step 3 — Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

> **Tip:** Use a virtual environment:
> ```bash
> python -m venv venv
> source venv/bin/activate   # macOS/Linux
> venv\Scripts\activate      # Windows
> pip install -r requirements.txt
> ```

---

### Step 4 — Start the Server

```bash
# From the backend/ directory
python app.py
```

You should see:
```
🤖 Initialising AI Marketing Command Center...
✅ Database initialized successfully
✅ All systems ready!
🌐 Open http://localhost:5000 in your browser
```

---

### Step 5 — Open in Browser

```
http://localhost:5000
```

That's it! The Flask server serves both the API (`/api/*`) and the frontend.

---

## 🔐 Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth Client ID**
5. Choose **Web Application**
6. Add **Authorised JavaScript origins**: `http://localhost:5000`
7. Add **Authorised redirect URIs**: `http://localhost:5000`
8. Copy the **Client ID**
9. Add it to `.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
10. Also update in `frontend/index.html`:
    ```js
    window.GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com";
    ```

---

## 🎮 Demo Mode

Click **"🚀 Try Demo"** on the login page — no Google account, no setup.

The demo account comes pre-loaded with:
- 4 sample campaigns
- 5 content pieces
- Auto-reply rules
- FAQ knowledge base

---

## 📁 Project Structure

```
ai-marketing-command-center/
├── requirements.md        ← Project requirements doc
├── README.md              ← This file
├── .env.example           ← Environment template
├── backend/
│   ├── app.py             ← Flask entry point (run this!)
│   ├── config.py          ← Config reads from .env
│   ├── database.py        ← SQLite setup + connection
│   ├── requirements.txt   ← pip dependencies
│   ├── data/              ← SQLite DB created here on first run
│   ├── routes/            ← auth, campaigns, content, analytics...
│   └── services/          ← ai_service, analytics_service
└── frontend/
    ├── index.html         ← App shell (login + SPA)
    ├── css/               ← main.css + animations.css
    └── js/                ← api, utils, auth, app, pages...
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google OAuth token verification |
| POST | `/api/auth/demo-login` | Demo login (no OAuth required) |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/campaigns/` | List all campaigns |
| POST | `/api/campaigns/` | Create campaign |
| POST | `/api/campaigns/:id/generate-strategy` | AI generate strategy |
| POST | `/api/content/generate` | AI generate content |
| GET | `/api/content/` | List saved content |
| POST | `/api/content/:id/publish` | Publish content |
| GET | `/api/analytics/overview` | Dashboard metrics |
| GET | `/api/analytics/engagement` | Timeline data |
| GET | `/api/analytics/channels` | Channel breakdown |
| POST | `/api/chat/message` | Send message, get AI reply |
| GET | `/api/chat/history` | Chat history |
| POST | `/api/calendar/generate` | AI generate monthly calendar |
| GET | `/api/auto-reply/rules` | Auto-reply rules |
| POST | `/api/auto-reply/simulate` | Test reply simulation |
| GET | `/api/health` | Server health check |

---

## 🤖 Replacing Mock AI with Real LLM

The `backend/services/ai_service.py` contains all AI logic in mockable methods.

To integrate OpenAI/Anthropic, replace the string templates with real API calls:

```python
# In ai_service.py, replace template content with:
import openai
openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_content(self, channel, content_type, topic, tone, brand_name, keywords):
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": f"Write a {tone} {channel} {content_type} about {topic} for {brand_name}. Keywords: {keywords}"}]
    )
    return {"body": response.choices[0].message.content, ...}
```

---

## 🛠️ Troubleshooting

| Issue | Solution |
|---|---|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| Port 5000 in use | Set `PORT=5001` in `.env` |
| Google login fails | Use Demo mode or check Client ID config |
| Database errors | Delete `backend/data/marketing.db` and restart |
| Charts not showing | Check browser console for CDN errors (needs internet) |

---

## 📄 License

MIT License — Free to use, modify, and deploy.

---

*AI Marketing Command Center v1.0 — Built for marketers who want to move faster.*
