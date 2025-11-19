// import type { Metadata } from "next";
// import { Inter, Fraunces } from "next/font/google";
// import { SideNav } from "@/components/nav";
// import { siteConfig } from "@/config/site";
// import { cn } from "@/lib/utils";
// import "@/style/globals.css";
// import { Providers } from "./providers";

// // load both fonts as CSS vars
// const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
// const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-serif" });

// export const metadata: Metadata = {
//   title: siteConfig.title,
//   description: siteConfig.description,
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html
//       lang="en"
//       suppressHydrationWarning
//       className={`${inter.variable} ${fraunces.variable}`}
//     >
//       <body className={cn("bg-latte text-espresso font-sans", inter.variable)}>
//         <Providers>
//           <div className="flex min-h-[100dvh]">
//             <SideNav />
//             <div className="flex-grow overflow-auto">{children}</div>
//           </div>
//         </Providers>
//       </body>
//     </html>
//   );
// }

import { Inter, Fraunces } from "next/font/google";
import type { Metadata } from "next";
import "@/style/globals.css";
import { Providers } from "./providers";
import { SideNav } from "@/components/nav";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`} suppressHydrationWarning>
      {/* Use semantic tokens so your globals.css theme applies */}
      <body className={cn("bg-background text-foreground font-sans")}>
        <Providers>
          <div className="flex min-h-[100dvh]">
            <SideNav />
            <div className="flex-grow overflow-auto">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}