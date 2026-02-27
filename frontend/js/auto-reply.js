/**
 * Auto-Reply Manager Page
 */
window.AutoReplyPage = {
  rules: [],
  faqs: [],
  activeTab: "rules",

  async load() {
    const page = document.getElementById("page-auto-reply");
    if (!page) return;
    page.innerHTML = this._render();
    initRipples();
    await this._loadData();
  },

  async _loadData() {
    try {
      [this.rules, this.faqs] = await Promise.all([API.getRules(), API.getFAQs()]);
      this._renderRules();
      this._renderFAQs();
    } catch (err) {
      Toast.error("Load Failed", err.message);
    }
  },

  _renderRules() {
    const list = document.getElementById("rules-list");
    if (!list) return;
    if (!this.rules.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🤖</div>
        <div class="empty-state-title">No auto-reply rules yet</div>
        <div class="empty-state-desc">Create rules to automatically respond to messages containing specific keywords.</div>
        <button class="btn btn-primary mt-16" onclick="AutoReplyPage.openRuleModal()">➕ Add First Rule</button></div>`;
      return;
    }
    list.className = "grid-auto list-animate";
    list.innerHTML = this.rules.map(r => `
      <div class="rule-card">
        <div class="rule-card-header">
          <div>
            <span class="rule-keyword">🔑 "${escHtml(r.trigger_keyword)}"</span>
            <div class="text-xs text-muted mt-6">${channelIcon(r.channel)} ${r.channel === "all" ? "All channels" : r.channel}</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" ${r.is_active ? "checked" : ""} onchange="AutoReplyPage.toggleRule(${r.id}, this.checked)">
            <div class="toggle-track"></div>
          </label>
        </div>
        <div class="rule-reply">"${escHtml(r.reply_text)}"</div>
        <div class="rule-footer">
          <span class="rule-stats">💬 ${r.match_count || 0} matches</span>
          <div class="flex gap-8">
            <button class="btn btn-ghost btn-sm" onclick="AutoReplyPage.deleteRule(${r.id})">🗑️ Delete</button>
          </div>
        </div>
      </div>`).join("");
    initRipples();
  },

  _renderFAQs() {
    const list = document.getElementById("faqs-list");
    if (!list) return;
    if (!this.faqs.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❓</div>
        <div class="empty-state-title">No FAQs yet</div>
        <div class="empty-state-desc">Add frequently asked questions and their answers to power your AI auto-replies.</div>
        <button class="btn btn-primary mt-16" onclick="AutoReplyPage.openFAQModal()">➕ Add FAQ</button></div>`;
      return;
    }
    list.className = "flex flex-col gap-12 list-animate";
    list.innerHTML = this.faqs.map(f => `
      <div class="card">
        <div class="flex items-start justify-between gap-12">
          <div style="flex:1">
            <div class="font-semi mb-6">❓ ${escHtml(f.question)}</div>
            <div class="text-secondary text-sm">${escHtml(f.answer)}</div>
            <div class="text-xs text-muted mt-8">Category: ${f.category} · Used ${f.usage_count} times</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="AutoReplyPage.deleteFAQ(${f.id})">🗑️</button>
        </div>
      </div>`).join("");
    initRipples();
  },

  openRuleModal() {
    document.getElementById("rule-modal-body").innerHTML = `
      <div class="modal-header">
        <div class="modal-title">➕ Add Auto-Reply Rule</div>
        <button class="modal-close" onclick="Modal.close('rule-modal')">✕</button>
      </div>
      <div class="form-group"><label class="form-label">Trigger Keyword *</label>
        <input class="form-input" id="rule-keyword" placeholder="e.g. price, refund, shipping...">
        <div class="form-hint">Messages containing this word will trigger the auto-reply</div>
      </div>
      <div class="form-group"><label class="form-label">Reply Message *</label>
        <textarea class="form-textarea" id="rule-reply" placeholder="Hi! Thanks for reaching out. Here's what you need to know..." rows="4"></textarea>
      </div>
      <div class="form-group"><label class="form-label">Channel</label>
        <select class="form-select" id="rule-channel">
          <option value="all">All Channels</option>
          ${["instagram","facebook","twitter","linkedin","email","sms"].map(ch=>`<option value="${ch}">${channelIcon(ch)} ${ch}</option>`).join("")}
        </select>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="Modal.close('rule-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="AutoReplyPage.saveRule()">💾 Save Rule</button>
      </div>`;
    initRipples();
    Modal.open("rule-modal");
  },

  async saveRule() {
    const keyword = document.getElementById("rule-keyword")?.value?.trim();
    const reply = document.getElementById("rule-reply")?.value?.trim();
    if (!keyword || !reply) { Toast.error("All fields required"); return; }
    Loader.show();
    try {
      const rule = await API.createRule({ trigger_keyword: keyword, reply_text: reply, channel: document.getElementById("rule-channel")?.value || "all" });
      this.rules.unshift(rule);
      this._renderRules();
      Modal.close("rule-modal");
      Toast.success("Rule Created! 🤖");
    } catch (err) {
      Toast.error("Failed", err.message);
    } finally {
      Loader.hide();
    }
  },

  async toggleRule(id, active) {
    try {
      await API.updateRule(id, { is_active: active ? 1 : 0 });
      const rule = this.rules.find(r => r.id === id);
      if (rule) rule.is_active = active ? 1 : 0;
      Toast.success(active ? "Rule Activated" : "Rule Paused");
    } catch (err) {
      Toast.error("Update Failed");
    }
  },

  async deleteRule(id) {
    if (!confirm("Delete this rule?")) return;
    Loader.show();
    try {
      await API.deleteRule(id);
      this.rules = this.rules.filter(r => r.id !== id);
      this._renderRules();
      Toast.success("Rule Deleted");
    } catch (err) {
      Toast.error("Failed", err.message);
    } finally {
      Loader.hide();
    }
  },

  openFAQModal() {
    document.getElementById("faq-modal-body").innerHTML = `
      <div class="modal-header">
        <div class="modal-title">➕ Add FAQ</div>
        <button class="modal-close" onclick="Modal.close('faq-modal')">✕</button>
      </div>
      <div class="form-group"><label class="form-label">Question *</label>
        <input class="form-input" id="faq-q" placeholder="e.g. What are your pricing plans?"></div>
      <div class="form-group"><label class="form-label">Answer *</label>
        <textarea class="form-textarea" id="faq-a" placeholder="Our pricing starts at $29/month..." rows="4"></textarea></div>
      <div class="form-group"><label class="form-label">Category</label>
        <select class="form-select" id="faq-cat">
          ${["general","pricing","support","product","account","data"].map(c=>`<option>${c}</option>`).join("")}
        </select></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="Modal.close('faq-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="AutoReplyPage.saveFAQ()">💾 Save FAQ</button>
      </div>`;
    initRipples();
    Modal.open("faq-modal");
  },

  async saveFAQ() {
    const q = document.getElementById("faq-q")?.value?.trim();
    const a = document.getElementById("faq-a")?.value?.trim();
    if (!q || !a) { Toast.error("Question and Answer required"); return; }
    Loader.show();
    try {
      const faq = await API.createFAQ({ question: q, answer: a, category: document.getElementById("faq-cat")?.value || "general" });
      this.faqs.unshift(faq);
      this._renderFAQs();
      Modal.close("faq-modal");
      Toast.success("FAQ Added! ✅");
    } catch (err) {
      Toast.error("Failed", err.message);
    } finally {
      Loader.hide();
    }
  },

  async deleteFAQ(id) {
    if (!confirm("Delete this FAQ?")) return;
    Loader.show();
    try {
      await API.deleteFAQ(id);
      this.faqs = this.faqs.filter(f => f.id !== id);
      this._renderFAQs();
      Toast.success("FAQ Deleted");
    } catch (err) {
      Toast.error("Failed", err.message);
    } finally {
      Loader.hide();
    }
  },

  async testReply() {
    const msg = document.getElementById("test-message")?.value?.trim();
    if (!msg) { Toast.error("Enter a message to test"); return; }
    const resultEl = document.getElementById("test-result");
    resultEl.innerHTML = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
    try {
      const res = await API.simulateReply(msg);
      const escapeType = res.escalate ? "🚨 Escalated to human" : `Source: ${res.source}`;
      resultEl.innerHTML = `
        <div style="padding:16px;background:rgba(37,211,102,0.06);border:1px solid rgba(37,211,102,0.2);border-radius:12px;animation:slideUp 0.3s ease">
          <div class="flex items-center justify-between mb-10">
            <span class="font-semi text-sm">🤖 Auto-Reply Preview</span>
            <div class="flex gap-8">
              <span class="badge-pill ${res.escalate ? 'badge-failed' : 'badge-active'}">${escapeType}</span>
              <span class="badge-pill badge-scheduled">Confidence: ${Math.round((res.confidence||0)*100)}%</span>
            </div>
          </div>
          <div style="background:var(--bg-card);border-radius:10px;padding:14px;font-size:0.9rem;line-height:1.65">${escHtml(res.reply)}</div>
        </div>`;
    } catch (err) {
      resultEl.innerHTML = `<div class="text-error">Error: ${err.message}</div>`;
    }
  },

  switchTab(tab, el) {
    this.activeTab = tab;
    document.querySelectorAll("#reply-tabs .tab").forEach(t => t.classList.remove("active"));
    el.classList.add("active");
    document.getElementById("rules-section").style.display = tab === "rules" ? "" : "none";
    document.getElementById("faqs-section").style.display = tab === "faqs" ? "" : "none";
    document.getElementById("simulator-section").style.display = tab === "simulator" ? "" : "none";
  },

  _render() {
    return `<div class="page-header header-reveal">
      <div class="page-header-left"><h1>💬 Auto-Reply Manager</h1><p class="page-desc">AI-powered automatic responses for messages, DMs, and comments</p></div>
      <div class="page-header-actions">
        <button class="btn btn-primary" onclick="AutoReplyPage.openRuleModal()">➕ New Rule</button>
        <button class="btn btn-outline" onclick="AutoReplyPage.openFAQModal()">📖 Add FAQ</button>
      </div>
    </div>

    <div class="tabs" id="reply-tabs">
      <div class="tab active" onclick="AutoReplyPage.switchTab('rules', this)">🤖 Rules</div>
      <div class="tab" onclick="AutoReplyPage.switchTab('faqs', this)">❓ FAQs</div>
      <div class="tab" onclick="AutoReplyPage.switchTab('simulator', this)">🧪 Simulator</div>
    </div>

    <div id="rules-section">
      <div id="rules-list" class="grid-auto"></div>
    </div>

    <div id="faqs-section" style="display:none">
      <div id="faqs-list"></div>
    </div>

    <div id="simulator-section" style="display:none">
      <div class="card" style="max-width:600px">
        <div class="card-header"><div class="card-title">🧪 Reply Simulator</div><div class="card-subtitle">Test how your AI will respond to incoming messages</div></div>
        <div class="form-group">
          <label class="form-label">Incoming Message</label>
          <textarea class="form-textarea" id="test-message" placeholder="Type a customer message to see how the AI would respond... e.g. 'What is your price?'" rows="3"></textarea>
        </div>
        <button class="btn btn-primary" onclick="AutoReplyPage.testReply()">🧪 Test Reply</button>
        <div id="test-result" class="mt-16"></div>
      </div>
    </div>

    <div class="modal-overlay" id="rule-modal"><div class="modal" id="rule-modal-body"></div></div>
    <div class="modal-overlay" id="faq-modal"><div class="modal" id="faq-modal-body"></div></div>`;
  }
};
