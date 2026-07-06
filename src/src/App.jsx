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
