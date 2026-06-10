import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { LocaleProvider } from '@/context/locale-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { es as esTranslations } from '@/locales/es';

export const metadata: Metadata = {
  title: esTranslations.SITE_TITLE,
  description: esTranslations.home.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background flex flex-col">
        <AuthProvider>
          <LocaleProvider>
            <CartProvider>
              <Header />
              <main className="flex-grow container py-8">
                {children}
              </main>
              <Footer />
              <Toaster />
            </CartProvider>
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
