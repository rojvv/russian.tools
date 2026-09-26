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

test("word URLs reported as noindex in Search Console remain indexable and listed in sitemaps", async () => {
  for (
    const [route, dictionary, words] of [
      ["decliner", "nouns", ["минутка", "антитело"]],
      ["conjugator", "verbs", [
        "виниться",
        "покряхтывать",
        "предрешать",
        "сосватать",
        "закодировать",
        "усложнить",
        "взмолиться",
        "гарпунить",
      ]],
    ]
  ) {
    for (const locale of ["en", "ru"]) {
      const sitemap = await request(`/sitemaps/${dictionary}${locale === "ru" ? "-ru" : ""}.xml`);
      assert.equal(sitemap.status, 200);
      const xml = await sitemap.text();
      for (const word of words) {
        const path = `/${route}?${encodeURIComponent(word)}&lang=${locale}`;
        const canonical = `https://russian.tools${path.replaceAll("&", "&amp;")}`;
        assert.ok(xml.includes(`<loc>${canonical}</loc>`), path);
        const response = await request(path);
        assert.equal(response.status, 200, path);
        assert.doesNotMatch(response.headers.get("x-robots-tag") ?? "", /noindex|\bnone\b/i, path);
        const html = await response.text();
        assert.doesNotMatch(
          html,
          /<meta\b[^>]*name="(?:robots|googlebot)"[^>]*content="[^"]*(?:noindex|\bnone\b)/i,
          path,
        );
        assert.ok(html.includes(`rel="canonical" href="${canonical}"`), path);
        assert.match(html, /<table\b/, path);
        assert.ok(html.includes(word), path);
      }
    }
  }
});

test("empty conjugations and invalid headwords are excluded from both language sitemaps", async () => {
  for (const locale of ["en", "ru"]) {
    for (
      const [route, dictionary, words] of [
        ["conjugator", "verbs", ["зафиксировать", "производиться"]],
        ["decliner", "nouns", ["MP3-плеер", "рoв"]],
      ]
    ) {
      const xml = await (await request(`/sitemaps/${dictionary}${locale === "ru" ? "-ru" : ""}.xml`)).text();
      for (const word of words) {
        const path = `/${route}?${encodeURIComponent(word)}&lang=${locale}`;
        assert.ok(!xml.includes(path.replaceAll("&", "&amp;")), path);
        const response = await request(path);
        assert.equal(response.status, 200, path);
        const html = await response.text();
        assert.match(html, /name="robots" content="noindex, follow"/, path);
        assert.doesNotMatch(html, /rel="canonical"|hreflang=/, path);
      }
    }
  }
});

