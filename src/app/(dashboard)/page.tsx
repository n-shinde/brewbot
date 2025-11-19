"use client";
import { useState } from "react";
import UploadPanel from "@/components/upload-panel";
import NearbyCoffee from "@/components/nearby-coffee";
import Insights from "@/components/insights";
// import ChatPanel from "@/components/chat-panel";

export default function DashboardPage() {
  const [result, setResult] = useState<any>(null);

  return (
    <main className="space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Upload transactions, then quickly find nearby competitors */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium">Upload Transactions</h2>
        <p className="text-sm text-muted-foreground">
          Upload your transactions file, then search for nearby coffee shops around a location.
        </p>
        <UploadPanel onResult={setResult}/>
      </section>

      <hr className="border-t" />

      {/* Location -> Nearby coffee shops */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium">Find Nearby Coffee Shops</h2>
        <p className="text-sm text-muted-foreground">
          Use your current location or enter an address to see the 10 closest shops.
        </p>
        <NearbyCoffee />
      </section>
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
