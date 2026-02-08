import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 全角数字・記号を半角に変換（数量・金額入力用） */
export function normalizeToHalfWidthNumeric(value: string): string {
  return value
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/．/g, ".")
    .replace(/，|、/g, ",")
    .trim();
}

/** 消費税の端数処理: 切り捨て(floor) / 四捨五入(round) / 切り上げ(ceil) */
export type TaxRounding = "floor" | "round" | "ceil";

export function calcTaxAmount(
  subtotal: number,
  taxRatePercent: number,
  rounding: TaxRounding = "floor"
): number {
  const raw = subtotal * (taxRatePercent / 100);
  switch (rounding) {
    case "floor":
      return Math.floor(raw);
    case "round":
      return Math.round(raw);
    case "ceil":
      return Math.ceil(raw);
    default:
      return Math.floor(raw);
  }
}
