import './globals.css';
import './animations.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Photo Book',
  description: 'Interactive photo book with page flip animations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Favicon links */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Apple Touch Icon for iOS devices */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        <title>Photo Book</title>
        <meta name="description" content="Interactive photo book with page flip animations" />
      </head>
      <body>{children}</body>
    </html>
  );
}
