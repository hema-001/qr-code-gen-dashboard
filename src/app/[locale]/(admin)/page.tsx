import type { Metadata } from "next";
import {useTranslations} from 'next-intl';

export const metadata: Metadata = {
  title:
    "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};

export default function Main() {
  const t = useTranslations('Main');
  return (
        <div className="container mx-auto py-8">
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">{t('title')}</h1>
            <p className="mt-1 font-normal text-gray-500 text-theme-sm dark:text-gray-400">Main page content coming soon...</p>
        </div>
  );
}
