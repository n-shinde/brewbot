import { Gauge, type LucideIcon, MessagesSquare, FileText } from "lucide-react";

export type SiteConfig = typeof siteConfig;
export type Navigation = {
  icon: LucideIcon;
  name: string;
  href: string;
};

export const siteConfig = {
  title: "BrewBot",
  description: "Optimize your sales and compete effectively with local coffee shops!",
};

export const navigations: Navigation[] = [
  {
    icon: MessagesSquare,
    name: "Competitor Search",
    href: "/",
  },
  {
    icon: Gauge,
    name: "Sales Analysis",
    href: "/ticket",
  },
  {
    icon: FileText,
    name: "Sample Data",
    href: "/samples",
  }
];
