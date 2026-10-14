/* PULSE Quiz - plain JS (no modules) so buttons work even via file:// and offline. */
var SUPABASE_URL = "https://oekdpzoewzkznxghmgby.supabase.co";
var SUPABASE_KEY = "sb_publishable_JPqTVSrXJkSYw99313Cnvg_aoAP6tlO";
var sb = null;
try {
  if (window.supabase && window.supabase.createClient) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) { sb = null; }

var POINTS = 1, TOTAL = 25, QUIZ_SECS = 15 * 60;

var QUESTIONS = [
  { q: "Which of the following is the SI unit of power?", o: ["Joule", "Watt", "Newton", "Pascal"], a: 1 },
  { q: "Which device converts electrical energy into mechanical energy?", o: ["Generator", "Electric motor", "Transformer", "Battery"], a: 1 },
  { q: "What is the approximate speed of light in a vacuum?", o: ["3 x 10^6 m/s", "3 x 10^8 m/s", "3 x 10^5 m/s", "3 x 10^10 m/s"], a: 1 },
  { q: "Which gas is most abundant in Earth's atmosphere?", o: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], a: 2 },
  { q: "Which simple machine is used to raise a flag on a flagpole?", o: ["Lever", "Pulley", "Wedge", "Screw"], a: 1 },
  { q: "What does CPU stand for?", o: ["Central Processing Unit", "Computer Power Unit", "Central Program Utility", "Control Processing Unit"], a: 0 },
  { q: "Which decimal number is binary 1010?", o: ["8", "10", "12", "14"], a: 1 },
  { q: "Which material is a good electrical conductor?", o: ["Rubber", "Glass", "Copper", "Wood"], a: 2 },
  { q: "Main purpose of a fuse?", o: ["Increase current", "Protect against excessive current", "Store energy", "Reduce frequency"], a: 1 },
  { q: "Which renewable source uses sunlight directly?", o: ["Geothermal", "Solar", "Tidal", "Wind"], a: 1 },
  { q: "What is 2^3?", o: ["6", "8", "9", "12"], a: 1 },
  { q: "150 km in 3 hours = average speed?", o: ["30 km/h", "45 km/h", "50 km/h", "60 km/h"], a: 2 },
  { q: "Instrument to measure temperature?", o: ["Barometer", "Thermometer", "Ammeter", "Speedometer"], a: 1 },
  { q: "Which law is V = IR?", o: ["Newton's law", "Ohm's law", "Faraday's law", "Hooke's law"], a: 1 },
  { q: "Example of AI?", o: ["Wall clock", "Manual switch", "Voice assistant", "Metal ruler"], a: 2 },
  { q: "What does GPS determine?", o: ["Blood pressure", "Location", "Resistance", "Temperature"], a: 1 },
  { q: "Stores energy in electric field?", o: ["Capacitor", "Resistor", "Fuse", "Switch"], a: 0 },
  { q: "Chemical formula of water?", o: ["CO2", "O2", "H2O", "NaCl"], a: 2 },
  { q: "Force keeping planets in orbit?", o: ["Friction", "Magnetism", "Gravity", "Buoyancy"], a: 2 },
  { q: "5 machines make 5 products in 5 min. 100 machines, 100 products?", o: ["5 minutes", "20 minutes", "100 minutes", "500 minutes"], a: 0 },
  { q: "Dr. Kalam born on?", o: ["15 Oct 1931", "15 Aug 1931", "2 Oct 1931", "26 Jan 1931"], a: 0 },
  { q: "Dr. Kalam known as?", o: ["Iron Man", "Missile Man", "White Revolution", "Metro Man"], a: 1 },
  { q: "Kalam became President in?", o: ["1997", "2000", "2002", "2007"], a: 2 },
  { q: "Kalam's autobiography?", o: ["Ignited Minds", "Wings of Fire", "India 2020", "Discovery of India"], a: 1 },
  { q: "Kalam worked with which organisation?", o: ["ISRO", "RBI", "SEBI", "NITI Aayog"], a: 0 }
];

