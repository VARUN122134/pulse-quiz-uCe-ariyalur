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

// Per-participant shuffle: questions + options (rebuilt every attempt).
var DECK = null;
function shuffleArr(a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function buildDeck() {
  var qi = shuffleArr(QUESTIONS.map(function (_, i) { return i; }));
  DECK = qi.map(function (orig) {
    var Q = QUESTIONS[orig];
    var oi = shuffleArr(Q.o.map(function (_, i) { return i; }));
    return { q: Q.q, o: oi.map(function (i) { return Q.o[i]; }), a: oi.indexOf(Q.a), src: orig };
  });
}

// Host control (start/pause/end per role). Offline => allow play.
var control = { student: "live", faculty: "live" };
var inQuiz = false, frozen = false;
function fetchControl() {
  if (!sb) return;
  sb.from("quiz_control").select("role,status").then(function (res) {
    if (res.error || !res.data) return;
    res.data.forEach(function (r) { control[r.role] = r.status; });
    paintControl();
    enforceControl();
  });
}
function controlMsg(s) {
  if (s === "live") return null;
  if (s === "waiting") return "⏳ Quiz not started yet — wait for the coordinator.";
  if (s === "paused") return "⏸ Quiz is paused by the coordinator — wait...";
  return "⏹ Quiz has ended — results will be announced by the coordinator.";
}
function paintControl() {
  var el = $("control-line");
  if (el) el.textContent = "🎓 Students: " + control.student.toUpperCase() + "  •  👩‍🏫 Faculty: " + control.faculty.toUpperCase();
}
function enforceControl() {
  if (!inQuiz || !profile) return;
  var s = control[profile.role];
  if (s === "paused" && !frozen) {
    frozen = true; clearInterval(timerId);
    $("pause-overlay").style.display = "block";
  } else if (s === "live" && frozen) {
    frozen = false;
    $("pause-overlay").style.display = "none";
    startTimer();
  } else if (s === "ended" && !frozen) {
    submitQuiz(false);
  }
}

function go(v) {
  var vs = ["home", "register", "quiz", "result"];
  for (var i = 0; i < vs.length; i++) $("view-" + vs[i]).classList.toggle("on", vs[i] === v);
  window.scrollTo(0, 0);
}

function openReg(r) {
  role = r;
  $("reg-title").textContent = r === "student" ? "Student details" : "Faculty details";
  $("reg-sub").textContent = r === "student" ? "Winners announced by the coordinator." : "Faculty: not ranked, no prize.";
  $("year-wrap").style.display = r === "student" ? "" : "none";
  $("reg-wrap").style.display = r === "student" ? "" : "none";
  $("reg-err").textContent = "";
  var gm = $("gate-msg");
  if (gm) { var b = controlMsg(control[r]); gm.textContent = b || "✅ Quiz is LIVE — fill & start!"; }
  go("register");
}

function startQuiz() {
  current = 0; blank(); buildDeck(); timeLeft = QUIZ_SECS; startStamp = Date.now();
  inQuiz = true; frozen = false;
  $("pause-overlay").style.display = "none";
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
  var Q = (DECK || QUESTIONS)[current];
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
  inQuiz = false; frozen = false;
  $("pause-overlay").style.display = "none";
  var D = DECK || QUESTIONS;
  var correct = 0, i;
  for (i = 0; i < D.length; i++) if (answers[i] === D[i].a) correct++;
  var score = correct * POINTS;
  var taken = Math.min(QUIZ_SECS, Math.floor((Date.now() - startStamp) / 1000));
  save(score, taken, function (saveErr) {
    if (saveErr) alert("Score: " + score + " / " + TOTAL + ".\nCloud save issue: " + saveErr + "\nTake a screenshot!");
    showResult(correct, score, taken, auto);
  });
}

function save(score, taken, cb) {
  if (!sb) { cb("offline (no internet) — showing local score"); return; }
  var payload = { role: profile.role, name: profile.name, dept: profile.dept, year: profile.year, reg_number: profile.reg_number, score: score, total: TOTAL, time_taken_secs: taken, answers: { v: 2, order: (DECK || []).map(function (d) { return d.src; }), answers: answers } };
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
  (DECK || QUESTIONS).forEach(function (Q, i) {
    var ok = answers[i] === Q.a;
    var d = document.createElement("div");
    d.className = "rev " + (ok ? "ok" : "no");
    d.innerHTML = "<b>Q" + (i + 1) + ". " + esc(Q.q) + "</b><br>Your: <b>" +
      (answers[i] === null ? "Skipped" : esc(L[answers[i]] + ". " + Q.o[answers[i]])) + "</b> " + (ok ? "✅" : "❌") +
      (ok ? "" : "<br>Answer: <b>" + esc(L[Q.a] + ". " + Q.o[Q.a]) + "</b>");
    rev.appendChild(d);
  });
}

// Public leaderboard removed — viewers see no scores. Host views results on admin page.
// wire buttons AFTER DOM ready — plain onclick so nothing can silently die
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-go]").forEach(function (b) { b.onclick = function () { go(b.getAttribute("data-go")); }; });
  $("btn-student").onclick = function () { openReg("student"); };
  $("btn-faculty").onclick = function () { openReg("faculty"); };

  $("reg-submit").onclick = function () {
    var err = $("reg-err");
    var name = $("f-name").value.trim(), dept = $("f-dept").value;
    var year = $("f-year").value, reg = $("f-reg").value.trim().toUpperCase().replace(/\s+/g, "");
    if (!name || !dept || (role === "student" && (!year || !reg))) { err.textContent = "Please fill all * fields."; return; }
    if (sb) {
      var block = controlMsg(control[role]);
      if (block) { err.textContent = block; return; }
    }
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

  fetchControl();
  setInterval(fetchControl, 10000);
});
