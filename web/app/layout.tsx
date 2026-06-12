import type { Metadata } from "next";
import "molstar/build/viewer/molstar.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Protein Visualizer",
  description: "A simple protein structure learning interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
