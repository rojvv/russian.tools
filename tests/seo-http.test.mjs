import { sveltekit } from "@sveltejs/kit/vite";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let server;
let origin;
before(async () => {
  // These HTTP checks use Vite's local assets. Avoid starting the Cloudflare
  // platform emulator, whose persistent worker outlives Vite's server.close().
  server = await createServer({
    configFile: false,
    plugins: [sveltekit()],
    server: { host: "127.0.0.1", port: 0 },
    logLevel: "error",
  });
  await server.listen();
  origin = server.resolvedUrls.local[0];
});
after(async () => {
  server?.httpServer?.closeAllConnections();
  await server?.close();
});

const request = (path, options = {}) => fetch(new URL(path, origin), { redirect: "manual", ...options });

test("dictionary outages return retryable 503 errors instead of successful noindex pages", async () => {
  // Exercise both loaders before successful requests populate their dictionary caches.
  for (const route of ["conjugator", "decliner"]) {
    const { load } = await server.ssrLoadModule(`/src/routes/${route}/+page.server.ts`);
    let headers;
    await assert.rejects(
      load({
        url: new URL(`/${route}?читать&lang=en`, origin),
        fetch: async () => new Response("unavailable", { status: 503 }),
        locals: { locale: "en" },
        setHeaders: value => {
          headers = value;
        },
      }),
      error => error.status === 503,
    );
    assert.equal(headers["Retry-After"], "60");
    assert.equal(headers["Cache-Control"], "no-store");
  }
});

test("language negotiation redirects privately to stable URLs and respects preferences", async () => {
  for (
    const [headers, locale] of [
      [{ "Accept-Language": "en" }, "en"],
      [{ "Accept-Language": "ru" }, "ru"],
      [{ "Accept-Language": "ru", Cookie: "language=en" }, "en"],
    ]
  ) {
    const response = await request("/", { headers });
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), `/?lang=${locale}`);
    assert.match(response.headers.get("cache-control"), /private.*no-store/);
    assert.match(response.headers.get("vary"), /Accept-Language/);
  }
  const response = await request("/?lang=ru", { headers: { Cookie: "language=en" } });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<html lang="ru"/);
  assert.match(html, /rel="canonical" href="https:\/\/russian.tools\/\?lang=ru"/);
  assert.match(html, /href="\/conjugator\?lang=ru"/);
  const data = await request("/__data.json", { headers: { "Accept-Language": "ru" } });
  assert.equal(data.status, 200);
  assert.deepEqual(await data.json(), { type: "redirect", location: "/?lang=ru" });
  assert.match(data.headers.get("cache-control"), /private.*no-store/);
});

test("tracked tool URLs redirect to indexable tools, never unrelated search results", async () => {
  for (const route of ["conjugator", "decliner"]) {
    const response = await request(`/${route}?utm_source=newsletter&lang=en`);
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), `/${route}?lang=en`);
    const page = await request(response.headers.get("location"));
    assert.equal(page.status, 200);
    assert.doesNotMatch(await page.text(), /name="robots" content="noindex/);
  }
});

test("dictionary aliases redirect once to indexable, self-canonical word pages", async () => {
  for (
    const [route, alias, word] of [
      ["conjugator", "verb=ЧИТА́ТЬ", "читать"],
      ["decliner", "noun=КНИ́ГА", "книга"],
      ["decliner", "adjective=НОВЫЙ", "новый"],
    ]
  ) {
    for (const locale of ["en", "ru"]) {
      const response = await request(`/${route}?utm_source=test&${alias}&lang=${locale}`);
      const canonical = `/${route}?${encodeURIComponent(word)}&lang=${locale}`;
      assert.equal(response.status, 308);
      assert.equal(response.headers.get("location"), canonical);
      const page = await request(canonical);
      assert.equal(page.status, 200);
      const html = await page.text();
      assert.ok(html.includes(`rel="canonical" href="https://russian.tools${canonical.replaceAll("&", "&amp;")}"`));
      assert.doesNotMatch(html, /name="robots" content="noindex/);
      assert.match(html, /hreflang="en"/);
      assert.match(html, /hreflang="ru"/);
      assert.ok(html.includes(word));
    }
  }
});

test("dictionary client navigation returns data without a canonical redirect loop", async () => {
  for (const [route, word] of [["conjugator", "договорить"], ["decliner", "книга"]]) {
    for (const locale of ["en", "ru"]) {
      const response = await request(
        `/${route}/__data.json?${encodeURIComponent(word)}&lang=${locale}&x-sveltekit-invalidated=11`,
      );
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.type, "data", `${route}: ${JSON.stringify(data)}`);
      assert.ok(data.nodes.some(node => node?.type === "data" && JSON.stringify(node.data).includes(word)));
      assert.ok(data.nodes.every(node => node?.type !== "error"));
    }
  }
});

