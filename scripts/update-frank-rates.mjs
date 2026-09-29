import { writeFile, mkdir, readFile, rename } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const CHANNEL = "frankexange";
const SOURCE_URL = `https://t.me/s/${CHANNEL}`;
const OUTPUT = new URL("../data/frank-rates.json", import.meta.url);

function decodeHtml(text) {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function rateFrom(text, currency) {
  const rx = new RegExp(
    `${currency}\\s*\\/\\s*UAH\\s*[:\\-]?\\s*(\\d+(?:[.,]\\d+)?)\\s*\\/\\s*(\\d+(?:[.,]\\d+)?)`,
    "iu"
  );
  const match = text.match(rx);
  if (!match) return null;

  const buy = Number(match[1].replace(",", "."));
  const sell = Number(match[2].replace(",", "."));

  if (!Number.isFinite(buy) || !Number.isFinite(sell)) return null;
  if (buy < 10 || buy > 200 || sell < 10 || sell > 200) return null;
  if (buy > sell) return null;

  return { buy, sell };
}

export function parseRates(html) {
const messages = [];
const messageRx = /<div[^>]+class="[^"]*\btgme_widget_message_text\b[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;

for (const match of html.matchAll(messageRx)) {
  messages.push(decodeHtml(match[1]));
}

let found = null;

for (let i = messages.length - 1; i >= 0; i -= 1) {
  const text = messages[i];
  if (!/КУРС\s+ВАЛЮТ/iu.test(text)) continue;

  const usd = rateFrom(text, "USD");
  const eur = rateFrom(text, "EUR");
  // Do not silently use an older post when the latest rates post is malformed.
  if (!usd || !eur) throw new Error("Latest rate post is invalid; existing JSON is preserved.");

  const dateMatch = text.match(/КУРС\s+ВАЛЮТ[\s\S]{0,40}?(\d{2}\.\d{2}\.\d{4})/iu);

  found = {
    source: "Frank Exchange",
    sourceChannel: `@${CHANNEL}`,
    sourceUrl: `https://t.me/${CHANNEL}`,
    date: dateMatch ? dateMatch[1] : null,
    usd,
    eur,
    fetchedAt: new Date().toISOString()
  };
  break;
}

if (!found) {
  throw new Error("Frank Exchange rate post not found; existing JSON is preserved.");
}

return found;
}

export async function updateRates({ fetcher = fetch, output = OUTPUT } = {}) {
  const response = await fetcher(SOURCE_URL, {
    signal: AbortSignal.timeout(20000),
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; SpravochnikIzmailRates/1.0)",
      "accept-language": "uk,ru;q=0.9,en;q=0.8"
    }
  });
  if (!response.ok) throw new Error(`Telegram returned ${response.status}; existing JSON is preserved.`);
  const found = parseRates(await response.text());
  let previous;
  try { previous = JSON.parse(await readFile(output, "utf8")); } catch (_) {}
  const content = ({ fetchedAt, ...rates }) => JSON.stringify(rates);
  if (previous && content(previous) === content(found)) return false;
  // Publish a complete document atomically; a failed request never touches it.
  await mkdir(new URL(".", output), { recursive: true });
  const temporary = new URL(output.href + ".tmp");
  await writeFile(temporary, JSON.stringify(found, null, 2) + "\n", "utf8");
  await rename(temporary, output);
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await updateRates();
}
