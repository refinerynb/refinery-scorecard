import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xhqnvaizvczspcwzrpnu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocW52YWl6dmN6c3Bjd3pycG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0OTQ2MjUsImV4cCI6MjA5ODA3MDYyNX0.oiUlNoe4833clEN1AgbC-0368S7oNzjYrHg-YkkHmxo";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const C = {
  ink: "#1C1C1C", warm: "#F6F2EC", gold: "#B8966E", goldLight: "#EDE0CE",
  pink: "#D94F4F", pinkLight: "#FDEAEA", green: "#3A7D5A", greenLight: "#E6F4ED",
  steel: "#4A6FA5", steelLight: "#E8EEF7", border: "#E2DBD0", muted: "#9A9189", white: "#FFFFFF",
};

const ROLE_OPTIONS = [
  { value: "stylist",     label: "Stylist" },
  { value: "front_desk",  label: "Front Desk" },
  { value: "team_leader", label: "Team Leader" },
  { value: "manager",     label: "Manager" },
  { value: "gm",          label: "GM (Payton)" },
  { value: "owner",       label: "Owner (Vicki)" },
  { value: "apprentice",  label: "Apprentice" },
];

const LEADERSHIP_ROLES = ["team_leader", "manager", "gm", "owner"];

// Individual weekly targets — Q3 2026
const STYLIST_TARGETS = {
  ali:     { serviceWeekly: 2221, productWeekly: 69 },
  alexis:  { serviceWeekly: 2135, productWeekly: 69 },
  darby:   { serviceWeekly: 2014, productWeekly: 69 },
  katie:   { serviceWeekly: 776,  productWeekly: 69 },
  payton:  { serviceWeekly: 1331, productWeekly: 69 },
  savanna: { serviceWeekly: 1727, productWeekly: 69 },
  teagan:  { serviceWeekly: 2191, productWeekly: 69 },
  vanessa: { serviceWeekly: 2123, productWeekly: 69 },
  vicki:   { serviceWeekly: 1331, productWeekly: 69 },
};
const PPH_FLOOR = 68.44;

// ── COMPANY SCORECARD targets & helpers ───────────────────────────────────────
const PRODUCT_PER_STYLIST_WEEKLY = 100; // product-sales target per active stylist
const PAYROLL_TARGET_PCT = 50;          // green when BELOW this
const UTILIZATION_TARGET_PCT = 80;      // green at or above
const GUEST_RATING_TARGET = 5;          // out of 5
const STYLIST_RATING_TARGET = 8;        // out of 10 (auto from team satisfaction)
// Service-sales targets by calendar month (weekly = monthly / 4).
const SERVICE_TARGETS = {
  "2026-07": { monthly: 55902.78, weekly: 13975.70 },
  "2026-08": { monthly: 58794.00, weekly: 14698.50 },
  "2026-09": { monthly: 60140.40, weekly: 15035.10 },
  "2026-10": { monthly: 74907.78, weekly: 18726.95 },
  "2026-11": { monthly: 65428.00, weekly: 16357.00 },
  "2026-12": { monthly: 73824.00, weekly: 18456.00 },
};
const COMPANY_METRICS = [
  { id: "service_sales",  label: "Service Sales",  kind: "money", dir: "higher", agg: "sum" },
  { id: "product_sales",  label: "Product Sales",  kind: "money", dir: "higher", agg: "sum" },
  { id: "payroll_pct",    label: "Payroll %",      kind: "pct",   dir: "lower",  agg: "avg" },
  { id: "pph",            label: "PPH",            kind: "money", dir: "higher", agg: "avg" },
  { id: "utilization",    label: "Utilization %",  kind: "pct",   dir: "higher", agg: "avg" },
  { id: "guest_rating",   label: "Guest Rating",   kind: "star",  dir: "higher", agg: "avg" },
  { id: "stylist_rating", label: "Stylist Rating", kind: "ten",   dir: "higher", agg: "avg", auto: true },
];
function companyTargetWeekly(id, monthKey, stylistCount) {
  switch (id) {
    case "service_sales":  return SERVICE_TARGETS[monthKey]?.weekly ?? null;
    case "product_sales":  return PRODUCT_PER_STYLIST_WEEKLY * stylistCount;
    case "payroll_pct":    return PAYROLL_TARGET_PCT;
    case "pph":            return PPH_FLOOR;
    case "utilization":    return UTILIZATION_TARGET_PCT;
    case "guest_rating":   return GUEST_RATING_TARGET;
    case "stylist_rating": return STYLIST_RATING_TARGET;
    default:               return null;
  }
}
function companyGreen(dir, value, target) {
  if (value == null || target == null || Number.isNaN(value)) return null;
  return dir === "lower" ? value < target : value >= target;
}
function fmtCompany(kind, v) {
  if (v == null || Number.isNaN(v)) return "—";
  if (kind === "money") return "$" + Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (kind === "pct")   return v + "%";
  if (kind === "star")  return v + "★";
  if (kind === "ten")   return v + "/10";
  return String(v);
}

// ── LEADERSHIP FEEDBACK (upward feedback to Vicki & Payton) ────────────────────
// Weekly pulse: 1–10 + feedback (required under 7). Monthly review: 0–1–2 scored
// questions + open prompts (two always-on, plus a rotating set that changes each
// month so the deep questions get covered a few at a time over a quarter).
const LEADER_PULSE_TARGET = 7;
const LEADER_SCORED_LEGEND = "0 = not effective / unclear · 1 = somewhat / inconsistent · 2 = effective / clear";
const LEADER_SCORED_Q = [
  { id: "expectations", label: "How clear are you on what's expected of you in your leadership role?" },
  { id: "coaching",     label: "How effective is the coaching you receive from Vicki and Payton?" },
  { id: "feedback",     label: "How effective are we at giving you clear, direct feedback?" },
  { id: "support",      label: "How supported do you feel handling difficult situations or decisions?" },
  { id: "authority",    label: "Do you feel you have enough authority to fully own your responsibilities?" },
];
const LEADER_OPEN_ALWAYS = [
  { id: "clarity3",      label: "List up to 3 areas where you currently lack clarity as a leader." },
  { id: "uncomfortable", label: "One piece of feedback you think we need to hear — even if it's uncomfortable." },
];
const LEADER_OPEN_SETS = [
  { name: "Start · Stop · Continue", qs: [
    { id: "start",    label: "One thing we should START doing as leaders." },
    { id: "stop",     label: "One thing we should STOP doing as leaders." },
    { id: "keep",     label: "One thing we should CONTINUE doing as leaders." },
  ] },
  { name: "Friction & Candor", qs: [
    { id: "bottlenecks", label: "Where are we unintentionally creating confusion, bottlenecks, or making your job harder?" },
    { id: "hesitate",    label: "What do you hesitate to bring to us — and why?" },
    { id: "involvement", label: "Where are we too involved? Where are we not involved enough?" },
  ] },
  { name: "Growth & Capacity", qs: [
    { id: "growth_conf", label: "How confident are you in our ability to lead the business through its next stage of growth? What influenced that?" },
    { id: "capacity",    label: "What leadership responsibility do we currently lack the capacity to handle well?" },
    { id: "say_do_gap",  label: "Where's the gap between what we say is important and what we actually prioritize?" },
  ] },
];
function leaderOpenSetForMonth(monthKey) {
  const m = parseInt(String(monthKey).slice(5, 7), 10) || 1;
  return LEADER_OPEN_SETS[(m - 1) % 3];
}
const LEADER_Q_LABELS = (() => {
  const map = {};
  LEADER_SCORED_Q.forEach(q => { map[q.id] = q.label; });
  LEADER_OPEN_ALWAYS.forEach(q => { map[q.id] = q.label; });
  LEADER_OPEN_SETS.forEach(s => s.qs.forEach(q => { map[q.id] = q.label; }));
  return map;
})();
const LEADER_SCORED_IDS = LEADER_SCORED_Q.map(q => q.id);
function leaderMonthlyDone(data) {
  return LEADER_SCORED_Q.every(q => typeof data?.[q.id] === "number");
}
function isLeader(member) {
  return LEADERSHIP_ROLES.includes(member.role);
}

const SCORECARDS = {
  stylist: {
    label: "Stylist",
    metrics: [
      { id: "service_sales",    label: "Service Sales vs Weekly Target",        desc: "0 = <90% of target · 1 = 90–99% · 2 = 100%+",                source: "Phorest",  score: { kind: "pct", tgt: "service", unit: "$" } },
      { id: "product_sales",    label: "Product Sales vs Weekly Target",        desc: "0 = <90% of target · 1 = 90–99% · 2 = 100%+",                source: "Phorest",  score: { kind: "pct", tgt: "product", unit: "$" } },
      { id: "pph",              label: "PPH",                                   desc: "Floor target $68.44 · 0 = below · 1 = at floor · 2 = floor +5%", source: "Phorest", score: { kind: "std", std: "pph", unit: "$" } },
      { id: "rebooking",        label: "Rebooking Rate",                       desc: "0 = <80% · 1 = 80–84% · 2 = 85%+",                           source: "Phorest",  score: { kind: "std", std: "rebooking", unit: "%" } },
      { id: "retention",        label: "Retention Rate (90-day rolling)",      desc: "0 = <75% · 1 = 75–84% · 2 = 85%+ · Grace period: 90 days",   source: "Phorest",  grace: true, score: { kind: "std", std: "retention", unit: "%" } },
      { id: "active_guests",    label: "Active Guest Count",                   desc: "0 = <70 · 1 = 70–84 · 2 = 85+",                              source: "Phorest",  score: { kind: "std", std: "active_guests", unit: "#" } },
    ],
  },
  front_desk: {
    label: "Front Desk",
    metrics: [
      { id: "retail_attach",    label: "Retail Attachment %",                  desc: "0 = below last month · 1 = +0.5% vs last month · 2 = +1%+",  source: "Phorest"   },
      { id: "rebooking",        label: "Rebooking %",                          desc: "0 = <80% · 1 = 80–84% · 2 = 85%+",                           source: "Phorest"   },
      { id: "orientations",     label: "New Guest Orientations",               desc: "0 = <100% · 1 = 100% · 2 = 100% + follow-up note logged",     source: "Manual"    },
      { id: "surveys",          label: "Survey Returns",                       desc: "0 = <50% returned · 1 = 50–79% · 2 = 80%+",                  source: "Manual"    },
      { id: "noshow",           label: "No-Show Rate",                         desc: "0 = >5% · 1 = 3–5% · 2 = <3%",                              source: "Phorest"   },
      { id: "notes",            label: "Guest Notes Passed to Team Leader",    desc: "0 = <100% · 1 = 100% · 2 = 100% same day",                   source: "Manual"    },
    ],
  },
  team_leader: {
    label: "Team Leader",
    metrics: [
      { id: "quality_checks",   label: "Haircut Quality Checks",               desc: "0 = <5/wk · 1 = 5/wk · 2 = 7+/wk",                          source: "Manual"    },
      { id: "guest_checkins",   label: "Verbal Guest Check-In Rate",           desc: "0 = <100% · 1 = 100% · 2 = 100% + feedback logged",           source: "Manual"    },
      { id: "pink_coaching",    label: "Pink Team Coaching Completed",         desc: "0 = <100% coached · 1 = 100% · 2 = 100% + action plan",       source: "Manual"    },
      { id: "green_ack",        label: "Green Team Acknowledgement",           desc: "0 = <100% · 1 = 100% · 2 = 100% + specific note per member",  source: "Manual"    },
      { id: "numbers_tracked",  label: "Team Numbers Updated & Tracked",       desc: "0 = late/incomplete · 1 = on time · 2 = early + insights",    source: "Manual"    },
      { id: "floor_standard",   label: "Floor Standard Verification",          desc: "0 = <100% checks · 1 = 100% · 2 = 100% + issues resolved",    source: "Manual"    },
    ],
  },
  manager: {
    label: "Manager",
    metrics: [
      { id: "pink_green_ratio", label: "Pink to Green Ratio (week over week)", desc: "0 = more pink than last week · 1 = same or fewer · 2 = zero pink", source: "Scorecard" },
      { id: "utilization",      label: "Utilization Rate (shop average)",      desc: "0 = <75% · 1 = 75–84% · 2 = 85–89%",                         source: "Phorest"   },
      { id: "infractions",      label: "Infraction Rate",                      desc: "0 = any infractions · 1 = zero · 2 = zero + proactive reinforcement documented", source: "Manual" },
      { id: "retail_gap",       label: "Retail Gap to Target",                 desc: "0 = moving away from 10% goal · 1 = holding/improving · 2 = +0.5%+ vs last week", source: "Phorest" },
      { id: "stock",            label: "Stock Management",                     desc: "0 = missed or not placed · 1 = on time · 2 = early + variance flagged", source: "Manual" },
      { id: "team_checkins",    label: "Team Check-In Completion",             desc: "0 = <100% · 1 = 100% · 2 = 100% + dev note per member",       source: "Manual"    },
    ],
  },
  gm: {
    label: "Payton",
    metrics: [
      { id: "pink_trend",       label: "Pink Team Trend (month over month)",   desc: "0 = more pink than last month · 1 = same or fewer than last month · 2 = zero pink this month", source: "Scorecard", cadence: "monthly" },
      { id: "team_kpi_avg",     label: "Team KPI Average",                     desc: "0 = <50% · 1 = 50–74% · 2 = 75%+ · Auto-calculated from this week's scores", source: "Scorecard" },
      { id: "open_issues",      label: "Open Issues",                          desc: "0 = untouched/rolled over · 1 = resolved or in progress · 2 = resolved + system created to prevent recurrence", source: "Manual" },
      { id: "hiring",           label: "Hiring Pipeline",                      desc: "0 = 0 interviews/mo · 1 = 1/mo · 2 = 2+/mo",                 source: "Manual",    cadence: "monthly" },
      { id: "coaching_outcomes",label: "Coaching Outcomes (prior week)",       desc: "0 = coached but no change or got worse · 1 = measurable improvement but still pink · 2 = moved to green", source: "Scorecard" },
      { id: "leadership_align", label: "Leadership Team Alignment",            desc: "0 = TL or Mgr missing targets · 1 = both meeting · 2 = both exceeding", source: "Scorecard" },
    ],
  },
  owner: {
    label: "Vicki",
    metrics: [
      { id: "revenue",          label: "Revenue vs Monthly Target",            desc: "0 = <95% of $58,315 · 1 = 95–99% · 2 = 100%+",               source: "Phorest",   cadence: "monthly" },
      { id: "profit_margin",    label: "Operating Profit Margin",              desc: "0 = below target · 1 = at target · 2 = above target",         source: "Financial", cadence: "monthly", lag: true },
      { id: "payroll_pct",      label: "Payroll %",                            desc: "0 = above target % · 1 = at target % · 2 = below target %",   source: "Financial", cadence: "monthly", lag: true },
      { id: "engagement",       label: "Employee Engagement",                  desc: "0 = any involuntary turnover · 1 = zero turnover · 2 = zero + culture activity done", source: "Manual", cadence: "monthly" },
      { id: "culture_initiatives", label: "Culture Initiatives Completed",     desc: "0 = none this month · 1 = 1 completed · 2 = 2+ completed",   source: "Manual",    cadence: "monthly" },
      { id: "leadership_obj",   label: "Leadership Objective Attainment",      desc: "0 = behind · 1 = on track · 2 = ahead + next initiative identified", source: "Manual", cadence: "monthly" },
    ],
  },
  apprentice: {
    label: "Apprentice",
    metrics: [
      { id: "service_sales",    label: "Service Sales",                        desc: "Handicapped — auto 2 until personal goal is set",              source: "—",        handicap: true },
      { id: "product_sales",    label: "Product Sales",                        desc: "Handicapped — auto 2 until personal goal is set",              source: "—",        handicap: true },
      { id: "pph",              label: "PPH",                                  desc: "Handicapped — auto 2 until personal goal is set",              source: "—",        handicap: true },
      { id: "rebooking",        label: "Rebooking Rate",                       desc: "0 = <80% · 1 = 80–84% · 2 = 85%+",                           source: "Phorest"   },
      { id: "training",         label: "Training Modules On Pace",             desc: "0 = behind · 1 = on schedule · 2 = on schedule + outstanding performance", source: "Manual" },
      { id: "model_conversion", label: "Model-to-Guest Conversion",            desc: "0 = <70% · 1 = 70% · 2 = >70%",                              source: "Manual"    },
    ],
  },
  // Core Value Award — rotating monthly assignment (not a permanent role).
  // Scored Yes/No weekly and accumulates over the month.
  // Award only: does NOT feed cumulative / bonus pool or Green–Pink team status.
  core_value: {
    label: "Core Value Award",
    yesNo: true,
    award: true,
    metrics: [
      { id: "service_times",      label: "Service times monitored",                 desc: "Yes / No", source: "Manual" },
      { id: "guest_ready",        label: "Shop is guest ready at open",             desc: "Yes / No", source: "Manual" },
      { id: "cleanliness",        label: "Cleanliness standards upheld",            desc: "Yes / No", source: "Manual" },
      { id: "sanitation",         label: "Sanitation protocols upheld",             desc: "Yes / No", source: "Manual" },
      { id: "closing",            label: "Closing procedures followed",             desc: "Yes / No", source: "Manual" },
      { id: "brand_env",          label: "Shop environment reflects brand",         desc: "Yes / No", source: "Manual" },
      { id: "service_standards",  label: "Service standards upheld",                desc: "Yes / No", source: "Manual" },
      { id: "leadership_comm",    label: "Clear communication with leadership team", desc: "Yes / No", source: "Manual" },
      { id: "guest_satisfaction", label: "Guest satisfaction maintained",           desc: "Yes / No", source: "Manual" },
      { id: "huddle_meeting",     label: "Team huddle & meeting preparation",       desc: "Yes / No", source: "Manual" },
    ],
  },
};

const SCORE_COLOR = { 0: C.pink, 1: C.gold, 2: C.green };
const MAX_PTS = 12;
const GREEN_MIN = 6;
const START_DATE = "2026-06-23";
const SCORE_PIN = "2363";
const ADMIN_PIN = "2026";
const PIN_GROUP = { score: "score", coaching: "admin", roster: "admin", reports: "admin" };
const PIN_FOR = { score: SCORE_PIN, admin: ADMIN_PIN };
const PIN_LABEL = { score: "Required to score this week", admin: "Manager access — Coaching & Roster" };

