import { motionEntries, motionFamilies, type MotionMeaning } from "./motion-catalog.ts";
import type { MotionSituation } from "./motion.ts";

export interface MotionState {
  family: string;
  meaning: MotionMeaning;
  aspect: "perfective" | "imperfective";
  situation: MotionSituation;
  query: string;
}

export const defaultMotionState: MotionState = {
  family: "transport",
  meaning: "exit",
  aspect: "perfective",
  situation: "direction",
  query: "",
};

export function readMotionQuery(url: URL): MotionState {
  const params = url.searchParams;
  const family = motionFamilies.some((item) => item.id === params.get("family"))
    ? params.get("family")!
    : defaultMotionState.family;
  const requestedMeaning = params.get("meaning") ?? defaultMotionState.meaning;
  const meaning = requestedMeaning === "base" || requestedMeaning === "start"
      || motionEntries.some((item) => item.family === family && item.meaning === requestedMeaning)
    ? requestedMeaning as MotionMeaning
    : "base";
  const requestedSituation = params.get("situation");
  const situation = ["direction", "habit", "wandering", "return"].includes(requestedSituation ?? "")
    ? requestedSituation as MotionSituation
    : defaultMotionState.situation;
  return {
    family,
    meaning,
    situation,
    aspect: params.get("aspect") === "imperfective" ? "imperfective" : "perfective",
    query: (params.get("q") ?? "").slice(0, 200),
  };
}

export function writeMotionQuery(url: URL, state: MotionState): URL {
  const next = new URL(url);
  for (const key of ["family", "meaning", "aspect", "situation", "query"] as const) {
    const param = key === "query" ? "q" : key;
    if (key === "query" && state[key] === "") next.searchParams.delete(param);
    else next.searchParams.set(param, state[key]);
  }
  return next;
}
