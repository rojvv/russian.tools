export const abbreviationCategories = {
  writing: { en: "Everyday writing", ru: "Письменная речь" },
  addresses: { en: "Addresses & housing", ru: "Адреса и жильё" },
  documents: { en: "Documents & public services", ru: "Документы и госуслуги" },
  government: { en: "Government & organizations", ru: "Государство и организации" },
  business: { en: "Business & work", ru: "Бизнес и работа" },
  finance: { en: "Money & taxes", ru: "Финансы и налоги" },
  education: { en: "Education", ru: "Образование" },
  medicine: { en: "Medicine", ru: "Медицина" },
  technology: { en: "Computing & technology", ru: "Компьютеры и техника" },
  transport: { en: "Transport", ru: "Транспорт" },
  science: { en: "Science & measurements", ru: "Наука и измерения" },
  grammar: { en: "Grammar & dictionaries", ru: "Грамматика и словари" },
  history: { en: "Historical terms", ru: "Исторические термины" },
  chat: { en: "Chat & informal writing", ru: "Переписка и разговорная речь" },
} as const;

export type AbbreviationCategory = keyof typeof abbreviationCategories;

export interface Abbreviation {
  id: string;
  short: string;
  expansion: string;
  english: string;
  category: AbbreviationCategory;
  aliases: string[];
}

