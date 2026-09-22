import { env } from 'onnxruntime-web/wasm';
import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';

env.wasm.numThreads = 1;
env.wasm.wasmPaths = { wasm: wasmUrl };

let pending: { id: number; text: string; single: boolean } | undefined;
let running = false;
const engine = import('@roj/rustress');
engine.then(() => self.postMessage({ type: 'ready' })).catch(() => {
	self.postMessage({ type: 'error', code: 'stressLoadError' });
});

self.onmessage = (event: MessageEvent<NonNullable<typeof pending>>) => {
	pending = event.data;
	void processLatest();
};

async function processLatest() {
	if (running) return;
	running = true;
	try {
		const { markStresses } = await engine;
		while (pending) {
			const request = pending;
			pending = undefined;
			try {
				// Bound inference batches while preserving whitespace and existing accents.
				const parts = request.text.match(/\S+\s*|\s+/gu) ?? [];
				let result = '';
				for (let i = 0; i < parts.length; i += 80) {
					if (pending) break;
					result += await markStresses(parts.slice(i, i + 80).join(''), {
						markSingleVowels: request.single
					});
				}
				if (!pending) self.postMessage({ type: 'result', id: request.id, text: result });
			} catch {
				self.postMessage({ type: 'error', id: request.id, code: 'stressProcessError' });
			}
		}
	} catch {
		// The initialization handler reports loading failures.
	} finally {
		running = false;
	}
}
