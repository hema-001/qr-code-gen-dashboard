import { Outfit, Noto_Sans_Arabic, Noto_Sans_SC } from 'next/font/google';
import './globals.css';
import {NextIntlClientProvider} from 'next-intl';
import { getLocale } from 'next-intl/server';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

// Font for English and default
const outfit = Outfit({
  subsets: ["latin"],
  variable: '--font-outfit',
});

// Font for Arabic
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: '--font-arabic',
});

// Font for Chinese
const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: '--font-chinese',
});

// RTL languages
const rtlLocales = ['ar'];

// Get font class based on locale
const getFontClass = (locale: string) => {
  switch (locale) {
    case 'ar':
      return notoSansArabic.className;
    case 'zh':
      return notoSansSC.className;
    default:
      return outfit.className;
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dir = rtlLocales.includes(locale) ? 'rtl' : 'ltr';
  const fontClass = getFontClass(locale);

  return (
    <html lang={locale} dir={dir}>
      <body className={`${fontClass} dark:bg-gray-900`}>
        <AuthProvider>
          <ThemeProvider>
            <SidebarProvider>
              <NextIntlClientProvider>{children}</NextIntlClientProvider>
              </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
