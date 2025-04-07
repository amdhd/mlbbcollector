import "./globals.css";
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'MLBB Ranking by JollyMax',
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
      <body className="bg-gray-900 text-white min-h-screen">
        <div className="mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-4xl">
          {children}
        </div>
      </body>
    </html>
  );
}
