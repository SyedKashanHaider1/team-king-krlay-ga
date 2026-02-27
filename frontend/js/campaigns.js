/**
 * Campaigns Page
 */
window.CampaignsPage = {
  campaigns: [],
  editingId: null,

  async load() {
    const page = document.getElementById("page-campaigns");
    if (!page) return;
    page.innerHTML = this._headerHtml() + `<div id="campaigns-list" class="stagger"></div>` + this._modalHtml();
    initRipples();
    await this._fetchAndRender();
  },

  async _fetchAndRender() {
    const list = document.getElementById("campaigns-list");
    showSkeletons(list, 3);
    try {
      this.campaigns = await API.getCampaigns();
      this._renderList();
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error loading campaigns</div><div class="empty-state-desc">${err.message}</div></div>`;
    }
  },

  _renderList() {
    const list = document.getElementById("campaigns-list");
    const filter = document.getElementById("campaign-filter")?.value || "all";
    let data = this.campaigns;
    if (filter !== "all") data = data.filter(c => c.status === filter);

    if (!data.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🎯</div>
        <div class="empty-state-title">No campaigns found</div>
        <div class="empty-state-desc">Create your first AI-powered campaign and watch it come to life.</div>
        <button class="btn btn-primary mt-16" onclick="CampaignsPage.openModal()">✨ Create Campaign</button></div>`;
      return;
    }

    list.className = "grid-auto stagger list-animate";
    list.innerHTML = data.map(c => this._campaignCard(c)).join("");
    initRipples();
  },

  _campaignCard(c) {
    const channels = (c.channels || []);
    const hasStrategy = !!c.strategy;
    return `<div class="campaign-card" onclick="CampaignsPage.openDetail(${c.id})">
      <div class="campaign-card-gradient"></div>
      <div class="campaign-card-header">
        <div style="flex:1;min-width:0">
          <div class="campaign-card-title truncate">${escHtml(c.name)}</div>
          <div class="campaign-card-desc truncate">${escHtml(c.description || c.goal || "No description")}</div>
        </div>
        ${statusBadge(c.status)}
      </div>
      ${c.goal ? `<div class="text-xs text-secondary mt-8">🎯 ${escHtml(c.goal).slice(0,70)}</div>` : ""}
      <div class="campaign-channels mt-12">
        ${channels.map(ch => `<span class="channel-tag ${ch}">${channelIcon(ch)} ${ch}</span>`).join("")}
        ${!channels.length ? '<span class="text-xs text-muted">No channels selected</span>' : ""}
      </div>
      <div class="campaign-meta">
        ${c.budget ? `<span class="campaign-meta-item">💰 ${formatCurrency(c.budget)}</span>` : ""}
        ${c.start_date ? `<span class="campaign-meta-item">📅 ${formatDate(c.start_date)}</span>` : ""}
        ${c.target_audience ? `<span class="campaign-meta-item">👥 ${escHtml(c.target_audience).slice(0,30)}</span>` : ""}
      </div>
      <div class="flex gap-8 mt-14" onclick="event.stopPropagation()">
        <button class="btn btn-primary btn-sm flex-1" onclick="CampaignsPage.generateStrategy(${c.id})">
          ${hasStrategy ? "🔄 Refresh Strategy" : "🤖 Generate Strategy"}
        </button>
        <button class="btn btn-outline btn-sm" onclick="CampaignsPage.openModal(${c.id})">✏️ Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="CampaignsPage.confirmDelete(${c.id})">🗑️</button>
      </div>
    </div>`;
  },

  openDetail(id) {
    const c = this.campaigns.find(x => x.id === id);
    if (!c) return;
    const strat = typeof c.strategy === "string" ? JSON.parse(c.strategy || "{}") : (c.strategy || {});
    let stratHtml = "";
    if (strat.phases) {
      stratHtml = `
        <div class="divider"></div>
        <h3 class="mt-8 mb-16">🤖 AI Campaign Strategy <span style="font-size:0.75rem;color:var(--success);margin-left:8px">AI Confidence: ${strat.ai_confidence_score || "—"}%</span></h3>
        <p class="text-secondary mb-16">${strat.overview || ""}</p>
        ${(strat.phases || []).map(ph => `
          <div class="strategy-phase">
            <div class="strategy-phase-header">
              <span class="strategy-phase-badge">${ph.phase}</span>
              <span class="text-xs text-muted">${ph.week}</span>
            </div>
            <p class="text-secondary text-sm mb-12">${ph.objective}</p>
            ${(ph.tactics || []).map(t => `<div class="strategy-tactic">${t}</div>`).join("")}
            <div class="mt-12">${(ph.kpis || []).map(k => `<span class="strategy-kpi">✓ ${k}</span>`).join("")}</div>
          </div>`).join("")}
        ${strat.audience_segments ? `
          <h4 class="mt-16 mb-12">👥 Audience Segments</h4>
          ${strat.audience_segments.map(seg => `
            <div class="flex items-center justify-between mb-8 p-12" style="background:rgba(255,255,255,0.03);border-radius:10px">
              <div><div class="font-semi text-sm">${seg.segment}</div><div class="text-xs text-muted">${seg.approach}</div></div>
              <span class="badge-pill badge-scheduled">${seg.size}</span>
            </div>`).join("")}` : ""}`;
    }

    document.getElementById("detail-modal-body").innerHTML = `
      <div class="modal-header">
        <div><div class="modal-title">${escHtml(c.name)}</div><div class="text-xs text-muted mt-4">${statusBadge(c.status)}</div></div>
        <button class="modal-close" onclick="Modal.close('detail-modal')">✕</button>
      </div>
      <div class="form-row mb-16">
        <div><span class="form-label">Goal</span><p>${escHtml(c.goal || "—")}</p></div>
        <div><span class="form-label">Budget</span><p>${c.budget ? formatCurrency(c.budget) : "—"}</p></div>
      </div>
      <div class="form-row mb-16">
        <div><span class="form-label">Start Date</span><p>${formatDate(c.start_date)}</p></div>
        <div><span class="form-label">End Date</span><p>${formatDate(c.end_date)}</p></div>
      </div>
      ${c.target_audience ? `<div class="mb-16"><span class="form-label">Target Audience</span><p>${escHtml(c.target_audience)}</p></div>` : ""}
      <div class="mb-16"><span class="form-label">Channels</span><div class="campaign-channels mt-8">${(c.channels||[]).map(ch=>`<span class="channel-tag ${ch}">${channelIcon(ch)} ${ch}</span>`).join("") || "None"}</div></div>
      ${strat.phases ? stratHtml : `<div class="empty-state" style="padding:30px"><div class="empty-state-icon">🤖</div><div class="empty-state-title">No strategy generated yet</div><button class="btn btn-primary mt-12" onclick="Modal.close('detail-modal');CampaignsPage.generateStrategy(${c.id})">Generate AI Strategy</button></div>`}
    `;
    Modal.open("detail-modal");
  },

  openModal(id = null) {
    this.editingId = id;
    const c = id ? this.campaigns.find(x => x.id === id) : null;
    const channels = c?.channels || [];
    document.getElementById("campaign-modal-body").innerHTML = `
      <div class="modal-header">
        <div class="modal-title">${id ? "✏️ Edit Campaign" : "✨ Create Campaign"}</div>
        <button class="modal-close" onclick="Modal.close('campaign-modal')">✕</button>
      </div>
      <div class="form-group"><label class="form-label">Campaign Name *</label>
        <input class="form-input" id="cm-name" placeholder="e.g. Summer Product Launch 2025" value="${escHtml(c?.name||"")}"></div>
      <div class="form-group"><label class="form-label">Goal</label>
        <input class="form-input" id="cm-goal" placeholder="e.g. Increase Q3 revenue by 30%" value="${escHtml(c?.goal||"")}"></div>
      <div class="form-group"><label class="form-label">Description</label>
        <textarea class="form-textarea" id="cm-desc" placeholder="Brief campaign description..." rows="3">${escHtml(c?.description||"")}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Budget ($)</label>
          <input class="form-input" id="cm-budget" type="number" placeholder="5000" value="${c?.budget||""}"></div>
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-select" id="cm-status">
            ${["draft","active","scheduled","completed"].map(s => `<option value="${s}" ${(c?.status||"draft")===s?"selected":""}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join("")}
          </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Start Date</label>
          <input class="form-input" id="cm-start" type="date" value="${c?.start_date||""}"></div>
        <div class="form-group"><label class="form-label">End Date</label>
          <input class="form-input" id="cm-end" type="date" value="${c?.end_date||""}"></div>
      </div>
      <div class="form-group"><label class="form-label">Target Audience</label>
        <input class="form-input" id="cm-audience" placeholder="e.g. Millennial professionals aged 25–34" value="${escHtml(c?.target_audience||"")}"></div>
      <div class="form-group"><label class="form-label">Channels</label>
        <div class="channel-grid" id="cm-channels">
          ${["instagram","facebook","twitter","linkedin","email","sms"].map(ch =>
            `<label class="channel-chip ${channels.includes(ch)?"selected":""}" data-channel="${ch}">
              ${channelIcon(ch)} ${ch.charAt(0).toUpperCase()+ch.slice(1)}
            </label>`).join("")}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="Modal.close('campaign-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="CampaignsPage.saveCampaign()">💾 Save Campaign</button>
      </div>`;
    initChannelChips(document.getElementById("cm-channels"));
    initRipples();
    Modal.open("campaign-modal");
  },

  async saveCampaign() {
    const name = document.getElementById("cm-name")?.value?.trim();
    if (!name) { Toast.error("Name required", "Please enter a campaign name"); document.getElementById("cm-name")?.classList.add("animate-shake"); return; }
    const channels = [...document.querySelectorAll("#cm-channels .channel-chip.selected")].map(c => c.dataset.channel);
    const data = {
      name,
      goal: document.getElementById("cm-goal")?.value,
      description: document.getElementById("cm-desc")?.value,
      budget: parseFloat(document.getElementById("cm-budget")?.value) || 0,
      status: document.getElementById("cm-status")?.value,
      start_date: document.getElementById("cm-start")?.value,
      end_date: document.getElementById("cm-end")?.value,
      target_audience: document.getElementById("cm-audience")?.value,
      channels
    };
    Loader.show();
    try {
      if (this.editingId) {
        await API.updateCampaign(this.editingId, data);
        Toast.success("Campaign Updated! ✅");
      } else {
        await API.createCampaign(data);
        Toast.success("Campaign Created! 🎯", "Your campaign is ready to go");
      }
      Modal.close("campaign-modal");
      await this._fetchAndRender();
    } catch (err) {
      Toast.error("Save Failed", err.message);
    } finally {
      Loader.hide();
    }
  },

  async generateStrategy(id) {
    Toast.info("Generating Strategy", "AI is building your campaign plan... 🤖");
    Loader.show();
    try {
      const result = await API.generateStrategy(id);
      const idx = this.campaigns.findIndex(c => c.id === id);
      if (idx >= 0) this.campaigns[idx].strategy = result.strategy;
      Toast.success("Strategy Ready! 🎉", "AI has built your full campaign plan");
      this.openDetail(id);
      this._renderList();
    } catch (err) {
      Toast.error("Strategy Failed", err.message);
    } finally {
      Loader.hide();
    }
  },

  async confirmDelete(id) {
    const c = this.campaigns.find(x => x.id === id);
    if (!c) return;
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    Loader.show();
    try {
      await API.deleteCampaign(id);
      this.campaigns = this.campaigns.filter(x => x.id !== id);
      this._renderList();
      Toast.success("Campaign Deleted");
    } catch (err) {
      Toast.error("Delete Failed", err.message);
    } finally {
      Loader.hide();
    }
  },

  _headerHtml() {
    return `<div class="page-header header-reveal">
      <div class="page-header-left">
        <h1>🎯 Campaigns</h1>
        <p class="page-desc">Build, track, and optimise your marketing campaigns with AI strategy</p>
      </div>
      <div class="page-header-actions">
        <select class="form-select" id="campaign-filter" onchange="CampaignsPage._renderList()" style="width:140px">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
        </select>
        <button class="btn btn-primary" onclick="CampaignsPage.openModal()">✨ New Campaign</button>
      </div>
    </div>`;
  },

  _modalHtml() {
    return `
    <div class="modal-overlay" id="campaign-modal"><div class="modal" id="campaign-modal-body"></div></div>
    <div class="modal-overlay" id="detail-modal"><div class="modal" style="max-width:700px" id="detail-modal-body"></div></div>`;
  }
};
