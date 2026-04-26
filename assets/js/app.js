/* ============================================================
   App-wide JS: theme toggle, mobile nav, phase pill
   ============================================================ */
(function () {
  const STORAGE_KEY = "golfsite.theme";
  const root = document.documentElement;
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    document.querySelectorAll("[data-theme-label]").forEach((el) => { el.textContent = theme === "dark" ? "Light" : "Dark"; });
    document.querySelectorAll("[data-theme-icon]").forEach((el) => { el.innerHTML = theme === "dark" ? sunSvg() : moonSvg(); });
  }
  function sunSvg() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>'; }
  function moonSvg() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'; }
  const stored = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(stored || (prefersDark ? "dark" : "light"));
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  });
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-menu-toggle]");
    const closeTrigger = e.target.closest("[data-menu-close]");
    const sidebar = document.querySelector(".sidebar");
    const backdrop = document.querySelector(".sidebar-backdrop");
    if (!sidebar) return;
    if (trigger) { sidebar.classList.add("open"); if (backdrop) backdrop.classList.add("open"); }
    if (closeTrigger || e.target.classList?.contains("sidebar-backdrop")) { sidebar.classList.remove("open"); if (backdrop) backdrop.classList.remove("open"); }
  });
  const PHASE_KEY = "golfsite.phase";
  const PHASES = [
    { id: 1, name: "Posture & Setup", weeks: "Weeks 1\u20132" },
    { id: 2, name: "Clubface & Path", weeks: "Weeks 3\u20134" },
    { id: 3, name: "Variability & Routine", weeks: "Weeks 5\u20136" },
    { id: 4, name: "Pressure & Transfer", weeks: "Weeks 7\u20138" },
  ];
  function getPhaseState() { try { return JSON.parse(localStorage.getItem(PHASE_KEY)) || { active: 1, done: [] }; } catch (_) { return { active: 1, done: [] }; } }
  function savePhaseState(s) { localStorage.setItem(PHASE_KEY, JSON.stringify(s)); }
  function renderPhasePill() {
    const pill = document.querySelector("[data-phase-pill]");
    if (!pill) return;
    const state = getPhaseState();
    const phase = PHASES.find((p) => p.id === state.active) || PHASES[0];
    pill.innerHTML = '<span class="dot"></span>Phase ' + phase.id + ' \xb7 ' + phase.name;
  }
  renderPhasePill();
  window.GolfSite = window.GolfSite || {};
  window.GolfSite.phases = PHASES;
  window.GolfSite.getPhaseState = getPhaseState;
  window.GolfSite.savePhaseState = savePhaseState;
  window.GolfSite.renderPhasePill = renderPhasePill;
})();
