/**
 * App Router — Navigation, Sidebar, Layout
 * AI Marketing Command Center
 */
window.AppRouter = {
  currentPage: "dashboard",
  sidebarCollapsed: false,

  pages: {
    dashboard:    { label: "Dashboard",       icon: "🏠", section: "main" },
    campaigns:    { label: "Campaigns",        icon: "🎯", section: "main" },
    content:      { label: "Content Studio",   icon: "✍️", section: "main" },
    calendar:     { label: "Marketing Calendar", icon: "📅", section: "main" },
    publishing:   { label: "Publishing Queue", icon: "📤", section: "main" },
    analytics:    { label: "Analytics",        icon: "📊", section: "insights" },
    chat:         { label: "AI Strategist",    icon: "🤖", section: "ai" },
    "auto-reply": { label: "Auto-Reply",       icon: "💬", section: "ai" },
  },

  init() {
    this._updateSidebarUser();
    this._buildNavItems();
    this._bindSidebarToggle();
    this._bindMobileOverlay();

    const saved = Store.get("current_page") || "dashboard";
    this.navigate(saved);
  },

  resetState() {
    this.currentPage = "dashboard";
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  },

  navigate(page) {
    if (!this.pages[page]) page = "dashboard";
    this.currentPage = page;
    Store.set("current_page", page);

    // Update nav items
    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.page === page);
    });

    // Show/hide pages
    document.querySelectorAll(".page").forEach(p => {
      const isActive = p.id === `page-${page}`;
      p.classList.toggle("active", isActive);
    });

    // Update topbar title
    const info = this.pages[page];
    document.getElementById("topbar-title").textContent = info.label;

    // Load page data
    this._loadPage(page);

    // Close mobile sidebar
    document.querySelector(".sidebar")?.classList.remove("mobile-open");
    document.querySelector(".sidebar-overlay")?.classList.remove("visible");

    // Update URL hash
    history.replaceState(null, "", `#${page}`);
  },

  _loadPage(page) {
    switch (page) {
      case "dashboard":    window.DashboardPage?.load();    break;
      case "campaigns":    window.CampaignsPage?.load();    break;
      case "content":      window.ContentPage?.load();      break;
      case "calendar":     window.CalendarPage?.load();     break;
      case "publishing":   window.PublishingPage?.load();   break;
      case "analytics":    window.AnalyticsPage?.load();    break;
      case "chat":         window.ChatPage?.load();         break;
      case "auto-reply":   window.AutoReplyPage?.load();    break;
    }
  },

  _buildNavItems() {
    const sections = { main: "CORE", insights: "INSIGHTS", ai: "AI TOOLS" };
    const nav = document.getElementById("sidebar-nav");
    if (!nav) return;

    let currentSection = null;
    let html = "";
    Object.entries(this.pages).forEach(([key, info]) => {
      if (info.section !== currentSection) {
        if (currentSection) html += "";
        html += `<div class="sidebar-section-title">${sections[info.section]}</div>`;
        currentSection = info.section;
      }
      const badge = key === "chat" ? `<span class="nav-badge">AI</span>` : "";
      html += `<div class="nav-item" data-page="${key}" onclick="AppRouter.navigate('${key}')">
        <span class="nav-icon">${info.icon}</span>
        <span class="nav-label">${info.label}</span>
        ${badge}
      </div>`;
    });

    // Logout at bottom of nav
    html += `<div class="divider mt-16 mb-8"></div>
    <div class="nav-item" onclick="Auth.logout()">
      <span class="nav-icon">🚪</span>
      <span class="nav-label">Logout</span>
    </div>`;

    nav.innerHTML = html;
  },

  _updateSidebarUser() {
    const user = Auth.user;
    if (!user) return;
    const nameEl = document.getElementById("sidebar-user-name");
    const emailEl = document.getElementById("sidebar-user-email");
    const avatarEl = document.getElementById("sidebar-user-avatar");
    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) {
      if (user.avatar) {
        avatarEl.innerHTML = `<img src="${user.avatar}" alt="${user.name}" onerror="this.parentElement.textContent='${user.name[0]}'">`;
      } else {
        avatarEl.textContent = user.name[0].toUpperCase();
      }
    }
  },

  _bindSidebarToggle() {
    const toggleBtn = document.getElementById("sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");
    const mainContent = document.querySelector(".main-content");
    if (!toggleBtn) return;

    toggleBtn.addEventListener("click", () => {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      sidebar?.classList.toggle("collapsed", this.sidebarCollapsed);
      mainContent?.classList.toggle("sidebar-collapsed", this.sidebarCollapsed);
      toggleBtn.textContent = this.sidebarCollapsed ? "☰" : "✕";
    });
  },

  _bindMobileOverlay() {
    const overlay = document.querySelector(".sidebar-overlay");
    const mobileBtn = document.getElementById("mobile-sidebar-btn");
    const sidebar = document.querySelector(".sidebar");

    mobileBtn?.addEventListener("click", () => {
      sidebar?.classList.toggle("mobile-open");
      overlay?.classList.toggle("visible");
    });

    overlay?.addEventListener("click", () => {
      sidebar?.classList.remove("mobile-open");
      overlay?.classList.remove("visible");
    });
  }
};

// Handle hash navigation
window.addEventListener("hashchange", () => {
  const page = location.hash.slice(1);
  if (page && window.AppRouter?.pages[page]) AppRouter.navigate(page);
});
