import type { LogisticsFee, Package } from "./types";

export type QuoteInput = {
  pkg: Package | null;
  outfits: number;
  logistics: LogisticsFee | null;
  express: boolean;
  expressFee: number;
  depositPercent: number;
};

export type Quote = {
  priced: boolean; // false when the package has no price yet
  outfits: number;
  subtotal: number;
  logistics: number;
  expressFee: number;
  total: number;
  deposit: number;
  balance: number;
};

// Used by the booking form for the live summary and again on the server,
// so the amount charged never depends on what the browser sends.
export function quote({ pkg, outfits, logistics, express, expressFee, depositPercent }: QuoteInput): Quote {
  const qty = pkg?.per_outfit ? Math.min(Math.max(1, Math.floor(outfits || 1)), 20) : 1;
  const priced = Boolean(pkg && pkg.price !== null);
  const subtotal = priced ? (pkg!.price as number) * qty : 0;
  const logisticsFee = logistics ? logistics.fee : 0;
  const exp = express ? expressFee : 0;
  const total = subtotal + logisticsFee + exp;
  const deposit = Math.round((total * depositPercent) / 100);
  return { priced, outfits: qty, subtotal, logistics: logisticsFee, expressFee: exp, total, deposit, balance: total - deposit };
}
