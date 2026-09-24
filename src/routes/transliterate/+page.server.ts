import { cyrillicSegments } from "$lib/latin-to-cyrillic";
import type { Actions } from "./$types";

export const actions: Actions = {
  default: async ({ request }) => {
    const fields = await request.formData();
    const text = String(fields.get("text") ?? "").slice(0, 20000);
    const direction = fields.get("direction") === "l2c" ? "l2c" : "c2l";
    const choices: Record<number, string> = {};
    if (direction === "l2c") {
      for (const segment of cyrillicSegments(text)) {
        const choice = fields.get(`choice-${segment.start}`);
        if (typeof choice === "string" && segment.options.includes(choice)) {
          choices[segment.start] = choice;
        }
      }
    }
    return { text, direction, choices };
  },
};
