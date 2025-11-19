"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigations } from "@/config/site";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-grow flex-col gap-y-1 p-2">
      {navigations.map((navigation) => {
        const Icon = navigation.icon;
        const isActive = pathname === navigation.href;
        
        return (
          <Link
            key={navigation.name}
            href={navigation.href}
            className={cn(
              "flex items-center rounded-md px-2 py-1.5 transition-colors",
              isActive
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
            )}
          >
            <Icon
              size={16}
              className={cn(
                "mr-2",
                isActive
                  ? "text-[hsl(var(--primary-foreground))]"
                  : "text-[hsl(var(--muted-foreground))]"
              )}
            />
            <span className="text-sm">{navigation.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
