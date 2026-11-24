import { Locator, Page } from '@playwright/test';

export const PROFILE_PATH = '/playwright/tables/practice.html';

export interface ProfileInput {
  firstName?: string;
  lastName?: string;
  gender?: 'Male' | 'Female';
  years?: string;
  date?: string;
  profession?: 'Manual Tester' | 'Automation Tester';
  tools?: Array<'UFT' | 'Protractor' | 'Selenium Webdriver'>;
  continents?: string[];
}

const TOOL_IDS: Record<string, string> = { UFT: 'tool-uft', Protractor: 'tool-protractor', 'Selenium Webdriver': 'tool-selenium' };
const slug = (s: string) => s.toLowerCase().replace(/\s+/g, '-');

/** Page Object: "QA Profile Form" (stand-in for a campaign entry form). */
export class ProfileFormPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly years: Locator;
  readonly date: Locator;
  readonly submit: Locator;
  readonly reset: Locator;
  readonly genericButton: Locator;
  readonly output: Locator;
  readonly upload: Locator;
  readonly uploadName: Locator;
  readonly tabPanel: Locator;

  constructor(readonly page: Page) {
    this.firstName = page.getByTestId('first-name');
    this.lastName = page.getByTestId('last-name');
    this.years = page.getByTestId('years-experience');
    this.date = page.getByTestId('profile-date');
    this.submit = page.getByTestId('profile-submit');
    this.reset = page.getByTestId('profile-reset');
    this.genericButton = page.getByTestId('profile-button');
    this.output = page.locator('#submission-output');
    this.upload = page.getByTestId('upload-image');
    this.uploadName = page.locator('#upload-file-name');
    this.tabPanel = page.locator('#selenium-tab-panel');
  }

  async goto() { await this.page.goto(PROFILE_PATH); }

  async fill(d: ProfileInput) {
    if (d.firstName !== undefined) await this.firstName.fill(d.firstName);
    if (d.lastName !== undefined) await this.lastName.fill(d.lastName);
    if (d.gender) await this.page.getByTestId(`gender-${d.gender.toLowerCase()}`).check();
    if (d.years) await this.years.selectOption(d.years);
    if (d.date) await this.date.fill(d.date);
    if (d.profession) await this.page.getByTestId(d.profession === 'Manual Tester' ? 'profession-manual' : 'profession-automation').check();
    for (const t of d.tools ?? []) await this.page.getByTestId(TOOL_IDS[t]).check();
    for (const c of d.continents ?? []) await this.page.getByTestId(`continent-${slug(c)}`).check();
  }

  /** Submits and returns the JSON the page prints (the form's observable data contract). */
  async submitAndRead(): Promise<Record<string, unknown>> {
    await this.submit.click();
    return JSON.parse((await this.output.textContent()) ?? '{}');
  }
}
