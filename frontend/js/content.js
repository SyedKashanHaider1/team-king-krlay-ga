/**
 * Content Studio Page
 */
window.ContentPage = {
  channel: "instagram",
  tone: "professional",
  generatedContent: null,
  savedContent: [],

  async load() {
    const page = document.getElementById("page-content");
    if (!page) return;
    page.innerHTML = this._render();
    initToneSelector(document.getElementById("tone-selector"), t => { this.tone = t; });
    initChannelChips(document.getElementById("channel-chips"), ch => { this.channel = ch[0] || "instagram"; });
    initRipples();
    await this._loadSaved();
  },

  async _loadSaved() {
    const list = document.getElementById("saved-content-list");
    if (!list) return;
    showSkeletons(list, 3);
    try {
      this.savedContent = await API.getContent();
      this._renderSaved();
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">No saved content yet</div></div>`;
    }
  },

  _renderSaved() {
    const list = document.getElementById("saved-content-list");
    if (!list) return;
    const data = this.savedContent;
    if (!data.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div>
        <div class="empty-state-title">No content yet</div>
        <div class="empty-state-desc">Generate and save your first piece of content above.</div></div>`;
      return;
    }
    list.className = "flex flex-col gap-12 list-animate";
    list.innerHTML = data.map(item => this._contentCard(item)).join("");
    initRipples();
  },

  _contentCard(item) {
    const hashtags = (item.hashtags || []);
    return `<div class="content-card">
      <div class="content-card-header">
        <div class="content-avatar" style="background:${channelColor(item.channel)}">${channelIcon(item.channel)}</div>
        <div style="flex:1;min-width:0">
          <div class="font-semi text-sm truncate">${escHtml(item.title || item.channel + " post")}</div>
          <div class="text-xs text-muted">${item.channel} · ${relativeTime(item.created_at)}</div>
        </div>
        ${statusBadge(item.status)}
      </div>
      <div class="content-card-body" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${escHtml(item.body)}</div>
      ${hashtags.length ? `<div class="content-hashtags">${hashtags.slice(0,5).map(h => `<span class="hashtag">${h}</span>`).join("")}</div>` : ""}
      <div class="content-card-footer">
        <div class="flex items-center gap-8">
          <span class="text-xs text-muted">${item.tone || "professional"} tone</span>
        </div>
        <div class="content-actions">
          <button class="content-action-btn" onclick="copyToClipboard('${escHtml(item.body).replace(/'/g,"\\'")}', 'Content')">📋 Copy</button>
          ${item.status !== "published" ? `<button class="content-action-btn publish" onclick="ContentPage.publishItem(${item.id})">🚀 Publish</button>` : '<span class="badge-pill badge-published">✓ Published</span>'}
          <button class="content-action-btn" style="color:var(--error)" onclick="ContentPage.deleteItem(${item.id})">🗑️</button>
        </div>
      </div>
    </div>`;
  },

  async generate() {
    const topic = document.getElementById("content-topic")?.value?.trim();
    if (!topic) { Toast.error("Topic required", "Enter a topic to generate content"); document.getElementById("content-topic")?.classList.add("animate-shake"); return; }
    const btn = document.getElementById("gen-btn");
    btn.classList.add("btn-loading"); btn.disabled = true;
    document.getElementById("gen-result")?.remove();
    try {
      const result = await API.generateContent({
        channel: this.channel,
        content_type: "social_post",
        topic,
        tone: this.tone,
        brand_name: document.getElementById("brand-name")?.value || "Your Brand",
        keywords: document.getElementById("keywords")?.value?.split(",").map(k => k.trim()).filter(Boolean) || []
      });
      this.generatedContent = result;
      this._showResult(result, topic);
    } catch (err) {
      Toast.error("Generation Failed", err.message);
    } finally {
      btn.classList.remove("btn-loading"); btn.disabled = false;
    }
  },

  _showResult(r, topic) {
    const wrapper = document.getElementById("gen-wrapper");
    const existing = document.getElementById("gen-result");
    if (existing) existing.remove();

    const el = document.createElement("div");
    el.id = "gen-result";
    el.className = "generated-result";
    el.innerHTML = `
      <div class="flex items-center justify-between mb-16">
        <div class="card-title">✨ Generated ${r.channel.charAt(0).toUpperCase()+r.channel.slice(1)} Content</div>
        <div class="flex gap-8">
          <span class="badge-pill badge-scheduled">~${r.estimated_reach} reach</span>
          <span class="badge-pill badge-active">${r.engagement_prediction} engagement</span>
        </div>
      </div>
      <div class="generated-content-body" id="gen-body-text">${escHtml(r.body)}</div>
      ${r.hashtags?.length ? `<div class="content-hashtags mb-12">${r.hashtags.map(h => `<span class="hashtag">${h}</span>`).join("")}</div>` : ""}
      <div class="mb-16">
        <div class="text-xs text-muted mb-8">💡 AI Tips</div>
        ${(r.ai_tips||[]).map(t => `<div class="ai-tip">${t}</div>`).join("")}
      </div>
      <div class="flex gap-10 flex-wrap">
        <button class="btn btn-primary btn-sm" onclick="ContentPage.saveGenerated('${escHtml(topic)}')">💾 Save Content</button>
        <button class="btn btn-outline btn-sm" onclick="copyToClipboard(document.getElementById('gen-body-text').textContent)">📋 Copy</button>
        <button class="btn btn-ghost btn-sm" onclick="ContentPage.generate()">🔄 Regenerate</button>
        <button class="btn btn-success btn-sm" onclick="ContentPage.saveAndPublish('${escHtml(topic)}')">🚀 Save & Publish</button>
      </div>`;
    wrapper.appendChild(el);
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    initRipples();
  },

  async saveGenerated(topic, autoPublish = false) {
    if (!this.generatedContent) return;
    const r = this.generatedContent;
    Loader.show();
    try {
      const data = {
        channel: r.channel,
        content_type: "social_post",
        title: topic,
        body: r.body,
        tone: this.tone,
        hashtags: r.hashtags || [],
        status: autoPublish ? "published" : "draft"
      };
      await API.saveContent(data);
      Toast.success(autoPublish ? "Published! 🚀" : "Saved! ✅", "Content added to your library");
      document.getElementById("gen-result")?.remove();
      this.generatedContent = null;
      await this._loadSaved();
    } catch (err) {
      Toast.error("Save Failed", err.message);
    } finally {
      Loader.hide();
    }
  },

  saveAndPublish(topic) { this.saveGenerated(topic, true); },

  async publishItem(id) {
    Loader.show();
    try {
      await API.publishContent(id);
      const idx = this.savedContent.findIndex(c => c.id === id);
      if (idx >= 0) this.savedContent[idx].status = "published";
      this._renderSaved();
      Toast.success("Published! 🚀", "Content is now live");
    } catch (err) {
      Toast.error("Publish Failed", err.message);
    } finally {
      Loader.hide();
    }
  },

  async deleteItem(id) {
    if (!confirm("Delete this content?")) return;
    Loader.show();
    try {
      await API.deleteContent(id);
      this.savedContent = this.savedContent.filter(c => c.id !== id);
      this._renderSaved();
      Toast.success("Deleted");
    } catch (err) {
      Toast.error("Delete Failed", err.message);
    } finally {
      Loader.hide();
    }
  },

  _render() {
    return `<div class="page-header header-reveal">
      <div class="page-header-left"><h1>✍️ Content Studio</h1><p class="page-desc">AI-powered content generation for every channel and every tone</p></div>
    </div>
    <div class="grid-2">
      <!-- Generator -->
      <div id="gen-wrapper">
        <div class="card mb-20">
          <div class="card-header"><div class="card-title">🤖 AI Content Generator</div></div>

          <div class="form-group">
            <label class="form-label">Channel</label>
            <div class="channel-grid" id="channel-chips">
              ${["instagram","facebook","twitter","linkedin","email","sms"].map((ch,i) =>
                `<label class="channel-chip ${i===0?"selected":""}" data-channel="${ch}">${channelIcon(ch)} ${ch.charAt(0).toUpperCase()+ch.slice(1)}</label>`
              ).join("")}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Topic / Subject *</label>
            <input class="form-input" id="content-topic" placeholder="e.g. Summer sale launch, new product feature, brand story...">
          </div>

          <div class="form-group">
            <label class="form-label">Brand Name</label>
            <input class="form-input" id="brand-name" placeholder="Your Brand Co." value="${Store.get('brand_name')||''}">
          </div>

          <div class="form-group">
            <label class="form-label">Keywords (comma-separated)</label>
            <input class="form-input" id="keywords" placeholder="growth, innovation, sale, launch...">
          </div>

          <div class="form-group">
            <label class="form-label">Tone of Voice</label>
            <div class="tone-grid" id="tone-selector">
              ${["professional","casual","urgent","playful","inspirational"].map((t,i) =>
                `<button class="tone-btn ${i===0?"active":""}" data-tone="${t}">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`
              ).join("")}
            </div>
          </div>

          <button class="btn btn-primary btn-full" id="gen-btn" onclick="ContentPage.generate()">
            ✨ Generate Content
          </button>
        </div>
      </div>

      <!-- Saved Content -->
      <div>
        <div class="flex items-center justify-between mb-16">
          <h3>📚 Content Library</h3>
          <div class="flex gap-8">
            <select class="form-select" style="width:130px" onchange="ContentPage._filterSaved(this.value)">
              <option value="all">All Content</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
        <div id="saved-content-list"></div>
      </div>
    </div>`;
  },

  _filterSaved(status) {
    const list = document.getElementById("saved-content-list");
    if (!list) return;
    const data = status === "all" ? this.savedContent : this.savedContent.filter(c => c.status === status);
    if (!data.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">No ${status} content</div></div>`;
      return;
    }
    list.innerHTML = data.map(item => this._contentCard(item)).join("");
    initRipples();
  }
};
