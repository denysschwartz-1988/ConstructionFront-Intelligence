import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap"
});

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
    <ClerkProvider>
      <html lang="en" className={inter.className}>
        <body
          style={{
            margin: 0,
            padding: 0,
            backgroundColor: "#0a1628",
            color: "#e6edf3"
          }}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
