import { useTranslation } from 'react-i18next';
import { ButtonLink } from './ui';

export default function LoginButton() {
  const { t } = useTranslation();

  return (
    <ButtonLink
      to="/login"
      className="app-login-button"
      title={t('auth.login')}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="icon-sm"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
        />
      </svg>
      <span>{t('auth.login')}</span>
    </ButtonLink>
  );
}
