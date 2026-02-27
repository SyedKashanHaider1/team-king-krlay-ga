/**
 * Marketing Calendar Page
 */
window.CalendarPage = {
  currentMonth: new Date().getMonth() + 1,
  currentYear: new Date().getFullYear(),
  events: [],

  async load() {
    const page = document.getElementById("page-calendar");
    if (!page) return;
    page.innerHTML = this._render();
    initRipples();
    await this._loadEvents();
  },

  async _loadEvents(generate = false) {
    const calEl = document.getElementById("cal-grid");
    if (calEl) calEl.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-muted)">Loading events...</div>`;
    try {
      if (generate) {
        Loader.show();
        const res = await API.generateCalendar(this.currentMonth, this.currentYear);
        this.events = res.events || [];
        Loader.hide();
        Toast.success("Calendar Generated! 📅", `${this.events.length} events created by AI`);
      } else {
        const res = await API.getCalendarEvents(this.currentMonth, this.currentYear);
        this.events = Array.isArray(res) ? res : [];
      }
      this._renderCalendar();
    } catch (err) {
      Loader.hide();
      if (calEl) calEl.innerHTML = `<div style="grid-column:1/-1" class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">${err.message}</div></div>`;
    }
  },

  _renderCalendar() {
    const calEl = document.getElementById("cal-grid");
    if (!calEl) return;
    document.getElementById("cal-month-title").textContent =
      new Date(this.currentYear, this.currentMonth - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    document.getElementById("cal-event-count").textContent = `${this.events.length} events`;

    const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
    const today = new Date();

    let html = "";
    for (let i = 0; i < firstDay; i++) html += `<div class="calendar-day empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const isToday = today.getDate() === d && today.getMonth() + 1 === this.currentMonth && today.getFullYear() === this.currentYear;
      const dayEvents = this.events.filter(e => e.event_date === dateStr);
      const visible = dayEvents.slice(0, 3);
      const more = dayEvents.length - 3;

      html += `<div class="calendar-day ${isToday ? "today" : ""}" onclick="CalendarPage.openDay('${dateStr}', ${d})">
        <div class="calendar-day-num">${d}</div>
        ${visible.map(evt => `
          <div class="calendar-event" style="background:${evt.color || "#667eea"}" title="${escHtml(evt.title)}" onclick="event.stopPropagation();CalendarPage.editEvent(${evt.id})">
            ${escHtml(evt.title).slice(0,22)}
          </div>`).join("")}
        ${more > 0 ? `<div class="calendar-more">+${more} more</div>` : ""}
      </div>`;
    }
    calEl.innerHTML = html;
  },

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 1) { this.currentMonth = 12; this.currentYear--; }
    this._loadEvents();
  },

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 12) { this.currentMonth = 1; this.currentYear++; }
    this._loadEvents();
  },

  openDay(dateStr, day) {
    const dayEvents = this.events.filter(e => e.event_date === dateStr);
    const body = document.getElementById("event-modal-body");
    body.innerHTML = `
      <div class="modal-header">
        <div class="modal-title">📅 ${new Date(dateStr + "T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
        <button class="modal-close" onclick="Modal.close('event-modal')">✕</button>
      </div>
      ${dayEvents.length ? `<div class="flex flex-col gap-10 mb-20 list-animate">
        ${dayEvents.map(evt => `
          <div style="padding:14px;background:rgba(255,255,255,0.04);border-radius:12px;border-left:4px solid ${evt.color || '#667eea'}">
            <div class="flex items-center justify-between mb-6">
              <span class="font-semi text-sm">${escHtml(evt.title)}</span>
              ${statusBadge(evt.status)}
            </div>
            <div class="text-xs text-muted">${channelIcon(evt.channel)} ${evt.channel} · ${evt.event_time || "Anytime"}</div>
            ${evt.description ? `<div class="text-xs text-secondary mt-4">${escHtml(evt.description)}</div>` : ""}
            <div class="flex gap-8 mt-10">
              <button class="btn btn-ghost btn-sm" onclick="CalendarPage.deleteEvent(${evt.id})">🗑️ Remove</button>
            </div>
          </div>`).join("")}
      </div>` : `<div class="empty-state" style="padding:30px"><div class="empty-state-icon">📭</div><div class="empty-state-title">No events this day</div></div>`}
      <div class="divider"></div>
      <div class="card-title mb-16">➕ Add Event</div>
      <div class="form-group"><label class="form-label">Title</label><input class="form-input" id="new-evt-title" placeholder="e.g. Instagram Product Post"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Time</label><input class="form-input" id="new-evt-time" type="time" value="12:00"></div>
        <div class="form-group"><label class="form-label">Channel</label>
          <select class="form-select" id="new-evt-channel">
            ${["instagram","facebook","twitter","linkedin","email","sms"].map(ch=>`<option value="${ch}">${channelIcon(ch)} ${ch}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Description</label><input class="form-input" id="new-evt-desc" placeholder="Brief note..."></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="Modal.close('event-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="CalendarPage.addEvent('${dateStr}')">Add Event</button>
      </div>`;
    Modal.open("event-modal");
    initRipples();
  },

  async addEvent(dateStr) {
    const title = document.getElementById("new-evt-title")?.value?.trim();
    if (!title) { Toast.error("Title required"); return; }
    Loader.show();
    try {
      const evt = await API.createEvent({
        title,
        event_date: dateStr,
        event_time: document.getElementById("new-evt-time")?.value || "12:00",
        channel: document.getElementById("new-evt-channel")?.value || "instagram",
        description: document.getElementById("new-evt-desc")?.value || "",
        color: channelColor(document.getElementById("new-evt-channel")?.value || "instagram")
      });
      this.events.push(evt);
      this._renderCalendar();
      Modal.close("event-modal");
      Toast.success("Event Added! 📅");
    } catch (err) {
      Toast.error("Failed", err.message);
    } finally {
      Loader.hide();
    }
  },

  async deleteEvent(id) {
    Loader.show();
    try {
      await API.deleteEvent(id);
      this.events = this.events.filter(e => e.id !== id);
      this._renderCalendar();
      Modal.close("event-modal");
      Toast.success("Event Removed");
    } catch (err) {
      Toast.error("Failed", err.message);
    } finally {
      Loader.hide();
    }
  },

  _render() {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    return `<div class="page-header header-reveal">
      <div class="page-header-left"><h1>📅 Marketing Calendar</h1><p class="page-desc">AI-generated marketing schedule and content planning</p></div>
      <div class="page-header-actions">
        <span id="cal-event-count" class="text-sm text-muted"></span>
        <button class="btn btn-outline btn-sm" onclick="CalendarPage._loadEvents()">🔄 Refresh</button>
        <button class="btn btn-primary" onclick="CalendarPage._loadEvents(true)">🤖 AI Generate</button>
      </div>
    </div>
    <div class="calendar-wrapper">
      <div class="calendar-nav">
        <button class="btn btn-ghost btn-sm" onclick="CalendarPage.prevMonth()">◀ Prev</button>
        <div class="calendar-month-title" id="cal-month-title">Loading...</div>
        <button class="btn btn-ghost btn-sm" onclick="CalendarPage.nextMonth()">Next ▶</button>
      </div>
      <div class="calendar-grid">
        ${days.map(d => `<div class="calendar-day-header">${d}</div>`).join("")}
        <div id="cal-grid" style="display:contents"></div>
      </div>
    </div>
    <div class="modal-overlay" id="event-modal"><div class="modal" style="max-width:600px" id="event-modal-body"></div></div>`;
  }
};

/**
 * Publishing Queue Page
 */
window.PublishingPage = {
  async load() {
    const page = document.getElementById("page-publishing");
    if (!page) return;
    page.innerHTML = this._skeleton();
    try {
      const content = await API.getContent("status=draft&status=scheduled");
      const allContent = await API.getContent();
      page.innerHTML = this._render(allContent);
      initRipples();
    } catch (err) {
      page.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">${err.message}</div></div>`;
    }
  },

  _skeleton() {
    return `<div class="page-header header-reveal"><div class="skeleton skeleton-title" style="width:300px"></div></div>
    <div class="flex flex-col gap-12">${Array(4).fill('<div class="skeleton" style="height:80px;border-radius:12px"></div>').join("")}</div>`;
  },

  _render(items) {
    const grouped = { draft: [], scheduled: [], published: [] };
    items.forEach(i => { if (grouped[i.status]) grouped[i.status].push(i); });

    const tabs = ["All", "Draft", "Scheduled", "Published"];
    return `<div class="page-header header-reveal">
      <div class="page-header-left"><h1>📤 Publishing Queue</h1><p class="page-desc">Schedule, manage, and track all your content publishing</p></div>
      <div class="page-header-actions">
        <button class="btn btn-primary" onclick="AppRouter.navigate('content')">✍️ Create Content</button>
      </div>
    </div>

    <div class="grid-3 mb-24 stagger">
      ${[
        ["📝 Draft", grouped.draft.length, "badge-draft"],
        ["⏰ Scheduled", grouped.scheduled.length, "badge-scheduled"],
        ["✅ Published", grouped.published.length, "badge-published"]
      ].map(([label, count, cls]) => `
        <div class="card text-center">
          <div style="font-size:2rem;font-weight:800;margin-bottom:4px">${count}</div>
          <span class="badge-pill ${cls}">${label}</span>
        </div>`).join("")}
    </div>

    <div class="tabs" id="pub-tabs">
      ${tabs.map((t,i) => `<div class="tab ${i===0?"active":""}" onclick="PublishingPage.filterTab('${t.toLowerCase()}', this)">${t}</div>`).join("")}
    </div>

    <div class="flex flex-col gap-10 list-animate" id="pub-list">
      ${this._renderItems(items)}
    </div>`;
  },

  _renderItems(items) {
    if (!items.length) return `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">No content here</div><button class="btn btn-primary mt-16" onclick="AppRouter.navigate('content')">Create Content</button></div>`;
    return items.map(item => `
      <div class="queue-item">
        <div class="queue-channel-icon" style="background:${channelColor(item.channel)}22">
          <span style="font-size:22px">${channelIcon(item.channel)}</span>
        </div>
        <div class="queue-item-body">
          <div class="queue-item-title">${escHtml(item.title || item.channel + " post")}</div>
          <div class="queue-item-preview">${escHtml(item.body).slice(0,80)}...</div>
          <div class="flex gap-8 mt-6">
            <span class="channel-tag ${item.channel}">${item.channel}</span>
            <span class="text-xs text-muted">${item.tone} tone</span>
          </div>
        </div>
        <div class="queue-item-meta">
          ${statusBadge(item.status)}
          ${item.status !== "published"
            ? `<button class="btn btn-success btn-sm" onclick="PublishingPage.publish(${item.id}, this)">🚀 Publish</button>`
            : `<span class="text-xs text-muted">${relativeTime(item.published_at)}</span>`}
        </div>
      </div>`).join("");
  },

  async publish(id, btn) {
    if (btn) { btn.textContent = "Publishing..."; btn.disabled = true; }
    try {
      await API.publishContent(id);
      Toast.success("Published! 🚀", "Content is now live");
      await this.load();
    } catch (err) {
      Toast.error("Failed", err.message);
      if (btn) { btn.textContent = "🚀 Publish"; btn.disabled = false; }
    }
  },

  filterTab(status, tabEl) {
    document.querySelectorAll("#pub-tabs .tab").forEach(t => t.classList.remove("active"));
    tabEl.classList.add("active");
    API.getContent(status !== "all" ? `status=${status}` : "").then(items => {
      document.getElementById("pub-list").innerHTML = this._renderItems(items);
      initRipples();
    });
  }
};
