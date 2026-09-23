export type KeyboardKey = { code: string; lower: string; upper: string; hint: string };

function row(codes: string[], lower: string, upper: string, hints: string): KeyboardKey[] {
  return codes.map((code, index) => ({ code, lower: lower[index], upper: upper[index], hint: hints[index] }));
}

export const keyboardRows = [
  row(
    ["Backquote", ...Array.from({ length: 9 }, (_, i) => `Digit${i + 1}`), "Digit0", "Minus", "Equal"],
    "ё1234567890-=",
    "Ё!\"№;%:?*()_+",
    "`1234567890-=",
  ),
  row(
    [
      "KeyQ",
      "KeyW",
      "KeyE",
      "KeyR",
      "KeyT",
      "KeyY",
      "KeyU",
      "KeyI",
      "KeyO",
      "KeyP",
      "BracketLeft",
      "BracketRight",
      "Backslash",
    ],
    "йцукенгшщзхъ\\",
    "ЙЦУКЕНГШЩЗХЪ/",
    "QWERTYUIOP[]\\",
  ),
  row(
    ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote"],
    "фывапролджэ",
    "ФЫВАПРОЛДЖЭ",
    "ASDFGHJKL;'",
  ),
  row(
    ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash"],
    "ячсмитьбю.",
    "ЯЧСМИТЬБЮ,",
    "ZXCVBNM,./",
  ),
];

export function keyCharacter(key: KeyboardKey, shift: boolean, caps: boolean): string {
  const letter = key.lower !== key.lower.toUpperCase();
  return (letter ? shift !== caps : shift) ? key.upper : key.lower;
}

type PhysicalKey = {
  code: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  isComposing: boolean;
  getModifierState(key: string): boolean;
};

export function physicalCharacter(event: PhysicalKey): string | null {
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return null;
  const key = keyboardRows.flat().find((key) => key.code === event.code);
  return key ? keyCharacter(key, event.shiftKey, event.getModifierState("CapsLock")) : null;
}

export type Edit = { value: string; start: number; end: number };
export const keyboardLimit = 20000;

/** Replace a selection, or erase the preceding grapheme (including emoji and accents). */
export function editText(current: Edit, insert: string | null): Edit {
  let { value, start, end } = current;
  if (insert === null && start === end && start > 0) {
    const segments = new Intl.Segmenter("ru", { granularity: "grapheme" }).segment(value.slice(0, start));
    for (const segment of segments) start = segment.index;
  }
  const addition = insert ?? "";
  if (value.length - (end - start) + addition.length > keyboardLimit) return current;
  value = value.slice(0, start) + addition + value.slice(end);
  return { value, start: start + addition.length, end: start + addition.length };
}