function PinLock({ expectedPin, label, onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (input === expectedPin) {
      onUnlock();
    } else {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 1200);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.warm, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${C.border}`, padding: "32px 28px", maxWidth: 320, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: C.gold, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>The Refinery</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, marginBottom: 4 }}>Enter PIN to Continue</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>{label || "Required to score or manage the roster"}</div>
        <input
          type="password"
          inputMode="numeric"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="••••"
          style={{
            width: "100%", padding: "12px", borderRadius: 10, textAlign: "center", fontSize: 22, letterSpacing: 8,
            border: `2px solid ${error ? C.pink : C.border}`, marginBottom: 14, boxSizing: "border-box",
            animation: error ? "shake 0.3s" : "none",
          }}
          autoFocus
        />
        {error && <div style={{ fontSize: 12, color: C.pink, marginBottom: 12 }}>Incorrect PIN, try again</div>}
        <button onClick={submit} style={{ width: "100%", padding: "12px", borderRadius: 10, background: C.ink, color: C.white, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Unlock</button>
      </div>
    </div>
  );
}

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}
function currentWeekKey() { return getMondayOf(new Date()).toISOString().slice(0, 10); }
function weekLabelFromKey(key) {
  const s = new Date(key + "T00:00:00"), e = new Date(s);
  e.setDate(s.getDate() + 6);
  const f = d => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${f(s)} – ${f(e)}`;
}
// Explicit range including year — used wherever week ambiguity has caused errors.
function weekRangeLabel(key) {
  const e = new Date(key + "T00:00:00"); e.setDate(e.getDate() + 6);
  return `${weekLabelFromKey(key)}, ${e.getFullYear()}`;
}
function prevWeekKey(key) { const d = new Date(key + "T00:00:00"); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); }
function nextWeekKey(key) { const d = new Date(key + "T00:00:00"); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); }
// Default the scoring week to the most recent week that already has scores (if it's
// within ~9 days), otherwise the current week. This keeps late/Monday scorers on the
// same week the rest of the team already scored, instead of drifting into a new week.
function defaultReviewWeek(allScores) {
  const cur = currentWeekKey();
  const todayMon = getMondayOf(new Date());
  const keys = Object.keys(allScores || {}).filter(k => k <= cur).sort().reverse();
  for (const k of keys) {
    const diffDays = (todayMon - new Date(k + "T00:00:00")) / 86400000;
    if (diffDays <= 9) return k;
  }
  return cur;
}
function getQuarter(k) { return Math.ceil(parseInt(k.slice(5, 7)) / 3); }
function getYear(k) { return k.slice(0, 4); }
function allWeeksSince(startKey) {
  const weeks = [], today = getMondayOf(new Date());
  let cursor = getMondayOf(new Date(startKey + "T00:00:00"));
  while (cursor <= today) {
    weeks.push(cursor.toISOString().slice(0, 10));
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks.reverse();
}
function groupByQuarter(keys) {
  return keys.reduce((g, k) => {
    const label = `${getYear(k)} Q${getQuarter(k)}`;
    (g[label] = g[label] || []).push(k);
    return g;
  }, {});
}
function uid() { return Math.random().toString(36).slice(2, 10); }

// ── month helpers (Core Value Award) ─────────────────────────────
function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthKeyOfWeek(weekKey) { return weekKey.slice(0, 7); } // month of that week's Monday
function prevMonthKey(mk) {
  const [y, m] = mk.split("-").map(Number);
  const d = new Date(y, m - 2, 1); // m-1 = this month index, minus 1 more = previous
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(mk) {
  const [y, m] = mk.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function monthsFromWeeks(weekKeys) {
  const seen = [];
  weekKeys.forEach(wk => { const mk = monthKeyOfWeek(wk); if (!seen.includes(mk)) seen.push(mk); });
  return seen; // newest-first (allWeeksSince is reversed)
}

function getMemberCards(member) {
  return LEADERSHIP_ROLES.includes(member.role) ? ["stylist", member.role] : [member.role];
}
// The single card that counts toward cumulative / bonus pool:
// Stylist for stylists + all leaders; own card for Front Desk / Apprentice.
// Leadership overlay and Core Value are excluded by construction.
function getBonusCard(member) { return getMemberCards(member)[0]; }

function cardMax(cardType) {
  const c = SCORECARDS[cardType];
  return c.metrics.length * (c.yesNo ? 1 : 2);
}
function calcCardPts(cardType, scores) {
  const card = SCORECARDS[cardType];
  const s = scores || {};
  const filled = card.metrics.filter(m => m.handicap || s[m.id] !== undefined).length;
  if (filled < card.metrics.length) return null;
  return card.metrics.reduce((acc, m) => m.handicap ? acc + 2 : acc + (s[m.id] || 0), 0);
}
function getMemberWeekPts(member, weekScores) {
  return getMemberCards(member).map(r => calcCardPts(r, weekScores?.[member.id]?.[r]));
}
// Monthly-aware status for a role card in a given week. Weekly metrics come from
// that week; monthly metrics come from the week's month. Pending monthly metrics
// don't count; the green line scales to what's knowable (green = at least a 1 on
// every counted metric). Card is "incomplete" (null) only if a WEEKLY metric is
// still unscored — a pending monthly metric alone doesn't block a provisional status.
function getCardStatus(cardType, memberId, week, allScores, monthlyScores) {
  const card = SCORECARDS[cardType];
  const weekS = allScores?.[week]?.[memberId]?.[cardType] || {};
  const monthS = monthlyScores?.[monthKeyOfWeek(week)]?.[memberId]?.[cardType] || {};
  const per = card.yesNo ? 1 : 2;
  let pts = 0, counted = 0, pending = 0, incomplete = false;
  for (const mt of card.metrics) {
    if (mt.handicap) { pts += per; counted++; continue; }
    const monthly = mt.cadence === "monthly";
    const v = monthly ? monthS[mt.id] : weekS[mt.id];
    if (v === undefined) { if (monthly) pending++; else incomplete = true; }
    else { pts += v; counted++; }
  }
  if (incomplete || counted === 0) return { pts: null, max: counted * per, counted, pending, incomplete };
  return { pts, max: counted * per, counted, pending, incomplete: false, green: pts >= counted };
}
function getMemberWeekStatuses(member, week, allScores, monthlyScores) {
  return getMemberCards(member).map(c => getCardStatus(c, member.id, week, allScores, monthlyScores));
}
// Bonus-pool math: base card only.
function getMemberBonusWeekPts(member, weekScores) {
  const card = getBonusCard(member);
  return calcCardPts(card, weekScores?.[member.id]?.[card]);
}
function getMemberCumulativePts(member, allScores) {
  return Object.values(allScores).reduce((t, ws) => t + (getMemberBonusWeekPts(member, ws) ?? 0), 0);
}
function isStylist(member) { return getMemberCards(member).includes("stylist"); }
// In the stylist bonus pool: cuts hair, but NOT the owner or GM (Vicki & Payton).
function inBonusPool(member) { return isStylist(member) && member.role !== "owner" && member.role !== "gm"; }
// ── Quarter-aware targets & standards (single source of truth, editable in Roster) ──
function quarterKeyOf(weekKey) { return `${getYear(weekKey)}-Q${getQuarter(weekKey)}`; }
function currentQuarterKey() {
  const d = new Date();
  return `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`;
}
function shiftQuarter(qKey, delta) {
  const [y, q] = qKey.split("-Q").map(Number);
  const idx = y * 4 + (q - 1) + delta;
  return `${Math.floor(idx / 4)}-Q${(idx % 4) + 1}`;
}
function quarterLabel(qKey) {
  const [y, q] = qKey.split("-Q");
  return `Q${q} ${y}`;
}
// Fixed shop standards [t1, t2]: score 0 if < t1, 1 if >= t1 and < t2, 2 if >= t2.
const DEFAULT_STANDARDS = {
  pph:           [68.44, 71.862],
  rebooking:     [80, 85],
  retention:     [75, 85],
  active_guests: [70, 85],
};
// Personal Service/Product targets: quarter-specific Roster value, else legacy code default.
function getStylistTarget(memberId, qKey, stylistTargets) {
  const row = (stylistTargets && stylistTargets[qKey] && stylistTargets[qKey][memberId]) || {};
  const legacy = STYLIST_TARGETS[memberId] || {};
  return {
    service: row.service != null ? row.service : (legacy.serviceWeekly != null ? legacy.serviceWeekly : null),
    product: row.product != null ? row.product : (legacy.productWeekly != null ? legacy.productWeekly : null),
  };
}
function getStandards(qKey, settings) {
  const raw = settings && settings[`standards:${qKey}`];
  if (raw) { try { return { ...DEFAULT_STANDARDS, ...JSON.parse(raw) }; } catch (e) { /* fall through */ } }
  return DEFAULT_STANDARDS;
}
// Convert an entered number to 0/1/2 using the metric's scoring spec.
function autoScoreMetric(value, spec, targets, standards) {
  if (value == null || value === "" || Number.isNaN(Number(value))) return null;
  const v = Number(value);
  if (spec.kind === "pct") {
    const t = targets ? targets[spec.tgt] : null;
    if (t == null || t === 0) return null;
    const pct = (v / t) * 100;
    return pct >= 100 ? 2 : pct >= 90 ? 1 : 0;
  }
  if (spec.kind === "std") {
    const band = (standards && standards[spec.std]) || DEFAULT_STANDARDS[spec.std];
    return v >= band[1] ? 2 : v >= band[0] ? 1 : 0;
  }
  return null;
}
function memberYearPts(member, allScores, year) {
  return Object.keys(allScores || {}).filter(wk => getYear(wk) === year)
    .reduce((t, wk) => t + (getMemberBonusWeekPts(member, allScores[wk]) ?? 0), 0);
}
function memberQuarterPts(member, allScores, year, q) {
  return Object.keys(allScores || {}).filter(wk => getYear(wk) === year && getQuarter(wk) === q)
    .reduce((t, wk) => t + (getMemberBonusWeekPts(member, allScores[wk]) ?? 0), 0);
}
function memberYearGreen(member, allScores, year) {
  let green = 0, scored = 0;
  Object.keys(allScores || {}).filter(wk => getYear(wk) === year).forEach(wk => {
    const p = getMemberBonusWeekPts(member, allScores[wk]);
    if (p !== null) { scored++; if (p >= GREEN_MIN) green++; }
  });
  return { green, scored };
}
// Core Value running total for a holder across a calendar month (null weeks count as 0).
function monthCoreValueTotal(memberId, monthKey, allScores) {
  return Object.keys(allScores)
    .filter(wk => monthKeyOfWeek(wk) === monthKey)
    .reduce((t, wk) => t + (calcCardPts("core_value", allScores[wk]?.[memberId]?.core_value) ?? 0), 0);
}
function monthCoreValueWeeks(memberId, monthKey, allScores) {
  return Object.keys(allScores)
    .filter(wk => monthKeyOfWeek(wk) === monthKey)
    .filter(wk => calcCardPts("core_value", allScores[wk]?.[memberId]?.core_value) !== null).length;
}
// Auto-calculate team KPI average % for a given week (GM card metric)
function calcTeamKpiAvgPct(activeTeam, weekScores) {
  const totals = activeTeam.map(m => {
    const pts = getMemberWeekPts(m, weekScores);
    const validPts = pts.filter(p => p !== null);
    if (validPts.length === 0) return null;
    return validPts.reduce((a, p) => a + p, 0) / validPts.length;
  }).filter(v => v !== null);
  if (totals.length === 0) return null;
  const avgPts = totals.reduce((a, v) => a + v, 0) / totals.length;
  return Math.round((avgPts / MAX_PTS) * 100);
}

// ── Recognition / shout-out detection ────────────────────────────
// Evaluate achievements against the most recent week that actually has scores.
function latestScoredWeek(allScores) {
  const cur = currentWeekKey();
  const keys = Object.keys(allScores || {}).filter(k => k <= cur).sort().reverse();
  return keys[0] || cur;
}
// Most recent week that has any company numbers entered (fallback: current week).
function latestCompanyWeek(companyScores) {
  const keys = Object.keys(companyScores || {}).filter(w => Object.keys(companyScores[w] || {}).length).sort().reverse();
  return keys[0] || currentWeekKey();
}
// Consecutive green weeks on the base card, ending at endWeek.
function greenStreak(member, allScores, endWeek) {
  let streak = 0, k = endWeek;
  for (let guard = 0; guard < 260; guard++) {
    const pts = getMemberBonusWeekPts(member, allScores?.[k] || {});
    if (pts !== null && pts >= GREEN_MIN) { streak++; k = prevWeekKey(k); }
    else break;
  }
  return streak;
}
// Did they max a sales metric on their base card this week?
function salesWin(member, weekScores) {
  const card = getBonusCard(member);
  const s = weekScores?.[member.id]?.[card];
  if (!s) return null;
  const svc = s.service_sales === 2, prod = s.product_sales === 2;
  if (svc && prod) return "Hit both sales goals";
  if (svc) return "Hit service sales goal";
  if (prod) return "Hit product sales goal";
  return null;
}
// True comeback: pink on the base card last week, green this week.
function pinkToGreen(member, allScores, endWeek) {
  const now = getMemberBonusWeekPts(member, allScores?.[endWeek] || {});
  const then = getMemberBonusWeekPts(member, allScores?.[prevWeekKey(endWeek)] || {});
  return then !== null && then < GREEN_MIN && now !== null && now >= GREEN_MIN;
}
function detectAchievements(activeTeam, allScores, week) {
  const out = [];
  activeTeam.forEach(m => {
    const streak = greenStreak(m, allScores, week);
    if (streak >= 3) out.push({ memberId: m.id, name: m.name, kind: "streak", reason: `On a roll — ${streak} weeks green` });
    const sw = salesWin(m, allScores?.[week] || {});
    if (sw) out.push({ memberId: m.id, name: m.name, kind: "sales", reason: sw });
    if (pinkToGreen(m, allScores, week)) out.push({ memberId: m.id, name: m.name, kind: "comeback", reason: "Bounced back — pink → green" });
  });
  return out;
}
function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const SATISFACTION_TARGET = 8;
// Average of submitted 1–10 ratings for a week (null if none submitted).
function teamSatisfactionAvg(notes, week, activeTeam) {
  const vals = activeTeam.map(m => notes?.[week]?.[m.id]?.satisfaction).filter(v => typeof v === "number");
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}
function satisfactionCount(notes, week, activeTeam) {
  return activeTeam.filter(m => typeof notes?.[week]?.[m.id]?.satisfaction === "number").length;
}

// Zero-history for one metric. Weekly metrics look back over weeks; monthly
// metrics look back over months (so a fresh month's blank isn't counted as a miss).
function metricZeroHistory(memberId, cardType, mt, week, allScores, monthlyScores) {
  const monthly = mt.cadence === "monthly";
  let scored = 0, z = 0;
  if (monthly) {
    let mk = monthKeyOfWeek(week);
    for (let g = 0; g < 60 && scored < 13; g++) {
      const v = monthlyScores?.[mk]?.[memberId]?.[cardType]?.[mt.id];
      if (v !== undefined) { scored++; if (v === 0) z++; }
      mk = prevMonthKey(mk);
    }
  } else {
    let k = week;
    for (let g = 0; g < 400 && scored < 13; g++) {
      const v = allScores?.[k]?.[memberId]?.[cardType]?.[mt.id];
      if (v !== undefined) { scored++; if (v === 0) z++; }
      k = prevWeekKey(k);
    }
  }
  const chronic = scored >= 3 && z * 2 >= scored;
  return { z, scored, chronic, monthly };
}

// Zeros for one specific card this week, with 13-period history + chronic flag.
function cardZeros(memberId, cardType, allScores, week, monthlyScores) {
  const cardScores = allScores?.[week]?.[memberId]?.[cardType];
  const monthCard = monthlyScores?.[monthKeyOfWeek(week)]?.[memberId]?.[cardType];
  const zeros = [];
  SCORECARDS[cardType].metrics.forEach(mt => {
    if (mt.handicap) return;
    const monthly = mt.cadence === "monthly";
    const cur = monthly ? monthCard?.[mt.id] : cardScores?.[mt.id];
    if (cur === 0) {
      const h = metricZeroHistory(memberId, cardType, mt, week, allScores, monthlyScores);
      zeros.push({ label: mt.label, z: h.z, scored: h.scored, chronic: h.chronic, monthly });
    }
  });
  zeros.sort((a, b) => (b.chronic - a.chronic) || (b.z / b.scored - a.z / a.scored));
  return zeros;
}

// For a pink member: their pink card(s) with points, and the categories they
// scored 0 in (monthly metrics judged on the month). Monthly-aware so leadership
// cards with pending months aren't wrongly flagged pink.
function pinkDetail(member, allScores, week, monthlyScores) {
  const multiCard = getMemberCards(member).length > 1;
  const cards = [], zeros = [];
  getMemberCards(member).forEach(cardType => {
    const st = getCardStatus(cardType, member.id, week, allScores, monthlyScores);
    if (st.pts === null || st.green) return; // only the pink card(s)
    cards.push({ label: SCORECARDS[cardType].label, pts: st.pts, pending: st.pending });
    const cardScores = allScores?.[week]?.[member.id]?.[cardType];
    const monthCard = monthlyScores?.[monthKeyOfWeek(week)]?.[member.id]?.[cardType];
    SCORECARDS[cardType].metrics.forEach(mt => {
      if (mt.handicap) return;
      const monthly = mt.cadence === "monthly";
      const cur = monthly ? monthCard?.[mt.id] : cardScores?.[mt.id];
      if (cur === 0) {
        const h = metricZeroHistory(member.id, cardType, mt, week, allScores, monthlyScores);
        zeros.push({ label: (multiCard ? SCORECARDS[cardType].label + ": " : "") + mt.label, z: h.z, scored: h.scored, chronic: h.chronic, monthly });
      }
    });
  });
  zeros.sort((a, b) => (b.chronic - a.chronic) || (b.z / b.scored - a.z / a.scored));
  return { cards, zeros };
}

function Avatar({ name, size = 38 }) {
  const initials = (name || "").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: "50%", background: C.goldLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.34, color: C.gold, flexShrink: 0 }}>{initials}</div>;
}

// Tiny inline trend line for a metric's recent actuals. up: true=green, false=red, null=flat.
function Sparkline({ values, up }) {
  if (!values || values.length < 2) return null;
  const w = 84, h = 22, pad = 3;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const color = up == null ? C.muted : up ? C.green : C.pink;
  const lastX = pad + (w - pad * 2), lastY = h - pad - ((values[values.length - 1] - min) / range) * (h - pad * 2);
  return (
    <svg width={w} height={h} style={{ display: "block", flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={(pad + (w - pad * 2)).toFixed(1)} cy={lastY.toFixed(1)} r="2.5" fill={color} />
    </svg>
  );
}
// A metric's entered values across weeks up to a point, oldest→newest, last n.
function metricHistory(allActuals, memberId, cardType, metricId, uptoWeek, n) {
  const out = [];
  Object.keys(allActuals || {}).filter(wk => wk <= uptoWeek).sort().forEach(wk => {
    const v = allActuals[wk] && allActuals[wk][memberId] && allActuals[wk][memberId][cardType] && allActuals[wk][memberId][cardType][metricId];
    if (typeof v === "number") out.push(v);
  });
  return out.slice(-n);
}
// Count how many of the last n weeks (with data) this stylist metric was below its
// bar — quarter-aware, so each week uses its own target/standards. Chronic = recurring.
function metricMissCount(allActuals, member, metric, uptoWeek, stylistTargets, settings, n) {
  const weeks = Object.keys(allActuals || {}).filter(wk => wk <= uptoWeek).sort().slice(-n);
  let sample = 0, misses = 0;
  weeks.forEach(wk => {
    const v = allActuals[wk] && allActuals[wk][member.id] && allActuals[wk][member.id].stylist && allActuals[wk][member.id].stylist[metric.id];
    if (typeof v !== "number") return;
    const q = quarterKeyOf(wk);
    const stdz = getStandards(q, settings);
    let ref;
    if (metric.score.kind === "pct") { const t = getStylistTarget(member.id, q, stylistTargets); ref = t && t[metric.score.tgt] != null ? t[metric.score.tgt] * 0.9 : null; }
    else ref = stdz[metric.score.std][0];
    if (ref == null) return;
    sample++;
    if (v < ref) misses++;
  });
  return { sample, misses };
}

// Input/textarea that types locally and only saves (commits) on blur, so
// per-keystroke DB writes + realtime echoes can't clobber what you're typing.
function LazyInput({ value, onCommit, as, style, ...rest }) {
  const [local, setLocal] = useState(value == null ? "" : value);
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setLocal(value == null ? "" : value); }, [value]);
  const common = {
    value: local,
    onChange: e => setLocal(e.target.value),
    onFocus: () => { focused.current = true; },
    onBlur: () => { focused.current = false; if (String(local) !== String(value == null ? "" : value)) onCommit(local); },
    style,
    ...rest,
  };
  return as === "textarea" ? <textarea {...common} /> : <input {...common} />;
}

function StatusPill({ pts, green, pending }) {
  if (pts === null || pts === undefined) {
    if (pending) return <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, padding: "2px 8px", borderRadius: 20, background: C.goldLight }}>pending</span>;
    return <span style={{ fontSize: 11, color: C.muted, padding: "2px 8px", borderRadius: 20, border: `1px solid ${C.border}` }}>—</span>;
  }
  const g = green !== undefined ? green : pts >= GREEN_MIN;
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: g ? C.greenLight : C.pinkLight, color: g ? C.green : C.pink }}>{g ? "🟢" : "🔴"} {pts}pts{pending ? ` +${pending}?` : ""}</span>;
}
// Pill from a getCardStatus() result.
function StatusPillS({ status }) {
  return <StatusPill pts={status.pts} green={status.green} pending={status.pending} />;
}

