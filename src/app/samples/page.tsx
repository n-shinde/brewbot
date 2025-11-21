// src/app/samples/page.tsx
import Link from "next/link";

type SampleFile = {
  name: string;
  href: string;        // public URL
  description: string;
  format: "CSV" | "JSON";
};

const FILES: SampleFile[] = [
  {
    name: "pos-transactions-large.csv",
    href: "/sample-data/pos-transactions-large.csv",
    description: "Large file - more than 30,000 rows.",
    format: "CSV",
  }
];

export const metadata = {
  title: "Sample POS Transactions Files",
  description: "Download sample POS transactions to test out our sales analysis features!",
};

export default function SamplesPage() {
  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Sample POS Transactions Files 📄 </h1>
        <p className="text-sm text-muted-foreground mt-1">
           Download sample POS transactions to test out our sales analysis features!
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FILES.map((f) => (
          <div key={f.name} className="rounded-lg border p-4 flex flex-col justify-between">
            <div>
              <div className="text-sm uppercase tracking-wide text-muted-foreground">{f.format}</div>
              <h2 className="text-lg font-medium mt-1">{f.name}</h2>
              <p className="text-sm text-muted-foreground mt-2">{f.description}</p>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {/* View (opens in browser) */}
              <Link
                href={f.href}
                className="px-3 py-2 rounded-md border hover:bg-accent hover:text-accent-foreground text-sm"
              >
                View
              </Link>

              {/* Download (forces save as) — use <a> for the download attribute */}
              <a
                href={f.href}
                download
                className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90"
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>

      <section className="text-sm text-muted-foreground">
        <h3 className="text-base font-medium text-foreground mb-1">How to use</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Download one of the sample files above.   ⬇️ </li>
          <li>Go to <code>/ticket</code> and upload the file.  ☁️ </li>
          <li>Review the parsed metrics and charts on your dashboard!  📊 </li>
        </ol>
      </section>
    </div>
  );
}
