/**
 * Utility functions — AI Marketing Command Center
 */

// ── Toast Notifications ──
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById("toast-container");
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "toast-container";
      this.container.id = "toast-container";
      document.body.appendChild(this.container);
    }
  },

  show(title, message = "", type = "info", duration = 4000) {
    if (!this.container) this.init();
    const icons = { success: "✅", error: "❌", warning: "⚠️", info: "💡" };
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ""}
      </div>
      <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
    `;
    this.container.appendChild(el);
    if (duration > 0) {
      setTimeout(() => {
        el.classList.add("toast-exit");
        setTimeout(() => el.remove(), 350);
      }, duration);
    }
    return el;
  },

  success(title, msg = "") { return this.show(title, msg, "success"); },
  error(title, msg = "")   { return this.show(title, msg, "error"); },
  warning(title, msg = "") { return this.show(title, msg, "warning"); },
  info(title, msg = "")    { return this.show(title, msg, "info"); }
};

// ── Loading overlay ──
const Loader = {
  el: null,
  count: 0,
  init() {
    this.el = document.getElementById("loading-overlay");
    if (!this.el) {
      this.el = document.createElement("div");
      this.el.className = "loading-overlay";
      this.el.id = "loading-overlay";
      this.el.innerHTML = `<div class="loading-spinner"></div>`;
      document.body.appendChild(this.el);
    }
  },
  show() { this.count++; if (!this.el) this.init(); this.el.classList.add("visible"); },
  hide() { this.count = Math.max(0, this.count - 1); if (this.count === 0 && this.el) this.el.classList.remove("visible"); },
  force() { this.count = 0; if (this.el) this.el.classList.remove("visible"); }
};

// ── Modal manager ──
const Modal = {
  stack: [],

  open(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add("visible");
    this.stack.push(id);
    document.body.style.overflow = "hidden";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.close(id);
    }, { once: true });
  },

  close(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove("visible");
    this.stack = this.stack.filter(s => s !== id);
    if (this.stack.length === 0) document.body.style.overflow = "";
  },

  closeAll() {
    this.stack.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove("visible");
    });
    this.stack = [];
    document.body.style.overflow = "";
  }
};

// ── Animated number counter ──
function animateCounter(el, target, duration = 900, prefix = "", suffix = "") {
  const start = parseFloat(el.textContent.replace(/[^0-9.]/g, "")) || 0;
  const startTime = performance.now();
  const isFloat = !Number.isInteger(target);

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * eased;
    el.textContent = prefix + (isFloat ? current.toFixed(1) : Math.round(current).toLocaleString()) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ── Format numbers ──
function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n?.toLocaleString() ?? "0";
}

function formatCurrency(n) {
  return "$" + (n >= 1_000 ? (n / 1_000).toFixed(1) + "K" : n?.toFixed(2) ?? "0.00");
}

function formatPercent(n) {
  return (n >= 0 ? "+" : "") + n?.toFixed(1) + "%";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function relativeTime(dateStr) {
  if (!dateStr) return "—";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  if (diff < 60_000)   return "just now";
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + "m ago";
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + "h ago";
  return Math.floor(diff / 86_400_000) + "d ago";
}

// ── Status helpers ──
function statusBadge(status) {
  const map = {
    active: "badge-active", draft: "badge-draft", scheduled: "badge-scheduled",
    published: "badge-published", failed: "badge-failed", planned: "badge-planned",
    live: "badge-live", completed: "badge-active"
  };
  const cls = map[status] || "badge-draft";
  return `<span class="badge-pill ${cls}"><span class="badge-dot"></span>${status}</span>`;
}

function channelIcon(channel) {
  const icons = {
    instagram: "📷", facebook: "📘", twitter: "🐦", linkedin: "💼",
    email: "📧", sms: "💬", all: "🌐"
  };
  return icons[channel] || "📣";
}

function channelColor(channel) {
  const colors = {
    instagram: "#E1306C", facebook: "#1877F2", twitter: "#1DA1F2",
    linkedin: "#0A66C2", email: "#EA4335", sms: "#25D366"
  };
  return colors[channel] || "#667eea";
}

// ── Skeleton loaders ──
function skeletonCard(lines = 3) {
  const lineHtml = Array.from({ length: lines }, (_, i) =>
    `<div class="skeleton skeleton-text" style="width:${60 + Math.random() * 35}%"></div>`
  ).join("");
  return `<div class="card"><div class="skeleton skeleton-title mb-12"></div>${lineHtml}</div>`;
}

function showSkeletons(container, count = 3) {
  container.innerHTML = Array.from({ length: count }, () => skeletonCard()).join("");
}

// ── Ripple effect ──
function addRipple(btn) {
  btn.addEventListener("click", function(e) {
    const circle = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    circle.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`;
    circle.className = "ripple-effect";
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 700);
  });
}

