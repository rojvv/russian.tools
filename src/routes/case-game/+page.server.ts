import { createCaseRound, isCaseAnswer, type WordKind } from "$lib/case-game";
import { getDeclinables } from "$lib/server/declension";
import type { Actions, PageServerLoad } from "./$types";

async function round(fields: URLSearchParams | FormData, fetch: typeof globalThis.fetch) {
  const requested = Number(fields.get("count") ?? 10);
  const count = Number.isInteger(requested) && requested >= 1 && requested <= 100 ? requested : 10;
  const kind: WordKind = fields.get("kind") === "noun"
    ? "noun"
    : fields.get("kind") === "adjective"
    ? "adjective"
    : "both";
  const seed = Number(fields.get("seed")) >>> 0 || crypto.getRandomValues(new Uint32Array(1))[0] || 1;
  let state = seed;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const questions = createCaseRound(await getDeclinables(fetch), kind, random, count);
  return { count, kind, seed, questions };
}

export const load: PageServerLoad = async ({ url, fetch }) => ({
  round: url.searchParams.has("count") ? await round(url.searchParams, fetch) : null,
});

export const actions: Actions = {
  default: async ({ request, fetch }) => {
    const fields = await request.formData();
    const exercise = await round(fields, fetch);
    const answers = exercise.questions.map((_, index) => String(fields.get(`answer-${index}`) ?? "").slice(0, 100));
    const correct = exercise.questions.map((question, index) => isCaseAnswer(question, answers[index]));
    return { round: exercise, answers, correct };
  },
};
