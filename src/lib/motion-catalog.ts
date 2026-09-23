export type Bilingual = { en: string; ru: string };
const text = (en: string, ru: string): Bilingual => ({ en, ru });

export const motionMeanings = {
  base: text("Basic movement", "Движение без приставки"),
  enter: text("Enter / move into", "Внутрь"),
  exit: text("Exit / move out of", "Наружу"),
  arrive: text("Arrive / bring to a destination", "Прибытие / доставка"),
  leave: text("Leave / move away", "Удаление / отправление"),
  approach: text("Approach / bring closer", "Приближение"),
  away: text("Move a short distance away", "В сторону / на некоторое расстояние"),
  cross: text("Cross / move to another place", "Через / на другое место"),
  reach: text("Reach / make it as far as", "Достижение цели"),
  pass: text("Pass / move through or past", "Мимо / сквозь"),
  around: text("Go around / bypass", "Вокруг / в обход"),
  visit: text("Stop by / move behind", "По пути / за предмет"),
  up: text("Move upwards", "Вверх"),
  down: text("Move down / off", "Вниз / с поверхности"),
  start: text("Set off / begin moving", "Начало движения"),
};
export type MotionMeaning = keyof typeof motionMeanings;
export interface MotionFamily {
  id: string;
  label: Bilingual;
  directed: string;
  multidirectional: string;
  phrase: string;
}
export interface MotionEntry {
  family: string;
  meaning: MotionMeaning;
  imperfective: string;
  perfective: string;
}

export const motionFamilies: MotionFamily[] = [
  { id: "foot", label: text("Walking", "Пешком"), directed: "идти", multidirectional: "ходить", phrase: "в школу" },
  {
    id: "transport",
    label: text("By land transport", "На наземном транспорте"),
    directed: "ехать",
    multidirectional: "ездить",
    phrase: "в город",
  },
  {
    id: "air",
    label: text("Flying", "По воздуху"),
    directed: "лететь",
    multidirectional: "летать",
    phrase: "в Москву",
  },
  {
    id: "swim",
    label: text("Swimming / sailing", "Вплавь / по воде"),
    directed: "плыть",
    multidirectional: "плавать",
    phrase: "к берегу",
  },
  { id: "run", label: text("Running", "Бегом"), directed: "бежать", multidirectional: "бегать", phrase: "в парк" },
  {
    id: "crawl",
    label: text("Crawling", "Ползком"),
    directed: "ползти",
    multidirectional: "ползать",
    phrase: "к двери",
  },
  {
    id: "climb",
    label: text("Climbing", "Лазание"),
    directed: "лезть",
    multidirectional: "лазить",
    phrase: "на дерево",
  },
  {
    id: "wander",
    label: text("Walking slowly / trudging", "Медленно пешком / вброд"),
    directed: "брести",
    multidirectional: "бродить",
    phrase: "по лесу",
  },
  {
    id: "carry",
    label: text("Carrying on foot", "Нести в руках / на себе"),
    directed: "нести",
    multidirectional: "носить",
    phrase: "сумку",
  },
  {
    id: "convey",
    label: text("Transporting a person / load", "Везти человека / груз"),
    directed: "везти",
    multidirectional: "возить",
    phrase: "груз",
  },
  {
    id: "lead",
    label: text("Leading / accompanying", "Вести / сопровождать"),
    directed: "вести",
    multidirectional: "водить",
    phrase: "ребёнка",
  },
  {
    id: "drive",
    label: text("Driving / chasing onward", "Гнать / заставлять двигаться"),
    directed: "гнать",
    multidirectional: "гонять",
    phrase: "стадо",
  },
  {
    id: "drag",
    label: text("Dragging / hauling", "Тащить / волочить"),
    directed: "тащить",
    multidirectional: "таскать",
    phrase: "мешок",
  },
  {
    id: "roll",
    label: text("Rolling something", "Катить предмет"),
    directed: "катить",
    multidirectional: "катать",
    phrase: "мяч",
  },
];

