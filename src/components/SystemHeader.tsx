import { useEffect, useState } from "react";

const SystemHeader = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 h-12">
        <div className="flex items-center gap-6">
          <h1 className="font-display text-2xl text-foreground tracking-[0.15em]">IGNIS</h1>
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
            Industrial Carbon Terminal v2.4.1
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-forge animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-mono">LIVE</span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {time.toISOString().replace("T", " ").slice(0, 19)} UTC
          </span>
          <span className="text-[10px] font-mono text-foreground uppercase tracking-wider">
            SYS:OPERATIONAL
          </span>
        </div>
      </div>
    </header>
  );
};

export default SystemHeader;