// Curated meanings, not automatic expansions. See abbreviations-SOURCE.md.
// Each row: abbreviation | Russian expansion | English gloss | optional aliases (; separated).
// Separate rows preserve different meanings of the same abbreviation.
const catalog: Record<AbbreviationCategory, string> = {
  writing: `
т. е.|то есть|that is; in other words
т. к.|так как|because; since
т. н.|так называемый|so-called
т. о.|таким образом|thus; in this way
и т. д.|и так далее|and so on; etc.|т. д.
и т. п.|и тому подобное|and the like|т. п.
и др.|и другие|and others
и пр.|и прочие|and other such things
напр.|например|for example
см.|смотри|see; a reference to another passage
ср.|сравни|compare; cf.
прим.|примечание|note; annotation
стр.|страница|page
с.|страница|page; bibliographic reference
рис.|рисунок|figure; illustration
табл.|таблица|table
гл.|глава|chapter
п.|пункт|item; numbered paragraph
пп.|пункты|items; numbered paragraphs
абз.|абзац|paragraph
т.|том|volume of a publication
тт.|тома|volumes of a publication
изд.|издание|edition; publication
ред.|редактор|editor
пер.|перевод|translation
экз.|экземпляр|copy of a publication or document
б. г.|без года|without a publication year
б. м.|без места|without a publication location
б/н|без номера|without a number; unnumbered
б/д|без даты|without a date; undated
исх.|исходящий|outgoing; outgoing document reference
вх.|входящий|incoming; incoming document reference
н. э.|нашей эры|Common Era; CE
до н. э.|до нашей эры|Before Common Era; BCE
г.|год|year
гг.|годы|years
в.|век|century
вв.|века|centuries
`,
  addresses: `
г.|город|city; town
ул.|улица|street
д.|дом|house; building number
д.|деревня|village
с.|село|rural settlement; village
п.|посёлок|settlement|пос.
пгт|посёлок городского типа|urban-type settlement
пр-т|проспект|avenue|просп.
пер.|переулок|lane; side street
пл.|площадь|square
наб.|набережная|embankment; waterfront street
бул.|бульвар|boulevard|б-р
ш.|шоссе|highway
туп.|тупик|dead-end street
обл.|область|region; oblast
р-н|район|district
мкр.|микрорайон|residential neighborhood|мкр-н
корп.|корпус|building block
стр.|строение|structure; building on a property
кв.|квартира|apartment; flat
под.|подъезд|entrance; stairwell
эт.|этаж|floor; storey
а/я|абонентский ящик|post office box
ЖКХ|жилищно-коммунальное хозяйство|housing and public utilities
ЖКУ|жилищно-коммунальные услуги|housing and utility services
ТСЖ|товарищество собственников жилья|homeowners association
УК|управляющая компания|property management company
МКД|многоквартирный дом|apartment building
ИЖС|индивидуальное жилищное строительство|individual housing construction
СНТ|садоводческое некоммерческое товарищество|noncommercial gardening association
ГВС|горячее водоснабжение|hot water supply
ХВС|холодное водоснабжение|cold water supply
ЖК|жилой комплекс|residential complex
тел.|телефон|telephone; phone number
моб.|мобильный|mobile; mobile phone number
доб.|добавочный|extension; additional phone number digits
эл. почта|электронная почта|email
`,
  documents: `
ФИО|фамилия, имя, отчество|surname, given name, patronymic
СНИЛС|страховой номер индивидуального лицевого счёта|individual insurance account number
ИНН|идентификационный номер налогоплательщика|taxpayer identification number
МФЦ|многофункциональный центр|public-service center
ЗАГС|запись актов гражданского состояния|civil registration; also used for the registry office
ВНЖ|вид на жительство|residence permit
РВП|разрешение на временное проживание|temporary residence permit
ОМС|обязательное медицинское страхование|compulsory medical insurance
ДМС|добровольное медицинское страхование|voluntary medical insurance
ЕГРН|Единый государственный реестр недвижимости|Unified State Register of Real Estate
ЕГРН|Единый государственный реестр налогоплательщиков|Unified State Register of Taxpayers
ЕГРЮЛ|Единый государственный реестр юридических лиц|state register of legal entities
ЕГРИП|Единый государственный реестр индивидуальных предпринимателей|state register of individual entrepreneurs
ОГРН|основной государственный регистрационный номер|primary state registration number
ОГРНИП|основной государственный регистрационный номер индивидуального предпринимателя|state registration number for an individual entrepreneur
КПП|код причины постановки на учёт|tax registration reason code
ЭП|электронная подпись|electronic signature
ЭЦП|электронная цифровая подпись|digital signature; older terminology
УКЭП|усиленная квалифицированная электронная подпись|enhanced qualified electronic signature
УНЭП|усиленная неквалифицированная электронная подпись|enhanced unqualified electronic signature
ЕСИА|Единая система идентификации и аутентификации|unified identification and authentication system
ЕПГУ|Единый портал государственных и муниципальных услуг|unified public services portal
СФР|Фонд пенсионного и социального страхования Российской Федерации|Social Fund of Russia
НПА|нормативный правовой акт|normative legal act
ФЗ|федеральный закон|federal law
ГК|Гражданский кодекс|Civil Code
ТК|Трудовой кодекс|Labor Code
УК|Уголовный кодекс|Criminal Code
КоАП|Кодекс об административных правонарушениях|Code of Administrative Offenses
`,
  government: `
РФ|Российская Федерация|Russian Federation
СМИ|средства массовой информации|mass media
МВД|Министерство внутренних дел|Ministry of Internal Affairs
МИД|Министерство иностранных дел|Ministry of Foreign Affairs
МЧС|Министерство Российской Федерации по делам гражданской обороны, чрезвычайным ситуациям и ликвидации последствий стихийных бедствий|Russian Ministry of Emergency Situations|МЧС России
ФНС|Федеральная налоговая служба|Federal Tax Service
ФТС|Федеральная таможенная служба|Federal Customs Service
ФАС|Федеральная антимонопольная служба|Federal Antimonopoly Service
ФСБ|Федеральная служба безопасности|Federal Security Service
ФССП|Федеральная служба судебных приставов|Federal Bailiff Service
ЦБ|Центральный банк|central bank
ЦИК|Центральная избирательная комиссия|Central Election Commission
ГД|Государственная дума|State Duma
СФ|Совет Федерации|Federation Council
ООН|Организация Объединённых Наций|United Nations; UN
ВОЗ|Всемирная организация здравоохранения|World Health Organization; WHO
ЕС|Европейский союз|European Union; EU
СНГ|Содружество Независимых Государств|Commonwealth of Independent States; CIS
ЕАЭС|Евразийский экономический союз|Eurasian Economic Union; EAEU
ОБСЕ|Организация по безопасности и сотрудничеству в Европе|Organization for Security and Co-operation in Europe; OSCE
ВТО|Всемирная торговая организация|World Trade Organization; WTO
МВФ|Международный валютный фонд|International Monetary Fund; IMF
НКО|некоммерческая организация|nonprofit organization
НПО|неправительственная организация|nongovernmental organization; NGO
МО|Министерство обороны|Ministry of Defense
ЧС|чрезвычайная ситуация|emergency situation
ЧП|чрезвычайное происшествие|emergency incident
ФОМС|фонд обязательного медицинского страхования|compulsory medical insurance fund
`,
  business: `
ООО|общество с ограниченной ответственностью|limited liability company
АО|акционерное общество|joint-stock company
ПАО|публичное акционерное общество|public joint-stock company
ИП|индивидуальный предприниматель|individual entrepreneur; sole proprietor
ГУП|государственное унитарное предприятие|state unitary enterprise
МУП|муниципальное унитарное предприятие|municipal unitary enterprise
ФГУП|федеральное государственное унитарное предприятие|federal state unitary enterprise
МСП|малое и среднее предпринимательство|small and medium-sized business
СП|совместное предприятие|joint venture
НПО|научно-производственное объединение|research and production association
ТЗ|техническое задание|technical specification; project requirements
КП|коммерческое предложение|commercial proposal; quotation
КПЭ|ключевые показатели эффективности|key performance indicators; KPIs
ОТК|отдел технического контроля|quality control department
ТМЦ|товарно-материальные ценности|inventory; tangible stocks
ФОТ|фонд оплаты труда|payroll fund
ГПХ|гражданско-правовой характер|civil-law nature; used of service contracts
з/п|заработная плата|salary; wages|зп
и. о.|исполняющий обязанности|acting officeholder
врио|временно исполняющий обязанности|temporarily acting officeholder
зам.|заместитель|deputy
зав.|заведующий|head of a department or facility
нач.|начальник|head; chief
б/у|бывший в употреблении|used; second-hand
шт.|штука|item; piece
упак.|упаковка|package; pack
арт.|артикул|product code; article number
ЭДО|электронный документооборот|electronic document exchange
СБ|служба безопасности|security service; security department
ТЦ|торговый центр|shopping center
`,
  finance: `
НДС|налог на добавленную стоимость|value-added tax; VAT
НДФЛ|налог на доходы физических лиц|personal income tax
УСН|упрощённая система налогообложения|simplified taxation system
ПСН|патентная система налогообложения|patent taxation system
НПД|налог на профессиональный доход|professional income tax
ОСНО|общая система налогообложения|general taxation system
БИК|банковский идентификационный код|bank identification code
КБК|код бюджетной классификации|budget classification code
УИН|уникальный идентификатор начисления|unique payment assessment identifier
р/с|расчётный счёт|settlement account; business bank account
к/с|корреспондентский счёт|correspondent account
л/с|лицевой счёт|personal account; account reference
СБП|Система быстрых платежей|Faster Payments System
НСПК|Национальная система платёжных карт|National Payment Card System
ПИН|персональный идентификационный номер|personal identification number; PIN|ПИН-код
ПСК|полная стоимость кредита|total cost of credit
ПДН|показатель долговой нагрузки|debt burden indicator
БКИ|бюро кредитных историй|credit history bureau
ИИС|индивидуальный инвестиционный счёт|individual investment account
ПИФ|паевой инвестиционный фонд|unit investment fund
ОФЗ|облигации федерального займа|federal loan bonds
ВВП|валовой внутренний продукт|gross domestic product; GDP
ВНП|валовой национальный продукт|gross national product; GNP
руб.|рубль|ruble
коп.|копейка|kopeck
тыс.|тысяча|thousand
млн|миллион|million
млрд|миллиард|billion
трлн|триллион|trillion
ОС|основные средства|fixed assets
`,
  education: `
вуз|высшее учебное заведение|higher education institution
ссуз|среднее специальное учебное заведение|specialized secondary education institution
ЕГЭ|единый государственный экзамен|Unified State Exam
ОГЭ|основной государственный экзамен|Basic State Exam
ГИА|государственная итоговая аттестация|state final assessment
ГВЭ|государственный выпускной экзамен|State Graduation Exam
ВПР|всероссийские проверочные работы|nationwide school assessments
ФГОС|федеральный государственный образовательный стандарт|federal state educational standard
СПО|среднее профессиональное образование|secondary vocational education
ДПО|дополнительное профессиональное образование|continuing professional education
ДОУ|дошкольное образовательное учреждение|preschool educational institution
СОШ|средняя общеобразовательная школа|general secondary school
ООП|основная образовательная программа|main educational program
ОВЗ|ограниченные возможности здоровья|disabilities; special educational needs context
ВКР|выпускная квалификационная работа|final qualification thesis or project
НИР|научно-исследовательская работа|research work
НИИ|научно-исследовательский институт|research institute
РАН|Российская академия наук|Russian Academy of Sciences
ВАК|Высшая аттестационная комиссия|Higher Attestation Commission
к. н.|кандидат наук|Candidate of Sciences degree
д. н.|доктор наук|Doctor of Sciences degree
доц.|доцент|associate professor; academic title
проф.|профессор|professor
акад.|академик|academician
д/з|домашнее задание|homework|дз
РКИ|русский как иностранный|Russian as a foreign language
ТРКИ|тестирование по русскому языку как иностранному|Test of Russian as a Foreign Language; TORFL
`,
  medicine: `
ОРВИ|острая респираторная вирусная инфекция|acute respiratory viral infection
ОРЗ|острое респираторное заболевание|acute respiratory disease
УЗИ|ультразвуковое исследование|ultrasound examination
МРТ|магнитно-резонансная томография|magnetic resonance imaging; MRI
КТ|компьютерная томография|computed tomography; CT
ЭКГ|электрокардиограмма|electrocardiogram; ECG
ЭЭГ|электроэнцефалограмма|electroencephalogram; EEG
ОАК|общий анализ крови|complete blood count
ОАМ|общий анализ мочи|urinalysis
ПЦР|полимеразная цепная реакция|polymerase chain reaction; PCR
ИФА|иммуноферментный анализ|enzyme immunoassay
АД|артериальное давление|blood pressure
ЧСС|частота сердечных сокращений|heart rate
СОЭ|скорость оседания эритроцитов|erythrocyte sedimentation rate; ESR
ЖКТ|желудочно-кишечный тракт|gastrointestinal tract
ЦНС|центральная нервная система|central nervous system
ЛОР|ларингооторинолог|ear, nose and throat specialist; ENT doctor
ВИЧ|вирус иммунодефицита человека|human immunodeficiency virus; HIV
СПИД|синдром приобретённого иммунодефицита|acquired immunodeficiency syndrome; AIDS
ИВЛ|искусственная вентиляция лёгких|mechanical ventilation
ЛФК|лечебная физическая культура|therapeutic physical exercise
БАД|биологически активная добавка|dietary supplement
ИМТ|индекс массы тела|body mass index; BMI
ЭКО|экстракорпоральное оплодотворение|in vitro fertilization; IVF
МКБ|Международная классификация болезней|International Classification of Diseases; ICD
СМП|скорая медицинская помощь|emergency medical care; ambulance service
ФАП|фельдшерско-акушерский пункт|rural primary care station
в/в|внутривенно|intravenously
в/м|внутримышечно|intramuscularly
п/к|подкожно|subcutaneously
ЗОЖ|здоровый образ жизни|healthy lifestyle
`,
  technology: `
ПК|персональный компьютер|personal computer; PC
ПО|программное обеспечение|software
ОС|операционная система|operating system
ОЗУ|оперативное запоминающее устройство|random-access memory; RAM
ПЗУ|постоянное запоминающее устройство|read-only memory; ROM
ЦП|центральный процессор|central processing unit; CPU
БП|блок питания|power supply unit
ИБП|источник бесперебойного питания|uninterruptible power supply; UPS
БД|база данных|database
СУБД|система управления базами данных|database management system
ООП|объектно-ориентированное программирование|object-oriented programming
ИТ|информационные технологии|information technology; IT
ИКТ|информационно-коммуникационные технологии|information and communication technology
ИИ|искусственный интеллект|artificial intelligence; AI
МО|машинное обучение|machine learning
ЛВС|локальная вычислительная сеть|local area network; LAN
ЭВМ|электронная вычислительная машина|electronic computer
АСУ|автоматизированная система управления|automated control system
САПР|система автоматизированного проектирования|computer-aided design system; CAD
АЦП|аналого-цифровой преобразователь|analog-to-digital converter; ADC
ЦАП|цифро-аналоговый преобразователь|digital-to-analog converter; DAC
ЧПУ|числовое программное управление|computer numerical control; CNC
ЖК|жидкокристаллический|liquid-crystal; display technology
СБ|системный блок|computer system unit
ТБ|терабайт|terabyte; data storage unit
ГБ|гигабайт|gigabyte; data storage unit
МТС|Мобильные ТелеСистемы|Mobile TeleSystems; telecommunications company name
`,
  transport: `
ДТП|дорожно-транспортное происшествие|road traffic accident
ПДД|правила дорожного движения|road traffic rules
ТС|транспортное средство|vehicle
ПТС|паспорт транспортного средства|vehicle passport; title document
СТС|свидетельство о регистрации транспортного средства|vehicle registration certificate
ОСАГО|обязательное страхование гражданской ответственности владельцев транспортных средств|compulsory motor third-party liability insurance
ГИБДД|Государственная инспекция безопасности дорожного движения|State Road Traffic Safety Inspectorate
ДПС|дорожно-патрульная служба|road patrol service
АЗС|автозаправочная станция|fuel station
СТО|станция технического обслуживания|vehicle service station
ТО|техническое обслуживание|maintenance; servicing
КПП|коробка переключения передач|gearbox; transmission
АКПП|автоматическая коробка переключения передач|automatic transmission
МКПП|механическая коробка переключения передач|manual transmission
ДВС|двигатель внутреннего сгорания|internal combustion engine
ГСМ|горюче-смазочные материалы|fuels and lubricants
ПВЗ|пункт выдачи заказов|order pickup point
ТК|транспортная компания|transport company; freight carrier
ж. д.|железная дорога|railway
ж.-д.|железнодорожный|railway-related|ж/д
РЖД|Российские железные дороги|Russian Railways
СВ|спальный вагон|sleeping carriage; premium sleeper category
БПЛА|беспилотный летательный аппарат|unmanned aerial vehicle; UAV
КПП|контрольно-пропускной пункт|checkpoint; controlled entry point
`,
  science: `
КПД|коэффициент полезного действия|efficiency ratio
ГОСТ|государственный стандарт|state standard; GOST designation
ТУ|технические условия|technical specifications
НИОКР|научно-исследовательские и опытно-конструкторские работы|research and development; R&D
ТБ|техника безопасности|safety precautions
СИ|Международная система единиц|International System of Units; SI
ДНК|дезоксирибонуклеиновая кислота|deoxyribonucleic acid; DNA
РНК|рибонуклеиновая кислота|ribonucleic acid; RNA
ГМО|генетически модифицированный организм|genetically modified organism; GMO
АЭС|атомная электростанция|nuclear power plant
ГЭС|гидроэлектростанция|hydroelectric power plant
ТЭЦ|теплоэлектроцентраль|combined heat and power plant
ЛЭП|линия электропередачи|electric power transmission line
СВЧ|сверхвысокая частота|super-high frequency; microwave band
УФ|ультрафиолетовый|ultraviolet; UV
ИК|инфракрасный|infrared; IR
км/ч|километр в час|kilometer per hour
кВт·ч|киловатт-час|kilowatt-hour|кВт⋅ч;кВт-ч
кв. м|квадратный метр|square meter|м²
куб. м|кубический метр|cubic meter|м³
л. с.|лошадиная сила|horsepower
об/мин|оборот в минуту|revolution per minute; rpm
СП|свод правил|code of practice; construction standards context
`,
  grammar: `
сущ.|имя существительное|noun
прил.|имя прилагательное|adjective
гл.|глагол|verb
нареч.|наречие|adverb
мест.|местоимение|pronoun
числ.|имя числительное|numeral
предл.|предлог|preposition
прич.|причастие|participle
деепр.|деепричастие|verbal adverb; gerund
межд.|междометие|interjection
ед. ч.|единственное число|singular
мн. ч.|множественное число|plural
м. р.|мужской род|masculine gender
ж. р.|женский род|feminine gender
ср. р.|средний род|neuter gender
им. п.|именительный падеж|nominative case
род. п.|родительный падеж|genitive case
дат. п.|дательный падеж|dative case
вин. п.|винительный падеж|accusative case
тв. п.|творительный падеж|instrumental case|твор. п.
предл. п.|предложный падеж|prepositional case
сов.|совершенный вид|perfective aspect
несов.|несовершенный вид|imperfective aspect
наст. вр.|настоящее время|present tense
прош. вр.|прошедшее время|past tense
буд. вр.|будущее время|future tense
повел. накл.|повелительное наклонение|imperative mood
неодуш.|неодушевлённое|inanimate
одуш.|одушевлённое|animate
нескл.|несклоняемое|indeclinable
безл.|безличный|impersonal
перен.|переносное значение|figurative meaning
разг.|разговорное|colloquial
прост.|просторечное|nonstandard colloquial usage
устар.|устаревшее|obsolete; archaic
книжн.|книжное|literary; bookish
ласк.|ласкательное|affectionate
сокр.|сокращение|abbreviation
`,
  history: `
СССР|Союз Советских Социалистических Республик|Union of Soviet Socialist Republics; USSR
РСФСР|Российская Советская Федеративная Социалистическая Республика|Russian Soviet Federative Socialist Republic
УССР|Украинская Советская Социалистическая Республика|Ukrainian Soviet Socialist Republic
БССР|Белорусская Советская Социалистическая Республика|Byelorussian Soviet Socialist Republic
КПСС|Коммунистическая партия Советского Союза|Communist Party of the Soviet Union
ВЛКСМ|Всесоюзный ленинский коммунистический союз молодёжи|All-Union Leninist Young Communist League; Komsomol
КГБ|Комитет государственной безопасности|Committee for State Security; KGB
НКВД|Народный комиссариат внутренних дел|People’s Commissariat for Internal Affairs
РККА|Рабоче-крестьянская Красная армия|Workers’ and Peasants’ Red Army
ВОВ|Великая Отечественная война|Great Patriotic War; 1941–1945
ВЦИК|Всероссийский центральный исполнительный комитет|All-Russian Central Executive Committee
СНК|Совет народных комиссаров|Council of People’s Commissars
МТС|машинно-тракторная станция|machine and tractor station in Soviet agriculture
НЭП|новая экономическая политика|New Economic Policy
ПФР|Пенсионный фонд Российской Федерации|Pension Fund of the Russian Federation; former institution
ФСС|Фонд социального страхования|Social Insurance Fund; former institution
ОАО|открытое акционерное общество|open joint-stock company; older legal form
ЗАО|закрытое акционерное общество|closed joint-stock company; older legal form
ЧП|частное предприятие|private enterprise; older business terminology
`,
  chat: `
спс|спасибо|thanks; informal chat spelling
пж|пожалуйста|please; informal chat spelling|пжл;пжлст
прив|привет|hi; informal chat spelling
нзч|не за что|you’re welcome; informal chat spelling
хз|хрен знает|who knows; coarse, also has a stronger obscene expansion
мб|может быть|maybe; informal chat spelling
кмк|как мне кажется|it seems to me
имхо|по моему скромному мнению|in my humble opinion; borrowed from English IMHO
чтд|что и требовалось доказать|which is what had to be proved; QED
чзх|что за хрень|what the heck; coarse
др|день рождения|birthday; informal chat spelling
нг|Новый год|New Year; informal chat spelling
лс|личные сообщения|private messages; DMs
чс|чёрный список|blocklist; blacklist
тс|топикстартер|original poster; thread starter
афк|отошёл от клавиатуры|away from keyboard; borrowed from English AFK
рофл|катаюсь по полу от смеха|rolling on the floor laughing; from English ROFL, also used for a joke
лол|громко смеюсь|laughing out loud; borrowed from English LOL
зы|постскриптум|P.S. typed with the Russian keyboard layout
`,
};

export const abbreviations: Abbreviation[] = Object.entries(catalog).flatMap(([category, text]) =>
  text.trim().split("\n").map((line) => {
    const [short, expansion, english, aliases = ""] = line.split("|");
    return {
      id: `${category}:${short}:${expansion}`,
      short,
      expansion,
      english,
      category: category as AbbreviationCategory,
      aliases: aliases ? aliases.split(";") : [],
    };
  })
).sort((a, b) => a.short.localeCompare(b.short, "ru") || a.expansion.localeCompare(b.expansion, "ru"));
