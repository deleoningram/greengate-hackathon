import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenGate",
  description: "AI-оценка готовности предприятия к обмену вторсырьём",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
