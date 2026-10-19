import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Field, Input, Panel, Stack } from '../components/ui';
import { authService } from '../services/authService';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const isResetForm = !!(token && emailParam);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authService.requestPasswordReset(email);
      setSuccess(response.message);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('resetPassword.errors.requestFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.errors.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('resetPassword.errors.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(emailParam!, token!, newPassword);
      setSuccess(response.message);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('resetPassword.errors.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <Panel className="auth-form">
        <Stack gap="lg">
        <header className="auth-header">
          <h1 className="auth-title">
            {isResetForm ? t('resetPassword.resetTitle') : t('resetPassword.requestTitle')}
          </h1>
          <p className="auth-description">
            {isResetForm
              ? t('resetPassword.resetDescription')
              : t('resetPassword.requestDescription')}
          </p>
        </header>

        <form
          onSubmit={isResetForm ? handleResetPassword : handleRequestReset}
        >
          <Stack gap="lg">
          <Stack>
            {!isResetForm ? (
              <Field label={t('auth.emailAddress')} htmlFor="email">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailAddress')}
                />
              </Field>
            ) : (
              <>
                <Field label={t('resetPassword.newPassword')} htmlFor="newPassword">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('resetPassword.newPassword')}
                  />
                </Field>
                <Field label={t('resetPassword.confirmPassword')} htmlFor="confirmPassword">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('resetPassword.confirmPassword')}
                  />
                </Field>
              </>
            )}
          </Stack>

          {error && <Alert>{error}</Alert>}

          {success && <Alert tone="success">{success}</Alert>}

            <Button
              type="submit"
              loading={loading}
              className="auth-submit"
            >
              {loading ? t('common.states.processing') : isResetForm ? (
                t('resetPassword.resetAction')
              ) : (
                t('resetPassword.sendLinkAction')
              )}
            </Button>

          <div className="auth-footer">
            <Link to="/login" className="text-link">
              {t('resetPassword.backToSignIn')}
            </Link>
          </div>
          </Stack>
        </form>
        </Stack>
      </Panel>
    </main>
  );
}
