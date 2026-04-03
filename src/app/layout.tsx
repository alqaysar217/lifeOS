
import type {Metadata} from 'next';
import './globals.css';
import { PWARegister } from '@/components/PWARegister';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'حياتي',
  description: 'نظام تشغيل حياتك المتكامل',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'حياتي',
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<any>;
}) {
  // فك المعاملات لضمان التوافق مع Next.js 15
  const params = await props.params;

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#8b5cf6" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="font-cairo antialiased bg-background text-foreground selection:bg-primary/20 overflow-x-hidden">
        <FirebaseClientProvider>
          <PWARegister />
          {props.children}
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
