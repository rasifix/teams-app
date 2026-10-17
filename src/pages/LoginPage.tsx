import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Input, LoadingSpinner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { LOGGED_OUT_REASON } from '../services/authSession';

interface LoginLocationState {
  from?: Location;
  reason?: string;
}

export default function LoginPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(!searchParams.get('register'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LoginLocationState | null;
  const from = locationState?.from?.pathname || '/';
  const wasLoggedOut = searchParams.get('reason') === LOGGED_OUT_REASON
    || locationState?.reason === LOGGED_OUT_REASON;

  useEffect(() => {
    setIsLogin(!searchParams.get('register'));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, firstName, lastName);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errors.authenticationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-subtle flex justify-center px-4 py-12">
      <div className="auth-form layout-stack layout-stack--lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-content-strong">
            {isLogin ? t('auth.signInToAccount') : t('auth.createAccount')}
          </h2>
          <p className="mt-2 text-center text-sm text-content-muted">
            {isLogin ? t('auth.noAccountPrompt') : t('auth.hasAccountPrompt')}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              {isLogin ? t('auth.signUp') : t('auth.signIn')}
            </Button>
          </p>
        </div>

        {wasLoggedOut && (
          <Alert tone="info">{t('auth.loggedOutMessage')}</Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="sr-only">
                    {t('auth.firstName')}
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required={!isLogin}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t('auth.firstName')}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="sr-only">
                    {t('auth.lastName')}
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required={!isLogin}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t('auth.lastName')}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email-address" className="sr-only">
                {t('auth.emailAddress')}
              </label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailAddress')}
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                {t('auth.password')}
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.password')}
              />
            </div>
          </div>

          {error && <Alert>{error}</Alert>}

          {isLogin && (
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link to="/reset-password" className="font-medium text-brand-text hover:text-brand-text">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </div>
          )}

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
              ) : (
                isLogin ? t('auth.signIn') : t('auth.signUp')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
