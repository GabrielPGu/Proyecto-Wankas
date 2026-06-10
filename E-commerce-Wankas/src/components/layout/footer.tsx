'use client'; 

import { Copyright } from 'lucide-react';
import { useLocale } from '@/context/locale-context'; 
import { FALLBACK_SITE_TITLE } from '@/config/site'; 

export function Footer() {
  const { translations } = useLocale(); 

  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container flex flex-col items-center justify-center gap-2 py-8 md:flex-row md:justify-between">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Copyright className="h-4 w-4" />
          <span>{new Date().getFullYear()} {translations.SITE_TITLE || FALLBACK_SITE_TITLE}. {translations.footer.rightsReserved}</span>
        </div>
      </div>
    </footer>
  );
}
