"use client";

type Props = {
  label?: string;
  className?: string;
};

export default function CoffeeLoader({ label = "Brewing your request...", className = "" }: Props) {
  return (
    <div
      className={`w-full select-none ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="coffee-track">
        <div className="coffee-fill" />
        <div className="coffee-mug" aria-hidden="true">
          <span className="text-base leading-none">☕️</span>
        </div>
      </div>
      <div className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{label}</div>
    </div>
  );
}