function ScoreBtn({ val, label, current, onChange, color }) {
  const active = current === val;
  const c = color || SCORE_COLOR[val];
  return <button onClick={() => onChange(val)} style={{ minWidth: 34, height: 34, padding: label ? "0 12px" : 0, borderRadius: 8, border: `2px solid ${active ? c : C.border}`, background: active ? c : C.white, color: active ? C.white : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.12s", flexShrink: 0 }}>{label ?? val}</button>;
}

function ScorecardPanel({ member, cardType, scores, onScore, week, monthlyScores, onSetMonthly, targets, standards, actuals, onEnterActual, allActuals }) {
  const card = SCORECARDS[cardType];
  const yesNo = !!card.yesNo;
  const per = yesNo ? 1 : 2;
  const monthKey = week ? monthKeyOfWeek(week) : null;
  const monthCard = (monthKey && monthlyScores?.[monthKey]?.[member.id]?.[cardType]) || {};
  const hasMonthly = card.metrics.some(m => m.cadence === "monthly");

  // Local monthly-aware status (weekly from this week, monthly from this month).
  let sumPts = 0, counted = 0, pending = 0, incompleteWeekly = false, filled = 0;
  card.metrics.forEach(m => {
    if (m.handicap) { sumPts += per; counted++; filled++; return; }
    const monthly = m.cadence === "monthly";
    const v = monthly ? monthCard[m.id] : scores?.[m.id];
    if (v === undefined) { if (monthly) pending++; else incompleteWeekly = true; }
    else { sumPts += v; counted++; filled++; }
  });
  const pts = (incompleteWeekly || counted === 0) ? null : sumPts;
  const maxAvail = counted * per;
  const isGreen = pts !== null && pts >= counted; // a 1 on every counted metric
  const stdz = standards || DEFAULT_STANDARDS;
  const options = yesNo
    ? [{ v: 0, l: "No", c: C.pink }, { v: 1, l: "Yes", c: C.green }]
    : [{ v: 0, l: null, c: SCORE_COLOR[0] }, { v: 1, l: null, c: SCORE_COLOR[1] }, { v: 2, l: null, c: SCORE_COLOR[2] }];

  return (
    <div style={{ background: C.white, borderRadius: 12, border: `1.5px solid ${C.border}`, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", background: C.warm, borderBottom: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>The Refinery · {card.label}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>{member.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          {card.award
            ? <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: C.goldLight, color: C.gold }}>{pts ?? "—"}/{cardMax(cardType)} this week</span>
            : <StatusPill pts={pts} green={isGreen} pending={pending} />}
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{filled}/{card.metrics.length} scored{pending ? ` · ${pending} monthly pending` : ""} · {pts ?? "—"}/{maxAvail} pts</div>
        </div>
      </div>

      {cardType === "stylist" && (
        <div style={{ padding: "10px 20px", background: C.steelLight, borderBottom: `1.5px solid ${C.border}`, fontSize: 11, color: C.steel, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span><strong>Service Target:</strong> {targets && targets.service != null ? "$" + targets.service.toLocaleString() : "— set in Roster"}</span>
          <span><strong>Product Target:</strong> {targets && targets.product != null ? "$" + targets.product : "— set in Roster"}</span>
          <span><strong>PPH Floor:</strong> ${stdz.pph[0]}</span>
          <span><strong>Rebook/Retention:</strong> {stdz.rebooking[1]}% / {stdz.retention[1]}%</span>
        </div>
      )}

      <div style={{ padding: "0 20px" }}>
        {card.metrics.map((m, i) => {
          const monthly = m.cadence === "monthly";
          const numeric = !!m.score && cardType === "stylist";
          const curVal = monthly ? monthCard[m.id] : scores?.[m.id];
          const monthlyPending = monthly && curVal === undefined;
          const actualVal = actuals ? actuals[m.id] : undefined;
          const derived = numeric ? autoScoreMetric(actualVal, m.score, targets, stdz) : null;
          const tgtForMetric = numeric && m.score.kind === "pct" ? (targets ? targets[m.score.tgt] : null) : null;
          const band = numeric && m.score.kind === "std" ? (stdz[m.score.std] || DEFAULT_STANDARDS[m.score.std]) : null;
          const hint = numeric
            ? (m.score.kind === "pct"
                ? (tgtForMetric != null ? `Target $${Number(tgtForMetric).toLocaleString()}${actualVal != null && tgtForMetric ? ` · you're at ${Math.round(actualVal / tgtForMetric * 100)}%` : ""}` : "No target set — add it in Roster")
                : `1 at ${band[0]}${m.score.unit === "%" ? "%" : ""} · 2 at ${band[1]}${m.score.unit === "%" ? "%" : ""}`)
            : null;
          const hist = numeric ? metricHistory(allActuals, member.id, cardType, m.id, week, 8) : [];
          let trendUp = null, trendText = null;
          if (numeric && hist.length >= 2) {
            const d = hist[hist.length - 1] - hist[hist.length - 2];
            trendUp = d > 0 ? true : d < 0 ? false : null;
            const abs = Math.abs(d);
            const amt = m.score.unit === "$" ? `$${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : m.score.unit === "%" ? `${abs.toFixed(1)}%` : `${abs}`;
            trendText = `${trendUp === true ? "▲" : trendUp === false ? "▼" : "▬"} ${amt} vs last week`;
          }
          return (
          <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: i < card.metrics.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: m.handicap ? C.muted : C.ink, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {m.label}
                {m.handicap && <span style={{ fontSize: 10, background: C.goldLight, color: C.gold, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>HANDICAP</span>}
                {monthly && <span style={{ fontSize: 10, background: C.steelLight, color: C.steel, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>MONTHLY</span>}
                {monthlyPending && <span style={{ fontSize: 10, background: C.goldLight, color: C.gold, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>PENDING</span>}
                {m.grace && <span style={{ fontSize: 10, background: C.steelLight, color: C.steel, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>90-DAY GRACE</span>}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{m.desc}</div>
              {hint && <div style={{ fontSize: 10, color: C.steel, marginTop: 1, fontWeight: 600 }}>{hint}</div>}
              {m.lag && <div style={{ fontSize: 10, color: C.gold, marginTop: 1, fontWeight: 700 }}>⏳ Available ~2 weeks after month-end — pending is expected, not counted against you</div>}
              {numeric && hist.length >= 2 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <Sparkline values={hist} up={trendUp} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: trendUp == null ? C.muted : trendUp ? C.green : C.pink }}>{trendText}</span>
                </div>
              )}
              {numeric && hist.length === 1 && <div style={{ fontSize: 10, color: C.muted, marginTop: 5, fontStyle: "italic" }}>First entry — your trend line starts next week 📈</div>}
              <div style={{ fontSize: 10, color: C.border, marginTop: 1 }}>Source: {m.source}{monthly && monthKey ? ` · applies to all of ${monthLabel(monthKey)}` : ""}</div>
            </div>
            {m.handicap
              ? <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, padding: "6px 10px", background: C.goldLight, borderRadius: 8, flexShrink: 0 }}>Auto 2</div>
              : numeric
                ? <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {m.score.unit === "$" && <span style={{ fontSize: 13, color: C.muted }}>$</span>}
                      <LazyInput type="number" inputMode="decimal" value={actualVal != null ? actualVal : ""} placeholder="enter"
                        onCommit={raw => onEnterActual(m.id, raw, autoScoreMetric(raw, m.score, targets, stdz))}
                        style={{ width: 84, padding: "7px 9px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, fontWeight: 700, textAlign: "right" }} />
                      {m.score.unit === "%" && <span style={{ fontSize: 13, color: C.muted }}>%</span>}
                    </div>
                    <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, background: derived == null ? C.warm : SCORE_COLOR[derived], color: derived == null ? C.muted : C.white }} title="auto score">{derived == null ? "—" : derived}</div>
                  </div>
                : <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>{options.map(o => <ScoreBtn key={o.v} val={o.v} label={o.l} color={o.c} current={curVal} onChange={v => monthly ? onSetMonthly(monthKey, member.id, cardType, m.id, v) : onScore(m.id, v)} />)}</div>
            }
          </div>
          );
        })}
      </div>
      <div style={{ padding: "12px 20px", background: C.warm, borderTop: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        {card.award
          ? <div style={{ fontSize: 11, color: C.muted }}>Yes = 1 · No = 0 · Max {cardMax(cardType)} · Award only — excluded from bonus pool & Green/Pink status</div>
          : <>
              <div style={{ fontSize: 11, color: C.muted }}>{hasMonthly ? "Green = a 1 on every category that's in · monthly metrics count once entered · scales while pending" : "Green = 6+ pts · Pink = under 6 pts · Max 12 pts"}</div>
              {pts !== null && <div style={{ fontSize: 12, fontWeight: 700, color: isGreen ? C.green : C.pink }}>{isGreen ? "✓ Green Team" : "⚠ Pink Team — review next week"}{pending ? ` (${pending} pending)` : ""}</div>}
            </>}
      </div>
    </div>
  );
}

// ── COMPANY SCORECARD ─────────────────────────────────────────────────────────
const ROCK_STATUS = {
  not_started: { label: "Not started", color: C.muted, bg: C.warm },
  on_track:    { label: "On track", color: C.green, bg: C.greenLight },
  behind:      { label: "Behind", color: C.pink, bg: C.pinkLight },
  complete:    { label: "✓ Complete", color: C.gold, bg: C.goldLight },
};
const ROCK_ORDER = ["not_started", "on_track", "behind", "complete"];

function RockReview({ quarterKey, roster, rocks, readOnly, onAddRock, onUpdateRock, onDeleteRock }) {
  const leaders = roster.filter(m => m.active && isLeader(m));
  const rocksFor = mid => Object.values(rocks || {}).filter(r => r.quarter_key === quarterKey && r.member_id === mid);
  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", background: C.ink, borderBottom: `1.5px solid ${C.border}` }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>The Refinery · EOS</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.white }}>Rock Review — {quarterLabel(quarterKey)}</div>
        <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>Quarterly leadership priorities</div>
      </div>
      {leaders.length === 0 && <div style={{ padding: "14px 20px", fontSize: 12, color: C.muted, fontStyle: "italic" }}>No leaders on the roster.</div>}
      {leaders.map((leader, i) => {
        const rks = rocksFor(leader.id);
        return (
          <div key={leader.id} style={{ padding: "12px 20px", borderBottom: i < leaders.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: rks.length || !readOnly ? 8 : 0 }}>{leader.name}</div>
            {rks.length === 0 && readOnly && <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>No rocks set this quarter.</div>}
            {rks.map(rock => {
              const st = ROCK_STATUS[rock.status] || ROCK_STATUS.not_started;
              if (readOnly) {
                return (
                  <div key={rock.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 5, background: st.color, flexShrink: 0, marginTop: 4 }} />
                    <div style={{ flex: 1, fontSize: 13, color: C.ink }}>{rock.title || <span style={{ color: C.muted, fontStyle: "italic" }}>(untitled rock)</span>}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: st.bg, color: st.color, flexShrink: 0 }}>{st.label}</span>
                  </div>
                );
              }
              return (
                <div key={rock.id} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <LazyInput value={rock.title} onCommit={t => onUpdateRock(rock.id, { title: t })} placeholder="Rock (quarterly priority)…" style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: `1.5px solid ${C.border}`, fontSize: 13 }} />
                    <button onClick={() => onDeleteRock(rock.id)} style={{ background: "none", border: "none", color: C.muted, fontSize: 16, cursor: "pointer", lineHeight: 1, padding: "4px 2px" }} aria-label="Delete rock">×</button>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                    {ROCK_ORDER.map(s => {
                      const cfg = ROCK_STATUS[s];
                      const on = rock.status === s;
                      return <button key={s} onClick={() => onUpdateRock(rock.id, { status: s })} style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, cursor: "pointer", border: `1.5px solid ${on ? cfg.color : C.border}`, background: on ? cfg.bg : C.white, color: on ? cfg.color : C.muted }}>{cfg.label}</button>;
                    })}
                  </div>
                </div>
              );
            })}
            {!readOnly && <button onClick={() => onAddRock(quarterKey, leader.id)} style={{ fontSize: 11, fontWeight: 700, color: C.steel, background: "none", border: `1.5px dashed ${C.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>+ Add rock</button>}
          </div>
        );
      })}
    </div>
  );
}

function CompanyNumRow({ label, sub, value, target, green, kind, editable, onChange }) {
  const dot = green === null ? C.border : green ? C.green : C.pink;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 8, height: 8, borderRadius: 4, background: dot, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{label}</div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{sub}</div>
      </div>
      {editable ? (
        <LazyInput type="number" inputMode="decimal" value={value ?? ""} onCommit={val => onChange(val)}
          placeholder="—"
          style={{ width: 96, padding: "7px 9px", borderRadius: 8, border: `1.5px solid ${green === null ? C.border : green ? C.green : C.pink}`, fontSize: 14, fontWeight: 700, textAlign: "right", color: C.ink }} />
      ) : (
        <div style={{ fontSize: 15, fontWeight: 800, color: green === null ? C.muted : green ? C.green : C.pink, minWidth: 70, textAlign: "right" }}>{fmtCompany(kind, value)}</div>
      )}
    </div>
  );
}

function CompanyScorecardSection({ roster, notes, companyScores, week, onSetCompany, readOnly }) {
  const activeTeam = roster.filter(m => m.active);
  const stylistCount = activeTeam.filter(m => getMemberCards(m).includes("stylist")).length;
  const mk = monthKeyOfWeek(week);
  const autoRating = teamSatisfactionAvg(notes, week, activeTeam);
  const wk = companyScores?.[week] || {};

  // Weekly rows
  const rows = COMPANY_METRICS.map(m => {
    const value = m.auto ? autoRating : (typeof wk[m.id] === "number" ? wk[m.id] : null);
    const target = companyTargetWeekly(m.id, mk, stylistCount);
    return { m, value, target, green: companyGreen(m.dir, value, target) };
  });
  const greenCount = rows.filter(r => r.green === true).length;
  const scoredCount = rows.filter(r => r.value != null).length;

  // Monthly rollup (sales summed, rates averaged; each week judged against its weekly bar)
  const rollup = COMPANY_METRICS.map(m => {
    let vals;
    if (m.auto) {
      vals = Object.keys(notes || {}).filter(w => monthKeyOfWeek(w) === mk)
        .map(w => teamSatisfactionAvg(notes, w, activeTeam)).filter(v => v != null);
    } else {
      vals = Object.keys(companyScores || {}).filter(w => monthKeyOfWeek(w) === mk)
        .map(w => companyScores[w]?.[m.id]).filter(v => typeof v === "number");
    }
    if (!vals.length) return { m, value: null, target: null, green: null, n: 0 };
    const perWeek = companyTargetWeekly(m.id, mk, stylistCount);
    let value, target;
    if (m.agg === "sum") { value = Math.round(vals.reduce((a, b) => a + b, 0) * 100) / 100; target = perWeek != null ? Math.round(perWeek * vals.length * 100) / 100 : null; }
    else { value = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100; target = perWeek; }
    return { m, value, target, green: companyGreen(m.dir, value, target), n: vals.length };
  });
  const monthTotal = SERVICE_TARGETS[mk]?.monthly ?? null;

  const setVal = (id, raw) => {
    if (raw === "" || raw == null) { onSetCompany(week, id, null); return; }
    const num = parseFloat(raw);
    if (!Number.isNaN(num)) onSetCompany(week, id, num);
  };

  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", background: C.ink, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>The Refinery · Company</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.white }}>Company Scorecard</div>
        </div>
        <div style={{ fontSize: 11, color: C.white, fontWeight: 600 }}>Week of {weekLabelFromKey(week)}</div>
      </div>

      <div style={{ padding: "8px 20px", background: C.warm, borderBottom: `1.5px solid ${C.border}`, fontSize: 11, color: C.muted, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
        <span>{scoredCount}/{COMPANY_METRICS.length} entered · {greenCount} on target · {stylistCount} active stylists</span>
        {readOnly && <span style={{ color: C.gold, fontWeight: 700 }}>🔒 Edit under Score This Week</span>}
      </div>

      {rows.map(r => (
        <CompanyNumRow key={r.m.id}
          label={r.m.label}
          sub={r.m.auto
            ? `Auto from team satisfaction · target ${STYLIST_RATING_TARGET}+/10`
            : `Target ${r.target == null ? "—" : fmtCompany(r.m.kind, r.target)}${r.m.dir === "lower" ? " or below" : "+"}`}
          value={r.value}
          target={r.target}
          green={r.green}
          kind={r.m.kind}
          editable={!readOnly && !r.m.auto}
          onChange={raw => setVal(r.m.id, raw)}
        />
      ))}

      <div style={{ padding: "12px 20px", background: C.warm }}>
        <div style={{ fontSize: 10, letterSpacing: 1, color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
          {monthLabel(mk)} so far{monthTotal ? ` · service target $${monthTotal.toLocaleString()}/mo` : ""}
        </div>
        {rollup.every(r => r.n === 0) ? (
          <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>No weeks entered this month yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {rollup.map(r => (
              <div key={r.m.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <div style={{ width: 7, height: 7, borderRadius: 4, background: r.green === null ? C.border : r.green ? C.green : C.pink, flexShrink: 0 }} />
                <div style={{ flex: 1, color: C.ink }}>{r.m.label} <span style={{ color: C.muted }}>({r.n} wk{r.n !== 1 ? "s" : ""}, {r.m.agg === "sum" ? "total" : "avg"})</span></div>
                <div style={{ fontWeight: 700, color: r.green === null ? C.muted : r.green ? C.green : C.pink }}>{fmtCompany(r.m.kind, r.value)}</div>
                <div style={{ color: C.muted, minWidth: 74, textAlign: "right" }}>/ {fmtCompany(r.m.kind, r.target)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// One labeled row per (member, card). Dual-role members appear once per card.
function TeamStatusList({ title, icon, entries, color, bg }) {
  const sorted = [...entries].sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0));
  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "10px 20px", background: bg, borderBottom: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>{title} ({sorted.length})</div>
      </div>
      {sorted.length === 0 ? (
        <div style={{ padding: "16px 20px", fontSize: 12, color: C.muted, fontStyle: "italic" }}>No one here this week</div>
      ) : (
        sorted.map((e, i) => (
          <div key={e.key} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 10, borderBottom: i < sorted.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ width: 18, fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "center" }}>{i + 1}</div>
            <Avatar name={e.name} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{e.name}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{e.cardLabel}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color }}>{e.pts ?? "—"} pts{e.pending ? <span style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}> +{e.pending}?</span> : ""}</div>
          </div>
        ))
      )}
    </div>
  );
}

// Birthdays & work anniversaries falling in the current calendar month.
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function birthdayLabel(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return "";
  return `${MONTHS_SHORT[parseInt(iso.slice(5, 7), 10) - 1]} ${parseInt(iso.slice(8, 10), 10)}`;
}
function hireYearLabel(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return "";
  return `Hired ${MONTHS_SHORT[parseInt(iso.slice(5, 7), 10) - 1]} ${iso.slice(0, 4)}`;
}
function isoLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dateLabel(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS_SHORT[m - 1]} ${d}, ${y}`;
}
// PTO eligibility & current anniversary-year period. Eligible at 1 year; the
// "used" flag is stored against the current period key so it auto-resets (use it
// or lose it) when the next work anniversary rolls the period forward.
function ptoStatus(member) {
  const hd = member.hire_date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(hd || "")) return { hasDate: false, eligible: false };
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const [hy, hm, hdd] = hd.split("-").map(Number);
  let ps = new Date(now.getFullYear(), hm - 1, hdd);
  if (ps > now) ps = new Date(now.getFullYear() - 1, hm - 1, hdd);
  const years = ps.getFullYear() - hy;
  const eligible = years >= 1;
  const firstAnniv = new Date(hy + 1, hm - 1, hdd);
  return { hasDate: true, eligible, years, periodKey: isoLocal(ps), periodStartYear: ps.getFullYear(), firstAnnivKey: isoLocal(firstAnniv) };
}
function celebrationsThisMonth(activeTeam) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1, todayDay = now.getDate();
  const items = [];
  activeTeam.forEach(mem => {
    if (mem.birthday && /^\d{4}-\d{2}-\d{2}$/.test(mem.birthday)) {
      const bm = parseInt(mem.birthday.slice(5, 7), 10);
      const bd = parseInt(mem.birthday.slice(8, 10), 10);
      if (bm === m) items.push({ id: mem.id + "-b", member: mem, type: "birthday", day: bd });
    }
    if (mem.hire_date && /^\d{4}-\d{2}-\d{2}$/.test(mem.hire_date)) {
      const hy = parseInt(mem.hire_date.slice(0, 4), 10);
      const hm = parseInt(mem.hire_date.slice(5, 7), 10);
      const hd = parseInt(mem.hire_date.slice(8, 10), 10);
      const years = y - hy;
      if (hm === m && years >= 1) items.push({ id: mem.id + "-a", member: mem, type: "anniversary", day: hd, years });
    }
  });
  items.sort((a, b) => a.day - b.day || (a.type === b.type ? 0 : a.type === "birthday" ? -1 : 1));
  return { items, monthNum: m, year: y, todayDay };
}

function CelebrationsCard({ roster }) {
  const activeTeam = roster.filter(m => m.active);
  const { items, monthNum, year, todayDay } = celebrationsThisMonth(activeTeam);
  const monthName = new Date(year, monthNum - 1, 1).toLocaleDateString("en-US", { month: "long" });
  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", background: C.goldLight, borderBottom: `1.5px solid ${C.gold}44` }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>🎂 Celebrations — {monthName}</div>
      </div>
      {items.length === 0
        ? <div style={{ padding: "14px 20px", fontSize: 12, color: C.muted, fontStyle: "italic" }}>No birthdays or work anniversaries this month.</div>
        : items.map((it, i) => {
            const isToday = it.day === todayDay;
            return (
              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : "none", background: isToday ? C.goldLight : "transparent" }}>
                <Avatar name={it.member.name} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{it.member.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{monthName} {it.day}{isToday ? " · Today! 🎉" : ""}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: it.type === "birthday" ? C.pinkLight : C.greenLight, color: it.type === "birthday" ? C.pink : C.green }}>
                  {it.type === "birthday" ? "🎂 Birthday" : `🎉 ${it.years} yr${it.years !== 1 ? "s" : ""}`}
                </span>
              </div>
            );
          })}
    </div>
  );
}

function TimeOffCard({ roster }) {
  const activeTeam = roster.filter(m => m.active);
  const rows = activeTeam.filter(m => /^\d{4}-\d{2}-\d{2}$/.test(m.hire_date || ""));
  if (rows.length === 0) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", background: C.steelLight, borderBottom: `1.5px solid ${C.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.steel }}>🌴 Time Off</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>PTO unlocks at 1 year · one week, use it or lose it (resets each work anniversary)</div>
      </div>
      {rows.map((m, i) => {
        const st = ptoStatus(m);
        const last = i === rows.length - 1;
        const rowStyle = { display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", borderBottom: last ? "none" : `1px solid ${C.border}` };
        if (st.eligible) {
          const used = m.pto_used_year === st.periodKey;
          return (
            <div key={m.id} style={rowStyle}>
              <Avatar name={m.name} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{st.periodStartYear}–{String(st.periodStartYear + 1).slice(2)} PTO year</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: used ? C.warm : C.greenLight, color: used ? C.muted : C.green, border: used ? `1px solid ${C.border}` : "none" }}>
                {used ? "Used this year" : "✓ Available"}
              </span>
            </div>
          );
        }
        const hire = new Date(m.hire_date + "T00:00:00");
        const days = Math.max(0, Math.floor((now - hire) / 86400000));
        const pct = Math.min(100, Math.round((days / 365) * 100));
        return (
          <div key={m.id} style={rowStyle}>
            <Avatar name={m.name} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}</div>
              <div style={{ height: 6, background: C.border, borderRadius: 3, marginTop: 5, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: C.gold }} />
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, textAlign: "right", flexShrink: 0 }}>Unlocks {dateLabel(st.firstAnnivKey)}<br /><span style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{pct}% there</span></span>
          </div>
        );
      })}
    </div>
  );
}

