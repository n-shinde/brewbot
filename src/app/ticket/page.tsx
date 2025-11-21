"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type PosIngestResponse = {
  filename: string;
  rows: number;
  cols: string[];
  inferred_numeric: string[];
  inferred_datetime: string[];
  date_range?: { column: string; start: string; end: string } | null;
  preview: Record<string, unknown>[];
};

export default function TicketPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [result, setResult] = useState<PosIngestResponse | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);

  const previewCols = useMemo<string[]>(
    () => (result?.preview?.[0] ? Object.keys(result.preview[0]) : result?.cols ?? []),
    [result]
  );

  async function handleUpload() {
    if (!file) {
      setStatus("error");
      setMessage("Please choose a file first.");
      return;
    }
    setStatus("uploading");
    setMessage("");
    setResult(null);
    setAnalysis(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${API_BASE}/ingest/pos`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || `Upload failed (${res.status})`);
      }

      const data: PosIngestResponse = await res.json();
      setResult(data);
      setStatus("success");
      setMessage(`Uploaded ${data.filename} • ${data.rows} rows`);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  async function runAnalysis() { // ADDED
    try {
      setMessage(""); // keep status area clean
      const res = await fetch(`${API_BASE}/analyze/pos`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || `Analysis failed (${res.status})`);
      }
      const data = await res.json();
      setAnalysis(data.insights ?? data); // support either {insights:{}} or flat
      setMessage("Analysis complete!");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to analyze file.");
    }
  } 

  return (
    <section className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Analyze your coffee shop&apos;s sales trends and unlock key business insights.</h1>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">Upload your POS Sales Transactions File</h2>
        <p className="text-sm text-muted-foreground">
          Accepted file formats: .csv, .txt, .xlsx
        </p>

        <div className="mt-3 flex items-center gap-3">
          <input
            type="file"
            accept=".csv,.txt,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={status === "uploading"}
            className="text-sm"
          />
          <Button onClick={handleUpload} disabled={!file || status === "uploading"}>
            {status === "uploading" ? "Uploading…" : "Upload"}
          </Button>
        </div>

        {status !== "idle" && (
          <div
            className={`mt-3 text-sm ${
              status === "success"
                ? "text-green-700"
                : status === "error"
                ? "text-red-600"
                : "text-muted-foreground"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {result && (
        <div className="rounded-lg border p-4">
          <h3 className="text-base font-medium">Your POS Data</h3>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Filename: </span>{result.filename}</div>
            <div><span className="text-muted-foreground">Rows: </span>{result.rows}</div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Columns: </span>
              <span className="break-words">{result.cols.join(", ")}</span>
            </div>
          </div>

          {/* Preview table */}
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm border rounded-md">
              <thead className="bg-gray-50">
                <tr>
                  {previewCols.map((c) => (
                    <th key={c} className="text-left px-3 py-2 border-b">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.preview.map((row, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50">
                    {previewCols.map((c) => (
                      <td key={c} className="px-3 py-2 border-b align-top">
                        {String(row[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ADDED: Run Analysis button + results */}
          <div className="mt-6">
            <Button onClick={runAnalysis}> Gather insights 📈 🍵 </Button>
            {analysis && (
              <div className="mt-4 space-y-4 text-sm">
                {Object.entries(analysis).map(([key, value]) => (
                  <div key={key}>
                    <h4 className="font-medium">{key}</h4>
                    <pre className="bg-gray-50 p-2 rounded-md overflow-x-auto text-xs">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

