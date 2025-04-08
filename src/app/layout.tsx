import "./globals.css";
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'MLBB Ranking',
  description: 'Track your MLBB collection items, calculate your worth, and see rankings of top collectors',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-JRVM4M1RZX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            gtag('config', 'G-JRVM4M1RZX');
          `}
        </Script>
      </head>
      <body className="bg-gray-900 text-white min-h-screen">
        <div className="mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-4xl">
          {children}
        </div>
      </body>
    </html>
  );
}
