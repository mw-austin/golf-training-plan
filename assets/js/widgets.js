/* ============================================================
   Page-specific widgets: drill checklist, phase tracker, KPI tracker
   ============================================================ */
(function () {
  // --------------- Drill checklist ---------------
  const CHECK_KEY = "golfsite.drillChecks";
  function getChecks() { try { return JSON.parse(localStorage.getItem(CHECK_KEY)) || {}; } catch (_) { return {}; } }
  function saveChecks(c) { localStorage.setItem(CHECK_KEY, JSON.stringify(c)); }
  function initDrillChecklist() {
    const checks = getChecks();
    document.querySelectorAll(".drill-checkbox").forEach((cb) => {
      const id = cb.getAttribute("data-drill-id");
      if (checks[id]) cb.checked = true;
      cb.addEventListener("change", () => { const cur = getChecks(); cur[id] = cb.checked; saveChecks(cur); updateDrillSummary(); });
    });
    const reset = document.querySelector("[data-drills-reset]");
    if (reset) { reset.addEventListener("click", () => { if (!confirm("Reset all drill checkboxes?")) return; saveChecks({}); document.querySelectorAll(".drill-checkbox").forEach((cb) => { cb.checked = false; }); updateDrillSummary(); }); }
    updateDrillSummary();
  }
  function updateDrillSummary() {
    const summary = document.querySelector("[data-drills-summary]");
    if (!summary) return;
    const total = document.querySelectorAll(".drill-checkbox").length;
    const done = document.querySelectorAll(".drill-checkbox:checked").length;
    summary.textContent = done + " of " + total + " drills checked";
  }
  // --------------- Phase tracker ---------------
  function initPhaseTracker() {
    const container = document.querySelector("[data-phase-tracker]");
    if (!container) return;
    render();
    container.addEventListener("click", (e) => {
      const card = e.target.closest(".phase-card");
      if (!card) return;
      const id = parseInt(card.getAttribute("data-phase"), 10);
      const state = window.GolfSite.getPhaseState();
      if (state.done.includes(id)) { state.done = state.done.filter((x) => x !== id); }
      else if (state.active === id) { state.done.push(id); const next = window.GolfSite.phases.find((p) => p.id === id + 1); state.active = next ? next.id : id; }
      else { state.active = id; }
      window.GolfSite.savePhaseState(state);
      window.GolfSite.renderPhasePill();
      render();
    });
    function render() {
      const state = window.GolfSite.getPhaseState();
      container.innerHTML = window.GolfSite.phases.map((p) => {
        let status = "future";
        if (state.done.includes(p.id)) status = "done";
        else if (state.active === p.id) status = "active";
        const label = status === "done" ? "Complete" : status === "active" ? "Active now" : "Up next";
        return '<div class="phase-card" data-phase="' + p.id + '" data-status="' + status + '" role="button" tabindex="0"><div class="phase-num">Phase ' + p.id + '</div><div class="phase-name">' + p.name + '</div><div class="phase-weeks">' + p.weeks + '</div><div class="phase-status">' + label + '</div></div>';
      }).join("");
    }
  }
  // --------------- KPI tracker ---------------
  const KPI_KEY = "golfsite.kpiLog";
  function getLog() { try { return JSON.parse(localStorage.getItem(KPI_KEY)) || []; } catch (_) { return []; } }
  function saveLog(l) { localStorage.setItem(KPI_KEY, JSON.stringify(l)); }
  function initKpiTracker() {
    const form = document.querySelector("[data-kpi-form]");
    if (!form) return;
    const tableBody = document.querySelector("[data-kpi-tbody]");
    const emptyState = document.querySelector("[data-kpi-empty]");
    const chartCanvas = document.querySelector("[data-kpi-chart]");
    const exportBtn = document.querySelector("[data-kpi-export]");
    const clearBtn = document.querySelector("[data-kpi-clear]");
    const metricSelect = document.querySelector("[data-chart-metric]");
    let chart = null;
    const metricLabels = { driverFtp: "Driver Face-to-Path (\xb0)", ironAoa: "7-Iron AoA (\xb0)", ironSmash: "7-Iron Smash Factor", fairways: "Fairways Hit", gir: "Greens in Regulation", score: "Score" };
    function render() {
      const log = getLog().sort((a, b) => a.date.localeCompare(b.date));
      if (log.length === 0) { tableBody.innerHTML = ""; emptyState.style.display = "block"; }
      else {
        emptyState.style.display = "none";
        tableBody.innerHTML = log.slice().reverse().map((e, idx) => '<tr><td>' + e.date + '</td><td>' + (e.driverFtp ?? "\u2014") + '</td><td>' + (e.ironAoa ?? "\u2014") + '</td><td>' + (e.ironSmash ?? "\u2014") + '</td><td>' + (e.fairways ?? "\u2014") + '</td><td>' + (e.gir ?? "\u2014") + '</td><td>' + (e.score ?? "\u2014") + '</td><td><button class="delete-btn" data-delete="' + (log.length - 1 - idx) + '" aria-label="Delete">\xd7</button></td></tr>').join("");
      }
      const metric = metricSelect ? metricSelect.value : "driverFtp";
      const data = log.filter((e) => e[metric] !== "" && e[metric] != null).map((e) => ({ x: e.date, y: parseFloat(e[metric]) }));
      if (chart) { chart.destroy(); chart = null; }
      if (chartCanvas && data.length > 0 && window.Chart) {
        const s = getComputedStyle(document.documentElement);
        const accent = s.getPropertyValue("--accent").trim();
        const text = s.getPropertyValue("--text").trim();
        const muted = s.getPropertyValue("--text-muted").trim();
        const border = s.getPropertyValue("--border-soft").trim();
        chart = new Chart(chartCanvas, { type: "line", data: { labels: data.map((d) => d.x), datasets: [{ label: metricLabels[metric], data: data.map((d) => d.y), borderColor: accent, backgroundColor: accent + "22", borderWidth: 2, fill: true, tension: 0.25, pointRadius: 4, pointBackgroundColor: accent }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: text } }, tooltip: { titleColor: text, bodyColor: text, backgroundColor: s.getPropertyValue("--surface").trim(), borderColor: border, borderWidth: 1 } }, scales: { x: { ticks: { color: muted }, grid: { color: border } }, y: { ticks: { color: muted }, grid: { color: border } } } } });
      }
    }
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const entry = { date: fd.get("date"), driverFtp: fd.get("driverFtp") || null, ironAoa: fd.get("ironAoa") || null, ironSmash: fd.get("ironSmash") || null, fairways: fd.get("fairways") || null, gir: fd.get("gir") || null, score: fd.get("score") || null };
      if (!entry.date) return;
      const log = getLog(); log.push(entry); saveLog(log); form.reset();
      const di = form.querySelector('input[name="date"]'); if (di) di.value = new Date().toISOString().slice(0, 10);
      render();
    });
    if (tableBody) { tableBody.addEventListener("click", (e) => { const btn = e.target.closest("[data-delete]"); if (!btn) return; const idx = parseInt(btn.getAttribute("data-delete"), 10); const log = getLog().sort((a, b) => a.date.localeCompare(b.date)); log.splice(idx, 1); saveLog(log); render(); }); }
    if (metricSelect) metricSelect.addEventListener("change", render);
    if (exportBtn) { exportBtn.addEventListener("click", () => { const log = getLog(); if (!log.length) { alert("No entries to export."); return; } const headers = ["date","driverFtp","ironAoa","ironSmash","fairways","gir","score"]; const csv = [headers.join(",")].concat(log.map((e) => headers.map((h) => e[h] ?? "").join(","))).join("\n"); const blob = new Blob([csv], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "golf-kpi-log.csv"; a.click(); }); }
    if (clearBtn) { clearBtn.addEventListener("click", () => { if (!confirm("Delete all KPI log entries?")) return; saveLog([]); render(); }); }
    const di = form.querySelector('input[name="date"]'); if (di && !di.value) di.value = new Date().toISOString().slice(0, 10);
    render();
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
  document.addEventListener("DOMContentLoaded", () => { initDrillChecklist(); initPhaseTracker(); initKpiTracker(); });
})();