function RecognitionSection({ roster, allScores, shoutouts, onAdd, onDelete, unlocked }) {
  const activeTeam = roster.filter(m => m.active);
  const week = latestScoredWeek(allScores);
  const achievements = detectAchievements(activeTeam, allScores, week);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualId, setManualId] = useState("");
  const [note, setNote] = useState("");

  const nameOf = id => roster.find(m => m.id === id)?.name || "Someone";
  const ICON = { streak: "🔥", sales: "💰", comeback: "📈" };

  // Only manual recognitions persist and show in a list; auto wins are read-only.
  const manual = [...shoutouts]
    .filter(s => s.kind === "custom")
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 10);

  const postManual = () => {
    if (!manualId || !note.trim()) return;
    onAdd({ member_id: manualId, reason: "Shout-out", kind: "custom", note: note.trim(), week_key: week });
    setManualOpen(false); setManualId(""); setNote("");
  };

  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", background: C.goldLight, borderBottom: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>🎉 This Week's Wins</div>
        <div style={{ fontSize: 11, color: C.gold }}>Week of {weekLabelFromKey(week)}</div>
      </div>

      {/* Auto-detected wins — read-only, no posting */}
      {achievements.length === 0 ? (
        <div style={{ padding: "12px 20px", fontSize: 12, color: C.muted }}>No standout wins yet this week.</div>
      ) : (
        achievements.map((a, i) => (
          <div key={a.memberId + a.kind} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 17 }}>{ICON[a.kind] || "⭐"}</span>
            <Avatar name={a.name} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{a.name}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{a.reason}</div>
            </div>
          </div>
        ))
      )}

      {/* Manual recognition — for wins the tracker can't see */}
      <div style={{ padding: "10px 20px", borderBottom: manual.length ? `1px solid ${C.border}` : "none" }}>
        {manualOpen ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <select value={manualId} onChange={e => setManualId(e.target.value)} style={{ padding: "7px 10px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 12 }}>
              <option value="">Choose person…</option>
              {activeTeam.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="What for?" style={{ flex: 1, minWidth: 140, padding: "7px 10px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 12 }} />
            <button onClick={postManual} style={{ padding: "7px 14px", borderRadius: 8, background: C.green, color: C.white, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Add</button>
            <button onClick={() => { setManualOpen(false); setManualId(""); setNote(""); }} style={{ padding: "7px 12px", borderRadius: 8, background: C.border, color: C.ink, border: "none", fontSize: 12, cursor: "pointer" }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => { setManualOpen(true); setNote(""); }} style={{ fontSize: 12, fontWeight: 700, color: C.gold, background: "none", border: "none", cursor: "pointer", padding: 0 }}>+ Recognize someone else</button>
        )}
      </div>

      {/* Manual recognitions list */}
      {manual.map((s, i) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", borderBottom: i < manual.length - 1 ? `1px solid ${C.border}` : "none" }}>
          <span style={{ fontSize: 15 }}>🙌</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: C.ink }}><strong>{nameOf(s.member_id)}</strong>{s.note ? ` — ${s.note}` : ""}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{s.created_at ? timeAgo(s.created_at) : ""}</div>
          </div>
          {unlocked && <button onClick={() => onDelete(s.id)} aria-label="Delete" style={{ background: "none", border: "none", color: C.muted, fontSize: 16, cursor: "pointer", lineHeight: 1 }}>×</button>}
        </div>
      ))}
    </div>
  );
}

function Dashboard({ roster, allScores, holders, shoutouts, onAddShoutout, onDeleteShoutout, unlocked, notes, monthlyScores, companyScores, rocks }) {
  const activeTeam = roster.filter(m => m.active);
  const wk = latestScoredWeek(allScores); // consistent with Wins/satisfaction — the last week actually scored

  // Per-card entries (role cards only — Core Value never appears in Green/Pink).
  // Monthly-aware: pending monthly metrics don't count; green scales to what's knowable.
  const entries = [];
  activeTeam.forEach(m => getMemberCards(m).forEach(card => {
    const st = getCardStatus(card, m.id, wk, allScores, monthlyScores);
    entries.push({ key: m.id + "|" + card, name: m.name, cardLabel: SCORECARDS[card].label, pts: st.pts, green: st.green, pending: st.pending });
  }));
  const greenEntries = entries.filter(e => e.pts !== null && e.green);
  const pinkEntries = entries.filter(e => e.pts !== null && !e.green);

  // Team Flag stays people-based: how many distinct members have any pink card.
  const pinkMemberIds = new Set();
  activeTeam.forEach(m => {
    if (getMemberCards(m).some(card => { const s = getCardStatus(card, m.id, wk, allScores, monthlyScores); return s.pts !== null && !s.green; })) pinkMemberIds.add(m.id);
  });
  const flag = pinkMemberIds.size >= 4 ? "red" : pinkMemberIds.size >= 2 ? "yellow" : "clear";

  const mk = currentMonthKey();
  const holderId = holders?.[mk];
  const holder = activeTeam.find(m => m.id === holderId);
  const cvTotal = holder ? monthCoreValueTotal(holder.id, mk, allScores) : null;
  const cvWeeks = holder ? monthCoreValueWeeks(holder.id, mk, allScores) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        {[
          { label: "Active Team", val: activeTeam.length, color: C.ink },
          { label: "Green (cards)", val: greenEntries.length, color: C.green },
          { label: "Pink (cards)", val: pinkEntries.length, color: C.pink },
          { label: "Team Flag", val: flag === "red" ? "🔴 Red" : flag === "yellow" ? "🟡 Yellow" : "✅ Clear", color: flag === "red" ? C.pink : flag === "yellow" ? C.gold : C.green },
        ].map(s => (
          <div key={s.label} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Week of {weekLabelFromKey(wk)} · dual-role members are listed once per card</div>
      <RecognitionSection roster={roster} allScores={allScores} shoutouts={shoutouts || []} onAdd={onAddShoutout} onDelete={onDeleteShoutout} unlocked={unlocked} />
      <CelebrationsCard roster={roster} />

      {(() => {
        const satWeek = latestScoredWeek(allScores);
        const avg = teamSatisfactionAvg(notes, satWeek, activeTeam);
        const count = satisfactionCount(notes, satWeek, activeTeam);
        const good = avg !== null && avg >= SATISFACTION_TARGET;
        return (
          <div style={{ background: C.white, border: `1.5px solid ${good ? C.green : C.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>Team Satisfaction · target {SATISFACTION_TARGET}+</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{count > 0 ? `${count} rating${count !== 1 ? "s" : ""} · week of ${weekLabelFromKey(satWeek)}` : "No ratings yet this week"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: avg === null ? C.border : good ? C.green : C.pink }}>
                {avg === null ? "—" : avg}<span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>/10</span>
              </div>
              {avg !== null && <div style={{ fontSize: 11, fontWeight: 700, color: good ? C.green : C.pink }}>{good ? "🟢 On target" : "🔴 Below target"}</div>}
            </div>
          </div>
        );
      })()}

      <TeamStatusList title="Green Team" icon="🟢" entries={greenEntries} color={C.green} bg={C.greenLight} />
      <TeamStatusList title="Pink Team" icon="🔴" entries={pinkEntries} color={C.pink} bg={C.pinkLight} />

      {/* Core Value Award — separate from Green/Pink and the bonus pool */}
      <div style={{ background: C.goldLight, border: `1.5px solid ${C.gold}66`, borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>Core Value Award · {monthLabel(mk)}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginTop: 2 }}>{holder ? holder.name : "No holder assigned"}</div>
          </div>
          {holder
            ? <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.gold }}>{cvTotal}<span style={{ fontSize: 12, color: C.muted }}> pts</span></div>
                <div style={{ fontSize: 11, color: C.muted }}>{cvWeeks} week{cvWeeks !== 1 ? "s" : ""} scored this month</div>
              </div>
            : <div style={{ fontSize: 12, color: C.muted }}>Assign a holder in Roster →</div>}
        </div>
      </div>

      <CompanyScorecardSection roster={roster} notes={notes} companyScores={companyScores || {}} week={latestCompanyWeek(companyScores)} readOnly onSetCompany={() => {}} />
      <RockReview quarterKey={currentQuarterKey()} roster={roster} rocks={rocks} readOnly />

      <div style={{ background: C.steelLight, border: `1.5px solid ${C.steel}44`, borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.steel, marginBottom: 8 }}>📋 Book Control Trigger</div>
        <div style={{ fontSize: 12, color: C.ink, lineHeight: 1.9 }}>
          All three must be true to activate book control for a stylist:<br />
          <strong>1.</strong> Utilization ≥ 90% &nbsp;·&nbsp; <strong>2.</strong> Active guest count ≥ 80–85 &nbsp;·&nbsp; <strong>3.</strong> Value of future appointments ≥ 80% of PPH goal (next 21 days)<br />
          <span style={{ color: C.muted }}>Activated by: Alexis S · Pipeline managed by: Payton K</span>
        </div>
      </div>
    </div>
  );
}

// ── PHOREST DATA PULL ─────────────────────────────────────────────────────────
function getPriorWeekRange(weekKey) {
  // weekKey is the Monday of the week being scored — we pull the previous Mon-Sun
  const monday = new Date(weekKey + "T00:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = d => d.toISOString().slice(0, 10);
  return { startFilter: fmt(monday), finishFilter: fmt(sunday) };
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text) {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const cols = parseCSVLine(line).map(c => c.trim().replace(/^"|"$/g, ""));
    const row = {};
    headers.forEach((h, i) => { row[h] = cols[i]; });
    return row;
  });
}

async function pullPhorestWeek(weekKey) {
  const { startFilter, finishFilter } = getPriorWeekRange(weekKey);

  // Step 1: create job
  const createRes = await fetch(`/api/phorest?action=create-job`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startFilter, finishFilter }),
  });
  const job = await createRes.json();
  if (!job.jobId) throw new Error("Failed to create Phorest export job");

  // Step 2: poll until done (max ~30s)
  let status = job;
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const checkRes = await fetch(`/api/phorest?action=check-job&jobId=${job.jobId}`);
    status = await checkRes.json();
    if (status.jobStatus === "DONE") break;
    if (status.jobStatus === "FAILED") throw new Error(status.failureReason || "Phorest export failed");
  }
  if (status.jobStatus !== "DONE") throw new Error("Phorest export timed out — try again in a minute");
  if (!status.tempCsvExternalUrl) throw new Error("No data returned for this date range");

  // Step 3: fetch CSV
  const csvRes = await fetch(`/api/phorest?action=fetch-csv&url=${encodeURIComponent(status.tempCsvExternalUrl)}`);
  const csvText = await csvRes.text();
  return parseCSV(csvText);
}

// Aggregate raw transaction rows into per-staff service/product totals
function aggregatePhorestData(rows) {
  const byStaff = {};
  rows.forEach(row => {
    const first = row["staff_first_name"];
    const last = row["staff_last_name"];
    if (!first && !last) return;
    const staffName = `${first || ""} ${last || ""}`.trim();
    if (!staffName) return;
    if (!byStaff[staffName]) byStaff[staffName] = { serviceSales: 0, productSales: 0 };
    const category = (row["item_type"] || "").toLowerCase();
    const amount = parseFloat(String(row["net_total_amount"] || row["total_amount"] || "0").replace(/[^0-9.\-]/g, "")) || 0;

    if (category.includes("product") || category.includes("retail")) {
      byStaff[staffName].productSales += amount;
    } else if (category.includes("service")) {
      byStaff[staffName].serviceSales += amount;
    }
  });
  return byStaff;
}


function Lead012({ value, onPick }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {[0, 1, 2].map(v => {
        const active = value === v;
        return (
          <button key={v} onClick={() => onPick(v)} style={{ width: 34, height: 34, borderRadius: 8, border: `2px solid ${active ? SCORE_COLOR[v] : C.border}`, background: active ? SCORE_COLOR[v] : C.white, color: active ? C.white : C.muted, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{v}</button>
        );
      })}
    </div>
  );
}

function LeadershipFeedbackPanel({ member, week, monthKey, pulse, monthly, onSetPulse, onSetMonthly }) {
  const [pending, setPending] = useState(null);
  const [open, setOpen] = useState(false);
  const savedScore = pulse?.score;
  const savedFb = pulse?.feedback || "";
  const effScore = pending != null ? pending : savedScore;
  const needFb = effScore != null && effScore < LEADER_PULSE_TARGET && !savedFb.trim();
  const pickScore = v => {
    if (v >= LEADER_PULSE_TARGET || savedFb.trim()) { onSetPulse(week, member.id, { score: v }); setPending(null); }
    else setPending(v);
  };
  const onFb = text => {
    if (pending != null && text.trim()) { onSetPulse(week, member.id, { score: pending, feedback: text }); setPending(null); }
    else onSetPulse(week, member.id, { feedback: text });
  };
  const md = monthly || {};
  const done = leaderMonthlyDone(md);
  const openSet = leaderOpenSetForMonth(monthKey);
  const openQs = [...LEADER_OPEN_ALWAYS, ...openSet.qs];

  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.gold}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", background: C.goldLight, borderBottom: `1.5px solid ${C.gold}44` }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>Leadership Feedback</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Your feedback up to Vicki &amp; Payton — how supported and coached you feel in this role.</div>
      </div>

      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>This week: how supported &amp; well-coached did you feel? (1–10)</div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(nval => {
            const active = effScore === nval;
            const good = nval >= LEADER_PULSE_TARGET;
            return (
              <button key={nval} onClick={() => pickScore(nval)} style={{ width: 34, height: 34, borderRadius: 8, border: `2px solid ${active ? (good ? C.green : C.gold) : C.border}`, background: active ? (good ? C.green : C.gold) : C.white, color: active ? C.white : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{nval}</button>
            );
          })}
        </div>
        {needFb && (
          <div style={{ fontSize: 11, color: C.pink, fontWeight: 700, marginBottom: 6 }}>
            ⚠ A reason is required for a rating under {LEADER_PULSE_TARGET}.{pending != null ? " The rating won't save until you add feedback." : ""}
          </div>
        )}
        <LazyInput as="textarea" value={savedFb} onCommit={text => onFb(text)}
          placeholder={needFb ? `Required: what would make this a ${LEADER_PULSE_TARGET}+ next week?` : "Optional: anything on your mind this week…"}
          rows={2}
          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${needFb ? C.pink : C.border}`, fontSize: 13, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
      </div>

      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", padding: "12px 20px", background: C.warm, border: "none", borderBottom: open ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{open ? "▾" : "▸"} Monthly Leadership Review — {monthLabel(monthKey)}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>This month's deep-dive: {openSet.name}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: done ? C.greenLight : C.goldLight, color: done ? C.green : C.gold }}>{done ? "✓ done" : "not started"}</span>
      </button>

      {open && (
        <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 10, color: C.muted, fontStyle: "italic" }}>{LEADER_SCORED_LEGEND}</div>
          {LEADER_SCORED_Q.map(q => (
            <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180, fontSize: 12, color: C.ink, fontWeight: 600 }}>{q.label}</div>
              <Lead012 value={typeof md[q.id] === "number" ? md[q.id] : undefined} onPick={v => onSetMonthly(monthKey, member.id, { [q.id]: v })} />
            </div>
          ))}
          <div style={{ height: 1, background: C.border }} />
          {openQs.map(q => (
            <div key={q.id}>
              <div style={{ fontSize: 12, color: C.ink, fontWeight: 600, marginBottom: 6 }}>{q.label}</div>
              <LazyInput as="textarea" value={md[q.id] || ""} onCommit={text => onSetMonthly(monthKey, member.id, { [q.id]: text })}
                rows={2} placeholder="Your answer (optional)…"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RewardCard({ title, icon, children, tone }) {
  const bar = tone === "gold" ? C.gold : tone === "green" ? C.green : C.steel;
  const bg = tone === "gold" ? C.goldLight : tone === "green" ? C.greenLight : C.steelLight;
  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "10px 18px", background: bg, borderBottom: `1.5px solid ${C.border}`, fontSize: 12, fontWeight: 800, color: bar }}>{icon} {title}</div>
      <div style={{ padding: "14px 18px" }}>{children}</div>
    </div>
  );
}

function RewardsPanel({ member, allScores, roster, poolEstimate }) {
  const year = String(new Date().getFullYear());
  const q = Math.ceil((new Date().getMonth() + 1) / 3);
  const stylist = isStylist(member);
  const inPool = inBonusPool(member);
  const poolMembers = roster.filter(m => m.active && inBonusPool(m));

  const myYear = memberYearPts(member, allScores, year);
  const totalYear = poolMembers.reduce((t, s) => t + memberYearPts(s, allScores, year), 0);
  const share = inPool && totalYear > 0 ? myYear / totalYear : 0;
  const est = poolEstimate * share;

  const stylists = roster.filter(m => m.active && isStylist(m));
  const qRanked = stylists.map(s => ({ id: s.id, name: s.name, pts: memberQuarterPts(s, allScores, year, q) })).sort((a, b) => b.pts - a.pts);
  const myRank = qRanked.findIndex(x => x.id === member.id) + 1;
  const myQ = qRanked.find(x => x.id === member.id)?.pts ?? memberQuarterPts(member, allScores, year, q);
  const leader = qRanked[0];
  const leading = myRank === 1 && myQ > 0;

  const { green, scored } = memberYearGreen(member, allScores, year);
  const greenPct = scored > 0 ? Math.round((green / scored) * 100) : 0;
  const inducted = !!member.club_100;

  const pto = ptoStatus(member);
  const ptoUsed = pto.eligible && member.pto_used_year === pto.periodKey;

  const money = n => "$" + Math.round(n).toLocaleString();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: C.ink, borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>The Refinery · Incentives</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>{member.name}</div>
        <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>Where you stand this year — {year}</div>
      </div>

      {!stylist && (
        <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic", padding: "0 4px" }}>The bonus pool, STRA-tegic Champion and 100 Club are stylist programs. Your Time Off is below.</div>
      )}

      {stylist && inPool && (
        <RewardCard title="Bonus Pool — estimated year-end share" icon="💰" tone="gold">
          {poolEstimate > 0
            ? <>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>{money(est)}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{Math.round(share * 100)}% of the pool · {myYear} pts of {totalYear} pool pts</div>
                <div style={{ height: 8, background: C.border, borderRadius: 4, marginTop: 10, overflow: "hidden" }}><div style={{ width: `${Math.round(share * 100)}%`, height: "100%", background: C.gold }} /></div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 8, fontStyle: "italic" }}>Estimate only — the pool is a share of shop net profit and shifts as points and profit change through the year.</div>
              </>
            : <div style={{ fontSize: 13, color: C.muted }}>Your share is <strong>{Math.round(share * 100)}%</strong> of the pool ({myYear} of {totalYear} pool pts). Dollar estimate appears once the pool amount is set.</div>}
        </RewardCard>
      )}
      {stylist && !inPool && (
        <RewardCard title="Bonus Pool" icon="💰" tone="steel">
          <div style={{ fontSize: 13, color: C.muted }}>As owner/GM you're not part of the stylist bonus pool — your {myYear} pts this year don't count against the team's shares. You still appear in the STRA-tegic Champion ranking below.</div>
        </RewardCard>
      )}

      {stylist && (
        <RewardCard title={`STRA-tegic Champion — Q${q} ${year}`} icon="🏆" tone={leading ? "gold" : "steel"}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: leading ? C.gold : C.ink }}>{leading ? "🥇 You're leading!" : myRank > 0 ? `Rank #${myRank} of ${qRanked.length}` : "—"}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{myQ} KPI pts this quarter</div>
            </div>
            {!leading && leader && leader.pts > 0 && (
              <div style={{ textAlign: "right", fontSize: 11, color: C.muted }}>Leader<br /><strong style={{ color: C.ink }}>{leader.name}</strong> · {leader.pts} pts<br /><span style={{ color: C.gold, fontWeight: 700 }}>{Math.max(0, leader.pts - myQ)} to catch up</span></div>
            )}
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 10, fontStyle: "italic" }}>Highest quarter KPI points wins; the champion picks from the incentive list.</div>
        </RewardCard>
      )}

      {stylist && (
        <RewardCard title="100 Club — mastery, all year" icon="⭐" tone={inducted ? "gold" : "steel"}>
          {inducted && <div style={{ fontSize: 13, fontWeight: 800, color: C.gold, marginBottom: 8 }}>🧥 Active 100 Club Member{typeof member.club_100 === "string" && member.club_100.length === 4 ? ` · since ${member.club_100}` : ""}</div>}
          <div style={{ fontSize: 12, color: C.ink, fontWeight: 600 }}>Green Team all year — {green} of {scored} weeks green ({greenPct}%)</div>
          <div style={{ height: 8, background: C.border, borderRadius: 4, marginTop: 8, overflow: "hidden" }}><div style={{ width: `${greenPct}%`, height: "100%", background: greenPct >= 100 ? C.green : C.gold }} /></div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>Also required (reviewed by leadership):</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 1.7 }}>· Healthy capacity threshold<br />· Guest satisfaction &amp; retention<br />· Living the core values</div>
        </RewardCard>
      )}

      <RewardCard title="Paid Time Off" icon="🌴" tone={pto.eligible && !ptoUsed ? "green" : "steel"}>
        {!pto.hasDate
          ? <div style={{ fontSize: 13, color: C.muted }}>Add your hire date in Roster to track PTO.</div>
          : !pto.eligible
            ? <div style={{ fontSize: 13, color: C.ink }}>Unlocks at 1 year — <strong>{dateLabel(pto.firstAnnivKey)}</strong>.</div>
            : <div style={{ fontSize: 15, fontWeight: 800, color: ptoUsed ? C.muted : C.green }}>{ptoUsed ? "Used this year" : "✓ Your week is available"}<div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 }}>{pto.periodStartYear}–{String(pto.periodStartYear + 1).slice(2)} · use it or lose it</div></div>}
      </RewardCard>
    </div>
  );
}

