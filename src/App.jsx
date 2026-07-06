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

const SCORECARDS = {
  stylist: {
    label: "Stylist",
    metrics: [
      { id: "service_sales",    label: "Service Sales vs Personal Goal",       desc: "0 = <90% · 1 = 90–99% · 2 = 100%+",                          source: "Phorest"   },
      { id: "product_sales",    label: "Product Sales vs Personal Goal",       desc: "0 = <90% · 1 = 90–99% · 2 = 100%+",                          source: "Phorest"   },
      { id: "pph",              label: "PPH vs Personal Target",               desc: "0 = below target · 1 = at target · 2 = target +5%",           source: "Phorest"   },
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
      { id: "pink_green_ratio", label: "Pink to Green Ratio (vs prior week)",  desc: "0 = more pink than last week · 1 = same or fewer · 2 = zero pink", source: "Scorecard" },
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
      { id: "pink_trend",       label: "Pink Team Trend (week over week)",     desc: "0 = more pink than last week · 1 = same or fewer than last week · 2 = zero pink this week", source: "Scorecard" },
      { id: "team_kpi_avg",     label: "Team KPI Average",                     desc: "0 = <50% · 1 = 50–74% · 2 = 75%+",                           source: "Scorecard" },
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
      { id: "book_control",     label: "Book Control Decisions",               desc: "0 = any stylist overdue · 1 = all triggers monitored · 2 = all acted on same week", source: "Scorecard" },
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
  return ["team_leader","manager","gm","owner"].includes(member.role) ? ["stylist", member.role] : [member.role];
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

function Dashboard({ roster, allScores }) {
  const activeTeam = roster.filter(m => m.active);
  const wk = currentWeekKey();
  const ws = allScores[wk] || {};
  const pinkCount = activeTeam.filter(m => getMemberWeekPts(m, ws).some(p => p !== null && p < GREEN_MIN)).length;
  const greenCount = activeTeam.filter(m => { const pts = getMemberWeekPts(m, ws); return pts.every(p => p === null || p >= GREEN_MIN) && pts.some(p => p !== null); }).length;
  const flag = pinkCount >= 4 ? "red" : pinkCount >= 2 ? "yellow" : "clear";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        {[
          { label: "Active Team", val: activeTeam.length, color: C.ink },
          { label: "Green Team", val: greenCount, color: C.green },
          { label: "Pink Team", val: pinkCount, color: C.pink },
          { label: "Team Flag", val: flag === "red" ? "🔴 Red" : flag === "yellow" ? "🟡 Yellow" : "✅ Clear", color: flag === "red" ? C.pink : flag === "yellow" ? C.gold : C.green },
        ].map(s => (
          <div key={s.label} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.val}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: C.warm, borderBottom: `1.5px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Team Snapshot — {weekLabelFromKey(wk)}</div>
        </div>
        {activeTeam.map((m, i) => {
          const pts = getMemberWeekPts(m, ws);
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", padding: "11px 20px", gap: 12, borderBottom: i < activeTeam.length - 1 ? `1px solid ${C.border}` : "none", flexWrap: "wrap" }}>
              <Avatar name={m.name} />
              <div style={{ flex: 1, minWidth: 100 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{getMemberCards(m).map(r => SCORECARDS[r].label).join(" + ")}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{pts.map((p, j) => <StatusPill key={j} pts={p} />)}</div>
            </div>
          );
        })}
      </div>
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

function ScoreView({ roster, allScores, onScore }) {
  const [sel, setSel] = useState(null);
  const [card, setCard] = useState(null);
  const wk = currentWeekKey();
  const activeTeam = roster.filter(m => m.active);
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
        {card && <ScorecardPanel member={sel} cardType={card} scores={allScores?.[wk]?.[sel.id]?.[card]} onScore={(mid, val) => onScore(wk, sel.id, card, mid, val)} />}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "14px 18px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Scoring week of {weekLabelFromKey(wk)}</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Reviewed Thursday · Covers previous Mon–Sun · Pull Phorest data before scoring</div>
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

  const NavBtn = ({ id, label }) => (
    <button onClick={() => setView(id)} style={{ padding: "8px 16px", borderRadius: "8px 8px 0 0", background: view === id ? C.warm : "transparent", color: view === id ? C.ink : "#aaa", border: "none", fontWeight: view === id ? 700 : 500, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>{label}</button>
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
            <NavBtn id="score" label="Score This Week" />
            <NavBtn id="history" label="History & Tracking" />
            <NavBtn id="roster" label="Roster" />
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {view === "dashboard" && <Dashboard roster={roster} allScores={allScores} />}
        {view === "score" && <ScoreView roster={roster} allScores={allScores} onScore={handleScore} />}
        {view === "history" && <HistoryView roster={roster} allScores={allScores} />}
        {view === "roster" && <RosterView roster={roster} onRosterChange={handleRosterChange} />}
      </div>
    </div>
  );
}
 
