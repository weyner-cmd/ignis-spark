import { useEffect, useState } from "react";

interface BurnGaugeProps {
  label: string;
  value: number;
  max: number;
  unit: string;
}

const BurnGauge = ({ label, value, max, unit }: BurnGaugeProps) => {
  const [displayed, setDisplayed] = useState(0);
  const ratio = value / max;
  const isBurning = ratio > 0.85;

  useEffect(() => {
    const timer = setTimeout(() => setDisplayed(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="border-b border-border p-6">
      <div className="flex items-baseline justify-between mb-4">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
          {label}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {isBurning ? "THRESHOLD EXCEEDED" : "NOMINAL"}
        </span>
      </div>
      <div className={`font-display text-6xl md:text-7xl leading-none tracking-tight ${isBurning ? "burn-active" : "text-foreground"}`}>
        {displayed.toLocaleString()}
        <span className="text-2xl md:text-3xl ml-2 text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-4 h-1 bg-muted w-full">
        <div
          className={`h-full transition-all duration-1000 ${isBurning ? "bg-forge" : "bg-slag"}`}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground font-mono">0</span>
        <span className="text-[10px] text-muted-foreground font-mono">{max.toLocaleString()} {unit}</span>
      </div>
    </div>
  );
};

export default BurnGauge;