// Explicit lexical pairs: prefixing the multidirectional base is not a general
// derivation rule (ехать / ездить becomes выехать / выезжать, for example).
const rows: Record<string, string> = {
  foot:
    "входить/войти выходить/выйти приходить/прийти уходить/уйти подходить/подойти отходить/отойти переходить/перейти доходить/дойти проходить/пройти обходить/обойти заходить/зайти восходить/взойти сходить/сойти",
  transport:
    "въезжать/въехать выезжать/выехать приезжать/приехать уезжать/уехать подъезжать/подъехать отъезжать/отъехать переезжать/переехать доезжать/доехать проезжать/проехать объезжать/объехать заезжать/заехать въезжать/въехать съезжать/съехать",
  air:
    "влетать/влететь вылетать/вылететь прилетать/прилететь улетать/улететь подлетать/подлететь отлетать/отлететь перелетать/перелететь долетать/долететь пролетать/пролететь облетать/облететь залетать/залететь взлетать/взлететь слетать/слететь",
  swim:
    "вплывать/вплыть выплывать/выплыть приплывать/приплыть уплывать/уплыть подплывать/подплыть отплывать/отплыть переплывать/переплыть доплывать/доплыть проплывать/проплыть оплывать/оплыть заплывать/заплыть всплывать/всплыть -",
  run:
    "вбегать/вбежать выбегать/выбежать прибегать/прибежать убегать/убежать подбегать/подбежать отбегать/отбежать перебегать/перебежать добегать/добежать пробегать/пробежать обегать/обежать забегать/забежать взбегать/взбежать сбегать/сбежать",
  crawl:
    "вползать/вползти выползать/выползти приползать/приползти уползать/уползти подползать/подползти отползать/отползти переползать/переползти доползать/доползти проползать/проползти оползать/оползти заползать/заползти вползать/вползти сползать/сползти",
  climb:
    "влезать/влезть вылезать/вылезть - - подлезать/подлезть - перелезать/перелезть долезать/долезть пролезать/пролезть - залезать/залезть влезать/влезть слезать/слезть",
  wander: "- - - - - - - добредать/добрести - - забредать/забрести - -",
  carry:
    "вносить/внести выносить/вынести приносить/принести уносить/унести подносить/поднести относить/отнести переносить/перенести доносить/донести проносить/пронести обносить/обнести заносить/занести возносить/вознести сносить/снести",
  convey:
    "ввозить/ввезти вывозить/вывезти привозить/привезти увозить/увезти подвозить/подвезти отвозить/отвезти перевозить/перевезти довозить/довезти провозить/провезти - завозить/завезти ввозить/ввезти свозить/свезти",
  lead:
    "вводить/ввести выводить/вывести приводить/привести уводить/увести подводить/подвести отводить/отвести переводить/перевести доводить/довести проводить/провести обводить/обвести заводить/завести возводить/возвести сводить/свести",
  drive:
    "вгонять/вогнать выгонять/выгнать пригонять/пригнать угонять/угнать подгонять/подогнать отгонять/отогнать перегонять/перегнать догонять/догнать прогонять/прогнать обгонять/обогнать загонять/загнать - сгонять/согнать",
  drag:
    "втаскивать/втащить вытаскивать/вытащить притаскивать/притащить утаскивать/утащить подтаскивать/подтащить оттаскивать/оттащить перетаскивать/перетащить дотаскивать/дотащить протаскивать/протащить - затаскивать/затащить втаскивать/втащить стаскивать/стащить",
  roll:
    "вкатывать/вкатить выкатывать/выкатить прикатывать/прикатить укатывать/укатить подкатывать/подкатить откатывать/откатить перекатывать/перекатить докатывать/докатить прокатывать/прокатить обкатывать/обкатить закатывать/закатить вкатывать/вкатить скатывать/скатить",
};
const meanings: MotionMeaning[] = [
  "enter",
  "exit",
  "arrive",
  "leave",
  "approach",
  "away",
  "cross",
  "reach",
  "pass",
  "around",
  "visit",
  "up",
  "down",
];
export const motionEntries: MotionEntry[] = motionFamilies.flatMap((family) =>
  rows[family.id].split(" ").flatMap((pair, index) => {
    if (pair === "-") return [];
    const [imperfective, perfective] = pair.split("/");
    return [{ family: family.id, meaning: meanings[index], imperfective, perfective }];
  })
);

export const motionStarts: Record<string, string> = {
  foot: "пойти",
  transport: "поехать",
  air: "полететь",
  swim: "поплыть",
  run: "побежать",
  crawl: "поползти",
  climb: "полезть",
  wander: "побрести",
  carry: "понести",
  convey: "повезти",
  lead: "повести",
  drive: "погнать",
  drag: "потащить",
  roll: "покатить",
};

