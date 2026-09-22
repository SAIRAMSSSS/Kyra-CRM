import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KYRA CRM — Employee Operations Portal",
  description: "Internal business portal for marketing campaigns, lead intake, telecalling operations, and site visits.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="h-full flex flex-col antialiased font-sans text-slate-900 bg-slate-50">
        {children}
      </body>
    </html>
  );
}
