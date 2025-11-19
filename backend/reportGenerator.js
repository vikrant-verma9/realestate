// backend/reportGenerator.js
const PDFDocument = require("pdfkit");
const fs = require("fs");

function generateReport(summary, chartData, tableRows, filepath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Title
    doc.fontSize(22).text("Real Estate Analysis Report", { align: "center" });
    doc.moveDown(2);

    // Summary
    doc.fontSize(16).text("Summary:", { underline: true });
    doc.fontSize(12).text(summary);
    doc.moveDown(2);

    // Chart Data
    doc.fontSize(16).text("Chart Data (Year-wise Aggregation):", {
      underline: true,
    });
    doc.moveDown(1);

    chartData.forEach((row) => {
      doc.fontSize(10).text(JSON.stringify(row));
    });

    doc.moveDown(2);

    // Full Table
    doc.fontSize(16).text("Complete Table Data:", { underline: true });
    doc.moveDown(1);

    tableRows.forEach((row) => {
      doc.fontSize(10).text(JSON.stringify(row));
    });

    doc.end();

    stream.on("finish", () => resolve(filepath));
    stream.on("error", reject);
  });
}

module.exports = generateReport;
