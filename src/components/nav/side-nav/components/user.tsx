import { ChevronDown } from "lucide-react";
import Image from "next/image";

export default function User() {
  return (
    <div className="flex h-16 items-center border-b border-[hsl(var(--border))] px-2">
      <div className="flex w-full items-center justify-between rounded-md px-2 py-1 
        hover:bg-[hsl(var(--muted))] transition-colors">
        <div className="flex items-center">
          <Image
            src="/avatar.jpg"
            alt="User"
            className="mr-2 rounded-full"
            width={36}
            height={36}
          />
          {/* <div className="flex flex-col">
            <span className="text-sm font-medium">Name</span>
            <span className="text-xs text-muted-foreground">Agent Admin</span>
          </div> */}
        </div>
        <ChevronDown
          size={16}
          className="text-[hsl(var(--muted-foreground))]"
        />
      </div>
    </div>
  );
}
