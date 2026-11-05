import { expect, test } from '@playwright/test';

for (const width of [320, 640, 1024, 1440]) {
  test(`layout offline sem overflow em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    for (const state of ['idle', 'loading', 'empty', 'error', 'success']) {
      await page.getByRole('button', { name: state, exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
    }
    const cards = page.getByRole('listitem');
    await expect(cards).toHaveCount(5);
    const columns = await page
      .getByRole('list')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(width < 640 ? 2 : width < 1024 ? 3 : 5);
    await page.getByRole('button', { name: '°F' }).click();
    await expect(page.getByText('82°F', { exact: true })).toBeVisible();
    for (const button of await page.getByRole('button').all()) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
}

test('busca, unidade, retry e atalho operáveis por teclado', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Ir para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  const input = page.getByRole('textbox', { name: 'Buscar cidade' });
  await input.focus();
  expect(await input.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe(
    'none',
  );
  await input.fill('Recife');
  await input.press('Enter');
  await expect(page.getByRole('heading', { name: 'Recife' })).toBeVisible();
  await page.getByRole('button', { name: '°F' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'error', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Tentar novamente' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('82°F', { exact: true })).toBeVisible();
});

test('contraste dos controles ativos e texto secundário', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'success', exact: true }).click();
  const ratios = await page.evaluate(() => {
    function rgb(value: string): number[] {
      return (value.match(/[\d.]+/g) ?? []).map(Number);
    }
    function luminance(color: number[]): number {
      return color
        .slice(0, 3)
        .map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    }
    function background(element: Element | null): number[] {
      if (!element) return [255, 255, 255];
      const color = rgb(getComputedStyle(element).backgroundColor);
      const alpha = color[3] ?? 1;
      const behind = background(element.parentElement);
      return color
        .slice(0, 3)
        .map((channel, index) => channel * alpha + behind[index] * (1 - alpha));
    }
    return [...document.querySelectorAll('button:not(:disabled), footer, li p, input')].map(
      (element) => {
        const back = background(element);
        const color = rgb(getComputedStyle(element).color);
        const alpha = color[3] ?? 1;
        const front = color
          .slice(0, 3)
          .map((channel, index) => channel * alpha + back[index] * (1 - alpha));
        const light = luminance(front);
        const dark = luminance(back);
        return {
          text: element.textContent,
          ratio: (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05),
        };
      },
    );
  });
  for (const result of ratios) expect(result.ratio, result.text ?? '').toBeGreaterThanOrEqual(4.5);
});
