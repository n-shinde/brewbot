"use client";

// Serves as our location picker based on if the user grants access to their location or not.


import { useEffect, useMemo, useRef, useState } from "react";
import {
  placesAutocomplete,
  placeDetails,
  Prediction,
} from "@/lib/api";
import { Button } from "@/components/ui/button";

export type LatLng = { lat: number; lng: number };

function useSessionToken() {
    const ref = useRef<string | null>(null);
    if (!ref.current) {
      ref.current = crypto.randomUUID();
    }
    return ref.current;
  }

export default function LocationPicker({
  onResolve,
  disabled,
}: {
  onResolve: (coords: LatLng) => void;
  disabled?: boolean;
}) {
  const sessionToken = useSessionToken();

  const [error, setError] = useState<string | null>(null);

  // Autocomplete
  const [addrInput, setAddrInput] = useState("");
  const [preds, setPreds] = useState<Prediction[]>([]);
  const [showPreds, setShowPreds] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // debounce
  const debounced = useMemo(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    return (fn: () => void, ms = 300) => {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }, []);

  useEffect(() => {
    if (!addrInput.trim()) {
      setPreds([]);
      return;
    }
    debounced(async () => {
      try {
        const results = await placesAutocomplete(addrInput.trim(), sessionToken, "country:us");
        setPreds(results);
        setShowPreds(true);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Autocomplete failed.");
      }
    }, 250);
  }, [addrInput, debounced, sessionToken]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowPreds(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function useMyLocation() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onResolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setError("Permission denied.");
        else if (err.code === err.POSITION_UNAVAILABLE) setError("Location unavailable.");
        else if (err.code === err.TIMEOUT) setError("Timed out getting location.");
        else setError("Could not get your location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }


  async function selectPrediction(place_id: string, description: string) {
    try {
      setAddrInput(description);
      setShowPreds(false);
      const detail = await placeDetails(place_id, sessionToken);
      onResolve({ lat: detail.lat, lng: detail.lng });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to resolve that place.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button onClick={useMyLocation} disabled={disabled}>
          Use my location
        </Button>
        <span className="text-sm text-muted-foreground">
          We’ll request your browser location (HTTPS required).
        </span>
      </div>


      {/* Single address autocomplete input */}
      <div ref={boxRef} className="relative">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Enter your coffee shop's full address"
          value={addrInput}
          onChange={(e) => setAddrInput(e.target.value)}
          onFocus={() => preds.length && setShowPreds(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && preds[0]) {
              e.preventDefault();
              selectPrediction(preds[0].place_id, preds[0].description);
            }
          }}
          disabled={disabled}
        />
        {showPreds && preds.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg max-h-64 overflow-auto">
            {preds.map((p) => (
              <li
                key={p.place_id}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                onClick={() => selectPrediction(p.place_id, p.description)}
              >
                <div className="font-medium">
                  {p.structured_formatting?.main_text || p.description}
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.structured_formatting?.secondary_text || ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 border border-red-300 rounded-md p-3">
          {error}
        </div>
      )}
    </div>
  );
}
