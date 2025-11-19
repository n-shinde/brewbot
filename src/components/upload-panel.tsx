"use client";
import { useState } from "react";
import { uploadPOS, fetchNearby, getReport } from "@/lib/api";

type Props = {
  onResult: (json: unknown) => void;  
};

export default function UploadPanel({ onResult }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [lat, setLat] = useState("37.7749");
  const [lng, setLng] = useState("-122.4194");
  const [radius, setRadius] = useState("3000");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    try {
      if (!file) throw new Error("Please choose a sales transactions file first.");
      setLoading(true);

      setStatus("Uploading sales transactions file...");
      await uploadPOS(file);

      setStatus("Finding competitors near your location...");

      await fetchNearby({
        lat: Number(lat),
        lng: Number(lng),
        radius_m: Number(radius),
        max_results: 10, // optional — you can omit or set any number
      });

      setStatus("Done! ✅");

    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function pickExt(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    if (!f) { setFile(null); return; }
    // Allow TXT/CSV/XLSX. Backend supports CSV; XLSX/TXT should be converted server-side or pre-processed.
    const ok = /\.(csv|txt|xlsx)$/i.test(f.name);
    if (!ok) setStatus("Please upload a file with a supported type. (CSV / TXT / XLSX)");
    setFile(f);
  }

  function getLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(String(pos.coords.latitude));
      setLng(String(pos.coords.longitude));
    });
  }

  return (
    <div className="border rounded-xl p-4 space-y-3">
      <div className="grid md:grid-cols-4 gap-3 items-center">
        <input
          className="border rounded px-3 py-2"
          type="file"
          accept=".csv,.txt,.xlsx"
          onChange={pickExt}
        />
        <input className="border rounded px-3 py-2" placeholder="Latitude" value={lat} onChange={(e)=>setLat(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Longitude" value={lng} onChange={(e)=>setLng(e.target.value)} />
        <div className="flex gap-2">
          <input className="border rounded px-3 py-2 w-full" placeholder="Radius (m)" value={radius} onChange={(e)=>setRadius(e.target.value)} />
          <button className="border rounded px-3 py-2" onClick={getLocation} type="button">📍</button>
        </div>
      </div>
      <button
        className="px-4 py-2 rounded bg-black text-white disabled:bg-gray-400"
        onClick={run}
        disabled={!file || loading}
      >
        {loading ? "Processing…" : "Upload & Find Nearby"}
      </button>
      <div className="text-sm text-gray-500">{status}</div>
    </div>
  );
}
