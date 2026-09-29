import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseRates, updateRates } from '../scripts/update-frank-rates.mjs';

const post = text => `<div class="tgme_widget_message_text js-message_text">${text}</div>`;
const rates = post('<b>КУРС ВАЛЮТ 29.09.2026</b><br>USD/UAH 44,70 / 45,20<br>EUR/UAH 51.00 / 51.70');

test('latest rates post, markup, decimal commas, unrelated newer message', () => {
  const parsed = parseRates(post('КУРС ВАЛЮТ USD/UAH 40/41 EUR/UAH 42/43') + rates + post('Реклама USD/UAH 20/21'));
  assert.deepEqual(parsed.usd, { buy: 44.7, sell: 45.2 });
  assert.deepEqual(parsed.eur, { buy: 51, sell: 51.7 });
  assert.equal(parsed.date, '29.09.2026');
});

test('invalid latest rates do not cause fallback to an older post', () => {
  for (const bad of ['USD/UAH 50/40 EUR/UAH 51/52', 'USD/UAH 44/45', 'USD/UAH 0/45 EUR/UAH 51/52']) {
    assert.throws(() => parseRates(rates + post('КУРС ВАЛЮТ ' + bad)));
  }
  assert.throws(() => parseRates('<html>Telegram unavailable</html>'));
});

test('failures preserve JSON byte-for-byte; unchanged rates do not create commits', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'frank-rates-'));
  const output = pathToFileURL(join(directory, 'rates.json'));
  try {
    const original = JSON.stringify(parseRates(rates));
    await writeFile(output, original);
    for (const fetcher of [
      async () => { throw new Error('offline'); },
      async () => ({ ok: false, status: 503 }),
      async () => ({ ok: true, text: async () => '<html>blocked</html>' })
    ]) {
      await assert.rejects(updateRates({ fetcher, output }));
      assert.equal(await readFile(output, 'utf8'), original);
    }
    assert.equal(await updateRates({ output, fetcher: async () => ({ ok: true, text: async () => rates }) }), false);
    assert.equal(await readFile(output, 'utf8'), original);
    assert.equal(await updateRates({ output, fetcher: async () => ({ ok: true, text: async () => rates.replace('44,70', '44,80') }) }), true);
    assert.equal(JSON.parse(await readFile(output, 'utf8')).usd.buy, 44.8);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
