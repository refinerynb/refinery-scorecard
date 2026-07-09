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

function getMemberCards(member) {
  return LEADERSHIP_ROLES.includes(member.role) ? ["stylist", member.role] : [member.role];
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
function getMemberCumulativePts(member, allScores) {
  return Object.values(allScores).reduce((t, ws) => t + getMemberWeekPts(member, ws).reduce((a, p) => a + (p ?? 0), 0), 0);
}
// Auto-calculate team KPI average % for a given week
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

function Avatar({ name, size = 38 }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: "50%", background: C.goldLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.34, color: C.gold, flexShrink: 0 }}>{initials}</div>;
}

function StatusPill({ pts }) {
  if (pts === null) return <span style={{ fontSize: 11, color: C.muted, padding: "2px 8px", borderRadius: 20, border: `1px solid ${C.border}` }}>—</span>;
  const g = pts >= GREEN_MIN;
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: g ? C.greenLight : C.pinkLight, color: g ? C.green : C.pink }}>{g ? "🟢" : "🔴"} {pts}pts</span>;
}

function ScoreBtn({ val, current, onChange }) {
  const active = current === val;
  return <button onClick={() => onChange(val)} style={{ width: 34, height: 34, borderRadius: 8, border: `2px solid ${active ? SCORE_COLOR[val] : C.border}`, background: active ? SCORE_COLOR[val] : C.white, color: active ? C.white : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.12s", flexShrink: 0 }}>{val}</button>;
}

function ScorecardPanel({ member, cardType, scores, onScore }) {
  const card = SCORECARDS[cardType];
  const pts = calcCardPts(cardType, scores);
  const filled = card.metrics.filter(m => m.handicap || scores?.[m.id] !== undefined).length;
  const isGreen = pts !== null && pts >= GREEN_MIN;
  const targets = cardType === "stylist" ? STYLIST_TARGETS[member.id] : null;

  return (
    <div style={{ background: C.white, borderRadius: 12, border: `1.5px solid ${C.border}`, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", background: C.warm, borderBottom: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>The Refinery · {card.label}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>{member.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <StatusPill pts={pts} />
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{filled}/{card.metrics.length} scored · {pts ?? "—"}/{MAX_PTS} pts</div>
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
              : <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>{[0, 1, 2].map(v => <ScoreBtn key={v} val={v} current={scores?.[m.id]} onChange={v => onScore(m.id, v)} />)}</div>
            }
          </div>
        ))}
      </div>
      <div style={{ padding: "12px 20px", background: C.warm, borderTop: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 11, color: C.muted }}>Green = 6+ pts · Pink = under 6 pts · Max 12 pts</div>
        {pts !== null && <div style={{ fontSize: 12, fontWeight: 700, color: isGreen ? C.green : C.pink }}>{isGreen ? "✓ Green Team" : "⚠ Pink Team — review next week"}</div>}
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

function TeamStatusList({ title, icon, members, color, bg }) {
  const sorted = [...members].sort((a, b) => (b.totalPts ?? 0) - (a.totalPts ?? 0));
  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "10px 20px", background: bg, borderBottom: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>{title} ({sorted.length})</div>
      </div>
      {sorted.length === 0 ? (
        <div style={{ padding: "16px 20px", fontSize: 12, color: C.muted, fontStyle: "italic" }}>No one here this week</div>
      ) : (
        sorted.map((m, i) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 10, borderBottom: i < sorted.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ width: 18, fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "center" }}>{i + 1}</div>
            <Avatar name={m.name} size={30} />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color }}>{m.totalPts ?? "—"} pts</div>
          </div>
        ))
      )}
    </div>
  );
}

