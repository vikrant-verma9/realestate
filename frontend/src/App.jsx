import React, { useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const fileRef = useRef(null);

  // ====================
  // Backend API Caller
  // ====================
  const postAnalyze = async (formData) => {
    return axios
      .post("http://localhost:5002/analyze", formData)
      .then((res) => res.data);
  };

  // ====================
  // Submit Excel File
  // ====================
  const sendQuery = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrMsg("");

    const fd = new FormData();
    fd.append("file", file);

    try {
      const data = await postAnalyze(fd);
      setAnalysis(data);
    } catch (err) {
      setErrMsg("Failed to analyze file. Check backend logs.");
    }

    setLoading(false);
  };

  // ====================
  // Download PDF Report
  // ====================
  const downloadReport = async () => {
    try {
      const res = await fetch("http://localhost:5002/download-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysis)
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "RealEstate_Report.pdf";
      a.click();
    } catch (err) {
      alert("Error downloading report!");
    }
  };

  // ====================
  // Chart Renderer
  // ====================
  const renderChart = (data) => {
    if (!data || !data.length) return <div>No chart data</div>;

    return (
      <div className="card p-3 shadow-sm mb-4">
        <h5 className="mb-3">Market Trend Chart</h5>
        <div style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="price" stroke="#1f77b4" />
              <Line type="monotone" dataKey="demand" stroke="#ff7f0e" />
              <Line type="monotone" dataKey="size" stroke="#2ca02c" />
              <Line type="monotone" dataKey="supply" stroke="#9467bd" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // ====================
  // UI
  // ====================
  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <h2 className="text-center mb-4">🏡 Real Estate Excel Analyzer</h2>

      {/* Upload Card */}
      <div className="card shadow-sm p-4 mb-4">
        <h5 className="mb-3">Upload Excel File</h5>

        <form onSubmit={sendQuery}>
          <div className="mb-3">
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fileRef}
              className="form-control"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </div>

          <button className="btn btn-primary" disabled={loading || !file}>
            {loading ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Processing...
              </span>
            ) : (
              "Upload & Analyze"
            )}
          </button>
        </form>

        {errMsg && <div className="alert alert-danger mt-3">{errMsg}</div>}
      </div>

      {/* Results Section */}
      {analysis && (
        <>
          {/* Summary Card */}
          <div className="card p-4 shadow-sm mb-4">
            <h4>📊 Summary</h4>
            <div className="bg-light p-3 rounded">{analysis.summary}</div>
          </div>

          {/* Chart */}
          {renderChart(analysis.chart_data)}

          {/* Download PDF */}
          <button className="btn btn-warning mb-4" onClick={downloadReport}>
            📄 Download PDF Report
          </button>

          {/* Table */}
          <div className="card p-3 shadow-sm">
            <h4>📁 Data Table</h4>

            <div style={{ maxHeight: 350, overflowY: "auto" }}>
              <table className="table table-striped mt-3">
                <thead>
                  <tr>
                    {Object.keys(analysis.table[0]).map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analysis.table.map((r, i) => (
                    <tr key={i}>
                      {Object.keys(r).map((c) => (
                        <td key={c}>{String(r[c])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
