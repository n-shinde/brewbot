// export const API_BASE =
//   process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// export async function uploadPOS(file: File) {
//   const fd = new FormData();
//   fd.append("file", file);
//   const res = await fetch(`${API_BASE}/ingest/pos`, { method: "POST", body: fd });
//   if (!res.ok) throw new Error(await res.text());
//   return res.json();
// }

// export async function fetchNearby(lat: number, lng: number, radius_m = 3000) {
//   const res = await fetch(`${API_BASE}/benchmark/nearby?lat=${lat}&lng=${lng}&radius_m=${radius_m}`);
//   if (!res.ok) throw new Error(await res.text());
//   return res.json();
// }

// export async function getReport() {
//   const res = await fetch(`${API_BASE}/analyze/report`);
//   if (!res.ok) throw new Error(await res.text());
//   return res.json();
// }

// src/lib/api.ts

export type LatLng = { lat: number; lng: number };
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };


export type Review = {
    rating: number;
    publish_time?: string;  
    text?: string;
    author?: string;       
};

export type Competitor = {
  id: string;
  name: string;
  rating?: number;
  review_count?: number;
  price_level?: number;
  source: string;
  distance_m?: number;
  recent_reviews?: Review[];
  formatted_address?: string;
  google_maps_uri?: string;
};


export type Prediction = {
  description: string;
  place_id: string;
  structured_formatting?: { main_text?: string; secondary_text?: string };
};

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function uploadPOS(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/ingest/pos`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}


// Fetch nearby competitors + recent reviews 
export async function fetchNearby(params: {
    lat: number;
    lng: number;
    radius_m?: number;
    max_results?: number;
    reviews_per_place?: number; // default 5 on backend
  }): Promise<{ competitors: Competitor[] }> {
    const url = new URL("/benchmark/nearby", API_BASE);
    url.searchParams.set("lat", String(params.lat));
    url.searchParams.set("lng", String(params.lng));
    if (params.radius_m) url.searchParams.set("radius_m", String(params.radius_m));
    if (params.max_results) url.searchParams.set("max_results", String(params.max_results));
    if (params.reviews_per_place) url.searchParams.set("reviews_per_place", String(params.reviews_per_place));
  
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  
  // Geocode through FastAPI proxy -> Google Geocoding 
  export async function geocodeViaBackend(address: string): Promise<LatLng> {
    const url = new URL("/find_places/geocode", API_BASE);
    url.searchParams.set("address", address);
  
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  
  // Place Autocomplete 
  export async function placesAutocomplete(input: string, sessionToken: string, components = "country:us"): Promise<Prediction[]> {
    const url = new URL("/find_places/places/autocomplete", API_BASE);
    url.searchParams.set("input", input);
    url.searchParams.set("session_token", sessionToken);
    if (components) url.searchParams.set("components", components);
  
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  
  // Place details
  export async function placeDetails(placeId: string, sessionToken: string): Promise<{ lat: number; lng: number; name?: string; formatted_address?: string }> {
    const url = new URL("/find_places/places/details", API_BASE);
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("session_token", sessionToken);
  
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

export async function getReport() {
  const res = await fetch(`${API_BASE}/analyze/report`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function chatWithGemini(payload: {
  messages: ChatMessage[];
  context?: unknown;
}): Promise<{ content: string }> {
  const url = new URL("/ai/chat", API_BASE);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
