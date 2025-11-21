"use client";

import { useState } from "react";
import { fetchNearby, Competitor } from "@/lib/api";
import LocationPicker, { LatLng } from "@/components/user-location";
import CoffeeLoader from "@/components/coffee-loader";
import ChatbotPanel from "@/components/chatbot-panel";

type Props = {
    onResults?: (items: Competitor[]) => void; 
};

export default function NearbyCoffee({ onResults }: Props = {}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Competitor[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function searchWithLatLng({ lat, lng }: LatLng) {
    try {
      setError(null);
      setLoading(true);
      setItems(null);
      const data = await fetchNearby({ lat, lng, radius_m: 8000, max_results: 10, reviews_per_place:5});
    //   console.log("nearby →", data.competitors.length, data.competitors); 
      setItems(data.competitors);
      onResults?.(data.competitors);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch nearby places.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <LocationPicker onResolve={searchWithLatLng} disabled={loading} />

      {loading && <CoffeeLoader label="Brewing your request..." />}

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
              <li
                key={c.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-2"
              >
                <div className="font-medium text-foreground">{c.name}</div>

                <div className="text-sm text-muted-foreground">
                  {c.rating ? `⭐ ${c.rating}` : "No rating"}
                  {typeof c.review_count === "number"
                    ? ` · ${c.review_count} reviews`
                    : ""}
                  {typeof c.price_level === "number"
                    ? ` · ${"$".repeat(Math.max(1, c.price_level))}`
                    : ""}
                </div>

                {typeof c.distance_m === "number" && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {(c.distance_m / 1609.34).toFixed(2)} miles away
                  </div>
                )}

                {/* ---- Reviews section ---- */}
                {Array.isArray(c.recent_reviews) &&
                  c.recent_reviews.length > 0 && (
                    <div className="mt-3 border-t border-border pt-2 space-y-2">
                      <div className="text-sm font-semibold text-foreground">
                        Recent Reviews
                      </div>

                      <ul className="space-y-2">
                        {c.recent_reviews.slice(0, 5).map(
                          (
                            r,
                            i: number
                          ) => (
                            <li
                              key={i}
                              className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground"
                            >
                              {r.text ? (
                                <p className="line-clamp-4">{`"${r.text}"`}</p>
                              ) : (
                                <p>No review text available.</p>
                              )}
                              <div className="mt-1 text-[10px] text-muted-foreground">
                                ⭐ {r.rating ?? "N/A"} ·{" "}
                                {r.author || "Anonymous"} ·{" "}
                                {r.publish_time
                                  ? new Date(
                                      r.publish_time
                                    ).toLocaleDateString()
                                  : ""}
                              </div>
                            </li>
                          )
                        )}
                      </ul>
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
