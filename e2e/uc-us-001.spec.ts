import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

async function captureGuideScreenshot(page: import('@playwright/test').Page, locale: 'en' | 'de', name: string) {
  if (process.env.DOCS_SCREENSHOT_CAPTURE !== '1') return;
  const directory = resolve('docs/assets', locale);
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: resolve(directory, `setup-${name}.png`), fullPage: true, animations: 'disabled' });
}

for (const locale of ['en', 'de'] as const) {
  test(`UC-US-001 registration requires email verification (${locale})`, async ({ page }) => {
    let registrationPayload: Record<string, unknown> | null = null;
    let verificationRequest = '';

    await page.addInitScript((language) => {
      localStorage.setItem('my-teams-language-preference', language);
    }, locale);
    await page.route('**/auth/register', async (route) => {
      registrationPayload = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'user-1', email: 'coach@example.test' }, message: 'Verification email sent' }),
      });
    });
    await page.route('**/auth/verify-email**', async (route) => {
      verificationRequest = route.request().url();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Email verified' }) });
    });

    await page.goto('/');
    await captureGuideScreenshot(page, locale, 'registration-home');
    const register = locale === 'en' ? 'Register' : 'Registrieren';
    await page.getByRole('link', { name: register, exact: true }).click();
    await captureGuideScreenshot(page, locale, 'registration-form');
    await page.getByLabel(locale === 'en' ? 'First name' : 'Vorname').fill('Alex');
    await page.getByLabel(locale === 'en' ? 'Last name' : 'Nachname').fill('Coach');
    await page.getByLabel(locale === 'en' ? 'Email address' : 'E-Mail-Adresse').fill('coach@example.test');
    await page.getByLabel(locale === 'en' ? 'Password' : 'Passwort').fill('secret123');
    await page.getByRole('button', { name: locale === 'en' ? 'Sign up' : 'Registrieren' }).click();

    await expect(page.getByText(locale === 'en' ? /account was created/i : /konto wurde erstellt/i)).toBeVisible();
    await captureGuideScreenshot(page, locale, 'registration');
    expect(registrationPayload).toMatchObject({ firstName: 'Alex', lastName: 'Coach', email: 'coach@example.test', password: 'secret123' });
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();

    await page.goto('/verify-email?token=token%2Bwith%20space');
    await expect(page.getByText(locale === 'en' ? /email.*verified/i : /E-Mail-Adresse.*bestätigt/i)).toBeVisible();
    await captureGuideScreenshot(page, locale, 'registration-verified');
    expect(new URL(verificationRequest).searchParams.get('token')).toBe('token+with space');
    await expect(page.getByRole('link', { name: locale === 'en' ? 'Sign in' : 'Anmelden' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });
}
