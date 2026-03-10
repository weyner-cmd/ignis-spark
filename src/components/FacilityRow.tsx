interface FacilityRowProps {
  id: string;
  name: string;
  region: string;
  burnRate: number;
  allowance: number;
  status: "nominal" | "warning" | "critical";
}

const FacilityRow = ({ id, name, region, burnRate, allowance, status }: FacilityRowProps) => {
  const ratio = burnRate / allowance;
  const isBurning = status === "critical";

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_1fr_120px] border-b border-border hover:bg-muted/30 transition-colors">
      <div className="p-4 border-r border-border">
        <span className="text-xs text-muted-foreground font-mono">{id}</span>
      </div>
      <div className="p-4 border-r border-border">
        <div className="text-sm font-mono text-foreground">{name}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{region}</div>
      </div>
      <div className="p-4 border-r border-border">
        <span className={`font-mono text-sm ${isBurning ? "burn-active" : "text-foreground"}`}>
          {burnRate.toLocaleString()} MT/H
        </span>
      </div>
      <div className="p-4 border-r border-border">
        <div className="h-1 bg-muted w-full mt-2">
          <div
            className={`h-full ${isBurning ? "bg-forge" : ratio > 0.7 ? "bg-slag" : "bg-slag/50"}`}
            style={{ width: `${Math.min(ratio * 100, 100)}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground font-mono mt-1 block">
          {(ratio * 100).toFixed(1)}% CAPACITY
        </span>
      </div>
      <div className="p-4 flex items-center">
        <span className={`text-[10px] uppercase tracking-widest font-mono ${
          status === "critical" ? "text-forge" : status === "warning" ? "text-foreground" : "text-muted-foreground"
        }`}>
          {status}
        </span>
      </div>
    </div>
  );
};

export default FacilityRow;