test("case variants share one sitemap URL matching the redirect target", async () => {
  for (const locale of ["en", "ru"]) {
    const xml = await (await request(`/sitemaps/nouns${locale === "ru" ? "-ru" : ""}.xml`)).text();
    const variant = `/decliner?${encodeURIComponent("Телец")}&lang=${locale}`;
    const canonical = `/decliner?${encodeURIComponent("телец")}&lang=${locale}`;
    assert.ok(!xml.includes(variant.replaceAll("&", "&amp;")));
    assert.ok(xml.includes(canonical.replaceAll("&", "&amp;")));
    const response = await request(variant);
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), canonical);
    const page = await request(canonical);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.ok(html.includes(`rel="canonical" href="https://russian.tools${canonical.replaceAll("&", "&amp;")}"`));
    assert.doesNotMatch(html, /name="robots" content="noindex/);
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
  assert.equal(locations.length, 28);
  for (const location of locations) {
    const url = new URL(location);
    const page = await request(url.pathname + url.search);
    assert.equal(page.status, 200, location);
    const html = await page.text();
    assert.ok(html.includes(`rel="canonical" href="${location}"`), location);
    assert.doesNotMatch(html, /name="robots" content="noindex/, location);
  }
});

test("curse browser renders filtered results and localized navigation without JavaScript", async () => {
  const { curseWords } = await server.ssrLoadModule("/src/lib/curse-data.ts");
  for (const locale of ["en", "ru"]) {
    const catalog = await request(`/curse?lang=${locale}`);
    const catalogHtml = await catalog.text();
    assert.equal(catalog.status, 200);
    assert.equal([...catalogHtml.matchAll(/<article\b/g)].length, 1000);
    assert.match(catalogHtml, /1000/);
    assert.doesNotMatch(catalogHtml, /rel="(?:next|prev)"/);
    assert.match(catalogHtml, /CC BY-SA 4.0/);
    for (const [article] of catalogHtml.matchAll(/<article\b[\s\S]*?<\/article>/g)) {
      assert.doesNotMatch(article, /wiktionary\.org|creativecommons\.org|Dictionary reference|Словарная статья/);
    }
    const credits = await (await request(`/acknowledgements?lang=${locale}`)).text();
    assert.match(credits, /id="curse-words"/);
    assert.match(credits, /CC BY-SA 4.0/);
    for (const entry of curseWords.filter(entry => entry.source)) {
      assert.ok(credits.includes(`href="${entry.source}"`), entry.word);
    }
    assert.equal([...catalogHtml.matchAll(/href="\/curse\/[^"?]+\?lang=/g)].length, 1000);
    const last = await request(`/curse?p=25&lang=${locale}`);
    const lastHtml = await last.text();
    assert.equal(last.status, 200);
    assert.equal([...lastHtml.matchAll(/<article\b/g)].length, 1000);
    assert.doesNotMatch(lastHtml, /rel="(?:next|prev)"/);
    assert.match(lastHtml, /rel="canonical"/);
    const idi = await request(`/curse?q=idi%20na%20khuy&lang=${locale}`);
    const idiHtml = await idi.text();
    assert.match(idiHtml, /id="word-idinakhuy"/);
    assert.match(idiHtml, /иди́ на́ хуй/);
    assert.match(idiHtml, /lang="ru-Latn">idi na khuy</);
    const imported = await request(`/curse?q=ебаться&lang=${locale}`);
    const importedHtml = await imported.text();
    assert.match(importedHtml, /id="word-dict-ебаться"/);
    assert.match(importedHtml, /class="meaning[^"]*" lang="en"/);
    if (locale === "ru") assert.match(importedHtml, /Значение на английском/);
    const matches = await (await request(`/curse?q=to&level=obscene&type=verb&lang=${locale}`)).text();
    assert.equal([...matches.matchAll(/<article\b/g)].length, 72);
    assert.doesNotMatch(matches, /rel="(?:next|prev)"/);
    const phrase = await request(`/curse?q=нифига%20себе&level=mild&type=exclamation&lang=${locale}`);
    const phraseHtml = await phrase.text();
    assert.equal(phrase.status, 200);
    assert.match(phraseHtml, /id="word-nifigasebe"/);
    assert.doesNotMatch(phraseHtml, /id="word-nifiga"|id="word-nikhuyasebe"/);
    const response = await request(`/curse?q=blyat&level=obscene&type=exclamation&lang=${locale}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /id="word-blyad"/);
    assert.doesNotMatch(html, /id="word-blin"/);
    assert.match(html, /name="robots" content="noindex, follow"/);
    assert.doesNotMatch(html, /rel="canonical"/);
    assert.ok(html.includes(locale === "ru" ? "Словарь ругательств" : "Curse Word Browser"));
    assert.ok(html.includes(locale === "ru" ? "Употребление" : "Usage"));
    const expanded = await request(`/curse?q=pizdit&level=obscene&type=verb&lang=${locale}`);
    const expandedHtml = await expanded.text();
    assert.equal(expanded.status, 200);
    assert.match(expandedHtml, /id="word-pizdit"/);
    assert.ok(expandedHtml.includes("пи́здить"));
    assert.ok(expandedHtml.includes(`/acknowledgements?lang=${locale}#curse-words`));
    assert.ok((await (await request(`/?lang=${locale}`)).text()).includes(`/curse?lang=${locale}`));
  }
  const empty = await request("/curse?q=%3Cscript%3E&lang=en");
  const html = await empty.text();
  assert.match(html, /No matching entries/);
  assert.match(html, /value="&lt;script(?:>|&gt;)"/);
  const filtered = await request("/curse?level=mild&type=exclamation&lang=en");
  const filteredHtml = await filtered.text();
  assert.match(filteredHtml, /id="word-blin"/);
  assert.doesNotMatch(filteredHtml, /id="word-blyad"|id="word-fignya"/);
  const redirect = await request("/curse?q=чёрт", { headers: { "Accept-Language": "ru" } });
  assert.equal(redirect.status, 307);
  assert.ok(redirect.headers.get("location").endsWith("&lang=ru"));
});

test("all curse sitemap URLs render indexable entry pages with matching canonicals", async () => {
  const index = await (await request("/sitemap.xml")).text();
  assert.match(index, /<loc>https:\/\/russian.tools\/sitemaps\/curse.xml<\/loc>/);
  const response = await request("/sitemaps/curse.xml");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/xml/);
  const locations = [...(await response.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  assert.equal(locations.length, 2000);
  assert.equal(new Set(locations).size, 2000);
  for (const location of locations) {
    const url = new URL(location);
    const response = await request(url.pathname + url.search);
    assert.equal(response.status, 200, location);
    const html = await response.text();
    assert.ok(html.includes(`rel="canonical" href="${location}"`), location);
    assert.doesNotMatch(html, /name="robots" content="noindex/, location);
    assert.match(html, /hreflang="en"/);
    assert.match(html, /hreflang="ru"/);
    assert.equal([...html.matchAll(/<article\b/g)].length, 1);
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
    assert.equal(scripts.length, 1);
    const data = JSON.parse(scripts[0][1]);
    assert.equal(data["@type"], "WebPage");
    assert.equal(data.url, location);
    assert.equal(data.mainEntity["@type"], "DefinedTerm");
    assert.ok(html.includes(data.mainEntity.name));
  }
});

test("curse entry URLs negotiate language, consolidate variants, and reject unknown words", async () => {
  const path = `/curse/${encodeURIComponent("иди_на_хуй")}`;
  const negotiated = await request(path, { headers: { "Accept-Language": "ru" } });
  assert.equal(negotiated.status, 307);
  assert.equal(negotiated.headers.get("location"), `${path}?lang=ru`);
  assert.match(negotiated.headers.get("cache-control"), /private.*no-store/);
  for (const locale of ["en", "ru"]) {
    const variant = await request(`/curse/${encodeURIComponent("ИДИ́_НА́_ХУЙ")}?utm_source=test&lang=${locale}`);
    assert.equal(variant.status, 308);
    assert.equal(variant.headers.get("location"), `${path}?lang=${locale}`);
    const data = await request(`${path}/__data.json?lang=${locale}&x-sveltekit-invalidated=11`);
    assert.equal(data.status, 200);
    const payload = await data.json();
    assert.equal(payload.type, "data");
    assert.ok(payload.nodes.some(node => node?.type === "data" && JSON.stringify(node.data).includes("idinakhuy")));
    assert.equal((await request(`/curse/not-a-word?lang=${locale}`)).status, 404);
    const imported = await (await request(`/curse/${encodeURIComponent("ебаться")}?lang=${locale}`)).text();
    assert.ok(imported.includes(`/acknowledgements?lang=${locale}#curse-words`));
    assert.doesNotMatch(imported.match(/<article\b[\s\S]*?<\/article>/)[0], /wiktionary\.org|creativecommons\.org/);
    if (locale === "ru") assert.match(imported, /Значение на английском/);
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
        ? /<option[^>]*value="l2c"[^>]*selected[^>]*>\s*Latin to Cyrillic/
        : /<option[^>]*value="c2l"[^>]*selected[^>]*>\s*Cyrillic to Latin/,
    );
  }
});

test("native lookup and directory forms expose submit controls and server-rendered results", async () => {
  for (const route of ["decliner", "conjugator", "abbreviation", "diminutive", "verb-prefixes", "motion", "curse"]) {
    const response = await request(`/${route}?lang=en`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(`<form[^>]*action="/${route}"[^>]*method="GET"`));
    assert.match(html, /<button[^>]*type="submit"/);
  }
  for (
    const [path, expected] of [
      ["/decliner?q=книга&lang=en", "кни́ги"],
      ["/conjugator?verb=читать&lang=en", "чита́ю"],
      ["/abbreviation?q=КПП&lang=ru", "коробка переключения передач"],
      ["/diminutive?q=Саша&lang=en", "Александр"],
      ["/motion?family=foot&meaning=base&situation=habit&lang=en", "ходи"],
    ]
  ) {
    const response = await fetch(new URL(path, origin));
    assert.equal(response.status, 200);
    assert.ok((await response.text()).includes(expected), path);
  }
  const motion = await (await request("/motion?q=войти&lang=ru")).text();
  assert.match(motion, /href="\/motion\?[^"]*family=foot[^"]*meaning=enter/);
});

test("transliteration posts render conversion and validated ambiguity choices without scripts", async () => {
  const post = async fields => {
    const response = await request("/transliterate?lang=en", {
      method: "POST",
      headers: { Origin: new URL(origin).origin, Accept: "text/html" },
      body: new URLSearchParams(fields),
    });
    assert.equal(response.status, 200);
    return response.text();
  };
  assert.match(await post({ text: "Привет", direction: "c2l" }), /Privet/);
  assert.match(await post({ text: "privet", direction: "l2c" }), /привет/);
  const { cyrillicSegments } = await server.ssrLoadModule("/src/lib/latin-to-cyrillic.ts");
  const segment = cyrillicSegments("yo").find(value => value.options.length > 1);
  assert.ok(segment);
  const html = await post({ text: "yo", direction: "l2c", [`choice-${segment.start}`]: segment.options[1] });
  assert.ok(html.includes(segment.options[1]));
  assert.match(html, /name="choice-0"/);
});

test("case exercises regenerate the same questions and grade native form answers", async () => {
  const url = "/case-game?count=2&kind=noun&seed=42&lang=en";
  const html = await (await request(url)).text();
  assert.match(html, /name="answer-0"/);
  assert.match(html, /name="answer-1"/);
  const { load } = await server.ssrLoadModule("/src/routes/case-game/+page.server.ts");
  const data = await load({
    url: new URL(url, origin),
    fetch: (path, options) => fetch(new URL(path, origin), options),
  });
  const response = await request("/case-game?lang=en", {
    method: "POST",
    headers: { Origin: new URL(origin).origin, Accept: "text/html" },
    body: new URLSearchParams({
      count: "2",
      kind: "noun",
      seed: "42",
      "answer-0": data.round.questions[0].answers[0],
      "answer-1": "incorrect",
    }),
  });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /1 \/ 2/);
});

test("reported Latin decliner URL renders the matched paradigm", async () => {
  const response = await request("/decliner?q=knigami&lang=ru");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /книга/);
  assert.match(html, /кни́гами/);
  assert.doesNotMatch(html, /data\/search\//);
});
