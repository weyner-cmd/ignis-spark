import SystemHeader from "@/components/SystemHeader";
import BurnGauge from "@/components/BurnGauge";
import FacilityRow from "@/components/FacilityRow";
import TradeBlock from "@/components/TradeBlock";

const facilities = [
  { id: "FAC-001", name: "Krupp Steelworks", region: "Essen, DE", burnRate: 12400, allowance: 14000, status: "warning" as const },
  { id: "FAC-002", name: "Tata Blast Furnace IV", region: "Jamshedpur, IN", burnRate: 18900, allowance: 15000, status: "critical" as const },
  { id: "FAC-003", name: "ArcelorMittal Dunkirk", region: "Dunkerque, FR", burnRate: 9200, allowance: 16000, status: "nominal" as const },
  { id: "FAC-004", name: "POSCO Gwangyang", region: "Gwangyang, KR", burnRate: 14800, allowance: 15500, status: "warning" as const },
  { id: "FAC-005", name: "Norilsk Smelter Complex", region: "Norilsk, RU", burnRate: 22100, allowance: 18000, status: "critical" as const },
  { id: "FAC-006", name: "US Steel Gary Works", region: "Gary, IN, US", burnRate: 7600, allowance: 12000, status: "nominal" as const },
];

const trades = [
  { pair: "EU ETS / CO2", price: 87.42, change: 2.14, volume: "14.2M" },
  { pair: "CCA / RGGI", price: 34.18, change: -1.07, volume: "8.7M" },
  { pair: "VCM / REDD+", price: 12.55, change: 0.33, volume: "3.1M" },
  { pair: "UK ETS / CO2", price: 45.90, change: -3.21, volume: "6.4M" },
];

const Index = () => {
  return (
    <div className="snap-container bg-background">
      <SystemHeader />

      {/* Section 1: Overview */}
      <section className="snap-section pt-12 flex flex-col">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3">
          {/* Left: Burn Gauges */}
          <div className="md:col-span-2 border-r border-border">
            <div className="border-b border-border px-6 py-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
                Global Burn Telemetry — Real-Time
              </span>
            </div>
            <BurnGauge label="Total CO₂ Emissions" value={45280} max={50000} unit="MT" />
            <BurnGauge label="Active Burn Rate" value={2847} max={3000} unit="MT/H" />
            <BurnGauge label="Clean Energy Offset" value={12400} max={45000} unit="MWh" />
          </div>

          {/* Right: Energy Markets */}
          <div className="flex flex-col">
            <div className="border-b border-border px-6 py-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
                Carbon Markets
              </span>
            </div>
            {trades.map((trade) => (
              <TradeBlock key={trade.pair} {...trade} />
            ))}
            <div className="flex-1 border-b border-border p-5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono mb-2">
                Network Status
              </div>
              <div className="space-y-2 mt-4">
                {["Feed: Bloomberg Terminal", "Latency: 12ms", "Uptime: 99.97%", "Last Sync: 0.4s ago"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-slag" />
                    <span className="text-[10px] font-mono text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Facility Monitor */}
      <section className="snap-section pt-12 flex flex-col">
        <div className="flex-1">
          <div className="border-b border-border px-6 py-3 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
              Facility Monitor — Active Installations
            </span>
            <span className="text-[10px] font-mono text-forge">
              2 THRESHOLD ALERTS
            </span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_120px] border-b border-border bg-muted/30">
            {["ID", "Facility", "Burn Rate", "Capacity", "Status"].map((h) => (
              <div key={h} className="p-4 border-r border-border last:border-r-0">
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono">{h}</span>
              </div>
            ))}
          </div>

          {facilities.map((f) => (
            <FacilityRow key={f.id} {...f} />
          ))}

          {/* Summary bar */}
          <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-muted/10">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              6 Installations Monitored
            </span>
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-mono text-muted-foreground">
                AGGREGATE: 85,000 MT/H
              </span>
              <span className="text-[10px] font-mono text-forge">
                EXCEED: 2 FACILITIES
              </span>
            </div>
          </div>

          {/* Bottom data strip */}
          <div className="grid grid-cols-4 border-b border-border">
            {[
              { label: "Total Allowance", value: "90,500 MT" },
              { label: "Current Output", value: "85,000 MT" },
              { label: "Remaining Buffer", value: "5,500 MT" },
              { label: "Time to Breach", value: "01:54:22" },
            ].map((item) => (
              <div key={item.label} className="p-5 border-r border-border last:border-r-0">
                <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono mb-2">
                  {item.label}
                </div>
                <div className="font-display text-3xl text-foreground">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
