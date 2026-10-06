import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function fillInquiry(page: Page) {
  await page.getByLabel('Name', { exact: true }).fill('Test Visitor')
  await page.getByLabel('Email', { exact: true }).fill('visitor@example.test')
  await page.getByLabel('Company', { exact: true }).fill('Test Company')
  await page.getByLabel('Message', { exact: true }).fill('Please send sample information.')
}
test.beforeEach(async ({ page }) => {
  await page.route('http://127.0.0.1:54329/rest/v1/**', route => route.fulfill({ json: [] }))
})

test('mobile form validates inline, preserves input after failure, retries same request, and confirms success', async ({ page }) => {
  const errors: string[] = [], payloads: Record<string, unknown>[] = []
  page.on('pageerror', error => errors.push(error.message))
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route('**/functions/v1/submit-inquiry', async route => {
    payloads.push(route.request().postDataJSON())
    if (payloads.length === 1) { await pending; await route.fulfill({ status: 503, json: { error: 'Delivery is temporarily unavailable.' } }) }
    else await route.fulfill({ json: { ok: true, reference: 'INQ-local-test', emailConfirmed: false } })
  })
  await page.goto('/contact')
  await page.getByRole('button', { name: 'Send inquiry', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('highlighted fields')
  await expect(page.getByLabel('Name', { exact: true })).toBeFocused()
  expect(payloads).toHaveLength(0)
  await fillInquiry(page)
  await page.getByRole('button', { name: 'Send inquiry', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sending…', exact: true })).toBeDisabled()
  await expect(page.getByLabel('Message', { exact: true })).toBeDisabled()
  release()
  await expect(page.getByRole('alert')).toContainText('Delivery is temporarily unavailable')
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue('Please send sample information.')
  await page.getByRole('button', { name: 'Send inquiry', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('reply to visitor@example.test')
  expect(payloads).toHaveLength(2)
  expect(payloads[0].requestId).toBe(payloads[1].requestId)
  expect(payloads[0].website).toBe('')
  expect(page.url()).toContain('/contact')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
  await page.screenshot({ path: 'test-results/inquiries/contact-mobile-success.png', fullPage: true })
})

test('server field errors are announced and editing a failed request creates a fresh id', async ({ page }) => {
  const payloads: Record<string, unknown>[] = []
  await page.route('**/functions/v1/submit-inquiry', async route => {
    payloads.push(route.request().postDataJSON())
    await route.fulfill({ status: 400, json: { error: 'Please check the highlighted fields.', fields: { email: 'Enter a valid email address.' } } })
  })
  await page.goto('/contact'); await fillInquiry(page)
  await page.getByRole('button', { name: 'Send inquiry', exact: true }).click()
  await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await page.getByLabel('Email', { exact: true }).fill('second@example.test')
  await page.getByRole('button', { name: 'Send inquiry', exact: true }).click()
  await expect.poll(() => payloads.length).toBe(2)
  expect(payloads[0].requestId).not.toBe(payloads[1].requestId)
})

test('contact has fallback details, correct field types, no overflow, and keeps the storefront navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/contact')
  await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('type', 'email')
  await expect(page.getByLabel('Phone (optional)', { exact: true })).toHaveAttribute('type', 'tel')
  await expect(page.locator('#contact').getByRole('link', { name: '(833) 853-1243', exact: true })).toBeVisible()
  await expect(page.locator('#contact').getByRole('link', { name: 'orders@nexgenpac.com', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/inquiries/contact-desktop.png', fullPage: true })
  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page).toHaveURL('/')
})

test('leaving and returning to a failed inquiry preserves the draft and retry identity', async ({ page }) => {
  const payloads: Record<string, unknown>[] = []
  await page.route('**/functions/v1/submit-inquiry', async route => {
    payloads.push(route.request().postDataJSON())
    await route.fulfill({ status: 503, json: { error: 'Your inquiry could not be confirmed. Your message is still here.' } })
  })
  await page.goto('/contact'); await fillInquiry(page)
  await page.getByRole('button', { name: 'Send inquiry', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('could not be confirmed')
  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page).toHaveURL('/')
  await page.goBack()
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('visitor@example.test')
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue('Please send sample information.')
  await page.getByRole('button', { name: 'Send inquiry', exact: true }).click()
  await expect.poll(() => payloads.length).toBe(2)
  expect(payloads[0].requestId).toBe(payloads[1].requestId)
})
