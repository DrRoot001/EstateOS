import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MARKETS,
  MARKET_CODES,
  restoreMarket,
  setMarket,
  useMarket,
  type MarketCode,
} from "@/lib/markets";

/** Switches the active country pack (PRD 8A). */
export function MarketSwitcher() {
  const market = useMarket();
  useEffect(restoreMarket, []);

  return (
    <Select value={market.code} onValueChange={(v) => setMarket(v as MarketCode)}>
      <SelectTrigger className="w-[132px]" aria-label="Market">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MARKET_CODES.map((code) => (
          <SelectItem key={code} value={code}>
            {MARKETS[code].flag} {code} · {MARKETS[code].currency}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
