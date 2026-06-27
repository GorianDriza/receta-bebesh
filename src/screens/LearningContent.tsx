import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AppLanguage } from '../i18n/translations';
import { useLanguage } from '../providers/LanguageProvider';

type TopicKey = 'all' | 'firstfoods' | 'nutrition' | 'allergies' | 'tips';

type Card = {
  id: string;
  topic: Exclude<TopicKey, 'all'>;
  title: Record<AppLanguage, string>;
  excerpt: Record<AppLanguage, string>;
  body: Record<AppLanguage, string>;
  badge: string;
  bg: string;
  ring: string;
};

const TOPICS: Array<{ key: TopicKey; sq: string; en: string }> = [
  { key: 'all',        sq: 'Të gjitha', en: 'All' },
  { key: 'firstfoods', sq: 'Ushqimet e para', en: 'First Foods' },
  { key: 'nutrition',  sq: 'Ushqyerja',       en: 'Nutrition' },
  { key: 'allergies',  sq: 'Alergji',          en: 'Allergies' },
  { key: 'tips',       sq: 'Këshilla',         en: 'Tips' },
];

const CARDS: Card[] = [
  {
    id: 'spoon',
    topic: 'firstfoods',
    title: { 'sq-AL': 'Si të filloni ushqyerjen me lugë', en: 'How to start spoon feeding' },
    excerpt: { 'sq-AL': 'Hapat e parë drejt ushqyerjes me luge — nga pozicioni deri tek qëndrueshmëria.', en: 'First steps toward spoon feeding — from position to consistency.' },
    body: {
      'sq-AL': 'Filloni me vetëm 1–2 lugë çaji pure çdo ditë dhe rriteni gradualisht. Vendoseni beben në karrige të lartë me shpinë drejt dhe këmbët të mbështetura. Zgjidhni kohë kur bebja është e qetë dhe jo shumë e lodhur — zakonisht pas zgjimit nga gjumi i mesditës. Qëndrueshmëria e parë duhet të jetë shumë e hollë dhe të rrjedhë lehtë nga luga.',
      en: 'Start with just 1–2 teaspoons of purée each day and build up gradually. Seat your baby in a high chair with a straight back and supported feet. Choose a time when baby is calm and not overtired — usually after a midday nap. The first texture should be very smooth and drip easily from the spoon.',
    },
    badge: 'UL', bg: '#CABEFF', ring: '#A68DFF',
  },
  {
    id: 'puree4',
    topic: 'firstfoods',
    title: { 'sq-AL': 'Ushqimet e para: 4–6 muaj', en: 'First foods: 4–6 months' },
    excerpt: { 'sq-AL': 'Perime dhe fruta të buta janë ideale — patate e ëmbël, karotë, bananet.', en: 'Soft vegetables and fruits are ideal — sweet potato, carrot, banana.' },
    body: {
      'sq-AL': 'Gjatë kësaj periudhe bebja ka nevojë vetëm për sasi shumë të vogla — 1 deri 2 lugë gjelle në ditë. Fillohet zakonisht me perime me shije të butë si patate e ëmbël, kungull dhe karotë të ziera mirë. Frutat si banana dhe avokado janë të shkëlqyeshme pa nevojë gatimi. Shmangni kripën, sheqerin dhe mjaltin — sistemi i veshkave dhe imunar i bebes nuk është gati.',
      en: 'At this stage baby needs only tiny amounts — 1 to 2 tablespoons per day. Start with mild-flavoured vegetables like sweet potato, pumpkin, and well-cooked carrot. Fruits like banana and avocado are excellent raw with no cooking needed. Avoid salt, sugar, and honey — baby\'s kidneys and immune system are not yet ready.',
    },
    badge: '4m', bg: '#FFF39D', ring: '#F4E15F',
  },
  {
    id: 'blw',
    topic: 'firstfoods',
    title: { 'sq-AL': 'Ushqyerja e drejtuar nga bebja (BLW)', en: 'Baby-led weaning (BLW)' },
    excerpt: { 'sq-AL': 'Jepuni bebës copa të buta në vend të pure — nxit pavarësinë dhe shijet.', en: 'Offer soft finger pieces instead of purée — builds independence and taste.' },
    body: {
      'sq-AL': 'BLW do të thotë që bebja ushqehet vetë nga fillimi — keni besim tek reflekset e saj natyrore. Ushqimet duhet të jenë aq të buta sa mund të shtypen lehtë midis gishtave tuaj. Prova pa u shqetësuar shumë nga ngjirja e lehtë — ajo është mbrojtëse dhe normale. Studime tregojnë se BLW mund të ndihmojë në zhvillimin e shijeve të ndryshme dhe të reduktojë rrezikun e mbipeshës.',
      en: 'BLW means baby feeds themselves from the start — trust their natural reflexes. Food should be soft enough to squash easily between your fingers. Don\'t worry about mild gagging — it is protective and normal. Studies suggest BLW may help develop varied tastes and reduce the risk of obesity later.',
    },
    badge: 'BLW', bg: '#CFFFD6', ring: '#98E8AA',
  },
  {
    id: 'finger6',
    topic: 'firstfoods',
    title: { 'sq-AL': 'Ushqimet me gishta nga 6 muajt', en: 'Finger foods from 6 months' },
    excerpt: { 'sq-AL': 'Karotë e zier, bananet e pjekur, avokado — të buta dhe pa rrezik mbytjeje.', en: 'Steamed carrot, ripe banana, avocado — soft, low choking risk foods.' },
    body: {
      'sq-AL': 'Ushqimet me gishta duhet të priten në forma gjatësore (si shufra) që bebja t\'i mbajë lehtë në grusht. Karotat dhe brokoli duhet të zihen deri sa të jenë shumë të buta — të paktën 15–20 minuta. Bananet e pjekura janë ideale si janë. Shmangni ushqimet e forta si arra të plota, rrush dhe karrotë të papjekur deri në moshën 4 vjeç.',
      en: 'Finger foods should be cut into long batons (chip shape) that baby can grip in their fist. Carrots and broccoli must be steamed until very soft — at least 15–20 minutes. Ripe bananas are perfect as-is. Avoid hard foods like whole nuts, grapes, and raw carrot until age 4.',
    },
    badge: '👆', bg: '#FFD9AE', ring: '#FFC681',
  },
  {
    id: 'water',
    topic: 'firstfoods',
    title: { 'sq-AL': 'Kur të filloni ujin', en: 'When to introduce water' },
    excerpt: { 'sq-AL': 'Uji mund të ofrohet nga 6 muajt kur beba ha ushqime të ngurta.', en: 'Small sips of water can start at 6 months once solid foods begin.' },
    body: {
      'sq-AL': 'Para 6 muajsh beba nuk ka nevojë për ujë — qumështi i gjirit ose formula plotëson të gjitha nevojat e lëngjeve. Pas fillimit të ushqimeve të ngurta, mund të ofroni gota të hapura (gota sippy) me pak ujë çdo ditë. Uji nuk duhet të zëvendësojë qumështin — është vetëm shtesë gjatë vakteve. Shmangni lëngjet e frutave deri mbas vitit të parë.',
      en: 'Before 6 months baby needs no water — breast milk or formula meets all fluid needs. Once solids begin, offer an open cup (sippy cup) with small sips of water at meals. Water should not replace milk feeds — it is simply an addition at mealtimes. Avoid fruit juice until after the first year.',
    },
    badge: '💧', bg: '#D4F0FF', ring: '#94D8FF',
  },
  {
    id: 'grains',
    topic: 'firstfoods',
    title: { 'sq-AL': 'Drithërat dhe cerealet', en: 'Grains and cereals' },
    excerpt: { 'sq-AL': "Orizin, tërbithë dhe misrin mund t'i shtoni nga 6 muajt si pure ose qull.", en: 'Rice, oats, and corn can be introduced from 6 months as porridge or mash.' },
    body: {
      'sq-AL': 'Drithërat janë burim i mirë i energjisë dhe disa mineraleve. Qullja me tërbithë (oat porridge) është shumë e lehtë për t\'u bërë dhe mund të pasurohet me fruta të buta. Orizi i bardhë i gatuar mirë bëhet pure e shkëlqyer. Gluteni (gruri, elbi, thekra) mund të futet pa problem nga 6 muajt — studime moderne nuk e mbështesin vonimin e glutenit.',
      en: 'Grains are a great source of energy and some minerals. Oat porridge is easy to prepare and can be enriched with soft fruit. Well-cooked white rice makes an excellent purée. Gluten (wheat, barley, rye) can be introduced from 6 months without concern — modern research does not support delaying gluten.',
    },
    badge: '🌾', bg: '#CABEFF', ring: '#A68DFF',
  },
  {
    id: 'meat_intro',
    topic: 'firstfoods',
    title: { 'sq-AL': 'Futja e mishit dhe peshkut', en: 'Introducing meat and fish' },
    excerpt: { 'sq-AL': 'Mishi i pulës, viçit dhe peshku i grirë mund të shtohen nga 6 muajt — burim i mirë i hekurit dhe zinkut.', en: 'Minced chicken, beef, and flaked fish from 6 months — great for iron and zinc.' },
    body: {
      'sq-AL': 'Mishi i kuq si viçi dhe qengji është veçanërisht i pasur me hekur që absorbohet mirë (hekur hem). Peshku si salmoni dhe merluca ofrojnë acide yndyrore omega-3 thelbësore për zhvillimin e trurit. Gatuajeni mishin mirë deri sa të mos ketë ngjyrë rozë dhe grini ose prisni imët. Filloni me sasi të vogla — 1–2 lugë gjelle — dhe rriteni gradualisht çdo javë.',
      en: 'Red meat like beef and lamb is especially rich in well-absorbed haem iron. Fish like salmon and cod provide essential omega-3 fatty acids for brain development. Cook meat thoroughly until no pink remains, then mince or flake finely. Start with small amounts — 1–2 tablespoons — and increase gradually each week.',
    },
    badge: '🍗', bg: '#FFD9AE', ring: '#FFC681',
  },
  {
    id: 'dairy_intro',
    topic: 'firstfoods',
    title: { 'sq-AL': 'Kur fillon bulmetin i plotë', en: 'When to introduce full-fat dairy' },
    excerpt: { 'sq-AL': 'Kosi i plotë, ricotta dhe djathi i butë janë të sigurtë nga 6 muajt si shtesë ushqimore.', en: 'Full-fat yoghurt, ricotta, and soft cheese are safe from 6 months as a food.' },
    body: {
      'sq-AL': 'Produktet e bulmetit mund të shtohen si ushqim nga 6 muajt, megjithëse qumështi i lopës si pije kryesore pritet deri mbas vitit të parë. Zgjidhni produkte me yndyrë të plotë — bebja ka nevojë për yndyrë për rritje dhe zhvillim të trurit. Kosi natyral pa sheqer është zgjedhja më e mirë. Djathërat e fortë duhet të grinden imët dhe të ngjyhen para se t\'i jepni bebes.',
      en: 'Dairy products can be included as food from 6 months, although cow\'s milk as the main drink waits until after the first year. Choose full-fat versions — babies need fat for growth and brain development. Plain unsweetened yoghurt is the best choice. Hard cheeses should be finely grated and softened before offering to baby.',
    },
    badge: '🥛', bg: '#D4F0FF', ring: '#94D8FF',
  },
  {
    id: 'iron',
    topic: 'nutrition',
    title: { 'sq-AL': 'Rëndësia e hekurit tek bebe', en: 'Why iron matters for babies' },
    excerpt: { 'sq-AL': 'Bebe humbasin hekurin nga nëna pas 6 muajve. Mëso si ta plotësosh.', en: 'Babies deplete maternal iron after 6 months. Learn how to replenish.' },
    body: {
      'sq-AL': 'Stoqet e hekurit me të cilat lind bebja fillojnë të ulen rreth moshës 4–6 muaj. Mungesa e hekurit mund të ndikojë negativisht në zhvillimin kognitiv dhe fizik. Burimet më të mira janë mishi i kuq, organet (mëlçia), bishtajat dhe drithërat e pasura me hekur. Shoqërojini këto ushqime me vitamina C (domate, portokall) për absorbim më të mirë.',
      en: 'Iron stores that babies are born with begin to fall around 4–6 months of age. Iron deficiency can negatively affect cognitive and physical development. Best sources are red meat, organ meats (liver), legumes, and iron-fortified cereals. Pair these foods with vitamin C sources (tomato, orange) for better absorption.',
    },
    badge: 'Fe', bg: '#CFFFD6', ring: '#98E8AA',
  },
  {
    id: 'variety',
    topic: 'nutrition',
    title: { 'sq-AL': 'Ekspozimi ndaj shijeve të ndryshme', en: 'Exposing babies to diverse flavours' },
    excerpt: { 'sq-AL': '8–10 ekspozime të ndryshme mund të ndihmojnë beben të pranojë ushqime të reja.', en: '8–10 exposures can help babies accept new foods — keep offering.' },
    body: {
      'sq-AL': 'Bebja mund të refuzojë ushqime të reja deri në 15 herë — kjo është plotësisht normale. Çdo ekspozim, edhe nëse bebja nuk ha, e ndihmon trurin të mësohet me shijet dhe teksturat e reja. Mos e detyroni — vetëm ofroni me qetësi dhe buzëqeshje. Fëmijët që shijojnë ushqime të ndryshme qysh herët zakonisht janë hagrës më pak selektivë më vonë.',
      en: 'Baby may refuse new foods up to 15 times — this is completely normal. Each exposure, even if baby doesn\'t eat, helps the brain get used to new flavours and textures. Never force — just offer calmly with a smile. Children who experience diverse foods early are typically less fussy eaters later on.',
    },
    badge: '🌈', bg: '#D4F0FF', ring: '#94D8FF',
  },
  {
    id: 'omega3',
    topic: 'nutrition',
    title: { 'sq-AL': 'Acidet yndyrore Omega-3 për trurin', en: 'Omega-3 fatty acids for brain growth' },
    excerpt: { 'sq-AL': 'Peshku si salmoni, sardelet dhe luleshtrydhet janë burime të mira DHA.', en: 'Salmon, sardines, and walnuts are great DHA sources for developing brains.' },
    body: {
      'sq-AL': 'DHA (acid docosahexaenoik) është omega-3 thelbësor për zhvillimin e trurit dhe syve të bebes. Salmoni, sardelet dhe toni me pak merkur ofrojnë DHA me bioavailabilitet të lartë. Për familjet vegane, vajra algae janë alternativa e drejtpërdrejtë e DHA. Arrat dhe farat e lirit ofrojnë ALA e cila konvertohet pjesërisht në DHA — por konvertimi është i kufizuar.',
      en: 'DHA (docosahexaenoic acid) is an essential omega-3 for baby\'s brain and eye development. Salmon, sardines, and low-mercury tuna provide highly bioavailable DHA. For vegan families, algae oil is the direct DHA alternative. Walnuts and flaxseeds provide ALA which partly converts to DHA — but conversion is limited.',
    },
    badge: 'Ω3', bg: '#FFF39D', ring: '#F4E15F',
  },
  {
    id: 'calcium',
    topic: 'nutrition',
    title: { 'sq-AL': 'Kalciumi dhe kockat e forta', en: 'Calcium for strong bones' },
    excerpt: { 'sq-AL': 'Gjalpi, kosi dhe djathi janë burime kalciumi pas vitit të parë.', en: 'Yoghurt, cheese, and dairy provide calcium after the first year.' },
    body: {
      'sq-AL': 'Kalciumi është thelbësor për ndërtimin e kockave dhe dhëmbëve të fortë. Gjatë vitit të parë, qumështi i gjirit ose formula plotëson nevojat për kalcium. Pas vitit të parë, kosi i plotë, djathi dhe qumështi i lopës bëhen burimet kryesore. Alternativa jo-bulmeti përfshijnë tofu të fortë, brokoli dhe fara susami.',
      en: 'Calcium is essential for building strong bones and teeth. During the first year, breast milk or formula meets calcium needs. After the first year, full-fat yoghurt, cheese, and cow\'s milk become the main sources. Non-dairy alternatives include firm tofu, broccoli, and sesame seeds.',
    },
    badge: 'Ca', bg: '#F0CBFF', ring: '#D494FF',
  },
  {
    id: 'vitamin_d',
    topic: 'nutrition',
    title: { 'sq-AL': 'Vitamina D — pse është e domosdoshme', en: 'Vitamin D — why it is essential' },
    excerpt: { 'sq-AL': 'Shumë fëmijë kanë nevojë për suplemente Vit D, sidomos gjatë dimrit.', en: 'Many babies need a Vit D supplement, especially in winter months.' },
    body: {
      'sq-AL': 'Vitamina D ndihmon trupin të absorbojë kalciumin dhe është thelbësore për kockat e forta. Qumështi i gjirit ka nivele të ulëta të Vit D — pediatrët rekomandojnë zakonisht 400 IU në ditë për foshnja. Dielli është burimi kryesor natyror por vetvlera ndryshon sipas gjerësisë gjeografike dhe stinës. Burime ushqimore të kufizuara përfshijnë peshkun e yndyrshëm dhe vezët.',
      en: 'Vitamin D helps the body absorb calcium and is essential for strong bones. Breast milk is low in Vit D — paediatricians typically recommend 400 IU daily for infants. Sunlight is the main natural source but output varies by latitude and season. Limited food sources include oily fish and eggs.',
    },
    badge: 'D☀', bg: '#FFD9AE', ring: '#FFC681',
  },
  {
    id: 'zinc',
    topic: 'nutrition',
    title: { 'sq-AL': 'Zinku për sistemin imunitar', en: 'Zinc for the immune system' },
    excerpt: { 'sq-AL': 'Mishi i kuq, bishtajat dhe farat janë burime të mira zinku për fëmijë.', en: 'Red meat, legumes, and seeds are good zinc sources to build immunity.' },
    body: {
      'sq-AL': 'Zinku luan rol kyç në funksionin imunitar, rigjenerimin e qelizave dhe zhvillimin. Bebja ka nevoja të larta për zink ndërsa rritet shpejt gjatë vitit të parë. Mishi i viçit, qengji, bishtajat (thjerrëzat, fasulet) dhe farat e kungullit janë burime të shkëlqyeshme. Vitamina C nuk ndihmon absorbimin e zinkut — por shmangnia e ushqimeve me acid fitik (drithëra të papjekura) rrit bioavailabilitetin.',
      en: 'Zinc plays a key role in immune function, cell repair, and development. Babies have high zinc needs as they grow rapidly in the first year. Beef, lamb, legumes (lentils, beans), and pumpkin seeds are excellent sources. Vitamin C doesn\'t enhance zinc absorption — but avoiding phytic acid foods (raw grains) improves bioavailability.',
    },
    badge: 'Zn', bg: '#CFFFD6', ring: '#98E8AA',
  },
  {
    id: 'vitc_iron',
    topic: 'nutrition',
    title: { 'sq-AL': 'Vitamina C rrit absorbimin e hekurit', en: 'Vitamin C boosts iron absorption' },
    excerpt: { 'sq-AL': 'Jepini ushqime të pasura me Vit C (domate, portokall) bashkë me ushqime me hekur.', en: 'Pair iron-rich foods with Vit C sources (tomato, orange) to absorb more iron.' },
    body: {
      'sq-AL': 'Hekuri jo-hem (nga bimët) absorbohet shumë më pak se hekuri hem (nga mishi) — vetëm 2–20% krahasuar me 15–35%. Vitamina C konverton hekurin jo-hem në formë më të lehtë për t\'u absorbuar. Shtoni pak domate, speca ose lëng limoni pranë supës me thjerrëza ose cerealet e pasura me hekur. Çaji dhe kafeja frenojnë absorbimin e hekurit — shmangni afër vakteve.',
      en: 'Non-haem iron (from plants) absorbs much less than haem iron (from meat) — just 2–20% vs 15–35%. Vitamin C converts non-haem iron into a more absorbable form. Add a little tomato, bell pepper, or lemon juice alongside lentil soup or iron-fortified cereal. Tea and coffee inhibit iron absorption — avoid near mealtimes.',
    },
    badge: 'C+Fe', bg: '#FFF39D', ring: '#F4E15F',
  },
  {
    id: 'allergens',
    topic: 'allergies',
    title: { 'sq-AL': 'Ushqimet alergjike — çfarë duhet të dini', en: 'Allergenic foods — what you need to know' },
    excerpt: { 'sq-AL': 'Njëra nga zakonet e reja: futni alergjenët herët për të zvogëluar rrezikun.', en: 'New guidance: introduce allergens early to reduce allergy risk.' },
    body: {
      'sq-AL': 'Udhëzimet e reja nga organizatat kryesore pediatrike rekomandojnë futjen e herët të ushqimeve alergjike (nga 4–6 muaj) për të reduktuar rrezikun e zhvillimit të alergjive. Studimi LEAP (2015) tregoi se futja e kikiriqut herët tek fëmijët me rrezik të lartë reduktoi alergji me 81%. Futni një alergjen të ri çdo 3–5 ditë dhe vëzhgoni për reagime. Nëse ka histori familjare alergje, konsultohuni me mjekun para futjes.',
      en: 'New guidelines from major paediatric organisations recommend early introduction of allergenic foods (from 4–6 months) to reduce the chance of developing allergies. The LEAP study (2015) showed that early peanut introduction in high-risk children reduced allergy by 81%. Introduce one new allergen every 3–5 days and watch for reactions. If there is a family history of allergy, consult your doctor before introducing.',
    },
    badge: 'A!', bg: '#FFD9AE', ring: '#FFC681',
  },
  {
    id: 'big8',
    topic: 'allergies',
    title: { 'sq-AL': '8 alergjenët kryesorë', en: 'The 8 major allergens' },
    excerpt: { 'sq-AL': 'Qumështi, vezët, kikiriku, arrat, soja, gruri, peshku, gaforrja.', en: 'Milk, eggs, peanuts, tree nuts, soy, wheat, fish, shellfish.' },
    body: {
      'sq-AL': 'Këta 8 ushqime shkaktojnë mbi 90% të të gjitha alergjive ushqimore. Gruri përmban gluten dhe mund të shkaktojë celiaki (jo vetëm alergjia). Alergjia ndaj qumështit të lopës është alergjia më e zakonshme tek foshnjat — shpesh kalohet para moshës 5 vjeç. Alergjia ndaj kikirikulit dhe arrave zakonisht është gjatëjetore. Futini gradualisht, veçmas çdo ushqim.',
      en: 'These 8 foods cause over 90% of all food allergies. Wheat contains gluten and can cause coeliac disease (not just allergy). Cow\'s milk allergy is the most common allergy in infants — often outgrown before age 5. Peanut and tree nut allergies are usually lifelong. Introduce them gradually, one at a time.',
    },
    badge: '×8', bg: '#CFFFD6', ring: '#98E8AA',
  },
  {
    id: 'reaction',
    topic: 'allergies',
    title: { 'sq-AL': 'Shenjat e reagimit alergjik', en: 'Signs of an allergic reaction' },
    excerpt: { 'sq-AL': 'Kruajtja, ënjtja e buzëve, kollitja ose të vjellat — njohni shenjat herët.', en: 'Hives, lip swelling, coughing, or vomiting — recognize the signs early.' },
    body: {
      'sq-AL': 'Reagimet e lehta përfshijnë skuqje lëkure, kruajtje, rrjedhje hunde ose sy të kuq. Reagimet e rënda (anafilaksia) përfshijnë ënjtje të fytit, vështirësi në frymëmarrje dhe rënie të presionit të gjakut. Anafilaksia kërkon epipen dhe thirrje të menjëhershme të ambulancës. Nëse ndodh reagim i lehtë, ndaloni ushqimin dhe konsultohuni me mjekun para rifutjes. Zini çdo reagim dhe ushqimin shkaktar.',
      en: 'Mild reactions include skin rash, itching, runny nose, or red eyes. Severe reactions (anaphylaxis) include throat swelling, difficulty breathing, and drop in blood pressure. Anaphylaxis requires an epipen and immediate ambulance call. If a mild reaction occurs, stop the food and consult your doctor before re-introducing. Record every reaction and the trigger food.',
    },
    badge: '⚠', bg: '#CABEFF', ring: '#A68DFF',
  },
  {
    id: 'introduce_timing',
    topic: 'allergies',
    title: { 'sq-AL': 'Koha e duhur për futjen e alergjenëve', en: 'Right timing for allergen introduction' },
    excerpt: { 'sq-AL': 'Fëmijët me ekzemë kanë rrezik më të lartë — konsultohuni me mjekun.', en: 'Babies with eczema are higher risk — consult your doctor before introducing.' },
    body: {
      'sq-AL': 'Rreziku i lartë përcaktohet nga ekzema e rëndë ose alergjia ekzistuese ndaj vezëve. Tek këta fëmijë, futja e kikiriqut dhe ushqimeve të tjera me rrezik të lartë duhet bërë vetëm nën mbikëqyrje mjekësore. Tek fëmijët me rrezik të ulët ose mesatar, futja e herët në shtëpi është e sigurtë dhe e rekomanduar. Momenti i duhur është nga 4 deri 6 muaj kur sistemi imunitar është ende "i hapur".',
      en: 'High risk is defined by severe eczema or an existing egg allergy. For these babies, peanut and other high-risk food introduction should only happen under medical supervision. For low- or average-risk babies, early home introduction is safe and recommended. The optimal window is 4–6 months when the immune system is still "open" to tolerance.',
    },
    badge: '⏱', bg: '#FFF39D', ring: '#F4E15F',
  },
  {
    id: 'label_reading',
    topic: 'allergies',
    title: { 'sq-AL': 'Leximi i etiketave të ushqimit', en: 'Reading food labels for allergens' },
    excerpt: { 'sq-AL': 'Alergjenët duhet të shënohen me shkronja të theksuara në etiketë sipas ligjit.', en: 'Allergens must be highlighted in bold on packaging by law — learn to spot them.' },
    body: {
      'sq-AL': 'Ligjet e BE-së dhe shumë vendeve kërkojnë theksimin e 14 alergjenëve kryesorë me shkronja të zeza ose ngjyrë të ndryshme. Kujdes ndaj frazave si "mund të përmbajë gjurmë të..." — kjo tregon rrezik ndotjeje kryqe. Emrat alternativë janë gjithashtu problem: "kazeinë" = qumësht, "albumina" = vezë, "orzo" = grurë. Gjithmonë rilexoni etiketat edhe për produkte të njohura — recetat ndryshojnë.',
      en: 'EU laws and many countries require the 14 major allergens to be highlighted in bold or a different colour. Watch out for phrases like "may contain traces of..." — this indicates cross-contamination risk. Alternative names are also a trap: "casein" = milk, "albumin" = egg, "orzo" = wheat. Always re-read labels even for familiar products — recipes change.',
    },
    badge: '📋', bg: '#CABEFF', ring: '#A68DFF',
  },
  {
    id: 'texture',
    topic: 'tips',
    title: { 'sq-AL': 'Kalimi nga pure te ushqimi i grirë', en: 'Moving from purée to mashed food' },
    excerpt: { 'sq-AL': 'Rreth 8 muajve, fëmijët janë gati për tekstura pak më të trasha.', en: 'Around 8 months babies are ready for slightly thicker textures.' },
    body: {
      'sq-AL': 'Progresi i teksturave duhet të jetë gradual: e hollë → e trashë → e grirë → e grirë me copa të vogla → copa të buta. Nuk ka nevojë t\'i nxitoni — çdo bebë ka ritmin e vet. Shenjat e gatishmërisë për tekstura më të trasha: lëvizjet e nofullës (mastikim) dhe interesi për ushqimin tuaj. Nëse bebja nuk pranon tekstura më të trasha, mos u shqetësoni — kthehuni pas disa ditësh.',
      en: 'Texture progression should be gradual: smooth → thick → mashed → mashed with soft lumps → soft pieces. No need to rush — every baby has their own pace. Signs of readiness for thicker textures: jaw movements (chewing motion) and interest in your food. If baby refuses thicker textures, don\'t worry — try again in a few days.',
    },
    badge: 'TX', bg: '#F0CBFF', ring: '#D494FF',
  },
  {
    id: 'gagging',
    topic: 'tips',
    title: { 'sq-AL': 'Ngjirja vs mbytja — ndryshimi', en: 'Gagging vs choking — the difference' },
    excerpt: { 'sq-AL': 'Ngjirja është normale dhe mbrojtëse; mbytja është e heshtur dhe e rrezikshme.', en: 'Gagging is normal and protective; choking is silent and needs action.' },
    body: {
      'sq-AL': 'Ngjirja (gagging): bebja bën zë, faqet i bëhen të kuqe, mund të vjellë — është refleks mbrojtës dhe kalon vetë. Mbytja (choking): bebja është e heshtur ose bën zë të ulët, ngjyra e lëkurës ndryshon, nuk mund të frymëmarrë — kërkon veprim të menjëhershëm. Mësoni manovrën e mbytjes për foshnja (goditjet në shpinë + kompresionet në gjoks) para fillimit të ushqimeve të ngurta. Kursi i ndihmës së parë për fëmijë rekomandohet fuqimisht.',
      en: 'Gagging: baby makes noise, face goes red, may vomit — it\'s a protective reflex that resolves on its own. Choking: baby is silent or makes a weak sound, skin colour changes, cannot breathe — requires immediate action. Learn the infant choking manoeuvre (back blows + chest compressions) before starting solid foods. A first aid course for children is strongly recommended.',
    },
    badge: '!', bg: '#D4F0FF', ring: '#94D8FF',
  },
  {
    id: 'refuses',
    topic: 'tips',
    title: { 'sq-AL': 'Kur bebja refuzon ushqimin', en: 'When baby refuses food' },
    excerpt: { 'sq-AL': 'Refuzimi është normal. Riofrojeni ushqimin pas 2–3 ditësh pa presion.', en: 'Refusal is normal. Re-offer the food after 2–3 days without pressure.' },
    body: {
      'sq-AL': 'Refuzimi i ushqimit nuk do të thotë se bebja nuk do ta dojë kurrë atë ushqim. Psikologjia e të ngrënit tek fëmijët tregon se frika nga e reja (neofobia) është adaptive — trupi i bebës "teston" ushqime të panjohura. Ofroni ushqimin pa presion, të paktën 10–15 herë gjatë javëve. Modeli familjar ndihmon — hani edhe ju të njëjtin ushqim bashkë me beben.',
      en: 'Food refusal does not mean baby will never like that food. Child eating psychology shows that fear of new foods (neophobia) is adaptive — baby\'s body "tests" unfamiliar items. Offer the food without pressure at least 10–15 times over several weeks. Family modelling helps — eat the same food alongside baby.',
    },
    badge: '🙅', bg: '#FFD9AE', ring: '#FFC681',
  },
  {
    id: 'batch',
    topic: 'tips',
    title: { 'sq-AL': 'Gatimi në sasi të mëdha dhe ngrirja', en: 'Batch cooking and freezing' },
    excerpt: { 'sq-AL': 'Ngrini pure në kubikë akulli — kurseni kohë gjatë javës dhe reduktoni mbeturinat.', en: 'Freeze purées in ice-cube trays — saves weekday time and reduces waste.' },
    body: {
      'sq-AL': 'Gatimi në sasi të mëdha një herë në javë (ose dyjavëshin) kursen shumë kohë. Pure e ngrirë mbahet deri 3 muaj — etiketoni me datë dhe emër ushqimi. Shkrini gjithmonë në frigorifer ose me ujë të ngrohtë — kurrë në temperaturë dhome. Një kub akulli është rreth 1 lugë gjelle — shumë praktike për të dozuar sasinë e duhur sipas moshës.',
      en: 'Batch cooking once a week (or fortnightly) saves significant time. Frozen purée keeps for up to 3 months — label with date and food name. Always defrost in the fridge or with warm water — never at room temperature. One ice-cube is roughly 1 tablespoon — very handy for portioning the right amount for baby\'s age.',
    },
    badge: '🧊', bg: '#CFFFD6', ring: '#98E8AA',
  },
  {
    id: 'avoid_foods',
    topic: 'tips',
    title: { 'sq-AL': 'Ushqimet që duhen shmangur nën 12 muaj', en: 'Foods to avoid under 12 months' },
    excerpt: { 'sq-AL': 'Mjalti, kripë e shtuar, sheqer, qumësht lope si pije dhe peshk me merkur të lartë.', en: 'Honey, added salt, added sugar, cows milk as a drink, and high-mercury fish.' },
    body: {
      'sq-AL': 'Mjalti mund të përmbajë sporet e Clostridium botulinum që shkaktojnë botulizëm tek foshnjat. Shumë kripë dëmton veshkat e papjekura. Sheqeri i shtuar krijon zakon jo të shëndetshëm dhe prish dhëmbët e parë. Peshqit me merkur të lartë (ton, peshkaqen, xifias) dëmtojnë sistemin nervor në zhvillim. Shmangni gjithashtu kafe/çaj, lëngje frutash, ushqime të fermentuara me kripë dhe vezë të papjekura.',
      en: 'Honey may contain Clostridium botulinum spores causing infant botulism. Too much salt damages immature kidneys. Added sugar creates unhealthy habits and damages first teeth. High-mercury fish (tuna, shark, swordfish) harm the developing nervous system. Also avoid coffee/tea, fruit juice, salt-cured fermented foods, and undercooked eggs.',
    },
    badge: '🚫', bg: '#FFD9AE', ring: '#FFC681',
  },
  {
    id: 'portions',
    topic: 'tips',
    title: { 'sq-AL': 'Sa duhet të hajë bebja?', en: 'How much should baby eat?' },
    excerpt: { 'sq-AL': '4-6m: 1-2 lugë çaji. 6-9m: 2-4 lugë gjelle. 9-12m: sa dëshiron — ushqimi kryesor ende është qumështi.', en: '4-6m: 1-2 tsp. 6-9m: 2-4 tbsp. 9-12m: baby-led amounts — milk is still primary.' },
    body: {
      'sq-AL': 'Sasia e ushqimit ndryshon shumë midis bebeve — mos e krahasoni me të tjerët. Gjatë vitit të parë qumështi i gjirit ose formula mbetet ushqimi kryesor që siguron lëndë ushqyese. Ushqimet e ngurta janë "praktikë" dhe plotësuese. Bebja ka instinkt të lindur për ngopje — mos e detyroni të hajë më shumë se sa tregon. Nëse rritja është normale (sipas grafikut), sasia e ngrënë është e duhur.',
      en: 'Food amounts vary greatly between babies — don\'t compare with others. Throughout the first year breast milk or formula remains the main source of nutrition. Solid foods are "practice" and supplementary. Babies have an inborn hunger and fullness instinct — never force more than they show. If growth is on track (following their growth curve), the amount eaten is right.',
    },
    badge: '🥄', bg: '#F0CBFF', ring: '#D494FF',
  },
  {
    id: 'highchair',
    topic: 'tips',
    title: { 'sq-AL': 'Pozicioni i sigurt në karrige të lartë', en: 'Safe high chair posture' },
    excerpt: { 'sq-AL': 'Këmbët të mbështetur, shpina drejt, tavolina në nivelin e bërrylëve — siguron gëlltitje të sigurtë.', en: 'Feet supported, back upright, tray at elbow height — ensures safe swallowing.' },
    body: {
      'sq-AL': 'Pozicioni i saktë rrit sigurinë dhe efikasitetin e ngrënies. Këmbët duhet të mbështeten në platformë ose karrige — jo të varen. Shpina duhet të jetë drejt dhe mbështetur — mos lejoni beben të anojë. Tavolina duhet të jetë në nivelin e bërrylëve kur bebja ka duar të shtrira. Kurrë mos lini beben pa mbikëqyrje në karrige të lartë.',
      en: 'Correct positioning increases both safety and eating efficiency. Feet must be supported on a footplate or footrest — not dangling. Back should be straight and supported — don\'t let baby lean to one side. The tray should sit at elbow height when baby\'s arms are resting forward. Never leave baby unsupervised in a high chair.',
    },
    badge: '🪑', bg: '#D4F0FF', ring: '#94D8FF',
  },
  {
    id: 'responsive',
    topic: 'tips',
    title: { 'sq-AL': 'Ushqyerja responsivë', en: 'Responsive feeding' },
    excerpt: { 'sq-AL': 'Mos e detyroni beben të hajë. Ndaleni kur jep shenja ngopjeje — ndihmon marrëdhënien e shëndetshme me ushqimin.', en: 'Never force-feed. Stop when baby signals fullness — builds a healthy food relationship.' },
    body: {
      'sq-AL': 'Ushqyerja responsivë do të thotë të ndiqni udhëheqjen e bebes — jo oraret dhe sasite e vendosura nga prindërit. Shenjat e urisë: sjellje e trazuar, goja hapet, kërkon send. Shenjat e ngopjes: kthehet kokën, mbyll gojën, tregon interes për gjëra të tjera. Hulumtimet tregojnë se ushqyerja responsivë lidhet me peshë më të shëndetshme dhe marrëdhënie pozitive me ushqimin në moshë madhore.',
      en: 'Responsive feeding means following baby\'s lead — not parent-set schedules and amounts. Hunger cues: fussing, mouth opening, reaching for things. Fullness cues: turning head away, closing mouth, showing interest in other things. Research links responsive feeding with healthier weight and a positive relationship with food into adulthood.',
    },
    badge: '🤝', bg: '#CFFFD6', ring: '#98E8AA',
  },
];

