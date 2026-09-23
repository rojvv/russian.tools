/** Dictionaries are stored compressed so uploads and downloads stay small. */
export async function loadDictionary<T>(fetch: typeof globalThis.fetch, name: string): Promise<T[]> {
  const response = await fetch(`/data/${name}.json.gz`);
  if (!response.ok || !response.body) throw new Error(`Could not load ${name} dictionary`);
  // Fetch may already decode Content-Encoding: gzip (notably in Vite).
  // Asset bindings can instead return raw gzip bytes, so inspect the body
  // rather than the headers, which may remain after automatic decoding.
  const bytes = new Uint8Array(await response.arrayBuffer());
  const body = new Response(bytes);
  const decoded = bytes[0] === 0x1f && bytes[1] === 0x8b
    ? new Response(body.body!.pipeThrough(new DecompressionStream("gzip")))
    : body;
  return decoded.json() as Promise<T[]>;
}

/** Share decoded server data between requests, and allow retries after failure. */
export function cachedDictionary<T>(name: string) {
  let request: Promise<T[]> | undefined;
  return (fetch: typeof globalThis.fetch): Promise<T[]> =>
    request ??= loadDictionary<T>(fetch, name).catch((error) => {
      request = undefined;
      throw error;
    });
}
