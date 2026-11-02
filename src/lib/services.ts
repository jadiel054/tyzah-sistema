export const DEFAULT_SERVICES = [
  { name: "Social", durationMin: 30, priceCents: 3000, sortOrder: 1 },
  { name: "Degradê", durationMin: 40, priceCents: 3500, sortOrder: 2 },
  { name: "Tesoura", durationMin: 40, priceCents: 3500, sortOrder: 3 },
  { name: "Barba", durationMin: 25, priceCents: 2000, sortOrder: 4 },
  { name: "Social / Barba", durationMin: 50, priceCents: 4500, sortOrder: 5 },
  { name: "Degradê / Barba", durationMin: 55, priceCents: 5000, sortOrder: 6 },
  { name: "Social / Barba / Sobrancelha", durationMin: 60, priceCents: 5500, sortOrder: 7 },
  { name: "Degradê / Barba / Sobrancelha", durationMin: 70, priceCents: 5500, sortOrder: 8 },
  { name: "Sobrancelha", durationMin: 10, priceCents: 1000, sortOrder: 9 },
  { name: "Tintura / Barba", durationMin: 15, priceCents: 1500, sortOrder: 10 },
];

export function priceLabel(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
