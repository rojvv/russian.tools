import assert from "node:assert/strict";
import test from "node:test";
import { curseWords } from "../src/lib/curse-data.ts";
import { curseEntryPath, curseEntrySeo, curseEntrySlug } from "../src/lib/curse-entry.ts";
import { languageUrl } from "../src/lib/seo.ts";

test("every curse entry has a unique stable URL and localized SEO metadata", () => {
  assert.equal(new Set(curseWords.map(curseEntryPath)).size, 1000);
  for (const locale of ["en", "ru"]) {
    const titles = new Set();
    const descriptions = new Set();
    for (const entry of curseWords) {
      const path = curseEntryPath(entry);
      assert.equal(decodeURIComponent(path.slice("/curse/".length)), curseEntrySlug(entry.word));
      const seo = curseEntrySeo(entry, locale);
      titles.add(seo.title);
      descriptions.add(seo.description);
      assert.ok(seo.description.length > 0 && seo.description.length <= 160);
      assert.equal(seo.canonical, `https://russian.tools${path}`);
      assert.equal(seo.schema.url, languageUrl(path, locale));
      assert.equal(seo.schema.mainEntity["@type"], "DefinedTerm");
      assert.equal(seo.schema.mainEntity.name, entry.word);
      assert.equal(seo.schema.mainEntity.description["@value"], entry.meaning[locale] ?? entry.meaning.en);
      assert.equal(seo.schema.mainEntity.description["@language"], entry.meaning[locale] ? locale : "en");
      assert.equal(seo.schema.mainEntity.inDefinedTermSet, languageUrl("/curse", locale));
      if (entry.imported) assert.equal(seo.schema.license, "https://creativecommons.org/licenses/by-sa/4.0/");
    }
    assert.equal(titles.size, 1000);
    assert.equal(descriptions.size, 1000);
  }
  assert.equal(curseEntrySlug("ИДИ́ НА́ ХУЙ"), "иди_на_хуй");
});
