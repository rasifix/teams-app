import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Input, LoadingSpinner } from '../components/ui';
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
    <div className="min-h-screen bg-surface-subtle flex justify-center px-4 py-12">
      <div className="auth-form layout-stack layout-stack--lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-content-strong">
            {isResetForm ? t('resetPassword.resetTitle') : t('resetPassword.requestTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-content-muted">
            {isResetForm
              ? t('resetPassword.resetDescription')
              : t('resetPassword.requestDescription')}
          </p>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={isResetForm ? handleResetPassword : handleRequestReset}
        >
          <div className="rounded-md shadow-sm space-y-4">
            {!isResetForm ? (
              <div>
                <label htmlFor="email" className="sr-only">
                  {t('auth.emailAddress')}
                </label>
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
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="newPassword" className="sr-only">
                    {t('resetPassword.newPassword')}
                  </label>
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
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="sr-only">
                    {t('resetPassword.confirmPassword')}
                  </label>
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
                </div>
              </>
            )}
          </div>

          {error && <Alert>{error}</Alert>}

          {success && <Alert tone="success">{success}</Alert>}

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <span className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-3" />
                  {t('common.states.processing')}
                </span>
              ) : isResetForm ? (
                t('resetPassword.resetAction')
              ) : (
                t('resetPassword.sendLinkAction')
              )}
            </Button>
          </div>

          <div className="text-center">
            <Link to="/login" className="font-medium text-sm text-brand-text hover:text-brand-text">
              {t('resetPassword.backToSignIn')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
