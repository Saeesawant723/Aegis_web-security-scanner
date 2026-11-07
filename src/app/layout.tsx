import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const bricolage = localFont({
  src: [
    { path: "../../public/fonts/BricolageGrotesque-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/BricolageGrotesque-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/BricolageGrotesque-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-bricolage",
  display: "swap",
});

const jetbrains = localFont({
  src: [
    { path: "../../public/fonts/JetBrainsMono-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/JetBrainsMono-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AEGIS//AI — Security Assessment Platform",
  description:
    "Find the holes before they do. Non-destructive web security analysis with AI-powered reporting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${bricolage.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen bg-bg text-text antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
