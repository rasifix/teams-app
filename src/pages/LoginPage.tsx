import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Field, Input, Panel, Stack } from '../components/ui';
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
  const [notice, setNotice] = useState('');
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
        navigate(from, { replace: true });
      } else {
        await register(email, password, firstName, lastName);
        setIsLogin(true);
        setNotice(t('auth.registrationVerificationNotice'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errors.authenticationFailed'));
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
            {isLogin ? t('auth.signInToAccount') : t('auth.createAccount')}
          </h1>
          <p className="auth-description">
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
        </header>

        {wasLoggedOut && (
          <Alert tone="info">{t('auth.loggedOutMessage')}</Alert>
        )}
        {notice && <Alert tone="success">{notice}</Alert>}

        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
          <Stack>
            {!isLogin && (
              <div className="auth-name-grid">
                <Field label={t('auth.firstName')} htmlFor="firstName">
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required={!isLogin}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t('auth.firstName')}
                  />
                </Field>
                <Field label={t('auth.lastName')} htmlFor="lastName">
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required={!isLogin}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t('auth.lastName')}
                  />
                </Field>
              </div>
            )}

            <Field label={t('auth.emailAddress')} htmlFor="email-address">
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
            </Field>

            <Field label={t('auth.password')} htmlFor="password">
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
            </Field>
          </Stack>

          {error && <Alert>{error}</Alert>}

          {isLogin && (
            <div className="auth-forgot">
                <Link to="/reset-password" className="text-link">
                  {t('auth.forgotPassword')}
                </Link>
            </div>
          )}

            <Button
              type="submit"
              loading={loading}
              className="auth-submit"
            >
              {loading ? t('common.states.processing') : isLogin ? t('auth.signIn') : t('auth.signUp')}
            </Button>
          </Stack>
        </form>
        </Stack>
      </Panel>
    </main>
  );
}
