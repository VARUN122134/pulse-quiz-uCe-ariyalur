/* PULSE Quiz host control - plain JS. No password (coordinator's choice). */
var SUPABASE_URL = "https://oekdpzoewzkznxghmgby.supabase.co";
var SUPABASE_KEY = "sb_publishable_JPqTVSrXJkSYw99313Cnvg_aoAP6tlO";
var sb = null;
try {
  if (window.supabase && window.supabase.createClient) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) { sb = null; }
function $(id) { return document.getElementById(id); }

function paint(status) {
  ["student", "faculty"].forEach(function (r) {
    var s = (status[r] || "?").toUpperCase();
    $("st-" + r).textContent = s;
    ["live", "paused", "ended"].forEach(function (x) {
      $("a-" + r + "-" + x).classList.toggle("cur", (status[r] || "") === x);
    });
  });
}

function refresh() {
  if (!sb) { $("adm-err").textContent = "No Supabase connection — check internet."; return; }
  $("adm-err").textContent = "";
  sb.from("quiz_control").select("role,status").then(function (res) {
    if (res.error) { $("adm-err").textContent = "Load failed: " + res.error.message; return; }
    var st = {};
    (res.data || []).forEach(function (r) { st[r.role] = r.status; });
    paint(st);
  });
  ["student", "faculty"].forEach(function (r) {
    sb.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("role", r).then(function (res) {
      if (!res.error) $("ct-" + r).textContent = res.count;
    });
  });
}

function setStatus(role, status) {
  if (!sb) return;
  if (status === "ended" && !confirm("END the quiz for " + role + "? No new starts after this.")) return;
  $("adm-err").textContent = "Saving…";
  sb.from("quiz_control").update({ status: status, updated_at: new Date().toISOString() }).eq("role", role).then(function (res) {
    if (res.error) $("adm-err").textContent = "Save failed: " + res.error.message;
    else { $("adm-err").textContent = ""; refresh(); }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  ["student", "faculty"].forEach(function (r) {
    ["live", "paused", "ended"].forEach(function (x) {
      $( "a-" + r + "-" + x).onclick = function () { setStatus(r, x === "live" ? "live" : x === "paused" ? "paused" : "ended"); };
    });
  });
  $("adm-refresh").onclick = refresh;
  refresh();
  setInterval(refresh, 5000);
});
