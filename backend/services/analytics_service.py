import random
import datetime

class AnalyticsService:
    CHANNELS = ["instagram", "facebook", "twitter", "linkedin", "email", "sms"]
    COLORS = {
        "instagram": "#E1306C",
        "facebook": "#1877F2",
        "twitter": "#1DA1F2",
        "linkedin": "#0A66C2",
        "email": "#EA4335",
        "sms": "#25D366"
    }

    def get_overview(self, user_id):
        now = datetime.datetime.now()
        return {
            "total_campaigns": random.randint(8, 24),
            "active_campaigns": random.randint(3, 8),
            "total_reach": random.randint(45000, 320000),
            "total_impressions": random.randint(180000, 950000),
            "total_clicks": random.randint(8000, 42000),
            "total_conversions": random.randint(450, 3200),
            "avg_engagement_rate": round(random.uniform(3.8, 7.2), 2),
            "total_revenue_attributed": round(random.uniform(8500, 85000), 2),
            "roi": round(random.uniform(180, 620), 1),
            "content_pieces_published": random.randint(38, 140),
            "auto_replies_sent": random.randint(120, 680),
            "growth_vs_last_month": {
                "reach": round(random.uniform(8.2, 34.5), 1),
                "engagement": round(random.uniform(-2.1, 18.7), 1),
                "conversions": round(random.uniform(5.4, 42.3), 1),
                "revenue": round(random.uniform(12.1, 55.8), 1)
            }
        }

    def get_engagement_timeline(self, days=30):
        data = []
        base_date = datetime.datetime.now() - datetime.timedelta(days=days)
        base_val = random.randint(800, 2000)
        for i in range(days):
            date = base_date + datetime.timedelta(days=i)
            # Simulate realistic trend with weekday spikes
            weekday_factor = 1.3 if date.weekday() < 5 else 0.7
            val = int(base_val * weekday_factor * random.uniform(0.85, 1.25))
            base_val = int(base_val * random.uniform(0.97, 1.04))  # slight growth
            data.append({
                "date": date.strftime("%Y-%m-%d"),
                "engagement": val,
                "reach": val * random.randint(8, 15),
                "clicks": int(val * random.uniform(0.12, 0.28)),
                "conversions": int(val * random.uniform(0.008, 0.025))
            })
        return data

    def get_channel_breakdown(self):
        result = []
        for ch in self.CHANNELS:
            eng = round(random.uniform(1.8, 9.4), 2)
            reach = random.randint(5000, 85000)
            result.append({
                "channel": ch,
                "color": self.COLORS[ch],
                "reach": reach,
                "impressions": int(reach * random.uniform(2.5, 5.2)),
                "clicks": int(reach * random.uniform(0.04, 0.15)),
                "engagement_rate": eng,
                "conversion_rate": round(random.uniform(0.8, 4.2), 2),
                "posts_published": random.randint(5, 42),
                "growth": round(random.uniform(-5.2, 28.4), 1)
            })
        return result

    def get_top_content(self, limit=5):
        types = ["Carousel Post", "Video Reel", "Story Ad", "Email Newsletter", "LinkedIn Article", "Twitter Thread", "SMS Blast"]
        channels = self.CHANNELS
        items = []
        for i in range(limit):
            ch = random.choice(channels)
            items.append({
                "rank": i + 1,
                "type": random.choice(types),
                "channel": ch,
                "color": self.COLORS[ch],
                "title": f"{random.choice(['Summer Sale', 'Product Launch', 'Customer Story', 'Brand Reveal', 'How-To Guide', 'Weekly Tip'])} — {ch.capitalize()}",
                "reach": random.randint(8000, 92000),
                "engagement_rate": round(random.uniform(4.2, 12.8), 1),
                "clicks": random.randint(320, 4800),
                "conversions": random.randint(18, 380),
                "score": random.randint(72, 99)
            })
        items.sort(key=lambda x: x["score"], reverse=True)
        return items

    def get_funnel_data(self):
        awareness = random.randint(80000, 250000)
        interest = int(awareness * random.uniform(0.25, 0.45))
        consideration = int(interest * random.uniform(0.30, 0.55))
        intent = int(consideration * random.uniform(0.35, 0.60))
        conversion = int(intent * random.uniform(0.25, 0.50))
        return [
            {"stage": "Awareness", "value": awareness, "color": "#667eea", "percent": 100},
            {"stage": "Interest", "value": interest, "color": "#764ba2", "percent": round(interest/awareness*100, 1)},
            {"stage": "Consideration", "value": consideration, "color": "#f093fb", "percent": round(consideration/awareness*100, 1)},
            {"stage": "Intent", "value": intent, "color": "#f5576c", "percent": round(intent/awareness*100, 1)},
            {"stage": "Conversion", "value": conversion, "color": "#25d366", "percent": round(conversion/awareness*100, 1)}
        ]

    def get_audience_demographics(self):
        return {
            "age_groups": [
                {"label": "18–24", "value": random.randint(12, 22)},
                {"label": "25–34", "value": random.randint(28, 42)},
                {"label": "35–44", "value": random.randint(18, 28)},
                {"label": "45–54", "value": random.randint(10, 18)},
                {"label": "55+", "value": random.randint(5, 12)}
            ],
            "gender": [
                {"label": "Female", "value": random.randint(44, 62)},
                {"label": "Male", "value": random.randint(35, 52)},
                {"label": "Other", "value": random.randint(2, 6)}
            ],
            "top_locations": [
                {"city": "New York", "value": random.randint(12, 22)},
                {"city": "Los Angeles", "value": random.randint(10, 18)},
                {"city": "London", "value": random.randint(8, 15)},
                {"city": "Toronto", "value": random.randint(6, 12)},
                {"city": "Sydney", "value": random.randint(4, 10)}
            ],
            "device_split": [
                {"label": "Mobile", "value": random.randint(58, 72)},
                {"label": "Desktop", "value": random.randint(22, 34)},
                {"label": "Tablet", "value": random.randint(4, 10)}
            ]
        }

    def get_heatmap_data(self):
        hours = list(range(24))
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        heatmap = []
        for day_idx, day in enumerate(days):
            for hour in hours:
                is_weekday = day_idx < 5
                is_peak_hour = hour in [8, 9, 12, 13, 17, 18, 19, 20]
                base = random.randint(20, 100)
                if is_weekday and is_peak_hour:
                    base = random.randint(70, 100)
                elif not is_weekday:
                    base = random.randint(10, 50)
                heatmap.append({"day": day, "hour": hour, "value": base})
        return heatmap
