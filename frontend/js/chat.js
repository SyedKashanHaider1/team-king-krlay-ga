/**
 * AI Chat (Strategist) Page
 */
window.ChatPage = {
  isTyping: false,

  async load() {
    const page = document.getElementById("page-chat");
    if (!page) return;
    page.innerHTML = this._render();
    this._bindInput();
    await this._loadHistory();
  },

  async _loadHistory() {
    Loader.show();
    try {
      const history = await API.getChatHistory();
      if (!history.length) {
        this._addBubble("assistant", this._welcomeMessage());
      } else {
        history.forEach(msg => this._addBubble(msg.role, msg.message, msg.created_at, false));
        this._scrollToBottom();
      }
    } catch (err) {
      this._addBubble("assistant", this._welcomeMessage());
    } finally {
      Loader.hide();
    }
  },

  async sendMessage(text = null) {
    const input = document.getElementById("chat-input");
    const message = text || input?.value?.trim();
    if (!message) return;
    if (input) input.value = "";
    this._autoResizeInput(input);

    this._addBubble("user", message);
    this._showTyping();
    this._scrollToBottom();

    try {
      const res = await API.sendMessage(message);
      this._hideTyping();
      this._addBubble("assistant", res.reply);
      this._scrollToBottom();
    } catch (err) {
      this._hideTyping();
      this._addBubble("assistant", `⚠️ I'm having trouble connecting right now. Please try again in a moment.\n\nError: ${err.message}`);
    }
  },

  _addBubble(role, message, time = null, animate = true) {
    const container = document.getElementById("chat-messages");
    if (!container) return;
    const isUser = role === "user";
    const timeStr = time ? relativeTime(time) : "just now";
    const avatarContent = isUser ? (Auth.user?.name?.[0] || "U") : "🤖";
    const wrap = document.createElement("div");
    wrap.className = `chat-bubble-wrap ${isUser ? "user" : "ai"}${animate ? " animate-slideUp" : ""}`;
    const formattedMsg = isUser ? escHtml(message) : parseMarkdown(message);
    wrap.innerHTML = `
      <div class="bubble-avatar" style="${isUser ? "background:var(--grad-insta)" : ""}">${avatarContent}</div>
      <div>
        <div class="chat-bubble ${isUser ? "user" : "ai"}">${formattedMsg}</div>
        <span class="chat-time">${timeStr}</span>
      </div>`;
    container.appendChild(wrap);
  },

  _showTyping() {
    const container = document.getElementById("chat-messages");
    if (!container) return;
    const el = document.createElement("div");
    el.className = "chat-bubble-wrap ai";
    el.id = "typing-indicator-wrap";
    el.innerHTML = `
      <div class="bubble-avatar">🤖</div>
      <div>
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
        <span class="chat-time">AI is thinking...</span>
      </div>`;
    container.appendChild(el);
    this._scrollToBottom();
  },

  _hideTyping() {
    document.getElementById("typing-indicator-wrap")?.remove();
  },

  _scrollToBottom() {
    const container = document.getElementById("chat-messages");
    if (container) setTimeout(() => container.scrollTop = container.scrollHeight, 100);
  },

  _autoResizeInput(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 130) + "px";
  },

  _bindInput() {
    const input = document.getElementById("chat-input");
    if (!input) return;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
    });
    input.addEventListener("input", () => this._autoResizeInput(input));
  },

  async clearHistory() {
    if (!confirm("Clear all chat history?")) return;
    Loader.show();
    try {
      await API.clearChat();
      document.getElementById("chat-messages").innerHTML = "";
      this._addBubble("assistant", this._welcomeMessage());
      Toast.success("Chat cleared");
    } catch (err) {
      Toast.error("Failed", err.message);
    } finally {
      Loader.hide();
    }
  },

  _welcomeMessage() {
    return `👋 Hey there! I'm your **AI Marketing Strategist** — and I'm genuinely excited to work with you.

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

What would you like to tackle first? 🚀`;
  },

  _render() {
    const quickActions = [
      "Build me a campaign strategy",
      "Best posting times for Instagram?",
      "How to improve email open rate?",
      "Generate a product launch plan",
      "Audience segmentation tips",
      "How to measure campaign ROI?"
    ];
    return `<div class="page-header header-reveal">
      <div class="page-header-left"><h1>🤖 AI Strategist</h1><p class="page-desc">Your intelligent marketing co-pilot — ask anything, get expert guidance</p></div>
      <div class="page-header-actions">
        <button class="btn btn-ghost btn-sm" onclick="ChatPage.clearHistory()">🗑️ Clear Chat</button>
      </div>
    </div>
    <div class="chat-container">
      <div class="chat-header">
        <div class="chat-ai-avatar">🤖</div>
        <div style="flex:1">
          <div class="font-semi">Marketing AI Strategist</div>
          <div class="chat-ai-status">Online · Powered by AI</div>
        </div>
      </div>
      <div class="chat-quick-actions">
        ${quickActions.map(a => `<div class="quick-action-chip" onclick="ChatPage.sendMessage('${a}')">${a}</div>`).join("")}
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-input-area">
        <textarea class="chat-input" id="chat-input" placeholder="Ask your AI Strategist anything… e.g. 'Help me plan a product launch campaign'" rows="1"></textarea>
        <button class="chat-send-btn" onclick="ChatPage.sendMessage()" title="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>`;
  }
};
