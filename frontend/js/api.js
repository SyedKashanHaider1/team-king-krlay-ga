/**
 * API Client — AI Marketing Command Center
 * All communication with the Flask backend
 */
const API_BASE = window.API_BASE || "http://localhost:5000/api";

class APIClient {
  constructor() {
    this._token = localStorage.getItem("mcc_token") || null;
  }

  setToken(token) {
    this._token = token;
    localStorage.setItem("mcc_token", token);
  }

  clearToken() {
    this._token = null;
    localStorage.removeItem("mcc_token");
  }

  get headers() {
    const h = { "Content-Type": "application/json" };
    if (this._token) h["Authorization"] = `Bearer ${this._token}`;
    return h;
  }

  async request(method, path, body = null, retryOn401 = true) {
    const opts = { method, headers: this.headers, credentials: "include" };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(`${API_BASE}${path}`, opts);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 && retryOn401) {
          // Try refresh
          try {
            const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
              method: "POST",
              credentials: "include"
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              this.setToken(refreshData.access_token);
              // Retry original request
              return this.request(method, path, body, false);
            }
          } catch (refreshErr) {
            // Refresh failed, logout
            this.clearToken();
            window.Auth && window.Auth.logout(true);
          }
        }
        if (res.status === 401) {
          this.clearToken();
          window.Auth && window.Auth.logout(true);
        }
        throw new Error(data.error || data.message || `HTTP ${res.status}`);
      }
      return data;
    } catch (err) {
      if (err.name === "TypeError") throw new Error("Cannot reach server. Is the backend running?");
      throw err;
    }
  }

  get(path)          { return this.request("GET", path); }
  post(path, body)   { return this.request("POST", path, body); }
  put(path, body)    { return this.request("PUT", path, body); }
  delete(path)       { return this.request("DELETE", path); }

  // ── Auth ──
  signup(data) { return this.post("/auth/signup", data); }
  login(data) { return this.post("/auth/login", data); }
  getMe() { return this.get("/auth/me"); }
  logout() { return this.post("/auth/logout", {}); }

  // ── Campaigns ──
  getCampaigns()           { return this.get("/campaigns/"); }
  getCampaign(id)          { return this.get(`/campaigns/${id}`); }
  createCampaign(data)     { return this.post("/campaigns/", data); }
  updateCampaign(id, data) { return this.put(`/campaigns/${id}`, data); }
  deleteCampaign(id)       { return this.delete(`/campaigns/${id}`); }
  generateStrategy(id)     { return this.post(`/campaigns/${id}/generate-strategy`, {}); }
  getCampaignStats()       { return this.get("/campaigns/stats"); }

  // ── Content ──
  getContent(params = "")      { return this.get(`/content/${params ? "?" + params : ""}`); }
  generateContent(data)        { return this.post("/content/generate", data); }
  saveContent(data)            { return this.post("/content/", data); }
  updateContent(id, data)      { return this.put(`/content/${id}`, data); }
  deleteContent(id)            { return this.delete(`/content/${id}`); }
  publishContent(id)           { return this.post(`/content/${id}/publish`, {}); }
  generateVariations(data)     { return this.post("/content/variations", data); }

  // ── Analytics ──
  getAnalyticsOverview()              { return this.get("/analytics/overview"); }
  getEngagement(days = 30)           { return this.get(`/analytics/engagement?days=${days}`); }
  getChannelBreakdown()               { return this.get("/analytics/channels"); }
  getTopContent(limit = 5)           { return this.get(`/analytics/top-content?limit=${limit}`); }
  getFunnel()                         { return this.get("/analytics/funnel"); }
  getDemographics()                   { return this.get("/analytics/demographics"); }
  getHeatmap()                        { return this.get("/analytics/heatmap"); }
  getOptimisationTips(channelData)    { return this.post("/analytics/optimisation-tips", channelData); }

  // ── Chat ──
  sendMessage(message, context = "")  { return this.post("/chat/message", { message, context }); }
  getChatHistory()                    { return this.get("/chat/history"); }
  clearChat()                         { return this.delete("/chat/clear"); }

  // ── Calendar ──
  getCalendarEvents(month, year) { return this.get(`/calendar/?month=${month}&year=${year}`); }
  generateCalendar(month, year)  { return this.post("/calendar/generate", { month, year }); }
  createEvent(data)              { return this.post("/calendar/", data); }
  updateEvent(id, data)          { return this.put(`/calendar/${id}`, data); }
  deleteEvent(id)                { return this.delete(`/calendar/${id}`); }

  // ── Auto-Reply ──
  getRules()              { return this.get("/auto-reply/rules"); }
  createRule(data)        { return this.post("/auto-reply/rules", data); }
  updateRule(id, data)    { return this.put(`/auto-reply/rules/${id}`, data); }
  deleteRule(id)          { return this.delete(`/auto-reply/rules/${id}`); }
  simulateReply(message)  { return this.post("/auto-reply/simulate", { message }); }
  getFAQs()               { return this.get("/auto-reply/faqs"); }
  createFAQ(data)         { return this.post("/auto-reply/faqs", data); }
  deleteFAQ(id)           { return this.delete(`/auto-reply/faqs/${id}`); }
}

window.API = new APIClient();