function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function fmt(s) { return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

var role = "student", current = 0, answers = [], timerId = null, timeLeft = QUIZ_SECS, startStamp = 0, profile = null;
function blank() { answers = []; for (var i = 0; i < QUESTIONS.length; i++) answers.push(null); }
blank();

function go(v) {
  var vs = ["home", "register", "quiz", "result", "leaderboard"];
  for (var i = 0; i < vs.length; i++) $("view-" + vs[i]).classList.toggle("on", vs[i] === v);
  window.scrollTo(0, 0);
  if (v === "leaderboard") loadBoard();
  if (v === "home") loadTop3();
}

function openReg(r) {
  role = r;
  $("reg-title").textContent = r === "student" ? "Student details" : "Faculty details";
  $("reg-sub").textContent = r === "student" ? "You will be ranked on the leaderboard." : "Faculty: not ranked, no prize.";
  $("year-wrap").style.display = r === "student" ? "" : "none";
  $("reg-wrap").style.display = r === "student" ? "" : "none";
  $("reg-err").textContent = "";
  go("register");
}

function startQuiz() {
  current = 0; blank(); timeLeft = QUIZ_SECS; startStamp = Date.now();
  go("quiz"); renderQ(); startTimer();
}
function startTimer() {
  clearInterval(timerId); tick();
  timerId = setInterval(tick, 1000);
}
function tick() {
  var el = $("q-timer");
  el.textContent = fmt(Math.max(0, timeLeft));
  el.classList.toggle("low", timeLeft <= 120);
  if (timeLeft <= 0) { clearInterval(timerId); submitQuiz(true); return; }
  timeLeft--;
}
function renderQ() {
  var Q = QUESTIONS[current];
  $("q-progress-text").textContent = "Question " + (current + 1) + " of " + QUESTIONS.length;
  $("q-bar").style.width = ((current + 1) / QUESTIONS.length * 100) + "%";
  $("q-text").textContent = "Q" + (current + 1) + ". " + Q.q;
  var box = $("q-opts"); box.innerHTML = "";
  var L = ["A", "B", "C", "D"];
  Q.o.forEach(function (opt, i) {
    var d = document.createElement("div");
    d.className = "opt" + (answers[current] === i ? " sel" : "");
    d.textContent = L[i] + ". " + opt;
    d.onclick = function () { answers[current] = i; renderQ(); };
    box.appendChild(d);
  });
  $("q-prev").disabled = current === 0;
  $("q-next").textContent = current === QUESTIONS.length - 1 ? "Last →" : "Next →";
}

function submitQuiz(auto) {
  clearInterval(timerId);
  var correct = 0, i;
  for (i = 0; i < QUESTIONS.length; i++) if (answers[i] === QUESTIONS[i].a) correct++;
  var score = correct * POINTS;
  var taken = Math.min(QUIZ_SECS, Math.floor((Date.now() - startStamp) / 1000));
  save(score, taken, function (saveErr) {
    if (saveErr) alert("Score: " + score + " / " + TOTAL + ".\nCloud save issue: " + saveErr + "\nTake a screenshot!");
    showResult(correct, score, taken, auto);
  });
}

function save(score, taken, cb) {
  if (!sb) { cb("offline (no internet) — showing local score"); return; }
  var payload = { role: profile.role, name: profile.name, dept: profile.dept, year: profile.year, reg_number: profile.reg_number, score: score, total: TOTAL, time_taken_secs: taken, answers: answers };
  sb.from("quiz_attempts").insert(payload).then(function (res) {
    if (res.error) {
      if ((res.error.message || "").toLowerCase().indexOf("duplicate") >= 0) cb("this Reg No already submitted once");
      else cb(res.error.message);
    } else cb(null);
  }).catch(function (e) { cb(e.message || "network error"); });
}

function showResult(correct, score, taken, auto) {
  go("result");
  $("r-title").textContent = "You scored " + score + " / " + TOTAL;
  $("r-sub").textContent = (auto ? "Time up! " : "") +
    (profile.role === "faculty" ? profile.name + " (Faculty) — not ranked." : profile.name + " • " + profile.dept + " • " + (profile.reg_number || ""));
  $("r-correct").textContent = correct + "/" + QUESTIONS.length;
  $("r-time").textContent = fmt(taken);
  var rev = $("r-review"); rev.innerHTML = "";
  var L = ["A", "B", "C", "D"];
  QUESTIONS.forEach(function (Q, i) {
    var ok = answers[i] === Q.a;
    var d = document.createElement("div");
    d.className = "rev " + (ok ? "ok" : "no");
    d.innerHTML = "<b>Q" + (i + 1) + ". " + esc(Q.q) + "</b><br>Your: <b>" +
      (answers[i] === null ? "Skipped" : esc(L[answers[i]] + ". " + Q.o[answers[i]])) + "</b> " + (ok ? "✅" : "❌") +
      (ok ? "" : "<br>Answer: <b>" + esc(L[Q.a] + ". " + Q.o[Q.a]) + "</b>");
    rev.appendChild(d);
  });
}

function medal(i) { return i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"; }

// Sort: score DESC, then time ASC (faster wins ties), null times last.
function sortBoard(data) {
  return (data || []).slice().sort(function (x, y) {
    if (y.score !== x.score) return y.score - x.score;
    var xt = (x.time_taken_secs == null ? 99999 : x.time_taken_secs);
    var yt = (y.time_taken_secs == null ? 99999 : y.time_taken_secs);
    return xt - yt;
  });
}
// Tie-aware rank: same score + same time => same rank number.
function rankOf(sorted, i) {
  if (i === 0) return 1;
  var p = sorted[i - 1], c = sorted[i];
  if (p.score === c.score && (p.time_taken_secs || 0) === (c.time_taken_secs || 0)) return rankOf(sorted, i - 1);
  return i + 1;
}

function timeStr(r) {
  if (r.time_taken_secs == null) return "—";
  return fmt(r.time_taken_secs);
}

function boardRows(data, el, full) {
  el.innerHTML = "";
  if (!data.length) { el.innerHTML = '<p class="mut">No attempts yet — be the first!</p>'; return; }
  var sorted = sortBoard(data);
  sorted.slice(0, full ? sorted.length : 3).forEach(function (r, i) {
    var rk = full ? rankOf(sorted, i) : (i + 1);
    var d = document.createElement("div");
    d.className = full ? "rank" : "pod";
    d.innerHTML = full
      ? "<span>" + rk + ". <b>" + esc(r.name) + "</b> <small class='mut'>" + esc(r.dept) + " • ⏱ " + timeStr(r) + "</small></span><b>" + r.score + " / " + TOTAL + "</b>"
      : medal(i) + " <b>" + esc(r.name) + "</b> (" + esc(r.dept) + ") — <b>" + r.score + " / " + TOTAL + "</b> <small class='mut'>⏱ " + timeStr(r) + "</small>";
    el.appendChild(d);
  });
}

function loadTop3() {
  var el = $("home-top3");
  if (!sb) {
    var local = [];
    try { local = JSON.parse(localStorage.getItem("quiz_local_board") || "[]"); } catch (e) {}
    boardRows(sortBoard(local).slice(0, 3), el, false);
    if (!local.length) el.innerHTML = '<p class="mut">Offline mode — scores save on this phone only.</p>';
    return;
  }
  sb.from("quiz_attempts").select("name,dept,score,time_taken_secs").eq("role", "student").order("score", { ascending: false }).order("time_taken_secs", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true }).limit(3)
    .then(function (res) {
      if (res.error) { el.innerHTML = '<p class="mut">Offline — check internet.</p>'; return; }
      boardRows(res.data || [], el, false);
    });
}

function loadBoard() {
  var pod = $("lb-podium"), list = $("lb-list");
  pod.innerHTML = '<p class="mut">Loading…</p>'; list.innerHTML = "";
  $("lb-count").textContent = "";
  if (!sb) {
    var local = [];
    try { local = JSON.parse(localStorage.getItem("quiz_local_board") || "[]"); } catch (e) {}
    $("lb-count").textContent = "Offline: " + local.length + " on this phone";
    boardRows(local, pod, false); boardRows(local, list, true);
    return;
  }
  sb.from("quiz_attempts").select("name,dept,year,reg_number,score,time_taken_secs,created_at").eq("role", "student").order("score", { ascending: false }).order("time_taken_secs", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true }).limit(100)
    .then(function (res) {
      if (res.error) { pod.innerHTML = '<p class="mut">Failed: ' + esc(res.error.message) + "</p>"; return; }
      var data = res.data || [];
      $("lb-count").textContent = data.length + " student(s)";
      boardRows(data, pod, false); boardRows(data, list, true);
    });
}

