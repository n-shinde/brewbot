"use client";

import { ArrowLeftToLine, ArrowRightToLine } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Navigation from "./components/navigation";
import User from "./components/user";
import VisActor from "./components/visactor";

export default function SideNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        className={cn(
          "fixed left-0 top-12 z-50 rounded-r-full px-3 py-2 shadow-lg",
          // Coffee theme (semantic tokens)
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
          "hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-[hsl(var(--background))]",
          "transition-transform duration-300 ease-in-out",
          "tablet:hidden",
          isOpen ? "translate-x-44" : "translate-x-0"
        )}
        onClick={() => setIsOpen((v) => !v)}
      >
        {isOpen ? <ArrowLeftToLine size={16} /> : <ArrowRightToLine size={16} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-40 flex h-[100dvh] w-44 shrink-0 flex-col",
          // Coffee theme (semantic tokens)
          "border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]",
          // Animation / responsive behavior
          "transition-transform duration-300 ease-in-out",
          "tablet:sticky tablet:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-3">
          <User />
        </div>

        <nav className="px-2">
          <Navigation />
        </nav>

        <div className="mt-auto p-3">
          <VisActor />
        </div>
      </aside>
    </>
  );
}

// export default function SideNav() {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <>
//       <button
//         className={cn(
//           "fixed left-0 top-12 z-50 rounded-r-md bg-slate-200 px-2 py-1.5 text-primary-foreground shadow-md hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 tablet:hidden",
//           "transition-transform duration-300 ease-in-out",
//           isOpen ? "translate-x-44" : "translate-x-0",
//         )}
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         {isOpen ? (
//           <ArrowLeftToLine size={16} />
//         ) : (
//           <ArrowRightToLine size={16} />
//         )}
//       </button>
//       <aside
//         className={cn(
//           "fixed bottom-0 left-0 top-0 z-40 flex h-[100dvh] w-44 shrink-0 flex-col border-r border-border bg-slate-100 dark:bg-slate-900 tablet:sticky tablet:translate-x-0",
//           "transition-transform duration-300 ease-in-out",
//           isOpen ? "translate-x-0" : "-translate-x-full",
//         )}
//       >
//         <User />
//         <Navigation />
//         <VisActor />
//       </aside>
//     </>
//   );
// }
