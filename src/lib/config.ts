export const shop = {
  name: process.env.SHOP_NAME || "Barbearia Ty_Zah",
  phone: process.env.SHOP_PHONE || "5533998301285",
  address: process.env.SHOP_ADDRESS || "Centro, Braúnas - MG, CEP 35189-000",
  mapsUrl:
    process.env.SHOP_MAPS_URL ||
    "https://www.google.com/maps/search/?api=1&query=Pra%C3%A7a+Padre+Jos%C3%A9+Augusto+de+Oliveira,+Centro,+Bra%C3%BAnas+-+MG",
  slotMinutes: Number(process.env.SHOP_SLOT_MINUTES || 30),
  tz: process.env.SHOP_TIMEZONE || "America/Sao_Paulo",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://tyzah-sistema.vercel.app",
};

export function getHours(): Record<number, [string, string] | null> {
  try {
    if (process.env.SHOP_HOURS_JSON) return JSON.parse(process.env.SHOP_HOURS_JSON);
  } catch {}
  return {
    0: null,
    1: null,
    2: ["09:00", "20:00"],
    3: ["09:00", "20:00"],
    4: ["09:00", "20:00"],
    5: ["09:00", "20:00"],
    6: ["08:00", "18:00"],
  };
}
