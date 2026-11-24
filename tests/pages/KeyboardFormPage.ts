import { Locator, Page } from '@playwright/test';

export const KEYBOARD_PATH = '/playwright/widgets/keyboard-form.html';

/** Page Object: keyboard-only registration form (stand-in for a sign-up / lead-capture form). */
export class KeyboardFormPage {
  readonly firstname: Locator;
  readonly lastname: Locator;
  readonly email: Locator;
  readonly telephone: Locator;
  readonly password: Locator;
  readonly confirm: Locator;
  readonly newsletterYes: Locator;
  readonly newsletterNo: Locator;
  readonly agree: Locator;
  readonly submit: Locator;
  readonly reset: Locator;
  readonly output: Locator;
  readonly focusCurrent: Locator;

  constructor(readonly page: Page) {
    this.firstname = page.getByTestId('firstname');
    this.lastname = page.getByTestId('lastname');
    this.email = page.getByTestId('email');
    this.telephone = page.getByTestId('telephone');
    this.password = page.getByTestId('password');
    this.confirm = page.getByTestId('confirm');
    this.newsletterYes = page.getByTestId('newsletter-yes');
    this.newsletterNo = page.getByTestId('newsletter-no');
    this.agree = page.getByTestId('agree');
    this.submit = page.getByTestId('register-submit');
    this.reset = page.getByTestId('register-reset');
    this.output = page.getByTestId('register-output');
    this.focusCurrent = page.locator('#focus-trace .is-current');
  }

  async goto() { await this.page.goto(KEYBOARD_PATH); }

  async fillAll(v: { first?: string; last?: string; email?: string; phone?: string; password?: string; confirm?: string } = {}) {
    await this.firstname.fill(v.first ?? 'Juan');
    await this.lastname.fill(v.last ?? 'Dela Cruz');
    await this.email.fill(v.email ?? uniqueEmail());
    await this.telephone.fill(v.phone ?? '09171234567');
    await this.password.fill(v.password ?? 'Secret#123');
    await this.confirm.fill(v.confirm ?? v.password ?? 'Secret#123');
  }

  async result(): Promise<Record<string, string>> {
    return JSON.parse((await this.output.textContent()) ?? '{}');
  }

  /** data-testid of whatever currently has focus. */
  focusedTestId() {
    return this.page.evaluate(() => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? '');
  }
}

export const uniqueEmail = () => `tta-${Date.now()}-${Math.floor(Math.random() * 1e4)}@mail.com`;
