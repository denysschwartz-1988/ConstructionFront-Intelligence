import { ClerkProvider } from "@clerk/nextjs";
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
    <ClerkProvider>
      <html lang="en">
        <body
          style={{
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, 'Helvetica Neue', Arial, sans-serif",
            fontSize: "13px",
            margin: 0,
            padding: 0
          }}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
