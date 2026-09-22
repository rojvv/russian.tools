export interface Verb {
  bare: string;
  infinitive: string;
  meaning: string;
  aspect: "imperfective" | "perfective" | "both";
  finite: string[];
  past: string[];
  imperative: string[];
}
export interface Section {
  title: string;
  rows: { label: string; form: string }[];
}
export { normalizeWord as normalizeVerb, findWords as findVerbs, suggestWords as suggestVerbs } from './dictionary-lookup.ts';

export function createTable(verb: Verb, aspect: "imperfective" | "perfective"): Section[] {
  const persons = ["я", "ты", "он / она / оно", "мы", "вы", "они"];
  const section = (title: string, labels: string[], forms: string[]): Section => ({
    title,
    rows: labels.map((label, i) => ({ label, form: forms[i] === "-" ? "" : (forms[i] ?? "") })),
  });
  const future = ["бу́ду", "бу́дешь", "бу́дет", "бу́дем", "бу́дете", "бу́дут"];
  return [
    ...(aspect === "imperfective" ? [section("Present", persons, verb.finite)] : []),
    section(
      "Future",
      persons,
      aspect === "perfective"
        ? verb.finite
        : future.map((form) => verb.bare === "быть" ? form : `${form} ${verb.infinitive}`),
    ),
    section("Past", ["он (masculine)", "она (feminine)", "оно (neuter)", "они (plural)"], verb.past),
    section("Imperative", ["ты", "вы"], verb.imperative),
  ];
}

export function exportRows(infinitive: string, aspect: string, sections: Section[]): string[][] {
  return [
    ["Verb", infinitive],
    ["Aspect", aspect],
    ["Tense / mood", "Person / gender", "Form"],
    ...sections.flatMap((section) => section.rows.map((row) => [section.title, row.label, row.form])),
    ["Source", "OpenRussian, CC BY-SA 4.0", "https://github.com/Badestrand/russian-dictionary"],
    ["Note", "Dictionary forms may contain errors."],
  ];
}

export function toCsv(rows: string[][]): string {
  return "\ufeff" + rows.map((row) =>
    row.map((cell) => {
      // Keep cells as text when opened in spreadsheet software.
      const safe = /^[\s]*[=+\-@]/u.test(cell) ? `'${cell}` : cell;
      return `"${safe.replaceAll("\"", "\"\"")}"`;
    }).join(",")
  ).join("\r\n");
}
