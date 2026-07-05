import type { Metadata } from "next";
import { outfit } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zidny Design Workflow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}
