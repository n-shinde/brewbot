"use client";
import { useState } from "react";
import UploadPanel from "@/components/upload-panel";
import NearbyCoffee from "@/components/nearby-coffee";
import ChatbotPanel from "@/components/chatbot-panel";
import type { Competitor } from "@/lib/api";


// import ChatPanel from "@/components/chat-panel";

export default function DashboardPage() {
  const [result, setResult] = useState<unknown>(null);
  const [shops, setShops] = useState<Competitor[] | null>(null);

  return (
    <main className="space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Get started with our competitor search feature.</h1>

      {/* Location -> Nearby coffee shops */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium">Find Nearby Coffee Shops</h2>
        <p className="text-sm text-muted-foreground">
          Use your current location or enter an address to see highly-rated coffee shops near you.
        </p>
        <NearbyCoffee />
      </section>

      <hr className="border-t" /> 

      {/* Chatbot panel */}
      {shops && shops.length > 0 && (
        <section className="space-y-4">
          <ChatbotPanel
            className="mt-6"
            context={{
              shops: shops.map((c) => ({
                id: c.id,
                name: c.name,
                address: (c as any).formatted_address,
                googleMapsUri: (c as any).google_maps_uri,
                rating: c.rating,
                reviews: c.review_count,
              })),
            }}
          />
        </section>
      )}


    </main>
  );
}



// import {
//   AverageTicketsCreated,
//   Conversions,
//   CustomerSatisfication,
//   Metrics,
//   TicketByChannels,
// } from "@/components/chart-blocks";
// import Container from "@/components/container";

// export default function Home() {
//   return (
//     <div>
//       <Metrics />
//       <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-3 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
//         <Container className="py-4 laptop:col-span-2">
//           <AverageTicketsCreated />
//         </Container>
//         <Container className="py-4 laptop:col-span-1">
//           <Conversions />
//         </Container>
//       </div>
//       <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-2 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
//         <Container className="py-4 laptop:col-span-1">
//           <TicketByChannels />
//         </Container>
//         <Container className="py-4 laptop:col-span-1">
//           <CustomerSatisfication />
//         </Container>
//       </div>
//     </div>
//   );
// }
