'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'next-i18next';

const LanguageToggle = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const currentLocale = router.locale;

  const toggleLanguage = () => {
    const newLocale = currentLocale === 'en' ? 'hi' : 'en';
    router.push(router.asPath, undefined, { locale: newLocale });
  };

  return (
    <button onClick={toggleLanguage} style={{ padding: '10px', cursor: 'pointer' }}>
      {t('toggleLanguage')}
    </button>
  );
};

export default LanguageToggle;

