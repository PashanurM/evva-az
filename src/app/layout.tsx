import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import { HtmlLangSync } from "@/components/layout/HtmlLangSync";
import { PublicChrome } from "@/components/layout/PublicChrome";
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

const bootScript = `(function(){try{var t=localStorage.getItem("evva-theme");if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";document.body&&document.body.classList.add("dark");}}catch(e){}function isExtensionNoise(msg,src,stack){var hay=String(msg||"")+String(src||"")+String(stack||"");return hay.indexOf("chrome-extension://")!==-1||hay.indexOf("moz-extension://")!==-1||hay.indexOf("MetaMask")!==-1||hay.indexOf("Failed to connect to MetaMask")!==-1||hay.indexOf("MetaMask extension not found")!==-1||hay.indexOf("Error restoring session")!==-1;}window.addEventListener("error",function(e){if(isExtensionNoise(e.message,e.filename,e.error&&e.error.stack)){e.preventDefault();e.stopImmediatePropagation();return true;}},true);window.addEventListener("unhandledrejection",function(e){var r=e.reason,m=r&&r.message?r.message:String(r||""),s=r&&r.stack?r.stack:"";if(isExtensionNoise(m,"",s)){e.preventDefault();e.stopImmediatePropagation();}},true);var origError=console.error;console.error=function(){var hay=Array.prototype.slice.call(arguments).map(String).join(" ");if(isExtensionNoise(hay))return;return origError.apply(console,arguments);};})();`;

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
      <head>
        <Script id="evva-boot" strategy="beforeInteractive">
          {bootScript}
        </Script>
      </head>
      <body className="evva-nature-ui" suppressHydrationWarning>
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
