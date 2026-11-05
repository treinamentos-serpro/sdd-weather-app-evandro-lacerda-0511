import { test, expect, type Page } from '@playwright/test';

const geocoding = {
  results: [
    {
      id: 1,
      name: 'Seattle',
      country: 'Estados Unidos',
      admin1: 'Washington',
      latitude: 47.6,
      longitude: -122.33,
    },
  ],
};

const forecast = {
  current: {
    time: '2026-06-16T12:00',
    temperature_2m: 0,
    relative_humidity_2m: 80,
    wind_speed_10m: 10,
    surface_pressure: 1015,
    precipitation: 0,
    weather_code: 3,
  },
  daily: {
    time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
    weather_code: [3, 61, 80, 1, 0],
    temperature_2m_max: [20, 19, 22, 24, 25],
    temperature_2m_min: [12, 11, 13, 14, 15],
    precipitation_probability_max: [20, 90, 70, 10, 0],
  },
};

async function mockApis(page: Page) {
  await page.route('**/geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: geocoding }),
  );
  await page.route('**/api.open-meteo.com/**', (route) => route.fulfill({ json: forecast }));
}

test('fluxo completo: buscar → clima atual → previsão → trocar unidade', async ({ page }) => {
  await mockApis(page);
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Seattle');
  await page.getByRole('button', { name: /buscar/i }).click();

  await expect(page.getByRole('region', { name: 'Resultados da busca' })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Seattle' })).toBeVisible();
  await expect(page.getByRole('region', { name: /previsão de 5 dias/i })).toBeVisible();

  await expect(page.getByText('0°C', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '°F' }).click();
  await expect(page.getByText('32°F', { exact: true })).toBeVisible();
});

test('busca vazia ou com apenas espaços não consulta geocodificação', async ({ page }) => {
  let geocodingRequests = 0;
  await page.route('**/geocoding-api.open-meteo.com/**', (route) => {
    geocodingRequests += 1;
    return route.fulfill({ json: geocoding });
  });
  await page.goto('/');

  const search = page.getByLabel(/buscar cidade/i);
  const submit = page.getByRole('button', { name: /buscar/i });
  await expect(submit).toBeDisabled();
  await search.press('Enter');
  await search.fill('   ');
  await expect(submit).toBeDisabled();
  await search.press('Enter');

  expect(geocodingRequests).toBe(0);
  await expect(page.getByRole('status')).toContainText('Busque uma cidade para começar');
});

test('preserva acentos e pontuação interna na consulta de geocodificação', async ({ page }) => {
  const query = 'São Paulo & região/centro?';
  let receivedName: string | null = null;
  let forecastRequests = 0;
  await page.route('**/geocoding-api.open-meteo.com/**', (route) => {
    receivedName = new URL(route.request().url()).searchParams.get('name');
    return route.fulfill({ json: { results: [] } });
  });
  await page.route('**/api.open-meteo.com/**', (route) => {
    forecastRequests += 1;
    return route.fulfill({ json: forecast });
  });
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill(`  ${query}  `);
  await page.getByRole('button', { name: /buscar/i }).click();

  await expect(page.getByRole('status')).toContainText(`Nenhuma cidade encontrada para "${query}"`);
  expect(receivedName).toBe(query);
  expect(forecastRequests).toBe(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('estado vazio quando a cidade não existe', async ({ page }) => {
  let forecastRequests = 0;
  await page.route('**/geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: [] } }),
  );
  await page.route('**/api.open-meteo.com/**', (route) => {
    forecastRequests += 1;
    return route.fulfill({ json: forecast });
  });
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('xyzxyz');
  await page.getByRole('button', { name: /buscar/i }).click();

  await expect(
    page.getByRole('status').getByRole('heading', {
      name: /nenhuma cidade encontrada/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Resultados da busca' })).toBeFocused();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByLabel(/buscar cidade/i)).toBeEditable();
  expect(forecastRequests).toBe(0);
});

test('marca forecast incompleto como erro e permite retry', async ({ page }) => {
  await page.route('**/geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: geocoding }),
  );
  let forecastRequests = 0;
  await page.route('**/api.open-meteo.com/**', (route) => {
    forecastRequests += 1;
    if (forecastRequests === 1) {
      return route.fulfill({
        json: {
          current: forecast.current,
          daily: {
            time: forecast.daily.time,
            weather_code: forecast.daily.weather_code,
            temperature_2m_min: forecast.daily.temperature_2m_min,
          },
        },
      });
    }
    return route.fulfill({ json: forecast });
  });
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Seattle');
  await page.getByRole('button', { name: /buscar/i }).click();
  await expect(page.getByRole('alert')).toContainText(
    'A resposta de previsão está incompleta. Tente novamente.',
  );
  await expect(page.getByRole('region', { name: 'Clima atual' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('region', { name: 'Clima atual' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toBeVisible();
  expect(forecastRequests).toBe(2);
});

test('recupera de falha HTTP ao carregar o clima', async ({ page }) => {
  await page.route('**/geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: geocoding }),
  );
  let forecastRequests = 0;
  await page.route('**/api.open-meteo.com/**', (route) => {
    forecastRequests += 1;
    return forecastRequests === 1
      ? route.fulfill({ status: 503, json: { reason: 'service unavailable' } })
      : route.fulfill({ json: forecast });
  });
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Seattle');
  await page.getByRole('button', { name: /buscar/i }).click();
  await expect(page.getByRole('alert')).toContainText(
    'O serviço de clima está indisponível no momento. Tente novamente.',
  );

  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('region', { name: 'Clima atual' }).getByText('0°C')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toBeVisible();
  expect(forecastRequests).toBe(2);
});

test('viewport mobile renderiza o fluxo principal', async ({ page }) => {
  await mockApis(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Seattle');
  await page.getByRole('button', { name: /buscar/i }).click();
  await expect(page.getByRole('heading', { name: 'Seattle' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Clima atual' }).getByText('0°C')).toBeVisible();

  const forecastRegion = page.getByRole('region', { name: 'Previsão de 5 dias' });
  await expect(forecastRegion).toBeVisible();
  await expect(forecastRegion.getByRole('listitem')).toHaveCount(5);
});
