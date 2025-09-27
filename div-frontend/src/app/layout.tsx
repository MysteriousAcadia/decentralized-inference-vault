import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DIV - Decentralized Inference Vault",
  description:
    "Commission-Free, Token-Gated Model-as-a-Service (MaaS) Inference Platform",
  keywords: [
    "AI",
    "Machine Learning",
    "Blockchain",
    "Decentralized",
    "Web3",
    "Inference",
  ],
  authors: [{ name: "DIV Team" }],
  openGraph: {
    title: "DIV - Decentralized Inference Vault",
    description:
      "Commission-Free, Token-Gated Model-as-a-Service (MaaS) Inference Platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
