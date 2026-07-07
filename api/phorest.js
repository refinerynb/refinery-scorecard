// /api/phorest.js
// Serverless function that proxies requests to the Phorest API.
// Keeps credentials server-side, out of the browser.

const PHOREST_USERNAME = "global/refinerynb@gmail.com";
const PHOREST_PASSWORD = "%GE6rK2N%@WL";
const BUSINESS_ID = "F2SPxegRrmVYTXnkIonN5A";
const BRANCH_ID = "jmr-AoRuqqt58C8fNP5hLg";
const BASE_URL = "https://platform.phorest.com/third-party-api-server/api";

function authHeader() {
  const token = Buffer.from(`${PHOREST_USERNAME}:${PHOREST_PASSWORD}`).toString("base64");
  return `Basic ${token}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { action } = req.query;

  try {
    // Step 1: create a CSV export job for a date range
    if (action === "create-job" && req.method === "POST") {
      const { startFilter, finishFilter } = req.body;
      const response = await fetch(
        `${BASE_URL}/business/${BUSINESS_ID}/branch/${BRANCH_ID}/csvexportjob`,
        {
          method: "POST",
          headers: { Authorization: authHeader(), "Content-Type": "application/json" },
          body: JSON.stringify({ jobType: "TRANSACTIONS_CSV", startFilter, finishFilter }),
        }
      );
      const data = await response.json();
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

    // Step 3: fetch and return the raw CSV text once job is DONE
    if (action === "fetch-csv" && req.method === "GET") {
      const { url } = req.query;
      const response = await fetch(url);
      const text = await response.text();
      res.setHeader("Content-Type", "text/plain");
      return res.status(200).send(text);
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
