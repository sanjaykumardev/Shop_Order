import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shop order flow",
  description: "Customer ordering and owner order management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
