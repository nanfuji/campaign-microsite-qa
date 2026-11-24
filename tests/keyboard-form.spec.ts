import { test, expect } from './support/base';
import { KeyboardFormPage, uniqueEmail } from './pages/KeyboardFormPage';

/**
 * Target: keyboard-only registration form, used as a stand-in for a sign-up / lead-capture form.
 * Contains accessibility checks plus a short list of documented behaviours ("observations") that a
 * production campaign form would normally enforce.
 */
test.describe('Registration form · keyboard & accessibility', () => {
  let kb: KeyboardFormPage;
  test.beforeEach(async ({ page }) => {
    kb = new KeyboardFormPage(page);
    await kb.goto();
  });

  test('KB-01 Tab order follows the visual order; the radio group is a single tab stop', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Tab-stop rules for radios/checkboxes differ by browser; asserted on Chromium');
    await kb.firstname.focus();
    const seen: string[] = [];
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press('Tab');
      seen.push(await kb.focusedTestId());
    }
    // The page's own help text lists both radios, but native radio groups expose one tab stop (the checked one).
    expect(seen).toEqual(['lastname', 'email', 'telephone', 'password', 'confirm', 'newsletter-no', 'agree', 'register-submit', 'register-reset']);
  });

  test('KB-02 the focus trace highlights the field that has focus', async () => {
    await kb.email.focus();
    await expect(kb.focusCurrent).toHaveText('3. email');
    await kb.submit.focus();
    await expect(kb.focusCurrent).toHaveText('10. register-submit');
  });

  test('KB-03 a user can register with the keyboard alone', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Relies on Chromium Tab-stop behaviour');
    const email = uniqueEmail();
    await kb.firstname.focus();
    for (const [i, value] of ['Juan', 'Dela Cruz', email, '09171234567', 'Secret#123', 'Secret#123'].entries()) {
      await page.keyboard.type(value);
      if (i < 5) await page.keyboard.press('Tab');
    }
    await page.keyboard.press('Tab'); // newsletter (No)
    await page.keyboard.press('Tab'); // privacy checkbox
    await page.keyboard.press('Space');
    await expect(kb.agree).toBeChecked();
    await page.keyboard.press('Tab'); // Register
    await page.keyboard.press('Enter');

    expect(await kb.result()).toEqual({
      firstname: 'Juan', lastname: 'Dela Cruz', email, telephone: '09171234567',
      password: 'Secret#123', confirm: 'Secret#123', newsletter: 'no', agree: 'checked',
    });
  });

  test('KB-04 pressing Enter inside a text field submits the form', async () => {
    await kb.fillAll();
    await kb.lastname.press('Enter');
    expect((await kb.result()).firstname).toBe('Juan');
  });

  test('KB-05 a malformed email is blocked by native validation', async () => {
    await kb.fillAll({ email: 'not-an-email' });
    await kb.submit.click();
    await expect(kb.output).toHaveText('No submit yet.');
    expect(await kb.email.evaluate((el: HTMLInputElement) => el.validity.typeMismatch)).toBe(true);
  });

  test('KB-06 newsletter defaults to "No" and a "Yes" choice is captured', async () => {
    await expect(kb.newsletterNo).toBeChecked();
    await kb.fillAll();
    await kb.newsletterYes.check();
    await kb.submit.click();
    expect((await kb.result()).newsletter).toBe('yes');
  });

  test('KB-07 Reset restores the defaults', async () => {
    await kb.fillAll();
    await kb.newsletterYes.check();
    await kb.agree.check();
    await kb.reset.click();
    await expect(kb.firstname).toHaveValue('');
    await expect(kb.email).toHaveValue('');
    await expect(kb.newsletterNo).toBeChecked();
    await expect(kb.agree).not.toBeChecked();
  });

  test('KB-08 every input has an accessible name and the radio group is labelled', async ({ page }) => {
    for (const name of ['First name', 'Last name', 'Email', 'Phone', 'Password', 'Confirm password']) {
      await expect(page.getByLabel(name, { exact: true })).toHaveCount(1);
    }
    await expect(page.getByRole('radiogroup', { name: 'Newsletter' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /privacy policy/i })).toBeVisible();
  });

  test('KB-09 password fields are masked', async () => {
    await expect(kb.password).toHaveAttribute('type', 'password');
    await expect(kb.confirm).toHaveAttribute('type', 'password');
  });

  test.describe('Observations (documented current behaviour, not endorsed)', () => {
    test('KB-10 consent is not enforced: the form submits with the privacy box unchecked', async () => {
      await kb.fillAll();
      await kb.submit.click();
      expect((await kb.result()).agree).toBe('(unchecked)');
    });

    test('KB-11 a password / confirm-password mismatch is accepted', async () => {
      await kb.fillAll({ password: 'Secret#123', confirm: 'Different#456' });
      await kb.submit.click();
      const data = await kb.result();
      expect(data.password).not.toBe(data.confirm);
    });

    test('KB-12 the password is echoed back in clear text in the output panel', async () => {
      await kb.fillAll({ password: 'Secret#123' });
      await kb.submit.click();
      await expect(kb.output).toContainText('Secret#123');
    });
  });
});
