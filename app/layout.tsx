import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Carte | Invitations with intention",
    template: "%s | Carte",
  },
  description: "Create thoughtful digital invitations for the moments worth gathering for.",
  openGraph: {
    type: "website",
    title: "Carte | Invitations with intention",
    description: "Create thoughtful digital invitations for the moments worth gathering for.",
    siteName: "Carte",
    url: "/",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
