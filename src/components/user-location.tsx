"use client";

// Serves as our location picker based on if the user grants access to their location or not.
// src/components/user-location.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  geocodeViaBackend,
  placesAutocomplete,
  placeDetails,
  Prediction,
} from "@/lib/api";
import { Button } from "@/components/ui/button";

export type LatLng = { lat: number; lng: number };

function buildAddress(city: string, state: string, zip: string) {
  const parts = [city.trim(), state.trim(), zip.trim()].filter(Boolean);
  return parts.join(", ");
}

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

  // City/State/ZIP
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

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

  async function useCityStateZip() {
    const addr = buildAddress(city, state, zip);
    if (!addr) {
      setError("Please enter at least City and State (ZIP optional).");
      return;
    }
    try {
      setError(null);
      const { lat, lng } = await geocodeViaBackend(addr);
      onResolve({ lat, lng });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not geocode that location.");
    }
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

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        <input
          className="sm:col-span-2 rounded-md border px-3 py-2 text-sm"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={disabled}
        />
        <input
          className="sm:col-span-1 rounded-md border px-3 py-2 text-sm"
          placeholder="State (e.g., CA)"
          value={state}
          onChange={(e) => setState(e.target.value.toUpperCase())}
          maxLength={2}
          disabled={disabled}
        />
        <input
          className="sm:col-span-1 rounded-md border px-3 py-2 text-sm"
          placeholder="ZIP (optional)"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          inputMode="numeric"
          pattern="\d*"
          disabled={disabled}
        />
        <Button className="sm:col-span-1" onClick={useCityStateZip} disabled={disabled}>
          Search
        </Button>
      </div>

      <div ref={boxRef} className="relative">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Or type a full address"
          value={addrInput}
          onChange={(e) => setAddrInput(e.target.value)}
          onFocus={() => preds.length && setShowPreds(true)}
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
