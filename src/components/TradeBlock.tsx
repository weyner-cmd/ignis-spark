interface TradeBlockProps {
  pair: string;
  price: number;
  change: number;
  volume: string;
}

const TradeBlock = ({ pair, price, change, volume }: TradeBlockProps) => {
  const isUp = change >= 0;

  return (
    <div className="border-r border-b border-border p-5 hover:bg-muted/20 transition-colors">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono mb-3">
        {pair}
      </div>
      <div className="font-display text-4xl text-foreground leading-none">
        ${price.toFixed(2)}
      </div>
      <div className="flex items-baseline gap-3 mt-2">
        <span className={`text-xs font-mono ${isUp ? "text-foreground" : "text-forge"}`}>
          {isUp ? "+" : ""}{change.toFixed(2)}%
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">
          VOL {volume}
        </span>
      </div>
    </div>
  );
};

export default TradeBlock;
