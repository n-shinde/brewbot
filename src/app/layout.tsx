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

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-serif" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans bg-latte text-espresso">{children}</body>
    </html>
  );
}