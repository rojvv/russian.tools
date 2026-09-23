<script lang="ts">
import { getI18n } from "$lib/i18n-context";
import Seo from "$lib/Seo.svelte";
const i18n = getI18n();
const ru = $derived(i18n.locale === "ru");
</script>

<Seo
  title={`${i18n.t("acknowledgementsTitle")} | russian.tools`}
  description={i18n.t("acknowledgementsDescription")}
  canonical="https://russian.tools/acknowledgements"
/>
<p>{i18n.t("acknowledgementsDescription")}</p>

<section>
  <h2>OpenRussian</h2>
  <p>
    {
      ru
      ? "Спряжение глаголов, склонение существительных и прилагательных и игра в падежи используют данные"
      : "The verb conjugator, noun and adjective decliner, and case game use data from"
    }
    <a href="https://en.openrussian.org/">{
      ru ? "OpenRussian и его участников" : "OpenRussian and its contributors"
    }</a>.
    {
      ru
      ? "Адаптированные словари распространяются по лицензии"
      : "The adapted dictionaries are distributed under"
    }
    <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.
  </p>
  <p>
    {
      ru
      ? "Данные отобраны и преобразованы для инструментов сайта; обозначения ударений приведены к единому виду, а некоторые ошибки исправлены. Источники и изменения:"
      : "Data has been selected and reformatted for these tools, with normalized stress marks and some corrections. Source and modification notes:"
    }
    <a href="/data/verbs-SOURCE.md">{ru ? "глаголы" : "verbs"}</a>,
    <a href="/data/adjectives-SOURCE.md">{
      ru ? "прилагательные" : "adjectives"
    }</a>.
    <a href="https://en.openrussian.org/dictionary-data">{
      ru ? "Исходные данные" : "Original dictionary data"
    }</a>.
  </p>
</section>
<section>
  <h2>{ru ? "Русские имена" : "Russian names"}</h2>
  <p>
    {
      ru
      ? "При составлении подборки уменьшительных имён использован"
      : "The name diminutive finder’s selection uses"
    }
    <a href="https://azbyka.ru/deti/slovar-russkih-lichnyh-imen-petrovskij">{
      ru
      ? "«Словарь русских личных имён» Н. А. Петровского"
      : "N. A. Petrovsky’s Dictionary of Russian Personal Names"
    }</a>{ru ? "." : " as a reference."}
    {
      ru
      ? "Подборка включает краткие и ласкательные формы и не является полной копией словаря."
      : "The selection includes short and affectionate forms and is not a complete reproduction of the dictionary."
    }
    <a
      href="https://gramota.ru/biblioteka/slovari/slovar-russkih-imyon/kak-polzovatsya-slovarem"
    >{
      ru ? "Как пользоваться словарём — Грамота.ру" : "Dictionary guide — Gramota.ru"
    }</a>.
  </p>
</section>
<section>
  <h2>{ru ? "Транслитерация" : "Transliteration"}</h2>
  <p>
    {
      ru
      ? "Соответствия кириллических и латинских букв основаны на"
      : "Cyrillic-to-Latin letter mappings follow"
    }
    <a
      href="https://www.icao.int/sites/default/files/publications/DocSeries/9303_p3_cons_en.pdf#page=35"
    >{
      ru
      ? "ИКАО Doc 9303, часть 3, раздел 6B (PDF)"
      : "ICAO Doc 9303, Part 3, section 6B (PDF)"
    }</a>.
    <a
      href="https://dk.kdmid.ru/ru/consular-functions/chasto-zadavaemye-voprosy/"
    >{
      ru ? "Консульские разъяснения" : "Russian consular guidance"
    }</a>
    {
      ru
      ? "указывают ИКАО как стандарт транслитерации для загранпаспортов."
      : "identifies ICAO as the passport transliteration standard."
    }
  </p>
</section>
<section>
  <h2>{ru ? "Расстановка ударений" : "Stress marking"}</h2>
  <p>
    {
      ru
      ? "Расстановка ударений и тренировка ударений работают с помощью"
      : "The stress marker and stress practice tools use"
    }
    <a href="https://jsr.io/@roj/rustress">@roj/rustress</a> {ru ? "и" : "and"}
    <a href="https://onnxruntime.ai/">ONNX Runtime Web</a>.
  </p>
</section>
<section>
  <h2>{ru ? "Шрифт" : "Typeface"}</h2>
  <p>
    <a href="https://fonts.google.com/specimen/Golos+Text">Golos Text</a>
    {
      ru ? "используется по лицензии" : "is used under the"
    }
    <a href="/fonts/GolosText-OFL.txt">SIL Open Font License</a>.
  </p>
</section>

<style>
section { margin-top: 32px; }
h2 { font-size: 20px; font-weight: 500; margin: 0 0 10px; }
p + p { margin-top: 12px; }
</style>
