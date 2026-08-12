import { useState, useEffect, useMemo } from "react";
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
const PPH_FLOOR = 68.22;

const SCORECARDS = {
  stylist: {
    label: "Stylist",
    metrics: [
      { id: "service_sales",    label: "Service Sales vs Weekly Target",        desc: "0 = <90% of target · 1 = 90–99% · 2 = 100%+",                source: "Phorest"   },
      { id: "product_sales",    label: "Product Sales vs Weekly Target",        desc: "0 = <90% of target · 1 = 90–99% · 2 = 100%+",                source: "Phorest"   },
      { id: "pph",              label: "PPH",                                   desc: "Floor target $68.22 · 0 = below · 1 = at floor · 2 = floor +5%", source: "Phorest"   },
      { id: "rebooking",        label: "Rebooking Rate",                       desc: "0 = <80% · 1 = 80–84% · 2 = 85%+",                           source: "Phorest"   },
      { id: "retention",        label: "Retention Rate (90-day rolling)",      desc: "0 = <75% · 1 = 75–84% · 2 = 85%+ · Grace period: 90 days",   source: "Phorest",  grace: true },
      { id: "active_guests",    label: "Active Guest Count",                   desc: "0 = <70 · 1 = 70–84 · 2 = 85+",                              source: "Phorest"   },
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
      { id: "pink_trend",       label: "Pink Team Trend (month over month)",   desc: "0 = more pink than last month · 1 = same or fewer than last month · 2 = zero pink this month", source: "Scorecard" },
      { id: "team_kpi_avg",     label: "Team KPI Average",                     desc: "0 = <50% · 1 = 50–74% · 2 = 75%+ · Auto-calculated from this week's scores", source: "Scorecard" },
      { id: "open_issues",      label: "Open Issues",                          desc: "0 = untouched/rolled over · 1 = resolved or in progress · 2 = resolved + system created to prevent recurrence", source: "Manual" },
      { id: "hiring",           label: "Hiring Pipeline",                      desc: "0 = 0 interviews/mo · 1 = 1/mo · 2 = 2+/mo",                 source: "Manual"    },
      { id: "coaching_outcomes",label: "Coaching Outcomes (prior week)",       desc: "0 = coached but no change or got worse · 1 = measurable improvement but still pink · 2 = moved to green", source: "Scorecard" },
      { id: "leadership_align", label: "Leadership Team Alignment",            desc: "0 = TL or Mgr missing targets · 1 = both meeting · 2 = both exceeding", source: "Scorecard" },
    ],
  },
  owner: {
    label: "Vicki",
    metrics: [
      { id: "revenue",          label: "Revenue vs Monthly Target",            desc: "0 = <95% of $58,315 · 1 = 95–99% · 2 = 100%+",               source: "Phorest"   },
      { id: "profit_margin",    label: "Operating Profit Margin",              desc: "0 = below target · 1 = at target · 2 = above target",         source: "Financial" },
      { id: "payroll_pct",      label: "Payroll %",                            desc: "0 = above target % · 1 = at target % · 2 = below target %",   source: "Financial" },
      { id: "engagement",       label: "Employee Engagement",                  desc: "0 = any involuntary turnover · 1 = zero turnover · 2 = zero + culture activity done", source: "Manual" },
      { id: "culture_initiatives", label: "Culture Initiatives Completed",     desc: "0 = none this month · 1 = 1 completed · 2 = 2+ completed",   source: "Manual"    },
      { id: "leadership_obj",   label: "Leadership Objective Attainment",      desc: "0 = behind · 1 = on track · 2 = ahead + next initiative identified", source: "Manual" },
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
const APP_PIN = "2363";

function PinLock({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (input === APP_PIN) {
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
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Required to score or manage the roster</div>
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
// Bonus-pool math: base card only.
function getMemberBonusWeekPts(member, weekScores) {
  const card = getBonusCard(member);
  return calcCardPts(card, weekScores?.[member.id]?.[card]);
}
function getMemberCumulativePts(member, allScores) {
  return Object.values(allScores).reduce((t, ws) => t + (getMemberBonusWeekPts(member, ws) ?? 0), 0);
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

function Avatar({ name, size = 38 }) {
  const initials = (name || "").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: "50%", background: C.goldLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.34, color: C.gold, flexShrink: 0 }}>{initials}</div>;
}

function StatusPill({ pts }) {
  if (pts === null) return <span style={{ fontSize: 11, color: C.muted, padding: "2px 8px", borderRadius: 20, border: `1px solid ${C.border}` }}>—</span>;
  const g = pts >= GREEN_MIN;
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: g ? C.greenLight : C.pinkLight, color: g ? C.green : C.pink }}>{g ? "🟢" : "🔴"} {pts}pts</span>;
}

function ScoreBtn({ val, label, current, onChange, color }) {
  const active = current === val;
  const c = color || SCORE_COLOR[val];
  return <button onClick={() => onChange(val)} style={{ minWidth: 34, height: 34, padding: label ? "0 12px" : 0, borderRadius: 8, border: `2px solid ${active ? c : C.border}`, background: active ? c : C.white, color: active ? C.white : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.12s", flexShrink: 0 }}>{label ?? val}</button>;
}

function ScorecardPanel({ member, cardType, scores, onScore }) {
  const card = SCORECARDS[cardType];
  const yesNo = !!card.yesNo;
  const maxPts = cardMax(cardType);
  const pts = calcCardPts(cardType, scores);
  const filled = card.metrics.filter(m => m.handicap || scores?.[m.id] !== undefined).length;
  const isGreen = pts !== null && pts >= GREEN_MIN;
  const targets = cardType === "stylist" ? STYLIST_TARGETS[member.id] : null;
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
            ? <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: C.goldLight, color: C.gold }}>{pts ?? "—"}/{maxPts} this week</span>
            : <StatusPill pts={pts} />}
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{filled}/{card.metrics.length} scored · {pts ?? "—"}/{maxPts} pts</div>
        </div>
      </div>

      {targets && (
        <div style={{ padding: "10px 20px", background: C.steelLight, borderBottom: `1.5px solid ${C.border}`, fontSize: 11, color: C.steel, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span><strong>Weekly Service Target:</strong> ${targets.serviceWeekly.toLocaleString()}</span>
          <span><strong>Weekly Product Target:</strong> ${targets.productWeekly}</span>
          <span><strong>PPH Floor:</strong> ${PPH_FLOOR}</span>
        </div>
      )}

      <div style={{ padding: "0 20px" }}>
        {card.metrics.map((m, i) => (
          <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: i < card.metrics.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: m.handicap ? C.muted : C.ink, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {m.label}
                {m.handicap && <span style={{ fontSize: 10, background: C.goldLight, color: C.gold, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>HANDICAP</span>}
                {m.grace && <span style={{ fontSize: 10, background: C.steelLight, color: C.steel, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>90-DAY GRACE</span>}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{m.desc}</div>
              <div style={{ fontSize: 10, color: C.border, marginTop: 1 }}>Source: {m.source}</div>
            </div>
            {m.handicap
              ? <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, padding: "6px 10px", background: C.goldLight, borderRadius: 8, flexShrink: 0 }}>Auto 2</div>
              : <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>{options.map(o => <ScoreBtn key={o.v} val={o.v} label={o.l} color={o.c} current={scores?.[m.id]} onChange={v => onScore(m.id, v)} />)}</div>
            }
          </div>
        ))}
      </div>
      <div style={{ padding: "12px 20px", background: C.warm, borderTop: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        {card.award
          ? <div style={{ fontSize: 11, color: C.muted }}>Yes = 1 · No = 0 · Max {maxPts} · Award only — excluded from bonus pool & Green/Pink status</div>
          : <>
              <div style={{ fontSize: 11, color: C.muted }}>Green = 6+ pts · Pink = under 6 pts · Max 12 pts</div>
              {pts !== null && <div style={{ fontSize: 12, fontWeight: 700, color: isGreen ? C.green : C.pink }}>{isGreen ? "✓ Green Team" : "⚠ Pink Team — review next week"}</div>}
            </>}
      </div>
    </div>
  );
}

// ── COMPANY SCORECARD ─────────────────────────────────────────────────────────
function CompanyScorecard() {
  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", background: C.ink }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>The Refinery</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.white }}>Company Scorecard — Q3 2026</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 1, background: C.border }}>
        {[
          { label: "Service Sales Target", val: "$58,315.72", sub: "monthly" },
          { label: "Product Sales Target", val: "$3,900", sub: "monthly · 6.7% of service" },
          { label: "Shop PPH Target", val: "$68.22", sub: "floor minimum" },
          { label: "Utilization Target", val: "80–90%", sub: "shop average" },
        ].map(s => (
          <div key={s.label} style={{ background: C.white, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, marginTop: 4 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
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
            <div style={{ fontSize: 13, fontWeight: 800, color }}>{e.pts ?? "—"} pts</div>
          </div>
        ))
      )}
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

function Dashboard({ roster, allScores, holders, shoutouts, onAddShoutout, onDeleteShoutout, unlocked, notes }) {
  const activeTeam = roster.filter(m => m.active);
  const wk = currentWeekKey();
  const ws = allScores[wk] || {};

  // Per-card entries (role cards only — Core Value never appears in Green/Pink).
  const entries = [];
  activeTeam.forEach(m => getMemberCards(m).forEach(card => {
    entries.push({ key: m.id + "|" + card, name: m.name, cardLabel: SCORECARDS[card].label, pts: calcCardPts(card, ws?.[m.id]?.[card]) });
  }));
  const greenEntries = entries.filter(e => e.pts !== null && e.pts >= GREEN_MIN);
  const pinkEntries = entries.filter(e => e.pts !== null && e.pts < GREEN_MIN);

  // Team Flag stays people-based: how many distinct members have any pink card.
  const pinkMemberIds = new Set();
  activeTeam.forEach(m => {
    if (getMemberCards(m).some(card => { const p = calcCardPts(card, ws?.[m.id]?.[card]); return p !== null && p < GREEN_MIN; })) pinkMemberIds.add(m.id);
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

      <CompanyScorecard />

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


function ScoreView({ roster, allScores, onScore, holders, notes, onSetNote }) {
  const [sel, setSel] = useState(null);
  const [card, setCard] = useState(null);
  const [phorestData, setPhorestData] = useState(null);
  const [pulling, setPulling] = useState(false);
  const [pullError, setPullError] = useState(null);
  // The single, explicit week that ALL scoring in this session saves to.
  const [reviewWeek, setReviewWeek] = useState(() => defaultReviewWeek(allScores));
  const [confirmed, setConfirmed] = useState(false);
  const activeTeam = roster.filter(m => m.active);

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
          {cards.map(r => (
            <button key={r} onClick={() => setCard(r)} style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${card === r ? C.gold : C.border}`, background: card === r ? C.goldLight : C.white, fontSize: 12, cursor: "pointer", fontWeight: card === r ? 700 : 500, color: card === r ? C.gold : C.muted }}>
              {SCORECARDS[r].label} Card
            </button>
          ))}
        </div>
        {card && (
          <ScorecardPanel
            member={sel}
            cardType={card}
            scores={allScores?.[reviewWeek]?.[sel.id]?.[card]}
            onScore={(mid, val) => onScore(reviewWeek, sel.id, card, mid, val)}
          />
        )}

        {/* Team satisfaction + private feedback — per person, per week */}
        <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", background: C.steelLight, borderBottom: `1.5px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>Team Satisfaction (1–10)</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Target {SATISFACTION_TARGET}+. Feedback is private to leaders — not shown on the dashboard.</div>
          </div>
          <div style={{ padding: "14px 20px" }}>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(nval => {
                const cur = notes?.[reviewWeek]?.[sel.id]?.satisfaction;
                const active = cur === nval;
                const good = nval >= SATISFACTION_TARGET;
                return (
                  <button key={nval} onClick={() => onSetNote(reviewWeek, sel.id, { satisfaction: nval })} style={{ width: 34, height: 34, borderRadius: 8, border: `2px solid ${active ? (good ? C.green : C.gold) : C.border}`, background: active ? (good ? C.green : C.gold) : C.white, color: active ? C.white : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{nval}</button>
                );
              })}
            </div>
            <textarea
              value={notes?.[reviewWeek]?.[sel.id]?.feedback || ""}
              onChange={e => onSetNote(reviewWeek, sel.id, { feedback: e.target.value })}
              placeholder="Feedback for leaders (optional, private)…"
              rows={2}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>
        </div>
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
        const pts = getMemberWeekPts(member, allScores?.[reviewWeek] || {});
        const done = pts.every(p => p !== null);
        return (
          <button key={member.id} onClick={() => { setSel(member); setCard(cards[0]); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: C.white, border: `1.5px solid ${done ? C.green : C.border}`, borderRadius: 10, cursor: "pointer", textAlign: "left" }}>
            <Avatar name={member.name} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{member.name}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{cards.map(r => SCORECARDS[r].label).join(" + ")}</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{pts.map((p, j) => <StatusPill key={j} pts={p} />)}</div>
          </button>
        );
      })}
    </div>
  );
}

function HistoryView({ roster, allScores, holders }) {
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
              const pts = getMemberWeekPts(m, allScores?.[selWeek] || {});
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", padding: "11px 20px", gap: 12, borderBottom: i < activeTeam.length - 1 ? `1px solid ${C.border}` : "none", flexWrap: "wrap" }}>
                  <Avatar name={m.name} size={34} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}</div><div style={{ fontSize: 11, color: C.muted }}>{getMemberCards(m).map(r => SCORECARDS[r].label).join(" + ")}</div></div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{pts.map((p, j) => <StatusPill key={j} pts={p} />)}</div>
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

function RosterView({ roster, onRosterChange, holders, onSetHolder, allScores }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", role: "stylist" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [pendingHolder, setPendingHolder] = useState(null); // null = no dialog; "" = pending "remove"

  const active = roster.filter(m => m.active);
  const inactive = roster.filter(m => !m.active);

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
            <button onClick={() => { onRosterChange("update", { ...m, ...editForm }); setEditId(null); }} style={{ padding: "6px 14px", borderRadius: 8, background: C.green, color: C.white, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Save</button>
            <button onClick={() => setEditId(null)} style={{ padding: "6px 14px", borderRadius: 8, background: C.border, color: C.ink, border: "none", fontSize: 12, cursor: "pointer" }}>Cancel</button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}{m.id === holderId && <span style={{ fontSize: 10, marginLeft: 6, background: C.goldLight, color: C.gold, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>⭐ CORE VALUE</span>}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{ROLE_OPTIONS.find(r => r.value === m.role)?.label}{m.start_date ? ` · Started ${weekLabelFromKey(m.start_date)}` : ""}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => { setEditId(m.id); setEditForm({ name: m.name, role: m.role }); }} style={{ padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, fontSize: 11, cursor: "pointer", color: C.muted }}>Edit</button>
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
            <button onClick={() => { if (form.name.trim()) { onRosterChange("add", { id: uid(), name: form.name.trim(), role: form.role, active: true, start_date: currentWeekKey() }); setForm({ name: "", role: "stylist" }); setAdding(false); } }} style={{ padding: "7px 16px", borderRadius: 8, background: C.green, color: C.white, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Add</button>
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
    </div>
  );
}

function CoachingView({ roster, allScores, notes, onSetNote }) {
  const activeTeam = roster.filter(m => m.active);
  const [week, setWeek] = useState(() => latestScoredWeek(allScores));
  const avg = teamSatisfactionAvg(notes, week, activeTeam);
  const good = avg !== null && avg >= SATISFACTION_TARGET;
  const ws = allScores?.[week] || {};
  const pink = activeTeam.filter(m => getMemberCards(m).some(c => { const p = calcCardPts(c, ws?.[m.id]?.[c]); return p !== null && p < GREEN_MIN; }));

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

      {/* Pink team coaching notes */}
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: C.pinkLight, borderBottom: `1.5px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.pink }}>🔴 Pink Team Coaching Notes ({pink.length})</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Anyone with a pink card this week. Log the coaching conversation & action plan.</div>
        </div>
        {pink.length === 0 ? (
          <div style={{ padding: "16px 20px", fontSize: 12, color: C.muted, fontStyle: "italic" }}>No pink team members this week 🎉</div>
        ) : (
          pink.map((m, i) => (
            <div key={m.id} style={{ padding: "12px 20px", borderBottom: i < pink.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Avatar name={m.name} size={30} />
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}</div>
              </div>
              <textarea
                value={notes?.[week]?.[m.id]?.coaching_note || ""}
                onChange={e => onSetNote(week, m.id, { coaching_note: e.target.value })}
                placeholder="Coaching notes & action plan…"
                rows={2}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function RefineryApp() {
  const [roster, setRoster] = useState([]);
  const [allScores, setAllScores] = useState({});
  const [holders, setHolders] = useState({});
  const [shoutouts, setShoutouts] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [unlocked, setUnlocked] = useState(false);
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
    loadRoster();
    loadScores();
    loadHolders();
    loadShoutouts();
    loadNotes();
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

  const handleRosterChange = async (action, member) => {
    if (action === "add") {
      await supabase.from("roster").insert(member);
      setRoster(prev => [...prev, member]);
    } else if (action === "toggle") {
      const updated = { ...member, active: !member.active, start_date: !member.active ? currentWeekKey() : member.start_date };
      await supabase.from("roster").update({ active: updated.active, start_date: updated.start_date }).eq("id", member.id);
      setRoster(prev => prev.map(m => m.id === member.id ? updated : m));
    } else if (action === "update") {
      await supabase.from("roster").update({ name: member.name, role: member.role }).eq("id", member.id);
      setRoster(prev => prev.map(m => m.id === member.id ? member : m));
    }
  };

  const NavBtn = ({ id, label, locked }) => (
    <button onClick={() => { if (locked && !unlocked) { setPinPromptFor(id); } else { setView(id); } }} style={{ padding: "8px 16px", borderRadius: "8px 8px 0 0", background: view === id ? C.warm : "transparent", color: view === id ? C.ink : "#aaa", border: "none", fontWeight: view === id ? 700 : 500, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
      {label}{locked && !unlocked && <span style={{ fontSize: 10 }}>🔒</span>}
    </button>
  );

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
      <div style={{ background: C.ink, padding: "18px 24px 0", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 10, letterSpacing: 3, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>The Refinery</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: C.white, letterSpacing: -0.3 }}>STRA-TEGIC Performance System</span>
          </div>
          <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
            <NavBtn id="dashboard" label="Dashboard" />
            <NavBtn id="score" label="Score This Week" locked />
            <NavBtn id="history" label="History & Tracking" />
            <NavBtn id="coaching" label="Coaching" locked />
            <NavBtn id="roster" label="Roster" locked />
          </div>
        </div>
      </div>
      {pinPromptFor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setPinPromptFor(null)}>
          <div onClick={e => e.stopPropagation()}>
            <PinLock onUnlock={() => { setUnlocked(true); setView(pinPromptFor); setPinPromptFor(null); }} />
          </div>
        </div>
      )}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {view === "dashboard" && <Dashboard roster={roster} allScores={allScores} holders={holders} shoutouts={shoutouts} onAddShoutout={handleAddShoutout} onDeleteShoutout={handleDeleteShoutout} unlocked={unlocked} notes={notes} />}
        {view === "score" && <ScoreView roster={roster} allScores={allScores} onScore={handleScore} holders={holders} notes={notes} onSetNote={handleSetNote} />}
        {view === "history" && <HistoryView roster={roster} allScores={allScores} holders={holders} />}
        {view === "coaching" && <CoachingView roster={roster} allScores={allScores} notes={notes} onSetNote={handleSetNote} />}
        {view === "roster" && <RosterView roster={roster} onRosterChange={handleRosterChange} holders={holders} onSetHolder={handleSetHolder} allScores={allScores} />}
      </div>
    </div>
  );
}
