export type TravelMode = "foot" | "transport" | "air";
export type MotionSituation = "direction" | "habit" | "wandering" | "return";

export const motionCopy = {
  en: {
    mode: "How are you travelling?",
    foot: "On foot",
    transport: "By land transport",
    air: "Flying",
    situation: "What kind of journey?",
    direction: "In one direction, in progress",
    habit: "A regular or repeated trip",
    wandering: "Around, without a single direction",
    return: "A past trip there and back",
    directionReason: "Use the unidirectional verb for movement towards a destination on a particular occasion.",
    habitReason:
      "Use the multidirectional verb for habitual or repeated trips, even when the destination is always the same.",
    wanderingReason: "Use the multidirectional verb for movement in different directions without one directed journey.",
    returnReason:
      "Use the multidirectional verb in the past for a visit or trip there and back. One round trip is enough; it does not have to be a habit.",
    example: "Example",
    compare: "Compare",
    conjugation: "View conjugation",
    note:
      "All six verbs are imperfective. Direction is not aspect: идти, ехать, and лететь do not by themselves mean arrival or completion. Departure and arrival often need prefixed verbs, such as пойти / прийти or полететь / прилететь.",
    javascript: "Enable JavaScript to change the journey choices.",
  },
  ru: {
    mode: "Как вы передвигаетесь?",
    foot: "Пешком",
    transport: "На наземном транспорте",
    air: "По воздуху",
    situation: "Какое это движение?",
    direction: "В одном направлении, в процессе",
    habit: "Регулярные или повторяющиеся поездки / походы / полёты",
    wandering: "В разных направлениях",
    return: "В прошлом: туда и обратно",
    directionReason: "Глагол однонаправленного движения описывает движение к цели в конкретной ситуации.",
    habitReason:
      "Глагол разнонаправленного движения описывает привычное или повторяющееся движение, даже если цель всегда одна и та же.",
    wanderingReason:
      "Глагол разнонаправленного движения описывает перемещение в разных направлениях без единого направления к цели.",
    returnReason:
      "Глагол разнонаправленного движения в прошедшем времени может обозначать посещение или поездку туда и обратно. Даже однократную, а не только привычную.",
    example: "Пример",
    compare: "Сравнение",
    conjugation: "Посмотреть спряжение",
    note:
      "Все шесть глаголов несовершенного вида. Направление не равно виду: идти, ехать и лететь сами по себе не означают прибытия или завершения. Для отправления и прибытия часто нужны приставочные глаголы, например пойти / прийти или полететь / прилететь.",
    javascript: "Включите JavaScript, чтобы менять условия движения.",
  },
};

const verbs = { foot: ["идти", "ходить"], transport: ["ехать", "ездить"], air: ["лететь", "летать"] } as const;
const examples = {
  foot: {
    direction: ["Сейчас я иду в магазин.", "I am walking to the shop now."],
    habit: ["Каждый день я хожу в магазин.", "I walk to the shop every day."],
    wandering: ["Я хожу по комнате.", "I am walking around the room."],
    return: ["Вчера я ходил в магазин и купил хлеб.", "Yesterday I went to the shop and bought bread."],
  },
  transport: {
    direction: ["Сейчас я еду на работу на автобусе.", "I am going to work by bus now."],
    habit: ["Каждый день я езжу на работу на автобусе.", "I go to work by bus every day."],
    wandering: [
      "Мы ездим по городу без определённого маршрута.",
      "We are driving around the city without a fixed route.",
    ],
    return: [
      "Вчера я ездил в Тулу и вечером вернулся домой.",
      "Yesterday I went to Tula and returned home in the evening.",
    ],
  },
  air: {
    direction: ["Сейчас я лечу в Москву.", "I am flying to Moscow now."],
    habit: ["Каждый месяц я летаю в Москву.", "I fly to Moscow every month."],
    wandering: ["Птицы летают над озером.", "Birds are flying around above the lake."],
    return: [
      "На прошлой неделе я летал в Москву и вернулся домой в пятницу.",
      "Last week I flew to Moscow and returned home on Friday.",
    ],
  },
} as const;

export function chooseMotion(mode: TravelMode, situation: MotionSituation) {
  const directed = situation === "direction";
  return {
    verb: verbs[mode][directed ? 0 : 1],
    contrastVerb: verbs[mode][directed ? 1 : 0],
    example: examples[mode][situation],
    contrast: examples[mode][directed ? "habit" : "direction"],
    reason: `${situation}Reason` as const,
  };
}
