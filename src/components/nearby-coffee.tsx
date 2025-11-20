"use client";

import { useState } from "react";
import { fetchNearby, Competitor } from "@/lib/api";
import LocationPicker, { LatLng } from "@/components/user-location";

export default function NearbyCoffee() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Competitor[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function searchWithLatLng({ lat, lng }: LatLng) {
    try {
      setError(null);
      setLoading(true);
      setItems(null);
      const data = await fetchNearby({ lat, lng, radius_m: 8000, max_results: 10 });
    //   console.log("nearby →", data.competitors.length, data.competitors); 
      setItems(data.competitors);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch nearby places.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <LocationPicker onResolve={searchWithLatLng} disabled={loading} />

      {error && (
        <div className="text-sm text-red-600 border border-red-300 rounded-md p-3">
          {error}
        </div>
      )}

      {items && (
        <>
        <div className="text-sm text-muted-foreground">
        Found {items.length} coffee shop{items.length === 1 ? "" : "s"}
        </div>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((c) => (
            <li key={c.id} className="rounded-2xl border p-4 shadow-sm">
            <div className="font-medium">{c.name}</div>
            <div className="text-sm text-muted-foreground">
                {c.rating ? `⭐ ${c.rating}` : "No rating"}
                {typeof c.review_count === "number" ? ` · ${c.review_count} reviews` : ""}
                {typeof c.price_level === "number" ? ` · ${"$".repeat(Math.max(1, c.price_level))}` : ""}
            </div>
            {typeof c.distance_m === "number" && (
                <div className="text-xs text-muted-foreground mt-1">
                {(c.distance_m).toFixed(2)} meters away
                </div>
            )}
            </li>
        ))}
        </ul>
    </>
    )}
    </div>
  );
}
