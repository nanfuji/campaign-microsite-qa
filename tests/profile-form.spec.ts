import { test, expect } from './support/base';
import { ProfileFormPage } from './pages/ProfileFormPage';

/**
 * Target: "QA Profile Form" practice page, used as a stand-in for a campaign entry form.
 * The page has NO validation rules: submitting prints the captured FormData as JSON. These tests
 * therefore guard the data-capture contract (what the user entered is exactly what is submitted).
 */
test.describe('Profile form · data capture', () => {
  let form: ProfileFormPage;
  test.beforeEach(async ({ page }) => {
    form = new ProfileFormPage(page);
    await form.goto();
  });

  test('PF-01 page loads with the expected heading and form controls', async ({ page }) => {
    await expect(page).toHaveTitle(/QA Profile Form/);
    await expect(page.locator('#page-title')).toContainText('Profile Form');
    for (const control of [form.firstName, form.lastName, form.years, form.date, form.submit, form.reset]) {
      await expect(control).toBeVisible();
    }
  });

  test('PF-02 a fully completed form is captured exactly as entered', async () => {
    await form.fill({
      firstName: 'Juan', lastName: 'Dela Cruz', gender: 'Male', years: '5', date: '2026-12-12',
      profession: 'Automation Tester', tools: ['Protractor', 'Selenium Webdriver'], continents: ['Asia', 'Europe'],
    });
    const data = await form.submitAndRead();
    expect(data).toMatchObject({
      firstName: 'Juan', lastName: 'Dela Cruz', gender: 'Male', yearsExperience: '5', date: '2026-12-12',
      profession: 'Automation Tester', tools: ['Protractor', 'Selenium Webdriver'], continents: ['Asia', 'Europe'],
    });
  });

  test('PF-03 one selected checkbox is captured as a value, several as an array', async () => {
    await form.fill({ tools: ['UFT'] });
    expect((await form.submitAndRead()).tools).toBe('UFT');

    await form.fill({ tools: ['Selenium Webdriver'] });
    expect((await form.submitAndRead()).tools).toEqual(['UFT', 'Selenium Webdriver']);
  });

  test('PF-04 radio buttons are mutually exclusive', async ({ page }) => {
    await form.fill({ gender: 'Male' });
    await form.fill({ gender: 'Female' });
    await expect(page.getByTestId('gender-male')).not.toBeChecked();
    await expect(page.getByTestId('gender-female')).toBeChecked();
    expect((await form.submitAndRead()).gender).toBe('Female');
  });

  test('PF-05 untouched form submits no implicit defaults for choice fields', async () => {
    const data = await form.submitAndRead();
    expect(Object.keys(data).sort()).toEqual(['date', 'firstName', 'lastName', 'upload', 'yearsExperience']);
    expect(data).toMatchObject({ firstName: '', lastName: '', yearsExperience: '', date: '' });
  });

  test('PF-06 unicode, apostrophes and markup survive the round trip as plain text', async ({ page }) => {
    const tricky = { firstName: 'Zoë Ñandú 李雷', lastName: `O'Brien <b>bold</b> & "quotes"` };
    await form.fill(tricky);
    const data = await form.submitAndRead();
    expect(data).toMatchObject(tricky);
    await expect(page.locator('#submission-output b')).toHaveCount(0); // never rendered as HTML
  });

  test('PF-07 Reset clears every field type', async ({ page }) => {
    await form.fill({ firstName: 'Ana', lastName: 'Reyes', gender: 'Female', years: '3', date: '2026-12-01', profession: 'Manual Tester', tools: ['UFT'], continents: ['Asia'] });
    await form.reset.click();
    await expect(form.firstName).toHaveValue('');
    await expect(form.lastName).toHaveValue('');
    await expect(form.years).toHaveValue('');
    await expect(form.date).toHaveValue('');
    await expect(page.locator('#qa-profile-form input:checked')).toHaveCount(0);
  });

  test('PF-08 uploading a file shows its name', async () => {
    await form.upload.setInputFiles({ name: 'entry-proof.png', mimeType: 'image/png', buffer: Buffer.from('fake-image-bytes') });
    await expect(form.uploadName).toHaveText('entry-proof.png');
  });

  test('PF-09 the sample download link resolves', async ({ page, request }) => {
    const href = await page.getByTestId('download-file').getAttribute('href');
    expect(href).toBeTruthy();
    const res = await request.get(href!);
    expect(res.ok()).toBeTruthy();
    expect((await res.text()).length).toBeGreaterThan(0);
  });

  test('PF-10 command tabs switch the displayed content', async () => {
    const expected: Record<string, string> = {
      'tab-browser': 'Browser commands', 'tab-navigation': 'Navigation commands', 'tab-switch': 'Switch commands',
      'tab-wait': 'Wait commands', 'tab-webelement': 'WebElement commands',
    };
    for (const [id, text] of Object.entries(expected)) {
      await form.page.getByTestId(id).click();
      await expect(form.tabPanel).toContainText(text);
    }
  });

  test('PF-11 the generic button reports the click time', async () => {
    await form.genericButton.click();
    await expect(form.output).toHaveText(/^Generic Button clicked at /);
  });

  test('PF-12 primary actions are reachable on small screens', async () => {
    await form.submit.scrollIntoViewIfNeeded();
    await expect(form.submit).toBeInViewport();
    await form.submit.click();
    await expect(form.output).not.toBeEmpty();
  });

  test('PF-13 no uncaught JavaScript errors during a full fill-and-submit', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await form.fill({ firstName: 'Ana', lastName: 'Reyes', gender: 'Female', years: '2', profession: 'Manual Tester', tools: ['UFT'], continents: ['Asia'] });
    await form.submitAndRead();
    await form.reset.click();
    expect(errors).toEqual([]);
  });
});
