import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Panel, Stack } from '../components/ui';
import { authService } from '../services/authService';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');

  useEffect(() => {
    if (!token) return;
    let active = true;
    authService.verifyEmail(token).then(
      () => { if (active) setStatus('success'); },
      () => { if (active) setStatus('error'); },
    );
    return () => { active = false; };
  }, [token]);

  return (
    <main className="auth-shell">
      <Panel className="auth-form">
        <Stack gap="lg">
          <h1 className="auth-title">{t('auth.verifyEmailTitle')}</h1>
          {status === 'loading' && <Alert tone="info">{t('auth.verificationInProgress')}</Alert>}
          {status === 'success' && (
            <>
              <Alert tone="success">{t('auth.verificationSuccess')}</Alert>
              <Link to="/login">{t('auth.signIn')}</Link>
            </>
          )}
          {status === 'error' && <Alert tone="error">{t('auth.verificationError')}</Alert>}
        </Stack>
      </Panel>
    </main>
  );
}
