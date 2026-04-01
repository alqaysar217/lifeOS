import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LifeOS | حياتي',
  description: 'نظام تشغيل حياتك المتكامل',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-readex antialiased bg-background text-foreground selection:bg-primary/20 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