export function searchMotion(query: string): MotionEntry[] {
  const normalized = query.toLowerCase().normalize("NFC").replaceAll("\u0301", "").replaceAll("ё", "е").trim();
  return motionEntries.filter((entry) =>
    [entry.imperfective, entry.perfective].some((word) => word.includes(normalized))
  );
}

export const catalogCopy = {
  en: {
    family: "Type of movement",
    meaning: "Direction or purpose",
    aspect: "How is the event viewed?",
    imperfective: "Process or repeated action",
    perfective: "A single event viewed as a whole",
    imperfectiveNote:
      "Imperfective: describes a process, a repeated action, or an action without asserting its completion.",
    perfectiveNote:
      "Perfective: presents a bounded event as a whole. Its non-past forms refer to the future, not the present.",
    startNote:
      "По- with a directed motion verb often marks setting off. This is not an ordinary aspect pair with the multidirectional verb: поездить means travel around for a while, not repeatedly set off.",
    search: "Find a motion verb",
    placeholder: "выехать, переехать, нести…",
    verbs: "Verbs",
    results: "matches",
    empty: "No matching verbs.",
    scope:
      "14 standard motion-verb families and their common spatial prefixes. Prefix meanings depend on context; figurative senses, rare derivatives, and reflexive forms are not exhaustively listed.",
    baseNote:
      "Both basic verbs are imperfective. One describes directed movement on a particular occasion; the other describes habitual trips, movement in different directions, or a past round trip.",
    relocation:
      "Переехать can mean cross by transport (переехать мост) or move house (переехать в другой город). Переезжать is its imperfective counterpart in both senses.",
    driveReach: "Догнать means catch up with someone or something; догонять describes the process or repeated action.",
    driveAround: "Обогнать means overtake or outstrip; обгонять describes the process or repeated action.",
    flightDown:
      "Слетать / слететь here means fly down or off. The same spelling слетать can also be perfective and mean make a round trip by air.",
    climbNote: "Лазать is also used alongside лазить as a multidirectional verb.",
    examplePhrase: "Example phrase",
    more: "Refine the search to see more matches.",
  },
  ru: {
    family: "Способ движения",
    meaning: "Направление или цель",
    aspect: "Как представлено действие?",
    imperfective: "Процесс или повторяющееся действие",
    perfective: "Отдельное действие как целое",
    imperfectiveNote: "Несовершенный вид: процесс, повторение или действие без указания на его завершённость.",
    perfectiveNote:
      "Совершенный вид: ограниченное действие как целое. Формы непрошедшего времени обозначают будущее, а не настоящее.",
    startNote:
      "По- с глаголом однонаправленного движения часто обозначает начало движения. Это не обычная видовая пара с разнонаправленным глаголом: поездить означает ездить некоторое время, а не регулярно отправляться в путь.",
    search: "Найти глагол движения",
    placeholder: "выехать, переехать, нести…",
    verbs: "Глаголы",
    results: "совпадений",
    empty: "Глаголы не найдены.",
    scope:
      "14 основных пар глаголов движения и распространённые пространственные приставки. Значение зависит от контекста; переносные значения, редкие производные и возвратные формы представлены не исчерпывающе.",
    baseNote:
      "Оба бесприставочных глагола несовершенного вида. Один обозначает направленное движение в конкретной ситуации, другой — привычное движение, разные направления или поездку туда и обратно в прошлом.",
    relocation:
      "Переехать может означать пересечь на транспорте (переехать мост) или сменить место жительства (переехать в другой город). В обоих значениях несовершенный вид — переезжать.",
    driveReach: "Догнать — настичь кого-либо или что-либо; догонять — процесс или повторение этого действия.",
    driveAround: "Обогнать — оказаться впереди; обгонять — процесс или повторение этого действия.",
    flightDown:
      "Слетать / слететь здесь означает движение вниз или с поверхности. Омоним слетать совершенного вида означает полететь куда-либо и вернуться.",
    climbNote: "Наряду с лазить употребляется разнонаправленный глагол лазать.",
    examplePhrase: "Пример словосочетания",
    more: "Уточните запрос, чтобы увидеть остальные совпадения.",
  },
};

export const transportPhrases: Partial<Record<MotionMeaning, string>> = {
  enter: "в гараж",
  exit: "из гаража",
  arrive: "в Москву",
  leave: "из города",
  approach: "к дому",
  away: "от дома",
  cross: "в другой город",
  reach: "до станции",
  pass: "мимо дома",
  around: "вокруг озера",
  visit: "к другу",
  up: "на гору",
  down: "с горы",
  start: "в Москву",
};
