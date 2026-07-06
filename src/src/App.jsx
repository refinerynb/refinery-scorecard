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
      { id: "product_sales",    label: "Product Sales vs Personal Goal",       desc: "0 = 
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
        function HistoryView({ roster, allScores }) {
  const activeTeam = roster.filter(m => m.active);
  const [mode, setMode] = useState("weekly");
  const [selWeek, setSelWeek] = useState(currentWeekKey());
  const allWeeks = useMemo(() => allWeeksSince(START_DATE), []);
  const qGroups = useMemo(() =>

