import { TopNav } from "@/components/nav";

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="min-h-[100dvh] bg-latte text-espresso">
//       <TopNav title="Dashboard" />
//       <main className="px-6 md:px-10 lg:px-16 py-8">{children}</main>
//     </div>
//   );
// }

export default function SampleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] bg-background text-foreground overflow-hidden">
      {/* Subtle blobs behind everything */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 right-0 h-[50vh] w-[60vw] rounded-full bg-[hsl(var(--muted))] opacity-25 blur-3xl" />
        <div className="absolute bottom-0 -left-32 h-[45vh] w-[55vw] rounded-full bg-[hsl(var(--card))] opacity-40 blur-2xl" />
      </div>

      <TopNav title="BrewBot" />
      <main className="px-6 md:px-10 lg:px-16 py-8">{children}</main>
    </div>
  );
}