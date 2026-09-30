const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const pages = ['/communal-services/', '/products-food/', '/recreation/', '/ukrytia/'];
const server = http.createServer((req, res) => {
  let file = path.join(root, new URL(req.url, 'http://localhost').pathname);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' })[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('380')) digits = '0' + digits.slice(3);
  return digits;
}

async function scrapeVisiblePhoneCards(page, route) {
  return page.locator('a[href^="tel:"]').evaluateAll((links, routePath) => links.map(link => {
    const card = link.closest('article, .contact') || link.parentElement;
    const section = link.closest('section');
    const title = card?.querySelector('h2,h3,h4')?.textContent?.trim() || '';
    const category = section?.querySelector('h2')?.textContent?.trim() || document.title.replace(/\s*[—|·].*$/, '');
    const detail = card?.innerText?.replace(/\s+/g, ' ').trim() || '';
    return { id: '', name: title || category, city: 'Измаил', category, specialties: detail, phones: [link.getAttribute('href').replace(/^tel:/i, '')], href: link.getAttribute('href'), route: routePath };
  }), route);
}

async function scrapeServices(page) {
  const records = [];
  await page.goto('/services-masters/');
  const sectionTabs = page.locator('[data-section]');
  for (let sectionIndex = 0; sectionIndex < await sectionTabs.count(); sectionIndex++) {
    await sectionTabs.nth(sectionIndex).click();
    const cats = page.locator('#view .category');
    const count = await cats.count();
    for (let i = 0; i < count; i++) {
      await page.locator('#view .category').nth(i).click();
      let subs = page.locator('#view .subcat');
      if (await subs.count()) {
        const subCount = await subs.count();
        for (let j = 0; j < subCount; j++) {
          await page.locator('#view .subcat').nth(j).click();
          records.push(...await scrapeVisiblePhoneCards(page, '/services-masters/'));
          await page.locator('#view [data-back]').click();
        }
      } else {
        records.push(...await scrapeVisiblePhoneCards(page, '/services-masters/'));
      }
      await page.locator('#view [data-back]').click();
    }
  }
  return records;
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || undefined });
  try {
    const page = await browser.newPage({ baseURL: `http://127.0.0.1:${server.address().port}` });
    await page.route('https://**', route => route.abort());
    const records = [];
    for (const route of pages) {
      await page.goto(route);
      records.push(...await scrapeVisiblePhoneCards(page, route));
    }
    records.push(...await scrapeServices(page));
    const byPhone = new Map();
    for (const record of records) for (const raw of record.phones) {
      const phone = normalizePhone(raw);
      if (phone.length < 6) continue;
      const entry = byPhone.get(phone) || { id: `global-${phone}`, name: new Set(), city: record.city, category: new Set(), specialties: new Set(), phones: [phone], href: `tel:+380${phone.slice(1)}`, route: record.route };
      if (record.name) entry.name.add(record.name);
      if (record.category) entry.category.add(record.category);
      if (record.specialties) entry.specialties.add(record.specialties);
      byPhone.set(phone, entry);
    }
    const normalized = [...byPhone.values()].map(record => ({
      ...record,
      name: [...record.name].join(' · '),
      category: [...record.category].join(' · '),
      specialties: [...record.specialties].join(' ')
    }));
    fs.writeFileSync(path.join(root, 'directory-search-extra.json'), JSON.stringify({ records: normalized }, null, 2) + '\n', 'utf8');
    console.log(`Wrote ${normalized.length} unique phone contacts from ${pages.length + 1} sections.`);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
