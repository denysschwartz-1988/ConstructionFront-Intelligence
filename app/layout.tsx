import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConstructionFront Project Intelligence Map",
  description: "Project intelligence map foundation for ConstructionFront."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