// ── Init ripples on all .btn elements ──
function initRipples() {
  document.querySelectorAll(".btn").forEach(addRipple);
}

// ── Escape HTML ──
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Parse markdown-ish text to HTML ──
function parseMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^#{3} (.+)$/gm, "<h4>$1</h4>")
    .replace(/^#{2} (.+)$/gm, "<h3>$1</h3>")
    .replace(/^#{1} (.+)$/gm, "<h2>$1</h2>")
    .replace(/^\| (.+) \|$/gm, (m, row) => {
      const cells = row.split(" | ").map(c => `<td style="padding:6px 12px;border:1px solid rgba(255,255,255,0.08)">${c.trim()}</td>`);
      return `<tr>${cells.join("")}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, m => `<table style="border-collapse:collapse;width:100%;margin:10px 0">${m}</table>`)
    .replace(/\n/g, "<br>");
}

// ── Debounce ──
function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ── Deep copy ──
function deepCopy(obj) { return JSON.parse(JSON.stringify(obj)); }

// ── Local storage helpers ──
const Store = {
  set(key, val) { try { localStorage.setItem("mcc_" + key, JSON.stringify(val)); } catch(e) {} },
  get(key, def = null) { try { const v = localStorage.getItem("mcc_" + key); return v ? JSON.parse(v) : def; } catch(e) { return def; } },
  remove(key) { localStorage.removeItem("mcc_" + key); }
};

// ── Channel multiselect helper ──
function initChannelChips(container, onChange) {
  container.querySelectorAll(".channel-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
      if (onChange) {
        const selected = [...container.querySelectorAll(".channel-chip.selected")]
          .map(c => c.dataset.channel);
        onChange(selected);
      }
    });
  });
}

// ── Tone selector helper ──
function initToneSelector(container, onChange) {
  container.querySelectorAll(".tone-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".tone-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (onChange) onChange(btn.dataset.tone);
    });
  });
}

// ── Copy to clipboard ──
async function copyToClipboard(text, label = "Text") {
  try {
    await navigator.clipboard.writeText(text);
    Toast.success("Copied!", `${label} copied to clipboard`);
  } catch {
    Toast.error("Copy failed", "Please copy manually");
  }
}

// Export all utilities globally
window.Toast = Toast;
window.Loader = Loader;
window.Modal = Modal;
window.animateCounter = animateCounter;
window.formatNumber = formatNumber;
window.formatCurrency = formatCurrency;
window.formatPercent = formatPercent;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.relativeTime = relativeTime;
window.statusBadge = statusBadge;
window.channelIcon = channelIcon;
window.channelColor = channelColor;
window.skeletonCard = skeletonCard;
window.showSkeletons = showSkeletons;
window.initRipples = initRipples;
window.escHtml = escHtml;
window.parseMarkdown = parseMarkdown;
window.debounce = debounce;
window.deepCopy = deepCopy;
window.Store = Store;
window.initChannelChips = initChannelChips;
window.initToneSelector = initToneSelector;
window.copyToClipboard = copyToClipboard;
