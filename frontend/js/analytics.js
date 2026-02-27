/**
 * Analytics Page
 */
window.AnalyticsPage = {
  charts: {},

  async load() {
    const page = document.getElementById("page-analytics");
    if (!page) return;
    page.innerHTML = this._skeleton();
    try {
      const [overview, engagement, channels, topContent, funnel, demo] = await Promise.all([
        API.getAnalyticsOverview(),
        API.getEngagement(30),
        API.getChannelBreakdown(),
        API.getTopContent(5),
        API.getFunnel(),
        API.getDemographics()
      ]);
      page.innerHTML = this._render(overview, channels, topContent, funnel, demo);
      this._initCharts(engagement, channels, demo);
      this._animateCounters(overview);
      initRipples();
    } catch (err) {
      page.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Failed to load analytics</div><div class="empty-state-desc">${err.message}</div><button class="btn btn-primary mt-16" onclick="AnalyticsPage.load()">Retry</button></div>`;
    }
  },

  _skeleton() {
    return `<div class="page-header header-reveal"><div class="skeleton skeleton-title" style="width:250px"></div></div>
    <div class="stats-grid stagger">${Array(4).fill('<div class="stat-card"><div class="skeleton skeleton-card"></div></div>').join("")}</div>
    <div class="grid-2"><div class="card"><div class="skeleton" style="height:280px"></div></div><div class="card"><div class="skeleton" style="height:280px"></div></div></div>`;
  },

  _render(ov, channels, topContent, funnel, demo) {
    const g = ov.growth_vs_last_month || {};
    return `<div class="page-header header-reveal">
      <div class="page-header-left"><h1>📊 Analytics</h1><p class="page-desc">Real-time insights across all your marketing channels</p></div>
      <div class="page-header-actions">
        <select class="form-select" style="width:130px" onchange="AnalyticsPage.changeRange(this.value)">
          <option value="7">Last 7 days</option>
          <option value="30" selected>Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <button class="btn btn-primary btn-sm" onclick="AnalyticsPage.getOptTips()">🤖 AI Tips</button>
      </div>
    </div>

    <div class="stats-grid stagger">
      ${this._stat("Total Reach", ov.total_reach, "👥", g.reach, "#667eea")}
      ${this._stat("Avg Engagement", ov.avg_engagement_rate + "%", "💥", g.engagement, "#f5576c", false)}
      ${this._stat("Conversions", ov.total_conversions, "⚡", g.conversions, "#25d366")}
      ${this._stat("Revenue", "$" + formatNumber(ov.total_revenue_attributed), "💰", g.revenue, "#ffd200", false)}
    </div>

    <div class="grid-2 mt-20">
      <div class="card col-span-2">
        <div class="card-header">
          <div class="card-title">📈 Engagement Timeline</div>
          <div class="text-xs text-muted">Last 30 days</div>
        </div>
        <div style="height:260px"><canvas id="engagement-chart"></canvas></div>
      </div>
    </div>

    <div class="grid-2 mt-20">
      <div class="card">
        <div class="card-header"><div class="card-title">📣 Channel Breakdown</div></div>
        <div>
          ${channels.map(ch => `
            <div class="metric-row">
              <span class="metric-label">
                <span class="metric-dot" style="background:${ch.color}"></span>
                ${channelIcon(ch.channel)} ${ch.channel.charAt(0).toUpperCase()+ch.channel.slice(1)}
              </span>
              <div class="flex items-center gap-8">
                <div style="width:80px">
                  <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(ch.engagement_rate*10,100)}%;background:${ch.color}"></div></div>
                </div>
                <span class="metric-value">${ch.engagement_rate}%</span>
                <span class="metric-change ${ch.growth>=0?'text-success':'text-error'}">${ch.growth>=0?"+":""}${ch.growth}%</span>
              </div>
            </div>`).join("")}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">🏆 Top Content</div></div>
        <div class="flex flex-col gap-10 list-animate">
          ${topContent.map((item,i) => `
            <div class="flex items-center gap-12" style="padding:10px;background:rgba(255,255,255,0.02);border-radius:10px">
              <span style="font-size:1.2rem;font-weight:800;color:${i===0?'#ffd200':i===1?'#c0c0c0':i===2?'#cd7f32':'var(--text-muted)'}">
                ${["🥇","🥈","🥉","4","5"][i]}
              </span>
              <div style="flex:1;min-width:0">
                <div class="font-semi text-sm truncate">${escHtml(item.title)}</div>
                <div class="text-xs text-muted">${channelIcon(item.channel)} ${item.channel} · ${formatNumber(item.reach)} reach</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-sm text-success">${item.engagement_rate}%</div>
                <div class="text-xs text-muted">engagement</div>
              </div>
            </div>`).join("")}
        </div>
      </div>
    </div>

    <div class="grid-2 mt-20">
      <div class="card">
        <div class="card-header"><div class="card-title">🔽 Conversion Funnel</div></div>
        <div class="funnel-bar mt-8">
          ${funnel.map(f => `
            <div class="funnel-row">
              <span class="funnel-label">${f.stage}</span>
              <div class="funnel-track">
                <div class="funnel-fill" style="width:${f.percent}%;background:${f.color}">
                  ${f.percent > 15 ? f.percent + "%" : ""}
                </div>
              </div>
              <span class="funnel-count">${formatNumber(f.value)}</span>
            </div>`).join("")}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">👥 Audience Split</div></div>
        <div style="height:200px"><canvas id="demo-chart"></canvas></div>
        <div class="flex flex-col gap-6 mt-12">
          ${(demo.age_groups||[]).map(a => `
            <div class="flex items-center justify-between">
              <span class="text-xs text-secondary">${a.label}</span>
              <div class="flex items-center gap-8">
                <div style="width:60px;height:4px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden">
                  <div style="width:${a.value}%;height:100%;background:var(--grad-primary);border-radius:2px"></div>
                </div>
                <span class="text-xs font-semi">${a.value}%</span>
              </div>
            </div>`).join("")}
        </div>
      </div>
    </div>

    <div id="opt-tips-section"></div>`;
  },

  _stat(label, value, icon, growth, color, isNum = true) {
    const val = isNum ? formatNumber(typeof value === "number" ? value : parseFloat(value)) : value;
    const gHtml = growth !== undefined
      ? `<span class="stat-change ${growth>=0?'up':'down'}">${growth>=0?"↑":"↓"} ${Math.abs(growth)}%</span>`
      : "";
    return `<div class="stat-card" style="--gradient:linear-gradient(135deg,${color},${color}aa);--icon-bg:${color}22">
      <div class="stat-card-header"><span class="stat-icon">${icon}</span>${gHtml}</div>
      <div class="stat-value" data-raw="${value}">${val}</div>
      <div class="stat-label">${label}</div>
    </div>`;
  },

  _initCharts(engagement, channels, demo) {
    // Engagement timeline
    const ctx1 = document.getElementById("engagement-chart");
    if (ctx1) {
      if (window._engChart) window._engChart.destroy();
      const labels = engagement.slice(-30).map(d => new Date(d.date).toLocaleDateString("en-US",{month:"short",day:"numeric"}));
      const data = engagement.slice(-30).map(d => d.engagement);
      window._engChart = new Chart(ctx1, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Engagement",
            data,
            borderColor: "#667eea",
            backgroundColor: "rgba(102,126,234,0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            borderWidth: 2.5
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: "#161628", titleColor: "#fff", bodyColor: "#a0a0c0" } },
          scales: {
            x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#606080", maxTicksLimit: 10 } },
            y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#606080" } }
          }
        }
      });
    }

    // Demographics doughnut
    const ctx2 = document.getElementById("demo-chart");
    if (ctx2 && demo.gender) {
      if (window._demoChart) window._demoChart.destroy();
      const COLORS = ["#667eea", "#f5576c", "#25d366", "#ffd200", "#1877f2"];
      window._demoChart = new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: demo.gender.map(g => g.label),
          datasets: [{ data: demo.gender.map(g => g.value), backgroundColor: COLORS, borderWidth: 0, hoverOffset: 8 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: "70%",
          plugins: { legend: { position: "bottom", labels: { color: "#a0a0c0", padding: 12, usePointStyle: true } }, tooltip: { backgroundColor: "#161628" } }
        }
      });
    }
  },

  _animateCounters(ov) {
    setTimeout(() => {
      document.querySelectorAll(".stat-value[data-raw]").forEach(el => {
        el.classList.add("value-updated");
      });
    }, 200);
  },

  async changeRange(days) {
    try {
      const data = await API.getEngagement(parseInt(days));
      if (window._engChart) {
        window._engChart.data.labels = data.slice(-days).map(d => new Date(d.date).toLocaleDateString("en-US",{month:"short",day:"numeric"}));
        window._engChart.data.datasets[0].data = data.slice(-days).map(d => d.engagement);
        window._engChart.update();
      }
    } catch (err) {
      Toast.error("Failed to update chart");
    }
  },

  async getOptTips() {
    const section = document.getElementById("opt-tips-section");
    if (!section) return;
    section.innerHTML = `<div class="card mt-20"><div class="skeleton" style="height:120px"></div></div>`;
    try {
      const channels = await API.getChannelBreakdown();
      const channelData = {};
      channels.forEach(c => { channelData[c.channel] = { engagement_rate: c.engagement_rate }; });
      const tips = await API.getOptimisationTips(channelData);
      section.innerHTML = `<div class="card mt-20">
        <div class="card-header"><div class="card-title">🤖 AI Optimisation Recommendations</div></div>
        <div class="flex flex-col gap-10 list-animate">
          ${tips.map(tip => `
            <div style="padding:14px;border-radius:10px;background:rgba(${tip.severity==='high'?'245,87,108':tip.severity==='medium'?'253,126,20':'37,211,102'},0.06);border:1px solid rgba(${tip.severity==='high'?'245,87,108':tip.severity==='medium'?'253,126,20':'37,211,102'},0.2)">
              <div class="text-sm mb-4">${tip.tip}</div>
              <div class="text-xs" style="color:var(--success)">Expected: ${tip.expected_lift}</div>
            </div>`).join("")}
        </div>
      </div>`;
    } catch (err) {
      section.innerHTML = `<div class="card mt-20"><div class="empty-state"><div>Failed: ${err.message}</div></div></div>`;
    }
  }
};
