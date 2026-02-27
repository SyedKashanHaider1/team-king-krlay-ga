/**
 * Dashboard Page
 */
window.DashboardPage = {
  loaded: false,

  async load() {
    if (this.loaded) return; // Skip reload if already loaded
    this.loaded = false; // Allow reload to show fresh data
    const page = document.getElementById("page-dashboard");
    if (!page) return;
    page.innerHTML = this._skeleton();

    try {
      const [overview, campaigns, channels] = await Promise.all([
        API.getAnalyticsOverview(),
        API.getCampaigns(),
        API.getChannelBreakdown()
      ]);
      page.innerHTML = this._render(overview, campaigns, channels);
      this._initCharts(channels);
      this._animateStats(overview);
      initRipples();
    } catch (err) {
      page.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Couldn't load dashboard</div><div class="empty-state-desc">${err.message}</div><button class="btn btn-primary mt-16" onclick="DashboardPage.loaded=false;DashboardPage.load()">Retry</button></div>`;
    }
  },

  _skeleton() {
    return `<div class="page-header header-reveal">
      <div class="page-header-left"><div class="skeleton skeleton-title" style="width:300px"></div><div class="skeleton skeleton-text" style="width:200px;margin-top:8px"></div></div>
    </div>
    <div class="stats-grid stagger">${Array(4).fill('<div class="stat-card"><div class="skeleton skeleton-card"></div></div>').join("")}</div>
    <div class="grid-2"><div class="card"><div class="skeleton" style="height:280px"></div></div><div class="card"><div class="skeleton" style="height:280px"></div></div></div>`;
  },

  _render(ov, campaigns, channels) {
    const g = ov.growth_vs_last_month || {};
    const recentCampaigns = (campaigns || []).slice(0, 4);

    return `
    <div class="page-header header-reveal">
      <div class="page-header-left">
        <h1>Welcome back, ${Auth.user?.name?.split(" ")[0] || "Marketer"} 👋</h1>
        <p class="page-desc">Here's what's happening with your marketing today · ${new Date().toLocaleDateString("en-US", {weekday:"long", month:"long", day:"numeric"})}</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" onclick="AppRouter.navigate('content')">✍️ Create Content</button>
        <button class="btn btn-outline" onclick="AppRouter.navigate('campaigns')">🎯 New Campaign</button>
      </div>
    </div>

    <div class="stats-grid stagger">
      ${this._statCard("Total Reach", ov.total_reach, "👥", "grad-primary", g.reach, "K", 1000)}
      ${this._statCard("Impressions", ov.total_impressions, "👁️", "grad-insta", g.reach, "K", 1000)}
      ${this._statCard("Conversions", ov.total_conversions, "⚡", "grad-green", g.conversions, "", 1)}
      ${this._statCard("Revenue", ov.total_revenue_attributed, "💰", "grad-warm", g.revenue, "", 1, true)}
    </div>

    <div class="grid-2 mt-20">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">📊 Channel Performance</div>
            <div class="card-subtitle">Engagement rate by channel</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="AppRouter.navigate('analytics')">View All →</button>
        </div>
        <div style="height:240px"><canvas id="channel-chart"></canvas></div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">🎯 Active Campaigns</div>
            <div class="card-subtitle">${recentCampaigns.length} recent campaigns</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="AppRouter.navigate('campaigns')">Manage →</button>
        </div>
        <div class="flex flex-col gap-8 list-animate">
          ${recentCampaigns.length ? recentCampaigns.map(c => this._miniCampaignCard(c)).join("") : '<div class="empty-state" style="padding:30px"><div class="empty-state-icon">🎯</div><div class="empty-state-title">No campaigns yet</div><button class="btn btn-primary btn-sm mt-12" onclick="AppRouter.navigate(\'campaigns\')">Create First Campaign</button></div>'}
        </div>
      </div>
    </div>

    <div class="grid-2 mt-20">
      <div class="card">
        <div class="card-header">
          <div class="card-title">🤖 Quick AI Actions</div>
        </div>
        <div class="flex flex-col gap-8">
          ${[
            ["✍️ Generate social post", "content"],
            ["🎯 Build campaign strategy", "campaigns"],
            ["📅 Plan monthly calendar", "calendar"],
            ["📊 View analytics insights", "analytics"],
            ["💬 Chat with AI Strategist", "chat"]
          ].map(([label, page]) => `
            <button class="btn btn-ghost w-full" style="justify-content:flex-start" onclick="AppRouter.navigate('${page}')">
              ${label}
            </button>`).join("")}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">📈 Key Metrics</div>
        </div>
        <div>
          ${[
            ["Avg Engagement Rate", ov.avg_engagement_rate + "%", ov.avg_engagement_rate > 5 ? "up" : "down"],
            ["Content Pieces Published", formatNumber(ov.content_pieces_published), "up"],
            ["Auto-Replies Sent", formatNumber(ov.auto_replies_sent), "up"],
            ["Campaign ROI", ov.roi + "%", "up"],
            ["Active Campaigns", ov.active_campaigns, "up"]
          ].map(([label, val, dir]) => `
            <div class="metric-row">
              <span class="metric-label">${label}</span>
              <div class="flex items-center gap-8">
                <span class="metric-value">${val}</span>
                <span class="stat-change ${dir}">${dir === "up" ? "↑" : "↓"}</span>
              </div>
            </div>`).join("")}
        </div>
      </div>
    </div>`;
  },

  _statCard(label, value, icon, grad, growth, suffix, divisor, isCurrency) {
    const formatted = isCurrency ? formatCurrency(value) : (value >= 1000 ? formatNumber(value) : value);
    const growthHtml = growth !== undefined
      ? `<div class="stat-change ${growth >= 0 ? 'up' : 'down'}">${growth >= 0 ? "↑" : "↓"} ${Math.abs(growth)}% vs last month</div>`
      : "";
    return `<div class="stat-card" style="--gradient:var(--${grad});--icon-bg:rgba(102,126,234,0.1)">
      <div class="stat-card-header">
        <span class="stat-icon">${icon}</span>
      </div>
      <div>
        <div class="stat-value" data-target="${value}" data-divisor="${divisor}" data-currency="${isCurrency ? 1 : 0}">${formatted}</div>
        <div class="stat-label">${label}</div>
      </div>
      ${growthHtml}
    </div>`;
  },

  _miniCampaignCard(c) {
    const channels = (c.channels || []).slice(0, 3);
    return `<div class="flex items-center gap-12 p-10" style="border-radius:10px;background:rgba(255,255,255,0.03);cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'" onclick="AppRouter.navigate('campaigns')">
      <div style="flex:1;min-width:0">
        <div class="font-semi text-sm truncate">${escHtml(c.name)}</div>
        <div class="text-xs text-muted mt-4">${c.goal ? escHtml(c.goal).slice(0,40)+"..." : "No goal set"}</div>
      </div>
      <div class="flex gap-4 items-center">
        ${channels.map(ch => `<span title="${ch}" style="font-size:14px">${channelIcon(ch)}</span>`).join("")}
        ${statusBadge(c.status)}
      </div>
    </div>`;
  },

  _initCharts(channels) {
    const ctx = document.getElementById("channel-chart");
    if (!ctx || !window.Chart) return;
    if (window._channelChart) { window._channelChart.destroy(); }
    const top = channels.slice(0, 6);
    window._channelChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: top.map(c => c.channel.charAt(0).toUpperCase() + c.channel.slice(1)),
        datasets: [{
          label: "Engagement Rate %",
          data: top.map(c => c.engagement_rate),
          backgroundColor: top.map(c => c.color + "88"),
          borderColor: top.map(c => c.color),
          borderWidth: 2,
          borderRadius: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: "#161628", titleColor: "#fff", bodyColor: "#a0a0c0" } },
        scales: {
          x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#a0a0c0" } },
          y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#a0a0c0", callback: v => v + "%" } }
        }
      }
    });
  },

  _animateStats(ov) {
    setTimeout(() => {
      document.querySelectorAll(".stat-value[data-target]").forEach(el => {
        const raw = parseFloat(el.dataset.target) || 0;
        if (raw > 0) {
          el.classList.add("value-updated");
        }
      });
    }, 100);
  }
};
