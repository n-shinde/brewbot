// "use client";
// import { VChart } from "@visactor/react-vchart";

// function ChartCard({ title, spec, height=320 }: any) {
//   return (
//     <div className="border rounded-xl p-4">
//       <div className="font-medium mb-2">{title}</div>
//       <div style={{ height }}>
//         <VChart spec={spec} />
//       </div>
//     </div>
//   );
// }

// export default function Insights({ result }: { result: any }) {
//   if (!result) return null;

//   const top = (result.top_items || []).slice(0, 10).map((t: any) => ({
//     name: t["Item Name"], count: t["cnt"]
//   }));

//   const gaps = (result.popularity_gaps || []).slice(0, 10).map((g: any) => ({
//     item: g.item, peer: +(g.peer_signal ?? 0), you: +(g.your_sales ?? 0)
//   }));

//   const topSpec = {
//     type: "bar",
//     data: [{ id: "d", values: top }],
//     xField: "name",
//     yField: "count",
//     axes: [{ orient: "left" }, { orient: "bottom", label: { autoHide: true } }],
//     legends: { visible: false },
//     tooltip: { visible: true }
//   };

//   const gapSpec = {
//     type: "common",
//     series: [
//       { type: "bar", dataId: "peer", xField: "item", yField: "peer", name: "Peers" },
//       { type: "bar", dataId: "you", xField: "item", yField: "you", name: "You" }
//     ],
//     data: [
//       { id: "peer", values: gaps },
//       { id: "you", values: gaps }
//     ],
//     axes: [{ orient: "left" }, { orient: "bottom", label: { autoHide: true } }],
//     tooltip: { visible: true }
//   };

//   return (
//     <div className="space-y-4">
//       {/* KPIs */}
//       <div className="grid md:grid-cols-4 gap-4">
//         <Kpi title="Net Sales" value={`$${Math.round(result.kpis?.net_sales || 0).toLocaleString()}`} />
//         <Kpi title="Transactions" value={result.kpis?.transactions ?? 0} />
//         <Kpi title="Tips" value={`$${Math.round(result.kpis?.tips || 0).toLocaleString()}`} />
//         <Kpi title="Fees" value={`$${Math.round(result.kpis?.fees || 0).toLocaleString()}`} />
//       </div>

//       {/* Charts */}
//       <div className="grid md:grid-cols-2 gap-4">
//         <ChartCard title="Top Products (sales)" spec={topSpec} />
//         <ChartCard title="Peer Mentions vs You" spec={gapSpec} />
//       </div>

//       {/* Raw JSON (debug toggle if you like) */}
//       <div className="border rounded-xl p-4">
//         <div className="font-medium mb-2">Report (JSON)</div>
//         <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
//       </div>
//     </div>
//   );
// }

// function Kpi({ title, value }: { title: string; value: any }) {
//   return (
//     <div className="border rounded-xl p-4">
//       <div className="text-sm text-gray-500">{title}</div>
//       <div className="text-2xl font-semibold">{value}</div>
//     </div>
//   );
// }