function Dashboard({ roster, allScores }) {
  const activeTeam = roster.filter(m => m.active);
  const wk = currentWeekKey();
  const ws = allScores[wk] || {};

  const withTotals = activeTeam.map(m => {
    const pts = getMemberWeekPts(m, ws);
    const validPts = pts.filter(p => p !== null);
    const totalPts = validPts.length > 0 ? validPts.reduce((a, p) => a + p, 0) : null;
    const isPink = pts.some(p => p !== null && p < GREEN_MIN);
    const isGreen = pts.every(p => p === null || p >= GREEN_MIN) && pts.some(p => p !== null);
    return { ...m, totalPts, isPink, isGreen };
  });

  const pinkMembers = withTotals.filter(m => m.isPink);
  const greenMembers = withTotals.filter(m => m.isGreen);
  const pinkCount = pinkMembers.length;
  const flag = pinkCount >= 4 ? "red" : pinkCount >= 2 ? "yellow" : "clear";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        {[
          { label: "Active Team", val: activeTeam.length, color: C.ink },
          { label: "Green Team", val: greenMembers.length, color: C.green },
          { label: "Pink Team", val: pinkCount, color: C.pink },
          { label: "Team Flag", val: flag === "red" ? "🔴 Red" : flag === "yellow" ? "🟡 Yellow" : "✅ Clear", color: flag === "red" ? C.pink : flag === "yellow" ? C.gold : C.green },
        ].map(s => (
          <div key={s.label} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Week of {weekLabelFromKey(wk)}</div>

      <TeamStatusList title="Green Team" icon="🟢" members={greenMembers} color={C.green} bg={C.greenLight} />
      <TeamStatusList title="Pink Team" icon="🔴" members={pinkMembers} color={C.pink} bg={C.pinkLight} />

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

function parseCSV(text) {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  return lines.slice(1).map(line => {
    // naive CSV split — Phorest CSVs are typically comma-delimited without embedded commas in key fields
    const cols = line.split(",").map(c => c.trim().replace(/"/g, ""));
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
    const staffName = row["Staff Name"] || row["StaffName"] || row["Staff"];
    if (!staffName) return;
    if (!byStaff[staffName]) byStaff[staffName] = { serviceSales: 0, productSales: 0 };
    const category = (row["Category"] || row["Type"] || "").toLowerCase();
    const amount = parseFloat(row["Price"] || row["Amount"] || row["Total"] || 0) || 0;
    if (category.includes("product") || category.includes("retail")) {
      byStaff[staffName].productSales += amount;
    } else {
      byStaff[staffName].serviceSales += amount;
    }
  });
  return byStaff;
}


function ScoreView({ roster, allScores, onScore }) {
  const [sel, setSel] = useState(null);
  const [card, setCard] = useState(null);
  const [phorestData, setPhorestData] = useState(null);
  const [pulling, setPulling] = useState(false);
  const [pullError, setPullError] = useState(null);
  const [pullWeek, setPullWeek] = useState(currentWeekKey());
  const wk = currentWeekKey();
  const activeTeam = roster.filter(m => m.active);

  const recentWeeks = useMemo(() => {
    const weeks = [];
    let cursor = getMondayOf(new Date());
    for (let i = 0; i < 8; i++) {
      weeks.push(cursor.toISOString().slice(0, 10));
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() - 7);
    }
    return weeks;
  }, []);

  const handlePullPhorest = async () => {
    setPulling(true);
    setPullError(null);
    try {
      const rows = await pullPhorestWeek(pullWeek);
      const aggregated = aggregatePhorestData(rows);
      setPhorestData(aggregated);
    } catch (err) {
      setPullError(err.message);
    } finally {
      setPulling(false);
    }
  };

  if (sel) {
    const cards = getMemberCards(sel);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
            scores={allScores?.[wk]?.[sel.id]?.[card]}
            onScore={(mid, val) => onScore(wk, sel.id, card, mid, val)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "14px 18px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Scoring week of {weekLabelFromKey(wk)}</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Reviewed Thursday · Covers previous Mon–Sun</div>
      </div>

      <div style={{ background: C.steelLight, border: `1.5px solid ${C.steel}44`, borderRadius: 12, padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>📊 Phorest Data</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Pull Service & Product Sales for a selected week</div>
          </div>
          <button onClick={handlePullPhorest} disabled={pulling} style={{ padding: "8px 16px", borderRadius: 8, background: pulling ? C.border : C.steel, color: C.white, border: "none", fontWeight: 700, fontSize: 12, cursor: pulling ? "default" : "pointer" }}>
            {pulling ? "Pulling... (~20s)" : "Pull Phorest Data"}
          </button>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {recentWeeks.map((w, i) => (
            <button key={w} onClick={() => setPullWeek(w)} style={{ padding: "5px 10px", borderRadius: 8, border: `1.5px solid ${pullWeek === w ? C.steel : C.border}`, background: pullWeek === w ? C.steel : C.white, color: pullWeek === w ? C.white : C.muted, fontSize: 11, cursor: "pointer", fontWeight: pullWeek === w ? 700 : 400, whiteSpace: "nowrap" }}>
              {i === 0 ? "This Week" : weekLabelFromKey(w)}
            </button>
          ))}
        </div>
        {pullError && <div style={{ marginTop: 10, fontSize: 12, color: C.pink, fontWeight: 600 }}>⚠ {pullError}</div>}
        {phorestData && !pullError && (
          <div style={{ marginTop: 12, borderTop: `1px solid ${C.steel}33`, paddingTop: 10 }}>
            <div style={{ fontSize: 11, color: C.steel, fontWeight: 700, marginBottom: 6 }}>✓ Pulled {weekLabelFromKey(pullWeek)} — reference these while scoring:</div>
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

      {activeTeam.map(member => {
        const cards = getMemberCards(member);
        const pts = getMemberWeekPts(member, allScores?.[wk] || {});
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

function HistoryView({ roster, allScores }) {
  const activeTeam = roster.filter(m => m.active);
  const [mode, setMode] = useState("weekly");
  const [selWeek, setSelWeek] = useState(currentWeekKey());
  const allWeeks = useMemo(() => allWeeksSince(START_DATE), []);
  const qGroups = useMemo(() => groupByQuarter(allWeeks), [allWeeks]);
  const qKeys = Object.keys(qGroups).sort().reverse();

  const ModeBtn = ({ id, label }) => (
    <button onClick={() => setMode(id)} style={{ padding: "7px 16px", borderRadius: 20, border: `1.5px solid ${mode === id ? C.gold : C.border}`, background: mode === id ? C.goldLight : C.white, color: mode === id ? C.gold : C.muted, fontWeight: mode === id ? 700 : 500, fontSize: 12, cursor: "pointer" }}>{label}</button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <ModeBtn id="weekly" label="Weekly" />
        <ModeBtn id="quarterly" label="Quarterly" />
        <ModeBtn id="cumulative" label="Cumulative / Bonus Pool" />
      </div>

      {mode === "weekly" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {allWeeks.map(wk => (
              <button key={wk} onClick={() => setSelWeek(wk)} style={{ padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${selWeek === wk ? C.gold : C.border}`, background: selWeek === wk ? C.goldLight : C.white, fontSize: 11, cursor: "pointer", fontWeight: selWeek === wk ? 700 : 400, color: selWeek === wk ? C.gold : C.muted, whiteSpace: "nowrap" }}>
                {wk === currentWeekKey() ? "This Week" : weekLabelFromKey(wk)}
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
          {qKeys.map(qk => {
            const weeks = qGroups[qk];
            const ranked = [...activeTeam].map(m => {
              const total = weeks.reduce((acc, wk) => acc + getMemberWeekPts(m, allScores?.[wk] || {}).reduce((a, p) => a + (p ?? 0), 0), 0);
              const ws = weeks.filter(wk => getMemberWeekPts(m, allScores?.[wk] || {}).some(p => p !== null)).length;
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
            🏆 Year-End Bonus Pool — higher annual score = larger share of pool.
          </div>
          <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            {[...activeTeam]
              .map(m => ({ m, total: getMemberCumulativePts(m, allScores), weeks: Object.keys(allScores).filter(wk => getMemberWeekPts(m, allScores[wk]).some(p => p !== null)).length }))
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
    </div>
  );
}

function RosterView({ roster, onRosterChange }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", role: "stylist" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const active = roster.filter(m => m.active);
  const inactive = roster.filter(m => !m.active);

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
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}</div>
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

export default function RefineryApp() {
  const [roster, setRoster] = useState([]);
  const [allScores, setAllScores] = useState({});
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
    loadRoster();
    loadScores();
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
        {view === "dashboard" && <Dashboard roster={roster} allScores={allScores} />}
        {view === "score" && <ScoreView roster={roster} allScores={allScores} onScore={handleScore} />}
        {view === "history" && <HistoryView roster={roster} allScores={allScores} />}
        {view === "roster" && <RosterView roster={roster} onRosterChange={handleRosterChange} />}
      </div>
    </div>
  );
}