// ── Article Modal ─────────────────────────────────────────────────────────────

function LearningArticleModal({ card, onClose }: { card: Card | null; onClose: () => void }) {
  const { language } = useLanguage();
  if (!card) return null;
  const topicLabel = language === 'sq-AL'
    ? TOPICS.find((t) => t.key === card.topic)?.sq ?? ''
    : TOPICS.find((t) => t.key === card.topic)?.en ?? '';

  return (
    <Modal visible={!!card} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={[a.root, { backgroundColor: card.bg }]}>
          {/* Header */}
          <View style={a.header}>
            <Pressable style={a.closeBtn} onPress={onClose} hitSlop={8}>
              <Text style={a.closeX}>✕</Text>
            </Pressable>
            <View style={[a.badgeWrap, { backgroundColor: card.ring }]}>
              <Text style={a.badgeText}>{card.badge}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={a.scroll} showsVerticalScrollIndicator={false}>
            {/* Topic pill */}
            <View style={[a.topicPill, { backgroundColor: `${card.ring}66` }]}>
              <Text style={[a.topicPillText, { color: '#2A2030' }]}>{topicLabel}</Text>
            </View>

            {/* Title */}
            <Text style={a.title}>{card.title[language]}</Text>

            {/* Divider */}
            <View style={[a.divider, { backgroundColor: card.ring }]} />

            {/* Excerpt */}
            <Text style={a.excerpt}>{card.excerpt[language]}</Text>

            {/* Body */}
            <Text style={a.body}>{card.body[language]}</Text>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LearningContent() {
  const { language } = useLanguage();
  const [selectedTopic, setSelectedTopic] = useState<TopicKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openCard, setOpenCard] = useState<Card | null>(null);

  const visible = useMemo(() => {
    let cards = selectedTopic === 'all' ? CARDS : CARDS.filter((c) => c.topic === selectedTopic);
    if (searchQuery.trim()) {
      const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const q = norm(searchQuery);
      cards = cards.filter(
        (c) => norm(c.title[language]).includes(q) || norm(c.excerpt[language]).includes(q),
      );
    }
    return cards;
  }, [selectedTopic, searchQuery, language]);

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.heading}>
          {language === 'sq-AL' ? 'Mëso 🌱' : 'Learn 🌱'}
        </Text>

        {/* Topic chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.topicRow}>
          {TOPICS.map((t) => (
            <Pressable
              key={t.key}
              style={[s.chip, selectedTopic === t.key && s.chipOn]}
              onPress={() => setSelectedTopic(t.key)}
            >
              <Text style={[s.chipText, selectedTopic === t.key && s.chipTextOn]}>
                {language === 'sq-AL' ? t.sq : t.en}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Search */}
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={language === 'sq-AL' ? 'Kërko...' : 'Search...'}
            placeholderTextColor="#B0A9A3"
            style={s.searchInput}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Text style={s.searchClear}>✕</Text>
            </Pressable>
          )}
        </View>

        {visible.length === 0 && (
          <Text style={s.emptyText}>
            {language === 'sq-AL' ? 'Nuk ka rezultate.' : 'No results.'}
          </Text>
        )}

        {/* Cards */}
        <View style={s.cardList}>
          {visible.map((card) => (
            <Pressable key={card.id} onPress={() => setOpenCard(card)}>
              <Surface style={[s.card, { backgroundColor: card.bg }]} elevation={0}>
                <View style={s.cardPattern} />
                <View style={s.notchTop} />
                <View style={s.notchBottom} />

                <View style={s.cardCopy}>
                  <View style={[s.topicPill, { backgroundColor: `${card.ring}66` }]}>
                    <Text style={[s.topicPillText, { color: '#2A2030' }]}>
                      {language === 'sq-AL'
                        ? TOPICS.find((t) => t.key === card.topic)?.sq ?? ''
                        : TOPICS.find((t) => t.key === card.topic)?.en ?? ''}
                    </Text>
                  </View>
                  <Text style={s.cardTitle}>{card.title[language]}</Text>
                  <Text style={s.cardExcerpt}>{card.excerpt[language]}</Text>
                  <Text style={[s.readMore, { color: card.ring }]}>
                    {language === 'sq-AL' ? 'Lexo më shumë →' : 'Read more →'}
                  </Text>
                </View>

                <View style={[s.avatarRing, { borderColor: card.ring }]}>
                  <View style={[s.avatarCore, { backgroundColor: card.ring }]}>
                    <Text style={s.badge}>{card.badge}</Text>
                  </View>
                </View>
              </Surface>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <LearningArticleModal card={openCard} onClose={() => setOpenCard(null)} />
    </>
  );
}

// ── Card list styles ──────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20, gap: 18 },
  heading: { fontSize: 38, lineHeight: 42, fontWeight: '800', letterSpacing: -1.4, color: '#111111' },

  topicRow: { paddingRight: 12, gap: 10 },
  chip: { borderRadius: 999, backgroundColor: '#FFFFFFD9', paddingHorizontal: 18, paddingVertical: 10 },
  chipOn:     { backgroundColor: '#111111' },
  chipText:   { fontSize: 14, fontWeight: '700', color: '#1E1B2F' },
  chipTextOn: { color: '#FFFFFF' },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFFD9', borderRadius: 18, paddingHorizontal: 16, height: 48, gap: 10 },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1714' },
  searchClear: { fontSize: 14, color: '#9E9590', paddingLeft: 8 },
  emptyText: { textAlign: 'center', color: '#9E9590', fontSize: 15, paddingVertical: 16 },

  cardList: { gap: 14 },
  card: {
    minHeight: 156, borderRadius: 30, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden',
  },
  cardPattern: {
    position: 'absolute', right: 16, top: 14,
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 12, borderColor: '#FFFFFF12',
  },
  notchTop: {
    position: 'absolute', width: 34, height: 8, borderRadius: 999,
    top: 0, left: '50%', marginLeft: -17, backgroundColor: '#EFEAFF',
  },
  notchBottom: {
    position: 'absolute', width: 34, height: 8, borderRadius: 999,
    bottom: 0, left: '50%', marginLeft: -17, backgroundColor: '#EFEAFF',
  },
  cardCopy: { flex: 1, paddingRight: 16, gap: 8 },
  topicPill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  topicPillText: { fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 20, lineHeight: 26, fontWeight: '800', letterSpacing: -0.6, color: '#111111' },
  cardExcerpt: { fontSize: 13, lineHeight: 18, color: '#575265' },
  readMore: { fontSize: 12, fontWeight: '700' },

  avatarRing: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, backgroundColor: '#FFFFFFB5',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarCore: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  badge: { fontSize: 16, fontWeight: '800', color: '#111111' },
});

// ── Article modal styles ──────────────────────────────────────────────────────

const a = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFFFFF88', alignItems: 'center', justifyContent: 'center',
  },
  closeX: { fontSize: 15, color: '#333', fontWeight: '800' },
  badgeWrap: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 18, fontWeight: '800', color: '#111' },

  scroll: { paddingHorizontal: 24, paddingBottom: 60, gap: 16 },

  topicPill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  topicPillText: { fontSize: 12, fontWeight: '700' },

  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.8, color: '#111111' },

  divider: { height: 3, width: 48, borderRadius: 999, opacity: 0.6 },

  excerpt: {
    fontSize: 17, lineHeight: 26, fontWeight: '600', color: '#2A2030',
    backgroundColor: '#FFFFFF55', borderRadius: 16, padding: 16,
  },
  body: { fontSize: 16, lineHeight: 26, color: '#3A3040' },
});
