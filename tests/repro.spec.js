import { expect, test } from '@playwright/test'

test.setTimeout(120000)

test('loses committed draft after immediate reload under burst commits', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => typeof window.__repro?.setDraftBurst === 'function' || window.__reproError)
  const reproError = await page.evaluate(() => window.__reproError ?? null)
  if (reproError !== null) {
    throw new Error(`repro bootstrap failed: ${reproError}`)
  }

  const input = page.locator('#draft')
  await expect(input).toBeVisible()

  const iterations = Number(process.env.REPRO_ITERATIONS ?? 20)
  const count = Number(process.env.REPRO_BURST_COUNT ?? 200)
  const payloadSize = Number(process.env.REPRO_PAYLOAD_SIZE ?? 20000)

  for (let i = 0; i < iterations; i += 1) {
    const token = `run-${Date.now()}-${i}`
    const expected = await page.evaluate(({ count, payloadSize, token }) => {
      return window.__repro.setDraftBurst({ count, payloadSize, token })
    }, { count, payloadSize, token })

    await page.reload()
    await expect(input).toBeVisible()

    const actual = await input.inputValue()
    if (actual !== expected) {
      throw new Error(`REPRODUCED iteration=${i} expectedLength=${expected.length} actualLength=${actual.length}`)
    }
  }

  throw new Error('Did not reproduce; increase REPRO_BURST_COUNT / REPRO_PAYLOAD_SIZE / REPRO_ITERATIONS')
})
