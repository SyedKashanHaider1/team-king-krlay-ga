import json
import random
import datetime

import os
import requests

from config import Config

class AIService:
    """Mocked AI service — replace inner methods with real LLM API calls."""

    TONES = {
        "professional": "authoritative, data-driven, and polished",
        "casual": "friendly, conversational, and relatable",
        "urgent": "time-sensitive, action-oriented, and compelling",
        "playful": "fun, witty, and energetic",
        "inspirational": "motivating, visionary, and emotionally resonant"
    }

    CHANNEL_LIMITS = {
        "instagram": 2200,
        "facebook": 63206,
        "twitter": 280,
        "linkedin": 3000,
        "email": 50000,
        "sms": 160
    }

    # ─────────────────────────────────────────────
    # Campaign Strategy
    # ─────────────────────────────────────────────
    def generate_campaign_strategy(self, name, goal, audience, budget, channels, start_date, end_date):
        channel_list = ", ".join(channels) if channels else "all channels"
        weeks = self._week_count(start_date, end_date)
        per_channel = round(budget / max(len(channels), 1), 2) if budget else 0

        phases = [
            {
                "phase": "Phase 1 — Awareness",
                "week": "Week 1–2",
                "objective": f"Build brand awareness for {name} among {audience}",
                "tactics": [
                    f"Launch teaser content across {channel_list}",
                    "Run targeted awareness ads with storytelling creative",
                    "Publish educational blog posts / carousels",
                    "Set up retargeting pixels and audience lists"
                ],
                "kpis": ["Reach", "Impressions", "Brand recall lift"]
            },
            {
                "phase": "Phase 2 — Engagement",
                "week": f"Week 3–{max(3, weeks // 2)}",
                "objective": f"Drive deep engagement and community building toward {goal}",
                "tactics": [
                    "Host live Q&A or interactive polls",
                    "Launch user-generated content challenge",
                    "Deploy email drip sequence (3-part series)",
                    "Publish social proof and testimonial content"
                ],
                "kpis": ["Engagement Rate", "Comments", "Email Open Rate", "CTR"]
            },
            {
                "phase": "Phase 3 — Conversion",
                "week": f"Week {max(4, weeks // 2 + 1)}–{weeks}",
                "objective": f"Convert engaged audience into {goal}",
                "tactics": [
                    "Deploy limited-time offer / CTA-heavy content",
                    "Retarget engaged users with conversion ads",
                    "Send final email push with urgency messaging",
                    "Activate SMS campaign for high-intent leads"
                ],
                "kpis": ["Conversion Rate", "Revenue", "CAC", "ROAS"]
            }
        ]

        return {
            "overview": f"A {weeks}-week multi-channel campaign targeting {audience} across {channel_list} with a total budget of ${budget:,.2f}. Goal: {goal}.",
            "budget_allocation": {ch: f"${per_channel:,.2f}" for ch in (channels or ["Social", "Email", "SMS"])},
            "recommended_posting_frequency": {
                "instagram": "1–2x daily",
                "facebook": "1x daily",
                "twitter": "3–5x daily",
                "linkedin": "3–4x weekly",
                "email": "2x weekly",
                "sms": "1x weekly"
            },
            "phases": phases,
            "best_posting_times": {
                "instagram": ["9 AM", "12 PM", "7 PM"],
                "facebook": ["8 AM", "1 PM", "5 PM"],
                "twitter": ["8 AM", "12 PM", "9 PM"],
                "linkedin": ["8 AM", "10 AM", "12 PM"],
                "email": ["Tuesday 10 AM", "Thursday 2 PM"],
                "sms": ["12 PM weekdays"]
            },
            "audience_segments": [
                {"segment": "High-Intent Leads", "size": "25%", "approach": "Direct conversion messaging"},
                {"segment": "Warm Audience", "size": "40%", "approach": "Nurture with value content"},
                {"segment": "Cold Audience", "size": "35%", "approach": "Awareness and education"}
            ],
            "risk_factors": [
                "Audience fatigue if posting too frequently",
                "Budget depletion before Phase 3 if not paced",
                "Low organic reach — supplement with paid media"
            ],
            "ai_confidence_score": round(random.uniform(82, 97), 1)
        }

    # ─────────────────────────────────────────────
    # Content Generation
    # ─────────────────────────────────────────────
    def generate_content(self, channel, content_type, topic, tone, brand_name="Your Brand", keywords=None):
        tone_desc = self.TONES.get(tone, self.TONES["professional"])
        keywords = keywords or []
        kw_str = ", ".join(keywords) if keywords else topic

        templates = {
            "instagram": self._instagram_post(topic, tone, brand_name, kw_str),
            "facebook": self._facebook_post(topic, tone, brand_name, kw_str),
            "twitter": self._twitter_post(topic, tone, brand_name),
            "linkedin": self._linkedin_post(topic, tone, brand_name, kw_str),
            "email": self._email_content(topic, tone, brand_name, content_type),
            "sms": self._sms_content(topic, brand_name)
        }

        content = templates.get(channel, templates["instagram"])
        limit = self.CHANNEL_LIMITS.get(channel, 2200)

        return {
            "channel": channel,
            "content_type": content_type,
            "title": content.get("title", ""),
            "body": content["body"][:limit],
            "hashtags": content.get("hashtags", []),
            "cta": content.get("cta", "Learn more →"),
            "emoji_suggestions": content.get("emojis", ["🚀", "💡", "✨"]),
            "estimated_reach": f"{random.randint(1200, 45000):,}",
            "engagement_prediction": f"{round(random.uniform(3.2, 8.9), 1)}%",
            "ai_tips": [
                f"Post on {random.choice(['Tuesday', 'Wednesday', 'Thursday'])} for best engagement",
                "Add a strong call-to-action in the first sentence",
                f"Use {random.randint(3,6)} relevant hashtags for maximum reach",
                "Pair with a high-contrast visual for 2× more impressions"
            ]
        }

    def generate_calendar(self, user_id, month, year, campaigns):
        events = []
        channels = ["instagram", "facebook", "twitter", "linkedin", "email", "sms"]
        content_ideas = [
            "Product Spotlight", "Customer Story", "Behind the Scenes",
            "Educational Tip", "Promotional Offer", "Poll & Engagement",
            "Weekly Newsletter", "Flash Sale Alert", "Milestone Celebration",
            "Industry News Comment", "How-To Guide", "User Generated Content"
        ]
        colors = ["#667eea", "#f5576c", "#25d366", "#1877f2", "#fd7e14", "#6f42c1"]
        import calendar
        days_in_month = calendar.monthrange(year, month)[1]

        for day in range(1, days_in_month + 1):
            if random.random() > 0.4:
                num_posts = random.randint(1, 3)
                for _ in range(num_posts):
                    ch = random.choice(channels)
                    idea = random.choice(content_ideas)
                    hour = random.choice([8, 9, 12, 13, 17, 19])
                    events.append({
                        "id": len(events) + 1,
                        "title": f"{idea} — {ch.capitalize()}",
                        "event_date": f"{year}-{month:02d}-{day:02d}",
                        "event_time": f"{hour:02d}:00",
                        "channel": ch,
                        "status": random.choice(["planned", "scheduled", "published"]),
                        "color": colors[channels.index(ch)],
                        "description": f"AI-recommended {ch} post for {idea.lower()}"
                    })

        return {"month": month, "year": year, "events": events[:60]}

    # ─────────────────────────────────────────────
    # Chat / AI Correspondence
    # ─────────────────────────────────────────────
    def chat_response(self, message, history=None):
        if Config.GEMINI_API_KEY:
            gemini_reply = self._gemini_chat_response(message, history=history)
            if gemini_reply:
                return gemini_reply

        msg_lower = message.lower()

        if any(w in msg_lower for w in ["campaign", "strategy", "plan", "launch"]):
            return self._campaign_advice(message)
        elif any(w in msg_lower for w in ["content", "post", "write", "generate", "create"]):
            return self._content_advice(message)
        elif any(w in msg_lower for w in ["analytic", "metric", "performance", "result", "roi", "kpi"]):
            return self._analytics_advice(message)
        elif any(w in msg_lower for w in ["schedule", "publish", "calendar", "when", "time"]):
            return self._scheduling_advice(message)
        elif any(w in msg_lower for w in ["audience", "target", "customer", "segment"]):
            return self._audience_advice(message)
        elif any(w in msg_lower for w in ["budget", "spend", "cost", "allocate"]):
            return self._budget_advice(message)
        elif any(w in msg_lower for w in ["hello", "hi", "hey", "start", "help"]):
            return self._greeting()
        else:
            return self._general_advice(message)

    def _gemini_chat_response(self, message, history=None):
        history = history or []

        contents = []
        for h in history:
            role = (h.get("role") or "").strip().lower()
            text = (h.get("message") or "").strip()
            if not text:
                continue

            if role in {"assistant", "model"}:
                gemini_role = "model"
            else:
                gemini_role = "user"

            contents.append({"role": gemini_role, "parts": [{"text": text}]})

        contents.append({"role": "user", "parts": [{"text": message}]})

        model = Config.GEMINI_MODEL
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        params = {"key": Config.GEMINI_API_KEY}
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 512
            }
        }

        try:
            resp = requests.post(url, params=params, json=payload, timeout=20)
            resp.raise_for_status()
            data = resp.json()

            candidates = data.get("candidates") or []
            if not candidates:
                return None

            content = (candidates[0].get("content") or {})
            parts = content.get("parts") or []
            if not parts:
                return None

            text = (parts[0].get("text") or "").strip()
            return text or None
        except Exception:
            return None

    def generate_auto_reply(self, incoming_message, faqs=None):
        msg_lower = incoming_message.lower()
        faqs = faqs or []

        # Check FAQs first
        for faq in faqs:
            if any(word in msg_lower for word in faq["question"].lower().split()):
                return {"reply": faq["answer"], "source": "faq", "confidence": 0.95}

        if any(w in msg_lower for w in ["price", "cost", "how much", "pricing"]):
            reply = "Thanks for reaching out! Our pricing starts at $29/month. Visit our pricing page for full details, or I can connect you with our sales team. 😊"
        elif any(w in msg_lower for w in ["hours", "open", "available", "when"]):
            reply = "We're available Monday–Friday, 9 AM–6 PM (EST). For urgent matters, email us at support@brand.com and we'll respond within 2 hours. ⏰"
        elif any(w in msg_lower for w in ["refund", "return", "cancel", "money back"]):
            reply = "We have a 30-day no-questions-asked refund policy. Please email refunds@brand.com and we'll process it within 3 business days. 💙"
        elif any(w in msg_lower for w in ["complaint", "problem", "issue", "broken", "not working"]):
            return {
                "reply": "I'm sorry you're experiencing this issue! I'm flagging this for immediate human review. A team member will reach out within 1 hour. 🚨",
                "source": "escalation",
                "escalate": True,
                "confidence": 0.99
            }
        else:
            reply = f"Thanks for your message! Our team has received it and will respond shortly. In the meantime, check our Help Center at help.brand.com for instant answers. 🙏"

        return {"reply": reply, "source": "ai", "confidence": round(random.uniform(0.78, 0.94), 2)}

    # ─────────────────────────────────────────────
    # Analytics Insights
    # ─────────────────────────────────────────────
    def generate_optimisation_tips(self, channel_data):
        tips = []
        for channel, metrics in channel_data.items():
            eng = metrics.get("engagement_rate", 0)
            if eng < 3.0:
                tips.append({
                    "channel": channel,
                    "severity": "high",
                    "tip": f"⚠️ {channel.capitalize()} engagement ({eng}%) is below benchmark. Try interactive formats: polls, carousels, or Reels.",
                    "expected_lift": "+45–60% engagement"
                })
            elif eng < 5.0:
                tips.append({
                    "channel": channel,
                    "severity": "medium",
                    "tip": f"💡 {channel.capitalize()} can improve. Experiment with posting at 7–9 PM and add more emotional storytelling.",
                    "expected_lift": "+20–35% engagement"
                })
            else:
                tips.append({
                    "channel": channel,
                    "severity": "low",
                    "tip": f"✅ {channel.capitalize()} is performing well! Double down — increase posting frequency by 20%.",
                    "expected_lift": "+15–25% reach"
                })
        return tips

    # ─────────────────────────────────────────────
    # Private helpers
    # ─────────────────────────────────────────────
    def _instagram_post(self, topic, tone, brand, kw):
        hooks = {
            "professional": f"This changes everything about {topic}. 📊",
            "casual": f"Okay, we need to talk about {topic}... 👀",
            "urgent": f"⚡ Last chance to understand {topic} before it's too late.",
            "playful": f"Plot twist: {topic} is actually fun. 🎉",
            "inspirational": f"Every great journey starts with knowing {topic}. 🌟"
        }
        body = f"""{hooks.get(tone, hooks['professional'])}

Here's what {brand} wants you to know about {topic}:

✦ Strategy that actually works
✦ Real results, not vanity metrics  
✦ Built for brands like yours

Swipe to see how we do it → or tap the link in bio to get started.

The brands that win aren't the ones who wait. They act. Are you ready?

💬 Drop a "YES" in the comments if this resonates with you!"""

        return {
            "body": body,
            "hashtags": [f"#{topic.replace(' ', '')}", f"#{brand.replace(' ', '')}", "#Marketing", "#GrowthHacking",
                         "#ContentStrategy", "#SocialMediaMarketing", "#DigitalMarketing", "#Branding",
                         "#MarketingTips", "#BusinessGrowth"],
            "emojis": ["📊", "🚀", "✦", "💡", "🎯"],
            "cta": "Tap the link in bio 🔗"
        }

    def _facebook_post(self, topic, tone, brand, kw):
        body = f"""🎯 Big announcement from {brand}!

We've been working hard on something that will transform how you approach {topic}, and we're finally ready to share it with our community.

Here's the thing — most businesses struggle with {topic} not because they lack effort, but because they lack the right strategy. That ends today.

What we're seeing in the data:
📈 Brands that master {topic} see 3× more engagement
💰 ROI improves by an average of 47% in the first 90 days
🎯 Audience retention jumps to 68% vs the industry average of 32%

We've compiled everything into an actionable guide based on real campaigns from brands just like yours.

Ready to level up? Comment "GUIDE" below and we'll send it to your DMs. ⬇️

— The {brand} Team"""

        return {
            "body": body,
            "hashtags": [f"#{topic.replace(' ','')}", "#FacebookMarketing", "#BusinessGrowth"],
            "emojis": ["🎯", "📈", "💰"],
            "cta": "Comment 'GUIDE' below 💬"
        }

    def _twitter_post(self, topic, tone, brand):
        posts = [
            f"The {topic} playbook nobody is talking about:\n\n→ Know your audience deeply\n→ Test, don't assume\n→ Double what works\n→ Cut what doesn't\n\nSimple. Scalable. Profitable. 🧵",
            f"Hot take: Most brands fail at {topic} because they're copying competitors instead of studying their customers.\n\nBe the brand that listens. — {brand} 🎯",
            f"If your {topic} strategy isn't generating leads, it's costing you money.\n\nFix it in 3 steps:\n1. Audit what you're posting\n2. Identify what drives clicks\n3. Rebuild around data\n\nDM for a free audit 👇"
        ]
        return {"body": random.choice(posts), "hashtags": ["#Marketing", f"#{topic.replace(' ','')}"], "emojis": ["🧵", "🎯"]}

    def _linkedin_post(self, topic, tone, brand, kw):
        body = f"""I spent 90 days analysing {topic} across 200+ brand campaigns. Here's what I found:

The brands outperforming their competition all share one trait: they treat {topic} as a system, not a series of tasks.

Here are the 5 principles that separate the leaders from the rest:

1. 🎯 Customer obsession over product obsession
   They start with pain points, not features.

2. 📊 Data-driven decisions at every touchpoint
   They A/B test headlines, CTAs, and timing — relentlessly.

3. 🔄 Consistent brand voice across all channels
   Customers recognise them in 3 seconds, anywhere.

4. ⚡ Speed of iteration
   They ship, learn, and improve in 72-hour cycles.

5. 🤝 Community-first growth
   Their best customers become their loudest advocates.

At {brand}, we've built our entire approach to {topic} around these principles — and the results speak for themselves.

What's the biggest challenge your team faces with {topic}? I'd love to discuss in the comments. 👇

#Marketing #{topic.replace(' ','')} #Leadership #GrowthStrategy #B2B"""

        return {
            "title": f"5 Principles of Winning {topic} Strategy",
            "body": body,
            "hashtags": ["#Marketing", "#Leadership", "#GrowthStrategy"],
            "emojis": ["🎯", "📊", "🔄", "⚡", "🤝"],
            "cta": "Share with your network 🔗"
        }

    def _email_content(self, topic, tone, brand, content_type):
        subject_lines = {
            "professional": f"How {brand} Solves {topic} For You",
            "casual": f"Hey, quick thought on {topic}...",
            "urgent": f"⚡ Don't miss this — {topic} update",
            "playful": f"We cracked the code on {topic} 🎉",
            "inspirational": f"Your {topic} transformation starts today ✨"
        }
        body = f"""Hi {{{{first_name}}}},

{subject_lines.get(tone, subject_lines['professional'])}

We've been listening to our community, and the #1 question we hear is: "How do we actually make {topic} work for our business?"

Today, we're answering that — with specifics.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 WHAT WE DISCOVERED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After analysing thousands of campaigns, we identified three non-negotiables for {topic} success:

  ✅ Clear audience definition before any content creation
  ✅ Consistent multi-channel presence (not just one platform)
  ✅ Weekly performance review with fast iteration loops

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 YOUR ACTION THIS WEEK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pick ONE channel you've been neglecting. Post consistently for 14 days. Measure. 

That's it. Start small. Build momentum.

[→ START YOUR FREE CAMPAIGN NOW]

As always, if you have questions — just reply to this email. We read every single one.

Warm regards,
The {brand} Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{brand} | Unsubscribe | Update Preferences"""

        return {
            "title": subject_lines.get(tone, subject_lines['professional']),
            "body": body,
            "hashtags": [],
            "cta": "→ START YOUR FREE CAMPAIGN NOW"
        }

    def _sms_content(self, topic, brand):
        msgs = [
            f"{brand}: Big news on {topic}! Check your email for our exclusive guide — only for subscribers. Reply STOP to opt out.",
            f"🔥 {brand}: Your {topic} results are waiting. Log in now → bit.ly/dashboard. Reply STOP to opt out.",
            f"{brand} Alert: New {topic} feature is LIVE. Try it free for 7 days: bit.ly/try-now. Reply STOP to opt out."
        ]
        return {"body": random.choice(msgs)[:160], "hashtags": [], "emojis": ["🔥"]}

    def _campaign_advice(self, msg):
        return f"""Great question about campaigns! Here's my strategic take:

🎯 **Start with your goal** — Is it awareness, engagement, or conversion? Each requires a completely different content mix and budget allocation.

📋 **My recommended 4-step framework:**
1. **Define** — Set SMART goals with specific KPIs
2. **Segment** — Identify your top 3 audience personas  
3. **Map** — Choose 2–3 channels where your audience is most active
4. **Activate** — Launch in phases (Awareness → Engagement → Conversion)

💡 **Pro tip:** Brands that run phased campaigns see 3× better ROI than those who go all-in on day one.

Would you like me to generate a full campaign strategy? Just tell me your brand name, goal, target audience, and budget — I'll build the whole plan in seconds! 🚀"""

    def _content_advice(self, msg):
        return f"""Here are my top content recommendations right now:

✍️ **What's working in 2025:**
- **Short-form video** — Reels & TikToks get 5× the organic reach of static posts
- **Carousels** — 3× more saves and shares than single images
- **Conversational email** — Personal tone outperforms corporate by 40%+ open rate
- **Voice-of-customer content** — Use real customer language, not marketing jargon

🎨 **Content formula that converts:**
**Hook** (first line grabs attention) + **Value** (teach something) + **Proof** (social proof or data) + **CTA** (one clear next step)

Want me to generate content for a specific channel? I can create Instagram posts, email copy, SMS messages, or LinkedIn articles — just tell me the topic and tone! 💬"""

    def _analytics_advice(self, msg):
        return f"""Let me break down what the numbers usually mean:

📊 **Key benchmarks to track:**
| Metric | Average | Good | Great |
|--------|---------|------|-------|
| Instagram ER | 1–3% | 3–6% | 6%+ |
| Email Open Rate | 20% | 25–35% | 35%+ |
| CTR | 2% | 3–5% | 5%+ |
| Conversion Rate | 2–3% | 3–5% | 5%+ |

🔍 **What to do if your numbers are below average:**
1. **Low reach?** → Boost with paid promotion for 5 days
2. **High reach, low engagement?** → Your content hook needs work
3. **High engagement, low conversion?** → Your CTA or landing page needs work
4. **Low email opens?** → A/B test your subject lines

Check your Analytics dashboard — I can see your campaign data and give you personalised recommendations! 📈"""

    def _scheduling_advice(self, msg):
        return f"""Timing is everything in marketing! Here's what the data shows:

🕐 **Optimal posting times (by channel):**

📱 **Instagram:** Tuesday–Thursday, 9 AM & 7 PM
👥 **Facebook:** Wednesday, 1 PM & 5 PM  
💼 **LinkedIn:** Tuesday–Thursday, 8–10 AM
🐦 **Twitter/X:** Weekdays, 8 AM & 5 PM
📧 **Email:** Tuesday & Thursday, 10 AM
📱 **SMS:** Weekdays 12–2 PM

⚡ **My top scheduling tips:**
- Never schedule more than 2 posts/day per channel (audience fatigue is real)
- Use the 70/20/10 rule: 70% value, 20% brand, 10% promotion
- Leave gaps on weekends unless your audience is B2C

Use the **Marketing Calendar** to drag-and-drop your content into the perfect time slots! Want me to suggest a posting schedule for your campaigns? 📅"""

    def _audience_advice(self, msg):
        return f"""Audience targeting is where campaigns win or lose. Here's my framework:

🎯 **The 3-Layer Audience Model:**

**Layer 1 — Core Audience (your best customers)**
Profile them deeply: age, location, income, pain points, favourite content formats. This is 20% of your audience but drives 80% of revenue.

**Layer 2 — Growth Audience (look-alike)**
Similar demographics to Layer 1 but not yet customers. Target with educational content and social proof.

**Layer 3 — Awareness Audience (cold)**
Broad targeting with high-value content to build brand awareness. Don't sell — educate and entertain.

💡 **Segmentation strategies:**
- Behavioural (how they interact with your brand)
- Psychographic (values, interests, lifestyle)
- Geographic (especially for local businesses)
- Lifecycle stage (new visitor → lead → customer → advocate)

Would you like me to build audience personas for your campaign? Tell me your product/service and industry! 👥"""

    def _budget_advice(self, msg):
        return f"""Smart budget allocation is a superpower in marketing. Here's how I recommend distributing it:

💰 **The 40/40/20 Rule:**
- **40%** — Your top-performing channel (double down on what works)
- **40%** — Second-best channel (expand reach)
- **20%** — Experimental channel (test new opportunities)

📊 **Budget benchmarks (% of revenue):**
- Startups: 15–20% of revenue on marketing
- Growth stage: 10–15%
- Mature brands: 5–10%

🎯 **Channel cost efficiency (CPM averages):**
| Channel | Avg CPM |
|---------|---------|
| Organic Social | $0 |
| Email | $0.40 |
| Facebook Ads | $7–12 |
| Instagram Ads | $8–14 |
| LinkedIn Ads | $30–50 |
| Google Search | $20–100 |

**Pro tip:** Always reserve 10–15% of your budget for rapid response — trend-jacking opportunities are worth it! 🚀"""

    def _greeting(self):
        return f"""👋 Hey there! I'm your **AI Marketing Strategist** — and I'm genuinely excited to work with you.

Here's what I can do for you right now:

🎯 **Build campaign strategies** — Tell me your goal and I'll create a full multi-channel plan
✍️ **Generate content** — Posts, emails, SMS, LinkedIn articles, and more
📊 **Analyse performance** — Get insights on what's working and what to fix
📅 **Plan your calendar** — AI-optimised posting schedule for your brand
💬 **Answer any marketing question** — Strategy, tactics, tools, or trends

**To get started, try asking me:**
- *"Create a campaign strategy for my product launch"*
- *"Write an Instagram post about our summer sale"*
- *"What's the best time to post on LinkedIn?"*
- *"How can I improve my email open rate?"*

What would you like to tackle first? 🚀"""

    def _general_advice(self, msg):
        responses = [
            f"""That's a great area to explore! Here's my strategic perspective:

In today's marketing landscape, the brands winning consistently share three habits:

1. **They obsess over customer data** — Not just demographics, but psychographics and behaviour patterns
2. **They iterate fast** — 72-hour test cycles instead of monthly reviews
3. **They build systems, not campaigns** — Sustainable content engines over one-off launches

For your specific question about "{msg[:50]}...", I'd recommend starting with a content audit to understand what's already resonating with your audience, then building from there.

Want me to dive deeper into any specific aspect? I'm here to help! 💡""",
            f"""Excellent question! Let me share what I know about this:

The most effective marketing approach in 2025 is what I call **"Precision Marketing"** — combining data intelligence with authentic storytelling.

Key principles:
✅ Lead with value before selling
✅ Personalise at scale using segmentation
✅ Build community, not just audience
✅ Measure everything, optimise fast

Is there a specific campaign or channel you're looking to improve? Give me more context and I'll give you a highly specific action plan! 🎯"""
        ]
        return random.choice(responses)

    def _week_count(self, start_date, end_date):
        try:
            from datetime import datetime
            s = datetime.strptime(start_date, "%Y-%m-%d")
            e = datetime.strptime(end_date, "%Y-%m-%d")
            return max(1, (e - s).days // 7)
        except:
            return 4
