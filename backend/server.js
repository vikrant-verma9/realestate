// backend/server.js
require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const generateReport = require("./reportGenerator");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const upload = multer({ storage: multer.memoryStorage() });

// Read excel from upload
function readExcelBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}

// Detect columns
function detectColumns(rows) {
  const sample = rows[0] || {};
  const cols = Object.keys(sample);

  return {
    area: cols.find((c) => c.toLowerCase().includes("area")) || cols[0],
    year: cols.find((c) => c.toLowerCase().includes("year")),
    price: cols.find((c) => c.toLowerCase().includes("price")),
    demand: cols.find((c) => c.toLowerCase().includes("demand")),
    size: cols.find((c) => c.toLowerCase().includes("size")),
    supply: cols.find((c) => c.toLowerCase().includes("supply")),
  };
}

// Aggregate data by year
function aggregateByYear(rows, cols) {
  const groups = {};

  rows.forEach((r) => {
    const year = Number(String(r[cols.year]).slice(0, 4));
    if (!year) return;

    if (!groups[year]) {
      groups[year] = {
        year,
        price: 0,
        demand: 0,
        size: 0,
        supply: 0,
        count: 0,
      };
    }

    const g = groups[year];
    g.price += Number(r[cols.price] || 0);
    g.demand += Number(r[cols.demand] || 0);
    g.size += Number(r[cols.size] || 0);
    g.supply += Number(r[cols.supply] || 0);
    g.count++;
  });

  return Object.values(groups).map((g) => ({
    year: g.year,
    price: g.price / g.count,
    demand: g.demand,
    size: g.size / g.count,
    supply: g.supply,
  }));
}

// MAIN ANALYZE ENDPOINT
app.post("/analyze", upload.single("file"), (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No excel file provided." });

    const rows = readExcelBuffer(req.file.buffer);
    const cols = detectColumns(rows);
    const chartData = aggregateByYear(rows, cols);

    res.json({
      summary: `Uploaded Excel contains ${rows.length} rows. Showing trends from ${chartData[0]?.year} to ${chartData.at(-1)?.year}.`,
      chart_data: chartData,
      table: rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DOWNLOAD REPORT ENDPOINT
app.post("/download-report", async (req, res) => {
  try {
    const { summary, chart_data, table } = req.body;

    const filePath = path.join(__dirname, "RealEstate_Report.pdf");

    await generateReport(summary, chart_data, table, filePath);

    res.download(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5002, () => console.log("Server running on port 5002"));