// wire buttons AFTER DOM ready — plain onclick so nothing can silently die
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-go]").forEach(function (b) { b.onclick = function () { go(b.getAttribute("data-go")); }; });
  $("btn-student").onclick = function () { openReg("student"); };
  $("btn-faculty").onclick = function () { openReg("faculty"); };
  $("btn-board1").onclick = function () { go("leaderboard"); };
  $("btn-board2").onclick = function () { go("leaderboard"); };
  $("nav-board").onclick = function () { go("leaderboard"); };
  $("lb-refresh").onclick = loadBoard;

  $("reg-submit").onclick = function () {
    var err = $("reg-err");
    var name = $("f-name").value.trim(), dept = $("f-dept").value;
    var year = $("f-year").value, reg = $("f-reg").value.trim().toUpperCase().replace(/\s+/g, "");
    if (!name || !dept || (role === "student" && (!year || !reg))) { err.textContent = "Please fill all * fields."; return; }
    err.textContent = "";
    $("reg-submit").textContent = "Checking…"; $("reg-submit").disabled = true;
    var done = function () {
      profile = { role: role, name: name, dept: dept, year: role === "student" ? year : null, reg_number: role === "student" ? reg : null };
      $("reg-submit").textContent = "Start Quiz →"; $("reg-submit").disabled = false;
      startQuiz();
    };
    if (role === "student" && sb) {
      sb.from("quiz_attempts").select("id").eq("role", "student").eq("reg_number", reg).limit(1).then(function (res) {
        if (res.error) { done(); return; } // offline-tolerant: let them play
        if (res.data && res.data.length) { err.textContent = "This Reg No already attempted (1 attempt only)."; $("reg-submit").textContent = "Start Quiz →"; $("reg-submit").disabled = false; return; }
        done();
      });
    } else done();
  };

  $("q-prev").onclick = function () { if (current > 0) { current--; renderQ(); } };
  $("q-next").onclick = function () { if (current < QUESTIONS.length - 1) { current++; renderQ(); } };
  $("q-submit").onclick = function () {
    var un = answers.filter(function (x) { return x === null; }).length;
    if (un > 0 && !confirm(un + " unanswered. Submit anyway?")) return;
    submitQuiz(false);
  };

  // keep local backup too (offline leaderboard on same phone)
  var origShow = showResult;
  showResult = function (correct, score, taken, auto) {
    try {
      if (profile && profile.role === "student") {
        var k = "quiz_local_board", arr = JSON.parse(localStorage.getItem(k) || "[]");
        arr.push({ name: profile.name, dept: profile.dept, score: score, time_taken_secs: taken });
        localStorage.setItem(k, JSON.stringify(arr));
      }
    } catch (e) {}
    origShow(correct, score, taken, auto);
  };

  loadTop3();
});