test("invalid searches stay noindex without an unrelated tool canonical", async () => {
  const response = await request("/conjugator?%3Cinvalid%3E&lang=en");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /name="robots" content="noindex, follow"/);
  assert.doesNotMatch(html, /rel="canonical"/);
});

test("every tool sitemap URL renders a matching canonical and allows indexing", async () => {
  const response = await request("/sitemaps/tools.xml");
  assert.equal(response.status, 200);
  const locations = [...(await response.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  assert.equal(locations.length, 26);
  for (const location of locations) {
    const url = new URL(location);
    const page = await request(url.pathname + url.search);
    assert.equal(page.status, 200, location);
    const html = await page.text();
    assert.ok(html.includes(`rel="canonical" href="${location}"`), location);
    assert.doesNotMatch(html, /name="robots" content="noindex/, location);
  }
});

test("abbreviation lookup and filtered directory render without JavaScript in both languages", async () => {
  for (const locale of ["en", "ru"]) {
    const response = await request(`/abbreviation?q=КПП&directory=налог&category=documents&lang=${locale}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /код причины постановки на учёт/);
    assert.match(html, /коробка переключения передач/);
    assert.match(html, /контрольно-пропускной пункт/);
    assert.match(html, /идентификационный номер налогоплательщика/);
    assert.doesNotMatch(html, /магнитно-резонансная томография/);
    assert.match(html, /name="robots" content="noindex, follow"/);
    assert.doesNotMatch(html, /rel="canonical"/);
    assert.ok(html.includes(locale === "ru" ? "Расшифровка сокращений" : "Abbreviation Decoder"));
    assert.match(html, /method="GET"/);
    const home = await request(`/?lang=${locale}`);
    assert.ok((await home.text()).includes(`/abbreviation?lang=${locale}`));
  }
  const empty = await request("/abbreviation?q=%3Cscript%3E&directory=not-a-real-word&lang=en");
  assert.match(await empty.text(), /No matching entry/);
});

test("verb prefix searches render comparisons, forms, and localized links without JavaScript", async () => {
  for (const locale of ["en", "ru"]) {
    const response = await request(`/verb-prefixes?q=dogovorit&lang=${locale}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    for (const word of ["говорить", "договорить", "договаривать", "договориться", "договариваться"]) {
      assert.ok(html.includes(word), word);
    }
    assert.ok(html.includes(locale === "ru" ? "Глаголы с приставками" : "Verb Prefix Explorer"));
    assert.match(html, /name="robots" content="noindex, follow"/);
    assert.doesNotMatch(html, /rel="canonical"/);
    assert.match(html, /method="GET"/);
    assert.ok(html.includes(`/conjugator?${encodeURIComponent("договорить")}&amp;lang=${locale}`));
    assert.ok(html.includes(`href="/motion?lang=${locale}"`));
    const home = await request(`/?lang=${locale}`);
    assert.ok((await home.text()).includes(`/verb-prefixes?lang=${locale}`));
  }
  const read = await request("/verb-prefixes?family=read&lang=en");
  const readHtml = await read.text();
  assert.match(readHtml, /дочитать/);
  assert.match(readHtml, /перечитать/);
  assert.doesNotMatch(readHtml, /Дай мне договорить мысль/);
  const empty = await request("/verb-prefixes?q=not-a-real-verb&lang=en");
  assert.match(await empty.text(), /No matching family/);
  const redirect = await request("/verb-prefixes?q=читать", { headers: { "Accept-Language": "ru" } });
  assert.equal(redirect.status, 307);
  assert.ok(redirect.headers.get("location").endsWith("&lang=ru"));
});

test("transliteration supports both direction URLs on one route", async () => {
  for (const direction of ["c2l", "l2c"]) {
    const response = await request(`/transliterate?lang=en&direction=${direction}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Cyrillic to Latin/);
    assert.match(html, /Latin to Cyrillic/);
    assert.match(html, /rel="canonical" href="https:\/\/russian.tools\/transliterate\?lang=en"/);
    assert.match(
      html,
      direction === "l2c"
        ? /<button[^>]*aria-pressed="true"[^>]*>\s*Latin to Cyrillic/
        : /<button[^>]*aria-pressed="true"[^>]*>\s*Cyrillic to Latin/,
    );
  }
});
