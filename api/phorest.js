const PHOREST_USERNAME = process.env.PHOREST_USERNAME;
const PHOREST_PASSWORD = process.env.PHOREST_PASSWORD;
const BUSINESS_ID = process.env.PHOREST_BUSINESS_ID;
const BRANCH_ID = process.env.PHOREST_BRANCH_ID;
const BASE_URL = "https://platform-us.phorest.com/third-party-api-server/api";

function authHeader() {
  const token = Buffer.from(`${PHOREST_USERNAME}:${PHOREST_PASSWORD}`).toString("base64");
  return `Basic ${token}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = req.query.action;
  console.log("Phorest API called, action:", action, "method:", req.method);

  try {
    // Step 1: create a CSV export job for a date range
    if (action === "create-job" && req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { startFilter, finishFilter } = body || {};
      console.log("Creating job for dates:", startFilter, finishFilter);

      const phorestUrl = `${BASE_URL}/business/${BUSINESS_ID}/branch/${BRANCH_ID}/csvexportjob`;
      const response = await fetch(phorestUrl, {
        method: "POST",
        headers: { Authorization: authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ jobType: "TRANSACTIONS_CSV", startFilter, finishFilter }),
      });
      const text = await response.text();
      console.log("Phorest response status:", response.status, "body:", text);

      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      return res.status(response.status).json(data);
    }

    // Step 2: poll job status
    if (action === "check-job" && req.method === "GET") {
      const { jobId } = req.query;
      const response = await fetch(
        `${BASE_URL}/business/${BUSINESS_ID}/branch/${BRANCH_ID}/csvexportjob/${jobId}`,
        { headers: { Authorization: authHeader() } }
      );
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // Get appointments for a date range (max 1 month)
    if (action === "appointments" && req.method === "GET") {
      const { fromDate, toDate } = req.query;
      const url = `${BASE_URL}/business/${BUSINESS_ID}/branch/${BRANCH_ID}/appointment?from_date=${fromDate}&to_date=${toDate}&size=500`;
      console.log("Fetching appointments:", fromDate, toDate);
      const response = await fetch(url, { headers: { Authorization: authHeader() } });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      return res.status(response.status).json(data);
    }

    // Get staff work timetables for a date range (max 1 month) — gives rostered hours
    if (action === "worktimetable" && req.method === "GET") {
      const { fromDate, toDate } = req.query;
      const url = `${BASE_URL}/business/${BUSINESS_ID}/branch/${BRANCH_ID}/staff/worktimetable?from_date=${fromDate}&to_date=${toDate}`;
      console.log("Fetching worktimetable:", fromDate, toDate);
      const response = await fetch(url, { headers: { Authorization: authHeader() } });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      return res.status(response.status).json(data);
    }

    // Step 3: fetch and return the raw CSV text once job is DONE
    if (action === "fetch-csv" && req.method === "GET") {
      const { url } = req.query;
      const response = await fetch(url);
      const text = await response.text();
      console.log("FULL CSV HEADER:", text.split("\n")[0], "|| ROW1:", text.split("\n")[1]);

      console.log("CSV total length:", text.length);
      res.setHeader("Content-Type", "text/plain");
      return res.status(200).send(text);
    }

    return res.status(400).json({ error: "Unknown action", action, method: req.method });
  } catch (err) {
    console.error("Phorest API error:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
