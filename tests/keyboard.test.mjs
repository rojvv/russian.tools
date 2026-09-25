import assert from "node:assert/strict";
import test from "node:test";
import {
  editText,
  fixKeyboardLayout,
  keyboardLimit,
  keyboardRows,
  keyCharacter,
  physicalCharacter,
} from "../src/lib/keyboard.ts";

const event = (code, extra = {}) => ({
  code,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  isComposing: false,
  getModifierState: () => false,
  ...extra,
});

test("layout fixer recovers words in both directions and preserves letter case", () => {
  assert.equal(fixKeyboardLayout("ghbdtn", "en-to-ru"), "привет");
  assert.equal(fixKeyboardLayout("руддщ", "ru-to-en"), "hello");
  assert.equal(fixKeyboardLayout("Ghbdtn VBH!", "en-to-ru"), "Привет МИР!");
  assert.equal(fixKeyboardLayout("Руддщ ЦЩКДВ!", "ru-to-en"), "Hello WORLD!");
});

test("layout fixer restores punctuation by key position, including shifted keys", () => {
  assert.equal(fixKeyboardLayout("Ghbdtn? vbh/", "en-to-ru"), "Привет, мир.");
  assert.equal(fixKeyboardLayout("Руддщб цщкдвю", "ru-to-en"), "Hello, world.");
  assert.equal(fixKeyboardLayout("`~[]{};'\":,.<>/?|", "en-to-ru"), "ёЁхъХЪжэЭЖбюБЮ.,/");
  assert.equal(fixKeyboardLayout("!@#$%^&*()_+", "en-to-ru"), "!\"№;%:?*()_+");
});

test("layout fixer round-trips every printable US keyboard character and all Russian letters", () => {
  const english = Array.from({ length: 95 }, (_, index) => String.fromCharCode(index + 32)).join("");
  const russian = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
  assert.equal(fixKeyboardLayout(fixKeyboardLayout(english, "en-to-ru"), "ru-to-en"), english);
  for (const value of [russian, russian.toUpperCase()]) {
    assert.equal(fixKeyboardLayout(fixKeyboardLayout(value, "ru-to-en"), "en-to-ru"), value);
  }
});

test("layout fixer preserves whitespace, unrelated characters, and text length", () => {
  const untouched = " 123\t\r\n🙂👨‍👩‍👧‍👦é日本語\u0301";
  for (const direction of ["en-to-ru", "ru-to-en"]) {
    assert.equal(fixKeyboardLayout("", direction), "");
    assert.equal(fixKeyboardLayout(untouched, direction), untouched);
  }
  assert.equal(fixKeyboardLayout("ghbdtn привет", "en-to-ru"), "привет привет");
  assert.equal(fixKeyboardLayout("руддщ hello", "ru-to-en"), "hello hello");
  const full = "G🙂 ".repeat(keyboardLimit / 4);
  assert.equal(fixKeyboardLayout(full, "en-to-ru").length, keyboardLimit);
});

test("physical positions produce Russian words and the full alphabet", () => {
  const word = ["KeyG", "KeyH", "KeyB", "KeyD", "KeyT", "KeyN"].map(code => physicalCharacter(event(code))).join("");
  assert.equal(word, "привет");
  const letters = keyboardRows.flat().map(key => key.lower).filter(char => /[а-яё]/.test(char));
  assert.equal(letters.length, 33);
  assert.equal([...letters].sort().join(""), [..."абвгдеёжзийклмнопрстуфхцчшщъыьэюя"].sort().join(""));
  assert.equal(physicalCharacter(event("Backquote")), "ё");
  assert.equal(physicalCharacter(event("BracketRight")), "ъ");
});

test("Shift and Caps Lock invert letter case but Caps Lock leaves punctuation alone", () => {
  for (const key of keyboardRows.flat()) {
    assert.equal(keyCharacter(key, false, false), key.lower);
    assert.equal(keyCharacter(key, true, false), key.upper);
  }
  assert.equal(physicalCharacter(event("KeyF", { shiftKey: true })), "А");
  assert.equal(physicalCharacter(event("KeyF", { getModifierState: () => true })), "А");
  assert.equal(physicalCharacter(event("KeyF", { shiftKey: true, getModifierState: () => true })), "а");
  assert.equal(physicalCharacter(event("Digit3", { getModifierState: () => true })), "3");
  assert.equal(physicalCharacter(event("Digit3", { shiftKey: true })), "№");
  assert.equal(physicalCharacter(event("Digit2", { shiftKey: true })), "\"");
  assert.equal(physicalCharacter(event("Slash", { shiftKey: true })), ",");
});

test("mapping leaves shortcuts, composition, navigation, and unmapped keys alone", () => {
  for (const modifier of ["ctrlKey", "metaKey", "altKey", "isComposing"]) {
    assert.equal(physicalCharacter(event("KeyC", { [modifier]: true })), null);
  }
  for (const code of ["ArrowLeft", "Backspace", "Delete", "Tab", "Enter", "Space", "Numpad1", ""]) {
    assert.equal(physicalCharacter(event(code)), null);
  }
});

test("inserts at the caret and replaces selections without losing surrounding text", () => {
  assert.deepEqual(editText({ value: "приет", start: 3, end: 3 }, "в"), { value: "привет", start: 4, end: 4 });
  assert.deepEqual(editText({ value: "привет мир", start: 7, end: 10 }, "друг"), {
    value: "привет друг",
    start: 11,
    end: 11,
  });
  assert.deepEqual(editText({ value: "аб", start: 1, end: 1 }, "\n"), { value: "а\nб", start: 2, end: 2 });
});

test("backspace removes selections and whole graphemes, with no change at the start", () => {
  assert.deepEqual(editText({ value: "привет", start: 3, end: 6 }, null), { value: "при", start: 3, end: 3 });
  for (const grapheme of ["а", "е\u0301", "🙂", "👨‍👩‍👧‍👦"]) {
    assert.deepEqual(editText({ value: `а${grapheme}б`, start: 1 + grapheme.length, end: 1 + grapheme.length }, null), {
      value: "аб",
      start: 1,
      end: 1,
    });
  }
  assert.deepEqual(editText({ value: "аб", start: 0, end: 0 }, null), { value: "аб", start: 0, end: 0 });
});

test("the limit blocks insertions but allows replacements and deletion", () => {
  const full = { value: "а".repeat(keyboardLimit), start: keyboardLimit, end: keyboardLimit };
  assert.deepEqual(editText(full, "б"), full);
  const replaced = editText({ ...full, start: 0, end: 1 }, "б");
  assert.equal(replaced.value.length, keyboardLimit);
  assert.equal(replaced.value[0], "б");
  assert.equal(editText(full, null).value.length, keyboardLimit - 1);
});