function ScoreView({ roster, allScores, onScore, holders, notes, onSetNote, monthlyScores, onSetMonthly, companyScores, onSetCompany, leadershipFb, onSetLeaderPulse, onSetLeaderMonthly, poolEstimate, actuals, onEnterActual, stylistTargets, settings, rocks, onAddRock, onUpdateRock, onDeleteRock }) {
  const [sel, setSel] = useState(null);
  const [card, setCard] = useState(null);
  const [detailMode, setDetailMode] = useState("score");
  const [phorestData, setPhorestData] = useState(null);
  const [pulling, setPulling] = useState(false);
  const [pullError, setPullError] = useState(null);
  // The single, explicit week that ALL scoring in this session saves to.
  const [reviewWeek, setReviewWeek] = useState(() => defaultReviewWeek(allScores));
  const [confirmed, setConfirmed] = useState(false);
  const [satPending, setSatPending] = useState(null); // low rating held until feedback is written
  const activeTeam = roster.filter(m => m.active);

  useEffect(() => { setSatPending(null); }, [sel?.id]);

  const cur = currentWeekKey();
  // Core Value holder is tied to the month of the week being scored.
  const mk = monthKeyOfWeek(reviewWeek);
  const holderId = holders?.[mk];
  const holder = activeTeam.find(m => m.id === holderId);

  const handlePullPhorest = async () => {
    setPulling(true);
    setPullError(null);
    try {
      const rows = await pullPhorestWeek(reviewWeek);
      setPhorestData(aggregatePhorestData(rows));
    } catch (err) {
      setPullError(err.message);
    } finally {
      setPulling(false);
    }
  };

  // ── Detail: scoring one person's card, always for the confirmed reviewWeek ──
  if (sel) {
    const cards = [...getMemberCards(sel), ...(sel.id === holderId ? ["core_value"] : [])];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: C.warm, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 11, fontWeight: 700, color: C.ink }}>
          Scoring week of {weekRangeLabel(reviewWeek)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => { setSel(null); setCard(null); }} style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, fontSize: 13, cursor: "pointer", color: C.ink, fontWeight: 600 }}>← Back</button>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>{sel.name}</div>
          <div style={{ display: "flex", gap: 2, marginLeft: 4, background: C.warm, borderRadius: 8, padding: 2 }}>
            {[["score", "Scorecard"], ["rewards", "Incentives"]].map(([mv, ml]) => (
              <button key={mv} onClick={() => setDetailMode(mv)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: detailMode === mv ? C.ink : "transparent", color: detailMode === mv ? C.white : C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{ml}</button>
            ))}
          </div>
          {detailMode === "score" && cards.map(r => (
            <button key={r} onClick={() => setCard(r)} style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${card === r ? C.gold : C.border}`, background: card === r ? C.goldLight : C.white, fontSize: 12, cursor: "pointer", fontWeight: card === r ? 700 : 500, color: card === r ? C.gold : C.muted }}>
              {SCORECARDS[r].label} Card
            </button>
          ))}
        </div>
        {detailMode === "rewards" && <RewardsPanel member={sel} allScores={allScores} roster={roster} poolEstimate={poolEstimate} />}
        {detailMode === "score" && card && (
          <ScorecardPanel
            member={sel}
            cardType={card}
            scores={allScores?.[reviewWeek]?.[sel.id]?.[card]}
            onScore={(mid, val) => onScore(reviewWeek, sel.id, card, mid, val)}
            week={reviewWeek}
            monthlyScores={monthlyScores}
            onSetMonthly={onSetMonthly}
            targets={getStylistTarget(sel.id, quarterKeyOf(reviewWeek), stylistTargets)}
            standards={getStandards(quarterKeyOf(reviewWeek), settings)}
            actuals={actuals?.[reviewWeek]?.[sel.id]?.[card]}
            onEnterActual={(mid, value, score) => onEnterActual(reviewWeek, sel.id, card, mid, value, score)}
            allActuals={actuals}
          />
        )}

        {/* Team satisfaction + private feedback — per person, per week */}
        {detailMode === "score" && (() => {
          const savedSat = notes?.[reviewWeek]?.[sel.id]?.satisfaction;
          const savedFb = notes?.[reviewWeek]?.[sel.id]?.feedback || "";
          const effectiveSat = satPending != null ? satPending : savedSat;
          const needFeedback = effectiveSat != null && effectiveSat <= 7 && !savedFb.trim();
          const pickSat = (val) => {
            if (val >= 8 || savedFb.trim()) { onSetNote(reviewWeek, sel.id, { satisfaction: val }); setSatPending(null); }
            else { setSatPending(val); }
          };
          const onFeedback = (text) => {
            if (satPending != null && text.trim()) { onSetNote(reviewWeek, sel.id, { satisfaction: satPending, feedback: text }); setSatPending(null); }
            else { onSetNote(reviewWeek, sel.id, { feedback: text }); }
          };
          return (
            <div style={{ background: C.white, border: `1.5px solid ${needFeedback ? C.pink : C.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 20px", background: C.steelLight, borderBottom: `1.5px solid ${C.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>Team Satisfaction (1–10)</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Target {SATISFACTION_TARGET}+. Feedback is private to leaders — not shown on the dashboard.</div>
              </div>
              <div style={{ padding: "14px 20px" }}>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(nval => {
                    const active = effectiveSat === nval;
                    const good = nval >= SATISFACTION_TARGET;
                    return (
                      <button key={nval} onClick={() => pickSat(nval)} style={{ width: 34, height: 34, borderRadius: 8, border: `2px solid ${active ? (good ? C.green : C.gold) : C.border}`, background: active ? (good ? C.green : C.gold) : C.white, color: active ? C.white : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{nval}</button>
                    );
                  })}
                </div>
                {needFeedback && (
                  <div style={{ fontSize: 11, color: C.pink, fontWeight: 700, marginBottom: 6 }}>
                    ⚠ A reason is required for a rating of 7 or below.{satPending != null ? " The rating won't save until you add feedback." : ""}
                  </div>
                )}
                <LazyInput as="textarea"
                  value={savedFb}
                  onCommit={text => onFeedback(text)}
                  placeholder={needFeedback ? "Required: why 7 or below?" : "Feedback for leaders (optional, private)…"}
                  rows={2}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${needFeedback ? C.pink : C.border}`, fontSize: 13, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
            </div>
          );
        })()}

        {detailMode === "score" && isLeader(sel) && (
          <LeadershipFeedbackPanel
            member={sel}
            week={reviewWeek}
            monthKey={mk}
            pulse={leadershipFb?.pulse?.[reviewWeek]?.[sel.id]}
            monthly={leadershipFb?.monthly?.[mk]?.[sel.id]}
            onSetPulse={onSetLeaderPulse}
            onSetMonthly={onSetLeaderMonthly}
          />
        )}
      </div>
    );
  }

  // ── Step 1: confirm the week before the roster appears ──
  if (!confirmed) {
    const isCurrent = reviewWeek === cur;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", paddingTop: 8 }}>
        <div style={{ background: C.white, border: `2px solid ${C.gold}`, borderRadius: 14, padding: "22px 20px", maxWidth: 440, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Which week are you scoring?</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "6px 0 4px" }}>
            <button onClick={() => setReviewWeek(prevWeekKey(reviewWeek))} aria-label="Previous week" style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.white, fontSize: 18, cursor: "pointer", color: C.ink }}>‹</button>
            <div style={{ minWidth: 190 }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>{weekRangeLabel(reviewWeek)}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{isCurrent ? "Current week (Mon–Sun)" : "Mon–Sun"}</div>
            </div>
            <button onClick={() => setReviewWeek(nextWeekKey(reviewWeek))} disabled={reviewWeek >= cur} aria-label="Next week" style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${C.border}`, background: reviewWeek >= cur ? C.warm : C.white, fontSize: 18, cursor: reviewWeek >= cur ? "default" : "pointer", color: reviewWeek >= cur ? C.border : C.ink }}>›</button>
          </div>
          <div style={{ fontSize: 12, color: C.muted, margin: "10px 0 16px" }}>Everyone must score the same week. Use the arrows if this isn't right, then confirm.</div>
          <button onClick={() => setConfirmed(true)} style={{ width: "100%", padding: "13px", borderRadius: 10, background: C.ink, color: C.white, border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
            ✓ Score {weekLabelFromKey(reviewWeek)}
          </button>
        </div>
        <div style={{ fontSize: 11, color: C.muted, textAlign: "center", maxWidth: 380 }}>
          Reviewed Thursday · covers the prior Mon–Sun. Late scorers: pick the same week the rest of the team already scored.
        </div>
      </div>
    );
  }

  // ── Step 2: score, all writes pinned to reviewWeek ──
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: C.white, border: `1.5px solid ${C.gold}`, borderRadius: 12, padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>Scoring week of {weekRangeLabel(reviewWeek)}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>All scores below save to this week.</div>
        </div>
        <button onClick={() => { setConfirmed(false); }} style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, fontSize: 12, cursor: "pointer", color: C.steel, fontWeight: 700 }}>Change week</button>
      </div>

      <div style={{ background: C.steelLight, border: `1.5px solid ${C.steel}44`, borderRadius: 12, padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>📊 Phorest Data — Service & Product Sales</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Pulls the confirmed week ({weekLabelFromKey(reviewWeek)}). Rebooking, Retention, Utilization & No-Shows still pulled manually.</div>
          </div>
          <button onClick={handlePullPhorest} disabled={pulling} style={{ padding: "8px 16px", borderRadius: 8, background: pulling ? C.border : C.steel, color: C.white, border: "none", fontWeight: 700, fontSize: 12, cursor: pulling ? "default" : "pointer" }}>
            {pulling ? "Pulling... (~20s)" : "Pull Sales Data"}
          </button>
        </div>
        {pullError && <div style={{ marginTop: 10, fontSize: 12, color: C.pink, fontWeight: 600 }}>⚠ {pullError}</div>}
        {phorestData && !pullError && (
          <div style={{ marginTop: 12, borderTop: `1px solid ${C.steel}33`, paddingTop: 10 }}>
            <div style={{ fontSize: 11, color: C.steel, fontWeight: 700, marginBottom: 6 }}>✓ Pulled {weekLabelFromKey(reviewWeek)} — Service & Product totals per stylist:</div>
            {Object.keys(phorestData).length === 0 ? (
              <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>No transactions found for this week</div>
            ) : (
              Object.entries(phorestData).map(([name, data]) => (
                <div key={name} style={{ fontSize: 11, color: C.ink, padding: "3px 0" }}>
                  <strong>{name}:</strong> Service ${data.serviceSales.toFixed(2)} · Product ${data.productSales.toFixed(2)}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div style={{ background: C.goldLight, border: `1.5px solid ${C.gold}44`, borderRadius: 10, padding: "10px 16px", fontSize: 11, color: C.gold, fontWeight: 600 }}>
        📋 Pull manually from Phorest → Manager → Reports → Insights: Rebooking Rate, Utilization (Staff Performance dashboard) · Retention (Client Retention dashboard) · No-Shows (Reports → Clients)
      </div>

      {/* Core Value Award — holder for the month of the week being scored */}
      {holder && (
        <button onClick={() => { setSel(holder); setCard("core_value"); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: C.goldLight, border: `1.5px solid ${C.gold}66`, borderRadius: 10, cursor: "pointer", textAlign: "left" }}>
          <span style={{ fontSize: 20 }}>⭐</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>Core Value Award · {monthLabel(mk)}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{holder.name}</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: C.white, color: C.gold }}>
            {calcCardPts("core_value", allScores?.[reviewWeek]?.[holder.id]?.core_value) ?? "—"}/{cardMax("core_value")} this wk
          </span>
        </button>
      )}

      {activeTeam.map(member => {
        const cards = getMemberCards(member);
        const statuses = getMemberWeekStatuses(member, reviewWeek, allScores, monthlyScores);
        const done = statuses.every(s => s.pts !== null);
        return (
          <button key={member.id} onClick={() => { setSel(member); setCard(cards[0]); setDetailMode("score"); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: C.white, border: `1.5px solid ${done ? C.green : C.border}`, borderRadius: 10, cursor: "pointer", textAlign: "left" }}>
            <Avatar name={member.name} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{member.name}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{cards.map(r => SCORECARDS[r].label).join(" + ")}</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{statuses.map((s, j) => <StatusPillS key={j} status={s} />)}</div>
          </button>
        );
      })}

      <div style={{ height: 4 }} />
      <CompanyScorecardSection roster={roster} notes={notes} companyScores={companyScores || {}} week={reviewWeek} onSetCompany={onSetCompany} />
      <RockReview quarterKey={quarterKeyOf(reviewWeek)} roster={roster} rocks={rocks} onAddRock={onAddRock} onUpdateRock={onUpdateRock} onDeleteRock={onDeleteRock} />
    </div>
  );
}

function HistoryView({ roster, allScores, holders, monthlyScores }) {
  const activeTeam = roster.filter(m => m.active);
  const [mode, setMode] = useState("weekly");
  const [selWeek, setSelWeek] = useState(currentWeekKey());
  const allWeeks = useMemo(() => allWeeksSince(START_DATE), []);
  const qGroups = useMemo(() => groupByQuarter(allWeeks), [allWeeks]);
  const qKeys = Object.keys(qGroups).sort().reverse();
  const months = useMemo(() => monthsFromWeeks(allWeeks), [allWeeks]);

  const ModeBtn = ({ id, label }) => (
    <button onClick={() => setMode(id)} style={{ padding: "7px 16px", borderRadius: 20, border: `1.5px solid ${mode === id ? C.gold : C.border}`, background: mode === id ? C.goldLight : C.white, color: mode === id ? C.gold : C.muted, fontWeight: mode === id ? 700 : 500, fontSize: 12, cursor: "pointer" }}>{label}</button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <ModeBtn id="weekly" label="Weekly" />
        <ModeBtn id="quarterly" label="Quarterly" />
        <ModeBtn id="cumulative" label="Cumulative / Bonus Pool" />
        <ModeBtn id="corevalue" label="Core Value Award" />
      </div>

      {mode === "weekly" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {allWeeks.map(wk => (
              <button key={wk} onClick={() => setSelWeek(wk)} style={{ padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${selWeek === wk ? C.gold : C.border}`, background: selWeek === wk ? C.goldLight : C.white, fontSize: 11, cursor: "pointer", fontWeight: selWeek === wk ? 700 : 400, color: selWeek === wk ? C.gold : C.muted, whiteSpace: "nowrap" }}>
                {weekLabelFromKey(wk)}{wk === currentWeekKey() ? " ·now" : ""}
              </button>
            ))}
          </div>
          <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", background: C.warm, borderBottom: `1.5px solid ${C.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Week of {weekLabelFromKey(selWeek)}</div>
            </div>
            {activeTeam.map((m, i) => {
              const statuses = getMemberWeekStatuses(m, selWeek, allScores, monthlyScores);
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", padding: "11px 20px", gap: 12, borderBottom: i < activeTeam.length - 1 ? `1px solid ${C.border}` : "none", flexWrap: "wrap" }}>
                  <Avatar name={m.name} size={34} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}</div><div style={{ fontSize: 11, color: C.muted }}>{getMemberCards(m).map(r => SCORECARDS[r].label).join(" + ")}</div></div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{statuses.map((s, j) => <StatusPillS key={j} status={s} />)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode === "quarterly" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 11, color: C.muted }}>Ranked by base-card points only (Stylist / Front Desk / Apprentice) — leadership cards excluded.</div>
          {qKeys.map(qk => {
            const weeks = qGroups[qk];
            const ranked = [...activeTeam].map(m => {
              const total = weeks.reduce((acc, wk) => acc + (getMemberBonusWeekPts(m, allScores?.[wk] || {}) ?? 0), 0);
              const ws = weeks.filter(wk => getMemberBonusWeekPts(m, allScores?.[wk] || {}) !== null).length;
              return { member: m, total, ws };
            }).sort((a, b) => b.total - a.total);
            return (
              <div key={qk} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", background: C.ink, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.white }}>{qk}</div>
                  <div style={{ fontSize: 11, color: C.gold }}>{weeks.length} week{weeks.length !== 1 ? "s" : ""}</div>
                </div>
                {ranked[0]?.total > 0 && (
                  <div style={{ padding: "10px 20px", background: C.goldLight, borderBottom: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>🏆</span><div style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>Current Champion: {ranked[0].member.name} — {ranked[0].total} pts</div>
                  </div>
                )}
                {ranked.map(({ member: m, total, ws }, i) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", padding: "11px 20px", gap: 12, borderBottom: i < activeTeam.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ width: 22, fontSize: 12, fontWeight: 700, color: i === 0 && total > 0 ? C.gold : C.muted, textAlign: "center" }}>{i + 1}</div>
                    <Avatar name={m.name} size={32} />
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}</div><div style={{ fontSize: 11, color: C.muted }}>{ws}/{weeks.length} weeks scored</div></div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: total > 0 ? C.ink : C.border }}>{total}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>pts</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {mode === "cumulative" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: C.goldLight, border: `1.5px solid ${C.gold}44`, borderRadius: 10, padding: "12px 16px", fontSize: 12, color: C.gold, fontWeight: 600 }}>
            🏆 Year-End Bonus Pool — higher annual score = larger share of pool. Base-card points only; leadership & Core Value points excluded.
          </div>
          <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            {[...activeTeam]
              .map(m => ({ m, total: getMemberCumulativePts(m, allScores), weeks: Object.keys(allScores).filter(wk => getMemberBonusWeekPts(m, allScores[wk]) !== null).length }))
              .sort((a, b) => b.total - a.total)
              .map(({ m, total, weeks }, i, arr) => {
                const maxPts = arr[0]?.total || 1;
                const bar = (total / maxPts) * 100;
                return (
                  <div key={m.id} style={{ padding: "14px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                      <div style={{ width: 22, fontSize: 12, fontWeight: 700, color: i < 3 ? C.gold : C.muted, textAlign: "center" }}>{i + 1}</div>
                      <Avatar name={m.name} size={32} />
                      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}</div><div style={{ fontSize: 11, color: C.muted }}>{weeks} week{weeks !== 1 ? "s" : ""} scored</div></div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: total > 0 ? C.gold : C.border }}>{total}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>pts</div>
                    </div>
                    <div style={{ marginLeft: 34, height: 4, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${bar}%`, height: "100%", background: C.gold, borderRadius: 4, transition: "width 0.4s" }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {mode === "corevalue" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: C.goldLight, border: `1.5px solid ${C.gold}44`, borderRadius: 10, padding: "12px 16px", fontSize: 12, color: C.gold, fontWeight: 600 }}>
            ⭐ Core Value Award — one holder per month, scored Yes/No weekly. Award only; these points never enter the bonus pool.
          </div>
          <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            {months.map((mkk, i) => {
              const hId = holders?.[mkk];
              const hMember = roster.find(m => m.id === hId);
              const total = hMember ? monthCoreValueTotal(hMember.id, mkk, allScores) : 0;
              const wks = hMember ? monthCoreValueWeeks(hMember.id, mkk, allScores) : 0;
              return (
                <div key={mkk} style={{ display: "flex", alignItems: "center", padding: "13px 20px", gap: 12, borderBottom: i < months.length - 1 ? `1px solid ${C.border}` : "none", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{monthLabel(mkk)}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{mkk === currentMonthKey() ? "Current month" : `${wks} week${wks !== 1 ? "s" : ""} scored`}</div>
                  </div>
                  {hMember
                    ? <>
                        <Avatar name={hMember.name} size={32} />
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{hMember.name}</div></div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: C.gold }}>{total}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>pts</div>
                      </>
                    : <div style={{ flex: 1, fontSize: 12, color: C.muted }}>No holder assigned</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RosterView({ roster, onRosterChange, holders, onSetHolder, allScores, onClearWeek, poolEstimate, onSetPoolEstimate, stylistTargets, onSetStylistTarget, settings, onSetSetting }) {
  const [tq, setTq] = useState(currentQuarterKey());
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", role: "stylist" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [pendingHolder, setPendingHolder] = useState(null); // null = no dialog; "" = pending "remove"
  const [pendingClear, setPendingClear] = useState(null); // week_key pending clear

  const active = roster.filter(m => m.active);
  const inactive = roster.filter(m => !m.active);

  // Weeks that contain scores, newest first, with member counts and future flags.
  const weeksWithScores = Object.keys(allScores || {})
    .filter(k => Object.keys(allScores[k] || {}).length > 0)
    .sort().reverse()
    .map(k => ({ key: k, members: Object.keys(allScores[k]).length, future: k > currentWeekKey() }));
  const clearMembers = pendingClear ? Object.keys(allScores[pendingClear] || {}).length : 0;

  const mk = currentMonthKey();
  const holderId = holders?.[mk] || "";

  // Reassigning a month that already has a holder needs confirmation, since it
  // hides the outgoing holder's scored weeks while someone else holds the month.
  const requestHolderChange = (next) => {
    if (next === holderId) return;
    if (!holderId) { onSetHolder(mk, next); return; }
    setPendingHolder(next);
  };
  const confirmHolderChange = () => { onSetHolder(mk, pendingHolder); setPendingHolder(null); };
  const cancelHolderChange = () => setPendingHolder(null);

  const outgoing = active.find(m => m.id === holderId);
  const incoming = pendingHolder ? active.find(m => m.id === pendingHolder) : null;
  const scoredWeeks = holderId ? monthCoreValueWeeks(holderId, mk, allScores || {}) : 0;

  useEffect(() => {
    if (pendingHolder === null) return;
    const onKey = e => { if (e.key === "Escape") setPendingHolder(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingHolder]);

  const MemberRow = ({ m }) => {
    const isEditing = editId === m.id;
    return (
      <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 12, borderBottom: `1px solid ${C.border}`, flexWrap: "wrap" }}>
        <Avatar name={m.name} size={36} />
        {isEditing ? (
          <div style={{ flex: 1, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={{ padding: "6px 10px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, flex: 1, minWidth: 120 }} />
            <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} style={{ padding: "6px 10px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13 }}>
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <span style={{ fontSize: 10, color: C.muted }}>🎂 bday</span>
            <input type="date" value={editForm.birthday || ""} onChange={e => setEditForm(f => ({ ...f, birthday: e.target.value }))} style={{ padding: "6px 8px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13 }} />
            <span style={{ fontSize: 10, color: C.muted }}>🎉 hire</span>
            <input type="date" value={editForm.hire_date || ""} onChange={e => setEditForm(f => ({ ...f, hire_date: e.target.value }))} style={{ padding: "6px 8px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13 }} />
            <span style={{ fontSize: 10, color: C.muted }}>🌴 PTO $</span>
            <input placeholder="amount" value={editForm.pto_amount || ""} onChange={e => setEditForm(f => ({ ...f, pto_amount: e.target.value }))} style={{ padding: "6px 8px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, width: 80 }} />
            <button onClick={() => { onRosterChange("update", { ...m, ...editForm }); setEditId(null); }} style={{ padding: "6px 14px", borderRadius: 8, background: C.green, color: C.white, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Save</button>
            <button onClick={() => setEditId(null)} style={{ padding: "6px 14px", borderRadius: 8, background: C.border, color: C.ink, border: "none", fontSize: 12, cursor: "pointer" }}>Cancel</button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}{m.id === holderId && <span style={{ fontSize: 10, marginLeft: 6, background: C.goldLight, color: C.gold, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>⭐ CORE VALUE</span>}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{ROLE_OPTIONS.find(r => r.value === m.role)?.label}{m.start_date ? ` · Started ${weekLabelFromKey(m.start_date)}` : ""}{m.birthday ? ` · 🎂 ${birthdayLabel(m.birthday)}` : ""}{m.hire_date ? ` · 🎉 ${hireYearLabel(m.hire_date)}` : ""}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => { setEditId(m.id); setEditForm({ name: m.name, role: m.role, birthday: m.birthday || "", hire_date: m.hire_date || "", pto_amount: m.pto_amount || "" }); }} style={{ padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, fontSize: 11, cursor: "pointer", color: C.muted }}>Edit</button>
              <button onClick={() => onRosterChange("toggle", m)} style={{ padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${m.active ? C.pink : C.green}`, background: m.active ? C.pinkLight : C.greenLight, fontSize: 11, cursor: "pointer", fontWeight: 700, color: m.active ? C.pink : C.green }}>
                {m.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Reassignment confirmation */}
      {pendingHolder !== null && (
        <div onClick={cancelHolderChange} role="dialog" aria-modal="true"
          style={{ position: "fixed", inset: 0, background: "rgba(28,28,28,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.white, borderRadius: 14, border: `1.5px solid ${C.border}`, maxWidth: 420, width: "100%", padding: "22px 24px", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>Core Value Award · {monthLabel(mk)}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: "6px 0 12px" }}>
              {incoming ? "Reassign this month's holder?" : "Remove this month's holder?"}
            </div>
            <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.6 }}>
              {incoming
                ? <>Change {monthLabel(mk)} from <strong>{outgoing?.name}</strong> to <strong>{incoming.name}</strong>.</>
                : <>Remove <strong>{outgoing?.name}</strong> as {monthLabel(mk)}'s holder.</>}
            </div>
            {scoredWeeks > 0 && (
              <div style={{ marginTop: 12, background: C.pinkLight, border: `1.5px solid ${C.pink}44`, borderRadius: 10, padding: "12px 14px", fontSize: 12.5, color: C.ink, lineHeight: 1.6 }}>
                ⚠️ <strong>{outgoing?.name}</strong> already has <strong>{scoredWeeks} scored week{scoredWeeks !== 1 ? "s" : ""}</strong> this month. Those scores aren't deleted — they'll reappear if you set {outgoing?.name} back as {monthLabel(mk)}'s holder — but they'll be hidden while {incoming ? incoming.name : "no one"} holds the month, and {incoming ? `${incoming.name} starts from zero` : "the month shows no score"}.
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
              <button onClick={cancelHolderChange} style={{ padding: "9px 16px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, color: C.ink, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={confirmHolderChange} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: scoredWeeks > 0 ? C.pink : C.ink, color: C.white, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {incoming ? `Reassign to ${incoming.name}` : "Remove holder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Core Value Award assignment for the current month */}
      <div style={{ background: C.goldLight, border: `1.5px solid ${C.gold}66`, borderRadius: 12, padding: "14px 18px" }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>⭐ Core Value Award · {monthLabel(mk)}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select value={holderId} onChange={e => requestHolderChange(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, flex: 1, minWidth: 180, background: C.white }}>
            <option value="">— No holder assigned —</option>
            {active.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <span style={{ fontSize: 11, color: C.muted }}>Rotates monthly · scored Yes/No in the Score tab</span>
        </div>
      </div>

      <div style={{ background: C.steelLight, border: `1.5px solid ${C.steel}44`, borderRadius: 10, padding: "12px 16px", fontSize: 12, color: C.steel, fontWeight: 600 }}>
        ℹ️ Deactivating hides a team member from scoring and dashboards — history is never deleted.
      </div>
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: C.warm, borderBottom: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Active Team ({active.length})</div>
          <button onClick={() => setAdding(true)} style={{ padding: "6px 14px", borderRadius: 8, background: C.ink, color: C.white, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ Add Team Member</button>
        </div>
        {adding && (
          <div style={{ display: "flex", gap: 8, padding: "14px 20px", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap", alignItems: "center", background: C.greenLight }}>
            <input placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, flex: 1, minWidth: 140 }} />
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13 }}>
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <span style={{ fontSize: 10, color: C.muted }}>🎂 bday</span>
            <input type="date" value={form.birthday || ""} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} style={{ padding: "7px 8px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13 }} />
            <span style={{ fontSize: 10, color: C.muted }}>🎉 hire</span>
            <input type="date" value={form.hire_date || ""} onChange={e => setForm(f => ({ ...f, hire_date: e.target.value }))} style={{ padding: "7px 8px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13 }} />
            <button onClick={() => { if (form.name.trim()) { onRosterChange("add", { id: uid(), name: form.name.trim(), role: form.role, active: true, start_date: currentWeekKey(), birthday: form.birthday || null, hire_date: form.hire_date || null }); setForm({ name: "", role: "stylist" }); setAdding(false); } }} style={{ padding: "7px 16px", borderRadius: 8, background: C.green, color: C.white, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ padding: "7px 12px", borderRadius: 8, background: C.border, color: C.ink, border: "none", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        )}
        {active.map(m => <MemberRow key={m.id} m={m} />)}
      </div>
      {inactive.length > 0 && (
        <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", background: C.warm, borderBottom: `1.5px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Inactive / Alumni ({inactive.length})</div>
          </div>
          {inactive.map(m => <MemberRow key={m.id} m={m} />)}
        </div>
      )}

      {/* Bonus pool estimate — shop-wide, feeds each stylist's Rewards tab */}
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: C.warm, borderBottom: `1.5px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>💰 Bonus Pool Estimate</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Shop-wide $ pool for the year (a share of net profit — update it as you review the P&L). Split by each stylist's cumulative-points share and shown as an estimate on their Rewards tab.</div>
        </div>
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Estimated pool $</span>
          <LazyInput type="number" inputMode="decimal" value={poolEstimate} onCommit={val => onSetPoolEstimate(val)} placeholder="e.g. 12000" style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, fontWeight: 700, width: 140 }} />
          {poolEstimate ? <span style={{ fontSize: 12, color: C.muted }}>= ${Number(poolEstimate).toLocaleString()} to split</span> : null}
        </div>
      </div>

      {/* Targets & Standards — per-quarter, the single source of truth for scoring */}
      {(() => {
        const stylists = active.filter(isStylist);
        const stds = getStandards(tq, settings);
        const setTgt = (mid, field, val) => onSetStylistTarget(tq, mid, { [field]: val === "" ? null : Number(val) });
        const setStd = (metric, idx, val) => {
          const cur = { ...getStandards(tq, settings) };
          const pair = [...(cur[metric] || DEFAULT_STANDARDS[metric])];
          pair[idx] = val === "" ? DEFAULT_STANDARDS[metric][idx] : Number(val);
          cur[metric] = pair;
          onSetSetting(`standards:${tq}`, JSON.stringify(cur));
        };
        const stdRows = [["pph", "PPH ($)"], ["rebooking", "Rebooking (%)"], ["retention", "Retention (%)"], ["active_guests", "Active Guests (#)"]];
        return (
          <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", background: C.warm, borderBottom: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>🎯 Targets &amp; Standards</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Service &amp; Product are per stylist and change quarterly. PPH, rebooking, retention &amp; guests are shop-wide standards. The scorecard scores each week against its quarter's numbers.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setTq(shiftQuarter(tq, -1))} style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, cursor: "pointer", fontSize: 14 }}>◀</button>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, minWidth: 74, textAlign: "center" }}>{quarterLabel(tq)}</div>
                <button onClick={() => setTq(shiftQuarter(tq, 1))} style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, cursor: "pointer", fontSize: 14 }}>▶</button>
              </div>
            </div>

            <div style={{ padding: "10px 20px 4px", fontSize: 10, letterSpacing: 1, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>Per-stylist weekly targets</div>
            {stylists.map(m => {
              const row = (stylistTargets && stylistTargets[tq] && stylistTargets[tq][m.id]) || {};
              const legacy = STYLIST_TARGETS[m.id] || {};
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 90, fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, color: C.muted }}>Service $</span>
                    <LazyInput type="number" inputMode="decimal" value={row.service != null ? row.service : ""} placeholder={legacy.serviceWeekly != null ? String(legacy.serviceWeekly) : "—"} onCommit={val => setTgt(m.id, "service", val)} style={{ width: 84, padding: "6px 8px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, color: C.muted }}>Product $</span>
                    <LazyInput type="number" inputMode="decimal" value={row.product != null ? row.product : ""} placeholder={legacy.productWeekly != null ? String(legacy.productWeekly) : "—"} onCommit={val => setTgt(m.id, "product", val)} style={{ width: 72, padding: "6px 8px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13 }} />
                  </div>
                </div>
              );
            })}
            {stylists.length === 0 && <div style={{ padding: "6px 20px 12px", fontSize: 12, color: C.muted, fontStyle: "italic" }}>No active stylists.</div>}

            <div style={{ padding: "12px 20px 4px", fontSize: 10, letterSpacing: 1, color: C.muted, fontWeight: 700, textTransform: "uppercase", borderTop: `1px solid ${C.border}`, marginTop: 6 }}>Shop standards (whole team)</div>
            {stdRows.map(([metric, label]) => (
              <div key={metric} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 120, fontSize: 13, fontWeight: 600, color: C.ink }}>{label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: C.gold, fontWeight: 700 }}>1 at</span>
                  <LazyInput type="number" inputMode="decimal" value={stds[metric][0]} onCommit={val => setStd(metric, 0, val)} style={{ width: 74, padding: "6px 8px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>2 at</span>
                  <LazyInput type="number" inputMode="decimal" value={stds[metric][1]} onCommit={val => setStd(metric, 1, val)} style={{ width: 74, padding: "6px 8px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13 }} />
                </div>
              </div>
            ))}
            <div style={{ padding: "6px 20px 14px", fontSize: 10, color: C.muted, fontStyle: "italic" }}>Score is 0 below the "1 at" number, 1 at or above it, 2 at or above the "2 at" number. Service &amp; Product score on % of target (90% = 1, 100% = 2).</div>
          </div>
        );
      })()}

      {/* Rewards & PTO — 100 Club induction + PTO usage per person */}
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: C.warm, borderBottom: `1.5px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>🏆 Incentives &amp; Time Off</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>100 Club is your call (induct when someone's met the full standard) · PTO unlocks at 1 year, use it or lose it. Set the PTO $ amount in a member's Edit.</div>
        </div>
        {active.map((m, i) => {
          const st = ptoStatus(m);
          const last = i === active.length - 1;
          const inducted = !!m.club_100;
          const used = st.eligible && m.pto_used_year === st.periodKey;
          const subline = st.eligible
            ? `PTO ${st.periodStartYear}–${String(st.periodStartYear + 1).slice(2)} · ${m.pto_amount ? `$${m.pto_amount}` : "amount not set"}`
            : st.hasDate ? `PTO eligible ${dateLabel(st.firstAnnivKey)}` : "Add a hire date for PTO";
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", borderBottom: last ? "none" : `1px solid ${C.border}`, flexWrap: "wrap" }}>
              <Avatar name={m.name} size={28} />
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{subline}</div>
              </div>
              <button onClick={() => onRosterChange("update", { ...m, club_100: inducted ? "" : String(new Date().getFullYear()) })}
                style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${inducted ? C.gold : C.border}`, background: inducted ? C.goldLight : C.white, color: inducted ? C.gold : C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {inducted ? "⭐ 100 Club" : "100 Club"}
              </button>
              {st.eligible && (
                <button onClick={() => onRosterChange("update", { ...m, pto_used_year: used ? "" : st.periodKey })}
                  style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${used ? C.pink : C.green}`, background: used ? C.pinkLight : C.greenLight, color: used ? C.pink : C.green, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {used ? "✓ PTO used" : "PTO available"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Data cleanup — find & clear misfiled weeks */}
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: C.warm, borderBottom: `1.5px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>🧹 Data Cleanup — Scored Weeks</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Future-dated weeks are flagged — those are almost always misfiled scores. Clearing a week removes everyone's scores for it and can't be undone.</div>
        </div>
        {weeksWithScores.length === 0 ? (
          <div style={{ padding: "14px 20px", fontSize: 12, color: C.muted }}>No scored weeks yet.</div>
        ) : (
          weeksWithScores.map((w, i) => (
            <div key={w.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", borderBottom: i < weeksWithScores.length - 1 ? `1px solid ${C.border}` : "none", background: w.future ? C.pinkLight : "transparent" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{weekRangeLabel(w.key)}{w.future && <span style={{ fontSize: 10, marginLeft: 6, background: C.pink, color: C.white, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>FUTURE — CHECK</span>}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{w.members} member{w.members !== 1 ? "s" : ""} scored</div>
              </div>
              <button onClick={() => setPendingClear(w.key)} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${C.pink}`, background: C.white, color: C.pink, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Clear week</button>
            </div>
          ))
        )}
      </div>

      {/* Clear-week confirmation */}
      {pendingClear && (
        <div onClick={() => setPendingClear(null)} role="dialog" aria-modal="true"
          style={{ position: "fixed", inset: 0, background: "rgba(28,28,28,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.white, borderRadius: 14, border: `1.5px solid ${C.border}`, maxWidth: 420, width: "100%", padding: "22px 24px", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, marginBottom: 10 }}>Clear all scores for this week?</div>
            <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.6 }}>
              This permanently deletes <strong>{clearMembers} member{clearMembers !== 1 ? "s" : ""}'</strong> scores for <strong>{weekRangeLabel(pendingClear)}</strong>{pendingClear > currentWeekKey() ? " (a future-dated week)" : ""}. This can't be undone. Satisfaction ratings and coaching notes for the week are not affected.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
              <button onClick={() => setPendingClear(null)} style={{ padding: "9px 16px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, color: C.ink, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { onClearWeek(pendingClear); setPendingClear(null); }} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: C.pink, color: C.white, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Clear week</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CoachingView({ roster, allScores, notes, onSetNote, monthlyScores, leadershipFb, actuals, stylistTargets, settings }) {
  const activeTeam = roster.filter(m => m.active);
  const [week, setWeek] = useState(() => latestScoredWeek(allScores));
  const [open, setOpen] = useState({});
  const avg = teamSatisfactionAvg(notes, week, activeTeam);
  const good = avg !== null && avg >= SATISFACTION_TARGET;
  const ws = allScores?.[week] || {};
  const pink = activeTeam.filter(m => getMemberCards(m).some(c => { const s = getCardStatus(c, m.id, week, allScores, monthlyScores); return s.pts !== null && !s.green; }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: C.steelLight, border: `1.5px solid ${C.steel}44`, borderRadius: 10, padding: "12px 16px", fontSize: 12, color: C.steel, fontWeight: 600 }}>
        🔒 Leaders only — satisfaction feedback and coaching notes are private to this tab and never shown on the dashboard.
      </div>

      {/* Week stepper */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <button onClick={() => setWeek(prevWeekKey(week))} aria-label="Previous week" style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, fontSize: 16, cursor: "pointer", color: C.ink }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, minWidth: 180, textAlign: "center" }}>{weekRangeLabel(week)}</div>
        <button onClick={() => setWeek(nextWeekKey(week))} disabled={week >= currentWeekKey()} aria-label="Next week" style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${C.border}`, background: week >= currentWeekKey() ? C.warm : C.white, fontSize: 16, cursor: week >= currentWeekKey() ? "default" : "pointer", color: week >= currentWeekKey() ? C.border : C.ink }}>›</button>
      </div>

      {/* This Week's Coaching Points — numeric misses across the team, misses only */}
      {(() => {
        const qKey = quarterKeyOf(week);
        const stdz = getStandards(qKey, settings);
        const stylistMetrics = SCORECARDS.stylist.metrics.filter(m => m.score);
        const rows = [];
        activeTeam.filter(isStylist).forEach(m => {
          const tgt = getStylistTarget(m.id, qKey, stylistTargets);
          const cardActuals = (actuals && actuals[week] && actuals[week][m.id] && actuals[week][m.id].stylist) || {};
          const points = [];
          stylistMetrics.forEach(mt => {
            const actual = cardActuals[mt.id];
            if (actual == null) return;
            const derived = autoScoreMetric(actual, mt.score, tgt, stdz);
            if (derived == null || derived === 2) return; // full marks or unscored → not a coaching point
            const unit = mt.score.unit;
            // Bar = the next level up they're short of.
            let ref, label;
            if (mt.score.kind === "pct") {
              ref = tgt ? tgt[mt.score.tgt] : null; label = "target";
            } else {
              const bnd = stdz[mt.score.std];
              if (derived === 0) { ref = bnd[0]; label = mt.score.std === "pph" ? "floor" : "the minimum"; }
              else { ref = bnd[1]; label = mt.score.std === "pph" ? "the +5% goal" : "goal"; }
            }
            if (ref == null) return;
            const gap = ref - actual;
            const fmt = n => unit === "$" ? `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : unit === "%" ? `${Number(n).toFixed(1)}%` : `${n}`;
            const hist = metricHistory(actuals, m.id, "stylist", mt.id, week, 2);
            const trend = hist.length >= 2 ? (hist[1] > hist[0] ? "▲ up" : hist[1] < hist[0] ? "▼ down" : "▬ flat") : "";
            const mc = metricMissCount(actuals, m, mt, week, stylistTargets, settings, 8);
            const chronic = derived === 0 && mc.sample >= 3 && mc.misses >= 3;
            points.push({ label: mt.label, text: `${fmt(gap)} under ${label} (${fmt(actual)} vs ${fmt(ref)})`, trend, severe: derived === 0, chronic, missCount: mc.misses });
          });
          if (points.length) rows.push({ member: m, points });
        });
        return (
          <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", background: C.pinkLight, borderBottom: `1.5px solid ${C.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.pink }}>📋 This Week's Coaching Points</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Everything off-target this week, from the numbers stylists entered. 🟡 close · 🔴 missed · <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, borderRadius: 8, background: C.pink, color: C.white, fontSize: 8, fontWeight: 900, verticalAlign: "middle" }}>!!</span> recurring.</div>
            </div>
            {rows.length === 0
              ? <div style={{ padding: "14px 20px", fontSize: 12, color: C.muted, fontStyle: "italic" }}>Nothing off-target this week — or numbers not entered yet. 🎉</div>
              : rows.map((r, i) => (
                  <div key={r.member.id} style={{ padding: "11px 20px", borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 4 }}>{r.member.name}</div>
                    {r.points.map((p, j) => (
                      <div key={j} style={{ fontSize: 12, color: C.ink, display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                        {p.chronic
                          ? <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, borderRadius: 8, background: C.pink, color: C.white, fontSize: 8, fontWeight: 900, flexShrink: 0, transform: "translateY(2px)" }}>!!</span>
                          : <span style={{ color: p.severe ? C.pink : C.gold, fontWeight: 800 }}>{p.severe ? "🔴" : "🟡"}</span>}
                        <span><strong>{p.label}:</strong> {p.text}{p.trend && <span style={{ color: C.muted }}> · {p.trend}</span>}{p.chronic && <span style={{ color: C.pink, fontWeight: 700 }}> · recurring ({p.missCount}× recently)</span>}</span>
                      </div>
                    ))}
                  </div>
                ))}
          </div>
        );
      })()}

      {/* Satisfaction + feedback */}
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: C.warm, borderBottom: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Team Satisfaction & Feedback</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: avg === null ? C.muted : good ? C.green : C.pink }}>{avg === null ? "No ratings" : `Avg ${avg}/10`}</div>
        </div>
        {activeTeam.map((m, i) => {
          const nd = notes?.[week]?.[m.id] || {};
          const has = typeof nd.satisfaction === "number" || (nd.feedback && nd.feedback.trim());
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 20px", borderBottom: i < activeTeam.length - 1 ? `1px solid ${C.border}` : "none", opacity: has ? 1 : 0.6 }}>
              <Avatar name={m.name} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}</div>
                {nd.feedback ? <div style={{ fontSize: 12, color: C.ink, marginTop: 2 }}>{nd.feedback}</div> : <div style={{ fontSize: 11, color: C.muted, fontStyle: "italic", marginTop: 2 }}>No feedback</div>}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: typeof nd.satisfaction !== "number" ? C.border : nd.satisfaction >= SATISFACTION_TARGET ? C.green : C.pink, flexShrink: 0 }}>
                {typeof nd.satisfaction === "number" ? `${nd.satisfaction}/10` : "—"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leadership feedback review (upward to Vicki & Payton) */}
      {(() => {
        const mk = monthKeyOfWeek(week);
        const leaders = activeTeam.filter(isLeader);
        const pulses = leaders.map(m => leadershipFb?.pulse?.[week]?.[m.id]?.score).filter(v => typeof v === "number");
        const pAvg = pulses.length ? Math.round((pulses.reduce((a, b) => a + b, 0) / pulses.length) * 10) / 10 : null;
        const pGood = pAvg !== null && pAvg >= LEADER_PULSE_TARGET;
        return (
          <div style={{ background: C.white, border: `1.5px solid ${C.gold}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", background: C.goldLight, borderBottom: `1.5px solid ${C.gold}44`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>Leadership Feedback</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Upward from leaders · week pulse + {monthLabel(mk)} review</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: pAvg === null ? C.muted : pGood ? C.green : C.pink }}>{pAvg === null ? "No pulses" : `Pulse avg ${pAvg}/10`}</div>
            </div>
            {leaders.length === 0 && <div style={{ padding: "12px 20px", fontSize: 12, color: C.muted, fontStyle: "italic" }}>No leaders on the roster.</div>}
            {leaders.map((m, i) => {
              const p = leadershipFb?.pulse?.[week]?.[m.id] || {};
              const md = leadershipFb?.monthly?.[mk]?.[m.id] || {};
              const hasMonthly = Object.keys(md).length > 0;
              const mDone = leaderMonthlyDone(md);
              const isOpen = open[`lead-${m.id}`];
              const openAnswers = Object.keys(md).filter(k => !LEADER_SCORED_IDS.includes(k) && typeof md[k] === "string" && md[k].trim());
              return (
                <div key={m.id} style={{ borderBottom: i < leaders.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 20px" }}>
                    <Avatar name={m.name} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}</div>
                      {p.feedback ? <div style={{ fontSize: 12, color: C.ink, marginTop: 2 }}>{p.feedback}</div> : <div style={{ fontSize: 11, color: C.muted, fontStyle: "italic", marginTop: 2 }}>No weekly note</div>}
                      {hasMonthly && (
                        <button onClick={() => setOpen(o => ({ ...o, [`lead-${m.id}`]: !o[`lead-${m.id}`] }))} style={{ marginTop: 6, background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 11, fontWeight: 700, color: C.gold }}>
                          {isOpen ? "▾" : "▸"} {monthLabel(mk)} review {mDone ? "✓" : "(in progress)"}
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: typeof p.score !== "number" ? C.border : p.score >= LEADER_PULSE_TARGET ? C.green : C.pink, flexShrink: 0 }}>
                      {typeof p.score === "number" ? `${p.score}/10` : "—"}
                    </div>
                  </div>
                  {isOpen && hasMonthly && (
                    <div style={{ padding: "0 20px 12px 60px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {LEADER_SCORED_Q.filter(q => typeof md[q.id] === "number").map(q => (
                        <div key={q.id} style={{ fontSize: 12, display: "flex", gap: 8 }}>
                          <span style={{ fontWeight: 800, color: md[q.id] === 2 ? C.green : md[q.id] === 1 ? C.gold : C.pink }}>{md[q.id]}</span>
                          <span style={{ color: C.muted }}>{q.label}</span>
                        </div>
                      ))}
                      {openAnswers.map(k => (
                        <div key={k} style={{ fontSize: 12 }}>
                          <div style={{ color: C.muted, fontWeight: 600 }}>{LEADER_Q_LABELS[k] || k}</div>
                          <div style={{ color: C.ink, marginTop: 1 }}>{md[k]}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Pink team coaching notes */}
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: C.pinkLight, borderBottom: `1.5px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.pink }}>🔴 Pink Team Coaching Notes ({pink.length})</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Anyone with a pink card this week. Log the coaching conversation & action plan.</div>
        </div>
        {pink.length === 0 ? (
          <div style={{ padding: "16px 20px", fontSize: 12, color: C.muted, fontStyle: "italic" }}>No pink team members this week 🎉</div>
        ) : (
          pink.map((m, i) => {
            const { cards, zeros } = pinkDetail(m, allScores, week, monthlyScores);
            const isOpen = !!open[m.id];
            const nZeros = zeros.length;
            const nChronic = zeros.filter(z => z.chronic).length;
            const hasNote = !!(notes?.[week]?.[m.id]?.coaching_note || "").trim();
            return (
            <div key={m.id} style={{ borderBottom: i < pink.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div onClick={() => setOpen(o => ({ ...o, [m.id]: !o[m.id] }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", cursor: "pointer" }}>
                <span style={{ fontSize: 12, color: C.muted, width: 10 }}>{isOpen ? "▾" : "▸"}</span>
                <Avatar name={m.name} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}{hasNote && <span title="Has coaching note" style={{ marginLeft: 6 }}>📝</span>}</div>
                  {cards.length > 0 && <div style={{ fontSize: 11, color: C.pink, fontWeight: 700 }}>{cards.map(c => `${c.label} ${c.pts} pts${c.pending ? ` +${c.pending}?` : ""}`).join(" · ")}</div>}
                </div>
                {nZeros > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: nChronic > 0 ? C.pinkLight : C.warm, color: nChronic > 0 ? C.pink : C.muted, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {nZeros} zero{nZeros !== 1 ? "s" : ""}{nChronic > 0 ? ` · ${nChronic} chronic` : ""}
                  </span>
                )}
              </div>
              {isOpen && (
                <div style={{ padding: "0 20px 14px 40px" }}>
                  {zeros.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      {zeros.map((z, j) => (
                        <div key={j} style={{ fontSize: 12, color: C.ink, padding: "2px 0", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <strong>{z.label}</strong>
                          <span style={{ color: z.chronic ? C.pink : C.muted, fontWeight: z.chronic ? 700 : 400 }}>— missed {z.z} of {z.scored} {z.monthly ? (z.scored === 1 ? "mo" : "mos") : (z.scored === 1 ? "wk" : "wks")}</span>
                          {z.chronic && <span style={{ fontSize: 9, letterSpacing: 0.5, background: C.pink, color: C.white, padding: "1px 6px", borderRadius: 10, fontWeight: 800 }}>CHRONIC</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <LazyInput as="textarea"
                    value={notes?.[week]?.[m.id]?.coaching_note || ""}
                    onCommit={text => onSetNote(week, m.id, { coaching_note: text })}
                    placeholder="Coaching notes & action plan…"
                    rows={2}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
                  />
                </div>
              )}
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function RptSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.gold, textTransform: "uppercase", letterSpacing: 1.5, borderBottom: `2px solid ${C.gold}`, paddingBottom: 4, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function ReportsView({ roster, allScores, monthlyScores, companyScores, actuals, stylistTargets, settings, rocks, notes, poolEstimate }) {
  const [mode, setMode] = useState("quarter");
  const [qk, setQk] = useState(currentQuarterKey());
  const [wk, setWk] = useState(() => latestScoredWeek(allScores));
  const activeTeam = roster.filter(m => m.active);
  const stylists = activeTeam.filter(isStylist);
  const money = n => "$" + Math.round(n).toLocaleString();

  const qYear = qk.slice(0, 4);
  const qNum = parseInt(qk.slice(qk.indexOf("Q") + 1), 10);
  const qWeeks = Object.keys(allScores || {}).filter(w => getYear(w) === qYear && getQuarter(w) === qNum).sort();

  // Rocks for the quarter
  const leaders = activeTeam.filter(isLeader);
  const rocksAll = Object.values(rocks || {}).filter(r => r.quarter_key === qk);
  const rocksDone = rocksAll.filter(r => r.status === "complete").length;

  // Company quarterly rollup (sales summed, rates averaged)
  const stylistCount = stylists.length;
  const compRollup = COMPANY_METRICS.map(m => {
    let vals;
    if (m.auto) vals = qWeeks.map(w => teamSatisfactionAvg(notes, w, activeTeam)).filter(v => v != null);
    else vals = qWeeks.map(w => companyScores?.[w]?.[m.id]).filter(v => typeof v === "number");
    if (!vals.length) return { m, value: null, target: null, green: null, n: 0 };
    const perWeek = m.id === "service_sales" ? (SERVICE_TARGETS[`${qYear}-${String((qNum - 1) * 3 + 1).padStart(2, "0")}`]?.weekly ?? null) : companyTargetWeekly(m.id, `${qYear}-${String((qNum - 1) * 3 + 1).padStart(2, "0")}`, stylistCount);
    let value, target;
    if (m.agg === "sum") { value = Math.round(vals.reduce((a, b) => a + b, 0)); target = perWeek != null ? Math.round(perWeek * vals.length) : null; }
    else { value = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100; target = perWeek; }
    return { m, value, target, green: companyGreen(m.dir, value, target), n: vals.length };
  });

  // Per-stylist quarter performance
  const teamRows = stylists.map(m => {
    let green = 0, scored = 0;
    qWeeks.forEach(w => { const p = getMemberBonusWeekPts(m, allScores[w]); if (p !== null) { scored++; if (p >= GREEN_MIN) green++; } });
    return { m, green, scored, pts: memberQuarterPts(m, allScores, qYear, qNum) };
  }).sort((a, b) => b.pts - a.pts);
  const champ = teamRows.filter(r => inBonusPool(r.m) || true)[0];

  const printBtn = <button onClick={() => window.print()} style={{ padding: "8px 16px", borderRadius: 8, background: C.gold, color: C.white, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>🖨 Print / Save PDF</button>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 24px 60px" }}>
      <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 2, background: C.white, borderRadius: 8, padding: 3, border: `1.5px solid ${C.border}` }}>
          {[["quarter", "Quarterly"], ["week", "Weekly"]].map(([mv, ml]) => (
            <button key={mv} onClick={() => setMode(mv)} style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: mode === mv ? C.ink : "transparent", color: mode === mv ? C.white : C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{ml}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {mode === "quarter"
            ? <><button onClick={() => setQk(shiftQuarter(qk, -1))} style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, cursor: "pointer" }}>◀</button><div style={{ fontSize: 13, fontWeight: 800, minWidth: 74, textAlign: "center" }}>{quarterLabel(qk)}</div><button onClick={() => setQk(shiftQuarter(qk, 1))} style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, cursor: "pointer" }}>▶</button></>
            : <><button onClick={() => setWk(prevWeekKey(wk))} style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, cursor: "pointer" }}>◀</button><div style={{ fontSize: 12, fontWeight: 700, minWidth: 90, textAlign: "center" }}>{weekLabelFromKey(wk)}</div><button onClick={() => setWk(nextWeekKey(wk))} style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, cursor: "pointer" }}>▶</button></>}
          {printBtn}
        </div>
      </div>

      <div className="print-area" style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "28px 32px" }}>
        <div style={{ borderBottom: `2px solid ${C.ink}`, paddingBottom: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>The Refinery · STRA-TEGIC</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.ink }}>{mode === "quarter" ? `Quarterly Review — ${quarterLabel(qk)}` : `Weekly Report — ${weekLabelFromKey(wk)}`}</div>
        </div>

        {mode === "quarter" ? (
          <>
            <RptSection title={`Rocks — ${rocksDone} of ${rocksAll.length} complete`}>
              {leaders.map(l => {
                const rks = rocksAll.filter(r => r.member_id === l.id);
                if (!rks.length) return null;
                return (
                  <div key={l.id} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{l.name}</div>
                    {rks.map(r => { const s = ROCK_STATUS[r.status] || ROCK_STATUS.not_started; return (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginTop: 2 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 4, background: s.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, color: C.ink }}>{r.title || "(untitled)"}</span>
                        <span style={{ color: s.color, fontWeight: 700 }}>{s.label}</span>
                      </div>); })}
                  </div>
                );
              })}
              {rocksAll.length === 0 && <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>No rocks set this quarter.</div>}
            </RptSection>

            <RptSection title="Company Scorecard — quarter">
              {compRollup.map(r => (
                <div key={r.m.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "3px 0" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: r.green === null ? C.border : r.green ? C.green : C.pink, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: C.ink }}>{r.m.label} <span style={{ color: C.muted }}>({r.n} wk{r.n !== 1 ? "s" : ""}, {r.m.agg === "sum" ? "total" : "avg"})</span></span>
                  <span style={{ fontWeight: 700, color: r.green === null ? C.muted : r.green ? C.green : C.pink }}>{fmtCompany(r.m.kind, r.value)}</span>
                  <span style={{ color: C.muted, minWidth: 80, textAlign: "right" }}>/ {fmtCompany(r.m.kind, r.target)}</span>
                </div>
              ))}
            </RptSection>

            <RptSection title="Team — quarter performance">
              {teamRows.map((r, i) => (
                <div key={r.m.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "3px 0" }}>
                  <span style={{ width: 20, color: C.muted, fontWeight: 700 }}>{i === 0 && r.pts > 0 ? "🥇" : `#${i + 1}`}</span>
                  <span style={{ flex: 1, fontWeight: 700, color: C.ink }}>{r.m.name}</span>
                  <span style={{ color: C.green, fontWeight: 700 }}>{r.green} green</span>
                  <span style={{ color: C.muted }}>/ {r.scored} wks</span>
                  <span style={{ minWidth: 60, textAlign: "right", fontWeight: 700, color: C.ink }}>{r.pts} pts</span>
                </div>
              ))}
              {champ && champ.pts > 0 && <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, marginTop: 8 }}>🏆 STRA-tegic Champion: {champ.m.name} ({champ.pts} pts)</div>}
            </RptSection>
          </>
        ) : (
          <WeeklyReportBody wk={wk} roster={roster} allScores={allScores} monthlyScores={monthlyScores} companyScores={companyScores} actuals={actuals} stylistTargets={stylistTargets} settings={settings} notes={notes} />
        )}
        <div style={{ marginTop: 24, paddingTop: 12, borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.muted }}>Generated from live data · The Refinery STRA-TEGIC Performance System</div>
      </div>
    </div>
  );
}

function WeeklyReportBody({ wk, roster, allScores, monthlyScores, companyScores, actuals, stylistTargets, settings, notes }) {
  const activeTeam = roster.filter(m => m.active);
  const stylists = activeTeam.filter(isStylist);
  const entries = [];
  activeTeam.forEach(m => getMemberCards(m).forEach(card => { const s = getCardStatus(card, m.id, wk, allScores, monthlyScores); if (s.pts !== null) entries.push({ name: m.name, card: SCORECARDS[card].label, green: s.green, pts: s.pts }); }));
  const greenN = entries.filter(e => e.green).length, pinkN = entries.filter(e => !e.green).length;
  const sat = teamSatisfactionAvg(notes, wk, activeTeam);
  const cs = companyScores?.[wk] || {};
  return (
    <>
      <RptSection title="Team status">
        <div style={{ fontSize: 13, color: C.ink }}><strong style={{ color: C.green }}>{greenN} green</strong> · <strong style={{ color: C.pink }}>{pinkN} pink</strong> (per card) · Team satisfaction {sat == null ? "—" : `${sat}/10`}</div>
      </RptSection>
      <RptSection title="Company numbers">
        {COMPANY_METRICS.filter(m => !m.auto).map(m => (
          <div key={m.id} style={{ fontSize: 12, padding: "2px 0", display: "flex", gap: 8 }}><span style={{ flex: 1, color: C.ink }}>{m.label}</span><span style={{ fontWeight: 700 }}>{typeof cs[m.id] === "number" ? fmtCompany(m.kind, cs[m.id]) : "—"}</span></div>
        ))}
      </RptSection>
      <RptSection title="Pink / coaching">
        {(() => {
          const rows = entries.filter(e => !e.green);
          return rows.length ? rows.map((e, i) => <div key={i} style={{ fontSize: 12, color: C.ink, padding: "2px 0" }}>🔴 {e.name} — {e.card} ({e.pts} pts)</div>) : <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>Everyone green this week. 🎉</div>;
        })()}
      </RptSection>
    </>
  );
}

function RefineryApp() {
  const [roster, setRoster] = useState([]);
  const [allScores, setAllScores] = useState({});
  const [holders, setHolders] = useState({});
  const [shoutouts, setShoutouts] = useState([]);
  const [notes, setNotes] = useState({});
  const [monthlyScores, setMonthlyScores] = useState({});
  const [companyScores, setCompanyScores] = useState({});
  const [leadershipFb, setLeadershipFb] = useState({ pulse: {}, monthly: {} });
  const [settings, setSettings] = useState({});
  const [stylistTargets, setStylistTargets] = useState({});
  const [actuals, setActuals] = useState({});
  const [rocks, setRocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [unlockedGroups, setUnlockedGroups] = useState({});
  const [pinPromptFor, setPinPromptFor] = useState(null);

  useEffect(() => {
    async function loadRoster() {
      const { data, error } = await supabase.from("roster").select("*").order("name");
      if (!error && data) setRoster(data);
    }
    async function loadScores() {
      const { data, error } = await supabase.from("scores").select("*");
      if (!error && data) {
        const structured = {};
        data.forEach(row => {
          if (!structured[row.week_key]) structured[row.week_key] = {};
          if (!structured[row.week_key][row.member_id]) structured[row.week_key][row.member_id] = {};
          if (!structured[row.week_key][row.member_id][row.card_type]) structured[row.week_key][row.member_id][row.card_type] = {};
          structured[row.week_key][row.member_id][row.card_type][row.metric_id] = row.score;
        });
        setAllScores(structured);
      }
      setLoading(false);
    }
    async function loadHolders() {
      const { data, error } = await supabase.from("core_value_holder").select("*");
      if (!error && data) {
        const h = {};
        data.forEach(r => { h[r.month_key] = r.member_id; });
        setHolders(h);
      }
      // If the table doesn't exist yet, holders simply stays empty (no crash).
    }
    async function loadShoutouts() {
      const { data, error } = await supabase.from("shout_outs").select("*").order("created_at", { ascending: false });
      if (!error && data) setShoutouts(data);
      // Missing table → stays empty, no crash.
    }
    async function loadNotes() {
      const { data, error } = await supabase.from("member_week_notes").select("*");
      if (!error && data) {
        const structured = {};
        data.forEach(r => {
          (structured[r.week_key] = structured[r.week_key] || {})[r.member_id] = { satisfaction: r.satisfaction, feedback: r.feedback, coaching_note: r.coaching_note };
        });
        setNotes(structured);
      }
      // Missing table → stays empty, no crash.
    }
    async function loadMonthly() {
      const { data, error } = await supabase.from("monthly_scores").select("*");
      if (!error && data) {
        const structured = {};
        data.forEach(r => {
          const mk = structured[r.month_key] = structured[r.month_key] || {};
          const mem = mk[r.member_id] = mk[r.member_id] || {};
          const card = mem[r.card_type] = mem[r.card_type] || {};
          card[r.metric_id] = r.score;
        });
        setMonthlyScores(structured);
      }
      // Missing table → stays empty, no crash.
    }
    async function loadCompany() {
      const { data, error } = await supabase.from("company_scores").select("*");
      if (!error && data) {
        const structured = {};
        data.forEach(r => {
          (structured[r.week_key] = structured[r.week_key] || {})[r.metric_id] = Number(r.value);
        });
        setCompanyScores(structured);
      }
      // Missing table → stays empty, no crash.
    }
    async function loadLeadership() {
      const { data, error } = await supabase.from("leadership_feedback").select("*");
      if (!error && data) {
        const pulse = {}, monthly = {};
        data.forEach(r => {
          const bucket = r.kind === "pulse" ? pulse : monthly;
          (bucket[r.period_key] = bucket[r.period_key] || {})[r.member_id] = r.data || {};
        });
        setLeadershipFb({ pulse, monthly });
      }
      // Missing table → stays empty, no crash.
    }
    async function loadSettings() {
      const { data, error } = await supabase.from("app_settings").select("*");
      if (!error && data) {
        const s = {};
        data.forEach(r => { s[r.key] = r.value; });
        setSettings(s);
      }
    }
    async function loadTargets() {
      const { data, error } = await supabase.from("stylist_targets").select("*");
      if (!error && data) {
        const structured = {};
        data.forEach(r => {
          const q = structured[r.quarter_key] = structured[r.quarter_key] || {};
          q[r.member_id] = { service: r.service != null ? Number(r.service) : null, product: r.product != null ? Number(r.product) : null };
        });
        setStylistTargets(structured);
      }
    }
    async function loadActuals() {
      const { data, error } = await supabase.from("metric_actuals").select("*");
      if (!error && data) {
        const s = {};
        data.forEach(r => {
          const w = s[r.week_key] = s[r.week_key] || {};
          const mem = w[r.member_id] = w[r.member_id] || {};
          const card = mem[r.card_type] = mem[r.card_type] || {};
          card[r.metric_id] = Number(r.value);
        });
        setActuals(s);
      }
    }
    async function loadRocks() {
      const { data, error } = await supabase.from("rocks").select("*");
      if (!error && data) {
        const s = {};
        data.forEach(r => { s[r.id] = { id: r.id, quarter_key: r.quarter_key, member_id: r.member_id, title: r.title || "", status: r.status || "not_started" }; });
        setRocks(s);
      }
    }
    loadRoster();
    loadScores();
    loadHolders();
    loadShoutouts();
    loadNotes();
    loadMonthly();
    loadCompany();
    loadLeadership();
    loadSettings();
    loadTargets();
    loadActuals();
    loadRocks();
  }, []);

  useEffect(() => {
    const channel = supabase.channel("scores-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "scores" }, payload => {
        const row = payload.new;
        if (!row) return;
        setAllScores(prev => {
          const next = JSON.parse(JSON.stringify(prev));
          if (!next[row.week_key]) next[row.week_key] = {};
          if (!next[row.week_key][row.member_id]) next[row.week_key][row.member_id] = {};
          if (!next[row.week_key][row.member_id][row.card_type]) next[row.week_key][row.member_id][row.card_type] = {};
          next[row.week_key][row.member_id][row.card_type][row.metric_id] = row.score;
          return next;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    const channel = supabase.channel("core-value-holder-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "core_value_holder" }, payload => {
        const row = payload.new;
        if (!row) return;
        setHolders(prev => ({ ...prev, [row.month_key]: row.member_id }));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    const channel = supabase.channel("shoutouts-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "shout_outs" }, payload => {
        if (payload.eventType === "INSERT" && payload.new) {
          setShoutouts(prev => prev.some(s => s.id === payload.new.id) ? prev : [payload.new, ...prev]);
        }
        if (payload.eventType === "DELETE" && payload.old) {
          setShoutouts(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    const channel = supabase.channel("mwn-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "member_week_notes" }, payload => {
        const r = payload.new || payload.old;
        if (!r) return;
        setNotes(prev => {
          const next = { ...prev, [r.week_key]: { ...(prev[r.week_key] || {}) } };
          if (payload.eventType === "DELETE") delete next[r.week_key][r.member_id];
          else next[r.week_key][r.member_id] = { satisfaction: r.satisfaction, feedback: r.feedback, coaching_note: r.coaching_note };
          return next;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const handleSetNote = async (weekKey, memberId, patch) => {
    const existing = notes?.[weekKey]?.[memberId] || {};
    const merged = { ...existing, ...patch };
    setNotes(prev => {
      const next = { ...prev, [weekKey]: { ...(prev[weekKey] || {}) } };
      next[weekKey][memberId] = merged;
      return next;
    });
    await supabase.from("member_week_notes").upsert(
      { week_key: weekKey, member_id: memberId, ...merged, updated_at: new Date().toISOString() },
      { onConflict: "week_key,member_id" }
    );
  };

  useEffect(() => {
    const channel = supabase.channel("monthly-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "monthly_scores" }, payload => {
        const r = payload.new || payload.old;
        if (!r) return;
        setMonthlyScores(prev => {
          const next = { ...prev, [r.month_key]: { ...(prev[r.month_key] || {}) } };
          next[r.month_key][r.member_id] = { ...(next[r.month_key][r.member_id] || {}) };
          next[r.month_key][r.member_id][r.card_type] = { ...(next[r.month_key][r.member_id][r.card_type] || {}) };
          if (payload.eventType === "DELETE") delete next[r.month_key][r.member_id][r.card_type][r.metric_id];
          else next[r.month_key][r.member_id][r.card_type][r.metric_id] = r.score;
          return next;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const handleSetMonthly = async (monthKey, memberId, cardType, metricId, val) => {
    setMonthlyScores(prev => {
      const next = { ...prev, [monthKey]: { ...(prev[monthKey] || {}) } };
      next[monthKey][memberId] = { ...(next[monthKey][memberId] || {}) };
      next[monthKey][memberId][cardType] = { ...(next[monthKey][memberId][cardType] || {}) };
      next[monthKey][memberId][cardType][metricId] = val;
      return next;
    });
    await supabase.from("monthly_scores").upsert({
      month_key: monthKey, member_id: memberId, card_type: cardType, metric_id: metricId, score: val, updated_at: new Date().toISOString()
    }, { onConflict: "month_key,member_id,card_type,metric_id" });
  };

  useEffect(() => {
    const channel = supabase.channel("company-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "company_scores" }, payload => {
        const r = payload.new || payload.old;
        if (!r) return;
        setCompanyScores(prev => {
          const next = { ...prev, [r.week_key]: { ...(prev[r.week_key] || {}) } };
          if (payload.eventType === "DELETE") delete next[r.week_key][r.metric_id];
          else next[r.week_key][r.metric_id] = Number(r.value);
          return next;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const handleSetCompany = async (weekKey, metricId, value) => {
    if (value == null) {
      setCompanyScores(prev => {
        const next = { ...prev, [weekKey]: { ...(prev[weekKey] || {}) } };
        delete next[weekKey][metricId];
        return next;
      });
      await supabase.from("company_scores").delete().eq("week_key", weekKey).eq("metric_id", metricId);
      return;
    }
    setCompanyScores(prev => {
      const next = { ...prev, [weekKey]: { ...(prev[weekKey] || {}) } };
      next[weekKey][metricId] = value;
      return next;
    });
    await supabase.from("company_scores").upsert({
      week_key: weekKey, metric_id: metricId, value, updated_at: new Date().toISOString()
    }, { onConflict: "week_key,metric_id" });
  };

  useEffect(() => {
    const channel = supabase.channel("leadership-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leadership_feedback" }, payload => {
        const r = payload.new || payload.old;
        if (!r) return;
        setLeadershipFb(prev => {
          const bucketName = r.kind === "pulse" ? "pulse" : "monthly";
          const bucket = { ...prev[bucketName], [r.period_key]: { ...(prev[bucketName]?.[r.period_key] || {}) } };
          if (payload.eventType === "DELETE") delete bucket[r.period_key][r.member_id];
          else bucket[r.period_key][r.member_id] = r.data || {};
          return { ...prev, [bucketName]: bucket };
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const setLeaderRow = async (kind, periodKey, memberId, patch) => {
    const bucketName = kind === "pulse" ? "pulse" : "monthly";
    const existing = leadershipFb?.[bucketName]?.[periodKey]?.[memberId] || {};
    const merged = { ...existing, ...patch };
    setLeadershipFb(prev => {
      const bucket = { ...prev[bucketName], [periodKey]: { ...(prev[bucketName]?.[periodKey] || {}) } };
      bucket[periodKey][memberId] = merged;
      return { ...prev, [bucketName]: bucket };
    });
    await supabase.from("leadership_feedback").upsert(
      { period_key: periodKey, member_id: memberId, kind, data: merged, updated_at: new Date().toISOString() },
      { onConflict: "period_key,member_id,kind" }
    );
  };
  const handleSetLeaderPulse = (weekKey, memberId, patch) => setLeaderRow("pulse", weekKey, memberId, patch);
  const handleSetLeaderMonthly = (monthKey, memberId, patch) => setLeaderRow("monthly", monthKey, memberId, patch);

  useEffect(() => {
    const channel = supabase.channel("settings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, payload => {
        const r = payload.new || payload.old;
        if (!r) return;
        setSettings(prev => {
          const next = { ...prev };
          if (payload.eventType === "DELETE") delete next[r.key];
          else next[r.key] = r.value;
          return next;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const handleSetSetting = async (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    await supabase.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  };

  useEffect(() => {
    const channel = supabase.channel("targets-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "stylist_targets" }, payload => {
        const r = payload.new || payload.old;
        if (!r) return;
        setStylistTargets(prev => {
          const next = { ...prev, [r.quarter_key]: { ...(prev[r.quarter_key] || {}) } };
          if (payload.eventType === "DELETE") delete next[r.quarter_key][r.member_id];
          else next[r.quarter_key][r.member_id] = { service: r.service != null ? Number(r.service) : null, product: r.product != null ? Number(r.product) : null };
          return next;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const handleSetStylistTarget = async (quarterKey, memberId, patch) => {
    const existing = stylistTargets?.[quarterKey]?.[memberId] || {};
    const merged = { ...existing, ...patch };
    setStylistTargets(prev => {
      const next = { ...prev, [quarterKey]: { ...(prev[quarterKey] || {}) } };
      next[quarterKey][memberId] = merged;
      return next;
    });
    await supabase.from("stylist_targets").upsert({
      quarter_key: quarterKey, member_id: memberId,
      service: merged.service != null && merged.service !== "" ? merged.service : null,
      product: merged.product != null && merged.product !== "" ? merged.product : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "quarter_key,member_id" });
  };

  useEffect(() => {
    const channel = supabase.channel("actuals-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "metric_actuals" }, payload => {
        const r = payload.new || payload.old;
        if (!r) return;
        setActuals(prev => {
          const next = JSON.parse(JSON.stringify(prev));
          next[r.week_key] = next[r.week_key] || {};
          next[r.week_key][r.member_id] = next[r.week_key][r.member_id] || {};
          next[r.week_key][r.member_id][r.card_type] = next[r.week_key][r.member_id][r.card_type] || {};
          if (payload.eventType === "DELETE") delete next[r.week_key][r.member_id][r.card_type][r.metric_id];
          else next[r.week_key][r.member_id][r.card_type][r.metric_id] = Number(r.value);
          return next;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // Stylist enters an actual number → store it AND write the derived 0/1/2 to scores.
  const handleEnterActual = async (weekKey, memberId, cardType, metricId, value, score) => {
    const clearing = value == null || value === "";
    setActuals(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[weekKey] = next[weekKey] || {};
      next[weekKey][memberId] = next[weekKey][memberId] || {};
      next[weekKey][memberId][cardType] = next[weekKey][memberId][cardType] || {};
      if (clearing) delete next[weekKey][memberId][cardType][metricId];
      else next[weekKey][memberId][cardType][metricId] = Number(value);
      return next;
    });
    if (clearing) {
      await supabase.from("metric_actuals").delete().eq("week_key", weekKey).eq("member_id", memberId).eq("card_type", cardType).eq("metric_id", metricId);
      setAllScores(prev => { const n = JSON.parse(JSON.stringify(prev)); if (n[weekKey] && n[weekKey][memberId] && n[weekKey][memberId][cardType]) delete n[weekKey][memberId][cardType][metricId]; return n; });
      await supabase.from("scores").delete().eq("week_key", weekKey).eq("member_id", memberId).eq("card_type", cardType).eq("metric_id", metricId);
      return;
    }
    await supabase.from("metric_actuals").upsert({ week_key: weekKey, member_id: memberId, card_type: cardType, metric_id: metricId, value: Number(value), updated_at: new Date().toISOString() }, { onConflict: "week_key,member_id,card_type,metric_id" });
    if (score != null) await handleScore(weekKey, memberId, cardType, metricId, score);
  };

  useEffect(() => {
    const channel = supabase.channel("rocks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "rocks" }, payload => {
        const r = payload.new || payload.old;
        if (!r) return;
        setRocks(prev => {
          const next = { ...prev };
          if (payload.eventType === "DELETE") delete next[r.id];
          else next[r.id] = { id: r.id, quarter_key: r.quarter_key, member_id: r.member_id, title: r.title || "", status: r.status || "not_started" };
          return next;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const handleAddRock = async (quarterKey, memberId) => {
    const rock = { id: uid(), quarter_key: quarterKey, member_id: memberId, title: "", status: "not_started" };
    setRocks(prev => ({ ...prev, [rock.id]: rock }));
    await supabase.from("rocks").insert({ ...rock, updated_at: new Date().toISOString() });
  };
  const handleUpdateRock = async (id, patch) => {
    setRocks(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    await supabase.from("rocks").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  };
  const handleDeleteRock = async id => {
    setRocks(prev => { const next = { ...prev }; delete next[id]; return next; });
    await supabase.from("rocks").delete().eq("id", id);
  };

  const handleScore = async (weekKey, memberId, cardType, metricId, val) => {
    setAllScores(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[weekKey]) next[weekKey] = {};
      if (!next[weekKey][memberId]) next[weekKey][memberId] = {};
      if (!next[weekKey][memberId][cardType]) next[weekKey][memberId][cardType] = {};
      next[weekKey][memberId][cardType][metricId] = val;
      return next;
    });
    await supabase.from("scores").upsert({
      week_key: weekKey, member_id: memberId, card_type: cardType, metric_id: metricId, score: val, updated_at: new Date().toISOString()
    }, { onConflict: "week_key,member_id,card_type,metric_id" });
  };

  const handleSetHolder = async (monthKey, memberId) => {
    setHolders(prev => ({ ...prev, [monthKey]: memberId }));
    if (!memberId) {
      await supabase.from("core_value_holder").delete().eq("month_key", monthKey);
      return;
    }
    await supabase.from("core_value_holder").upsert({
      month_key: monthKey, member_id: memberId, updated_at: new Date().toISOString()
    }, { onConflict: "month_key" });
  };

  const handleAddShoutout = async (row) => {
    const rec = { id: uid(), created_at: new Date().toISOString(), note: "", ...row };
    setShoutouts(prev => [rec, ...prev]);
    await supabase.from("shout_outs").insert(rec);
  };

  const handleDeleteShoutout = async (id) => {
    setShoutouts(prev => prev.filter(s => s.id !== id));
    await supabase.from("shout_outs").delete().eq("id", id);
  };

  const handleClearWeek = async (weekKey) => {
    setAllScores(prev => { const n = { ...prev }; delete n[weekKey]; return n; });
    await supabase.from("scores").delete().eq("week_key", weekKey);
  };

  const handleRosterChange = async (action, member) => {
    if (action === "add") {
      await supabase.from("roster").insert(member);
      setRoster(prev => [...prev, member]);
    } else if (action === "toggle") {
      const updated = { ...member, active: !member.active, start_date: !member.active ? currentWeekKey() : member.start_date };
      await supabase.from("roster").update({ active: updated.active, start_date: updated.start_date }).eq("id", member.id);
      setRoster(prev => prev.map(m => m.id === member.id ? updated : m));
    } else if (action === "update") {
      await supabase.from("roster").update({ name: member.name, role: member.role, birthday: member.birthday || null, hire_date: member.hire_date || null, pto_amount: member.pto_amount || null, pto_used_year: member.pto_used_year || null, club_100: member.club_100 || null }).eq("id", member.id);
      setRoster(prev => prev.map(m => m.id === member.id ? member : m));
    }
  };

  const NavBtn = ({ id, label }) => {
    const group = PIN_GROUP[id];
    const locked = group && !unlockedGroups[group];
    return (
      <button onClick={() => { if (locked) { setPinPromptFor({ view: id, group }); } else { setView(id); } }} style={{ padding: "8px 16px", borderRadius: "8px 8px 0 0", background: view === id ? C.warm : "transparent", color: view === id ? C.ink : "#aaa", border: "none", fontWeight: view === id ? 700 : 500, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
        {label}{locked && <span style={{ fontSize: 10 }}>🔒</span>}
      </button>
    );
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.warm, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: C.gold, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>The Refinery</div>
        <div style={{ fontSize: 16, color: C.muted }}>Loading performance data...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.warm, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@media print { .no-print { display: none !important; } body { background: #fff !important; } .print-area { box-shadow: none !important; border: none !important; } }`}</style>
      <div className="no-print" style={{ background: C.ink, padding: "18px 24px 0", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 10, letterSpacing: 3, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>The Refinery</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: C.white, letterSpacing: -0.3 }}>STRA-TEGIC Performance System</span>
            <span style={{ fontSize: 10, color: C.gold, fontWeight: 700 }}>v30</span>
          </div>
          <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
            <NavBtn id="dashboard" label="Dashboard" />
            <NavBtn id="score" label="Score This Week" />
            <NavBtn id="history" label="History & Tracking" />
            <NavBtn id="coaching" label="Coaching" />
            <NavBtn id="roster" label="Roster" />
            <NavBtn id="reports" label="Reports" />
          </div>
        </div>
      </div>
      {pinPromptFor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setPinPromptFor(null)}>
          <div onClick={e => e.stopPropagation()}>
            <PinLock expectedPin={PIN_FOR[pinPromptFor.group]} label={PIN_LABEL[pinPromptFor.group]} onUnlock={() => { setUnlockedGroups(g => ({ ...g, [pinPromptFor.group]: true })); setView(pinPromptFor.view); setPinPromptFor(null); }} />
          </div>
        </div>
      )}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {view === "dashboard" && <Dashboard roster={roster} allScores={allScores} holders={holders} shoutouts={shoutouts} onAddShoutout={handleAddShoutout} onDeleteShoutout={handleDeleteShoutout} unlocked={!!(unlockedGroups.score || unlockedGroups.admin)} notes={notes} monthlyScores={monthlyScores} companyScores={companyScores} rocks={rocks} />}
        {view === "score" && <ScoreView roster={roster} allScores={allScores} onScore={handleScore} holders={holders} notes={notes} onSetNote={handleSetNote} monthlyScores={monthlyScores} onSetMonthly={handleSetMonthly} companyScores={companyScores} onSetCompany={handleSetCompany} leadershipFb={leadershipFb} onSetLeaderPulse={handleSetLeaderPulse} onSetLeaderMonthly={handleSetLeaderMonthly} poolEstimate={parseFloat(settings.pool_estimate) || 0} actuals={actuals} onEnterActual={handleEnterActual} stylistTargets={stylistTargets} settings={settings} rocks={rocks} onAddRock={handleAddRock} onUpdateRock={handleUpdateRock} onDeleteRock={handleDeleteRock} />}
        {view === "history" && <HistoryView roster={roster} allScores={allScores} holders={holders} monthlyScores={monthlyScores} />}
        {view === "coaching" && <CoachingView roster={roster} allScores={allScores} notes={notes} onSetNote={handleSetNote} monthlyScores={monthlyScores} leadershipFb={leadershipFb} actuals={actuals} stylistTargets={stylistTargets} settings={settings} />}
        {view === "roster" && <RosterView roster={roster} onRosterChange={handleRosterChange} holders={holders} onSetHolder={handleSetHolder} allScores={allScores} onClearWeek={handleClearWeek} poolEstimate={settings.pool_estimate || ""} onSetPoolEstimate={v => handleSetSetting("pool_estimate", v)} stylistTargets={stylistTargets} onSetStylistTarget={handleSetStylistTarget} settings={settings} onSetSetting={handleSetSetting} />}
        {view === "reports" && <ReportsView roster={roster} allScores={allScores} monthlyScores={monthlyScores} companyScores={companyScores} actuals={actuals} stylistTargets={stylistTargets} settings={settings} rocks={rocks} notes={notes} poolEstimate={parseFloat(settings.pool_estimate) || 0} />}
      </div>
    </div>
  );
}
