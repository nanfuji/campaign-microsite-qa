# Campaign Microsite QA · Playwright + TypeScript

Automated QA for **registration and lead-capture forms**, the heart of any campaign microsite: if the data a visitor enters is not exactly what is captured, the campaign is leaking leads.

**Target (public practice site):** [QA Profile Form](https://app.thetestingacademy.com/playwright/tables/practice.html) and [Keyboard registration form](https://app.thetestingacademy.com/playwright/widgets/keyboard-form.html) by The Testing Academy. They stand in for a campaign entry form.

## Scope · 25 test cases

| Area | Spec | Highlights |
|---|---|---|
| Data capture | `profile-form.spec.ts` (PF-01…13) | Every field type round-trips exactly; single vs multiple checkbox values; unicode and markup stay inert text; reset; upload; mobile reachability; no uncaught JS errors |
| Keyboard & accessibility | `keyboard-form.spec.ts` (KB-01…09) | Tab order (radio group = one stop), keyboard-only registration, native email validation, labels and roles, masked passwords |
| Observations | `keyboard-form.spec.ts` (KB-10…12) | Documented current behaviour that a production form would normally enforce |

## Findings surfaced by the tests

- **Consent is not enforced**: the form submits with the privacy box unticked (KB-10).
- **Password / confirm mismatch is accepted** (KB-11) and **the password is echoed in clear text** (KB-12).
- Help text claims both newsletter radios are tab stops; native radio groups expose one (KB-01).

## What I did not test, and why

The target has no server-side validation, tracking or backend, so analytics (`dataLayer`) contracts, duplicate-entry rules and rate limits cannot be tested here. Where those matter on a real campaign, they belong in the suite; see the strategy below.

## Test strategy

Risk-based: data integrity and consent first, then accessibility, then convenience features. Page Objects keep selectors in one place; stable `data-testid` hooks are preferred, with role/label locators for accessibility checks. Tests are independent and parallel-safe (unique data per test). Full case list: `QA-Test-Cases.xlsx`.

## Run it

```bash
npm install
npx playwright install
npm test                 # all projects (desktop Chromium, Pixel 7, iPhone 14 / WebKit)
npm run test:chromium    # quickest: Chromium desktop + Android emulation
npm run test:ui          # Playwright UI mode (time-travel debugger)
npm run report           # open the HTML report
```

**In VS Code:** install the *Playwright Test for VS Code* extension, open this folder, then use the Testing panel (beaker icon) to run, debug and record tests.

Point the suite somewhere else with `BASE_URL=https://your-host npm test`.

## CI & report

`.github/workflows/playwright.yml` runs the suite on every push and PR, **weekly on a schedule** (to catch the third-party site changing under the tests), and on demand. The HTML report is published to GitHub Pages: enable *Settings → Pages → Source: GitHub Actions*; the report appears at `https://nanfuji.github.io/<repo>/`.

## Being a good guest

The target is a free, public practice site run by a third party. The suite keeps parallelism low, blocks the site's analytics beacons, never sends load, and **never calls the site's AI backend**: model traffic is mocked at the network layer.

## How these tests were verified

The build environment had no internet access, so each spec was run on desktop Chromium and Pixel 7 emulation against a local replica made from saved copies of the real pages (served at the same URL paths). Every suite also passed 3 consecutive repeat runs with no flakes, and `tsc --noEmit` is clean. **They have not yet been run against the live host or in WebKit**: run `npm test` once and check the report.
