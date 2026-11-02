import type { Metadata } from "next";
import { Bebas_Neue, Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { shop } from "@/lib/config";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const dm = DM_Sans({ subsets: ["latin"], variable: "--font-dm" });

export const metadata: Metadata = {
  title: `${shop.name} | Corte e Barba em Braúnas, MG`,
  description: `Agende seu horário na ${shop.name}. ${shop.address}.`,
  openGraph: {
    title: shop.name,
    description: `Barbearia em ${shop.address}. Agende online.`,
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BarberShop",
    name: shop.name,
    telephone: `+${shop.phone}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: shop.address,
      addressLocality: "Braúnas",
      addressRegion: "MG",
      postalCode: "35189-000",
      addressCountry: "BR",
    },
    url: shop.appUrl,
    priceRange: "$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "08:00",
        closes: "18:00",
      },
    ],
  };

  return (
    <html lang="pt-BR" className={`${bebas.variable} ${playfair.variable} ${dm.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
