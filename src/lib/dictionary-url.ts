/** Ignore attribution parameters while retaining legacy bare and named searches. */
export function readDictionaryQuery(url: URL): string {
  const first = [...url.searchParams.entries()].find(([key]) =>
    !/^(?:lang|utm_.*|gclid|dclid|fbclid|msclkid|gbraid|wbraid|_gl|mc_cid|mc_eid)$/i.test(key)
  );
  return first ? (first[1] || first[0]).slice(0, 40) : "";
}
