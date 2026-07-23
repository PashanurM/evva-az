import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { HtmlLangSync } from "@/components/layout/HtmlLangSync";
import { NumberInputGuard } from "@/components/layout/NumberInputGuard";
import { PublicChrome } from "@/components/layout/PublicChrome";
import { SilenceNextDevtools } from "@/components/layout/SilenceNextDevtools";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Providers } from "@/app/providers";
import { siteMetadata } from "@/lib/site-metadata";
import "./globals.css";
import "./evva-nature-theme.css";
import "@/components/layout/layout-chrome.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  ...siteMetadata,
  icons: {
    icon: "/assets/evva-favicon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="az"
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <body className="evva-nature-ui" suppressHydrationWarning>
        <SilenceNextDevtools />
        <NumberInputGuard />
        <ThemeProvider>
          <Providers>
            <HtmlLangSync />
            <PublicChrome>{children}</PublicChrome>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
