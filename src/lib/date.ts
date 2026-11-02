import { shop } from "./config";

/**
 * Returns today's date formatted as YYYY-MM-DD in the shop's timezone (default America/Sao_Paulo).
 * Resolves the issue where new Date().toISOString() after 21:00 BRT outputs the next UTC day.
 */
export function getTodayDateString(timeZone: string = shop.tz): string {
  const now = new Date();
  return now.toLocaleDateString("en-CA", { timeZone });
}

/**
 * Formats a given Date instance into YYYY-MM-DD in the shop's timezone.
 */
export function formatDateInTz(date: Date, timeZone: string = shop.tz): string {
  return date.toLocaleDateString("en-CA", { timeZone });
}

/**
 * Checks if a given YYYY-MM-DD date string is strictly in the past relative to today in the shop's timezone.
 */
export function isDateInPast(dateStr: string, timeZone: string = shop.tz): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return true;
  const today = getTodayDateString(timeZone);
  return dateStr < today;
}

/**
 * Formats YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateBR(dateStr: string): string {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  return dateStr.split("-").reverse().join("/");
}
