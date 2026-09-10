import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RolePilot — Resume Review Workflow",
  description: "Upload a resume and job URL, approve the review, and receive evidence-based application feedback.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
