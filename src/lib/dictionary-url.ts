/** Ignore attribution parameters while retaining legacy bare and named searches. */
export function readDictionaryQuery(url: URL): string {
  const first = [...url.searchParams.entries()].find(([key]) =>
    !/^(?:lang|utm_.*|gclid|dclid|fbclid|msclkid|gbraid|wbraid|_gl|mc_cid|mc_eid)$/i.test(key)
  );
  if (!first) return "";
  const [key, value] = first;
  // URLSearchParams represents bare words and empty named values identically.
  // Reserved search keys must never become the word being looked up.
  return (value || (/^(?:q|verb|noun|adjective)$/i.test(key) ? "" : key)).slice(0, 40);
}
