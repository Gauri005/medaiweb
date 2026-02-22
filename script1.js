// script.js
// referance
const chatEl = document.getElementById('chat');
const msgEl = document.getElementById('message');
const sendBtn = document.getElementById('sendBtn');

//CURATED RULES BASE (key conditions included) 
// Each item: keywords[] (lowercase), conditions[], recommendation ('home'|'doctor'|'emergency'),
// notes (short guidance)
const RULES_BASE = [
  { keywords:['fever','temperature','high fever'], conditions:['Flu','Viral infection','COVID-19'], recommendation:'doctor',
    notes:'Paracetamol for fever. If >101°F for 48+ hrs or worsening → see doctor.' },
  { keywords:['cough','dry cough','sore throat'], conditions:['Common cold','Bronchitis','COVID-19'], recommendation:'doctor',
    notes:'Rest, fluids, honey for cough (adults). If breathing difficulty or high fever → doctor.' },
  { keywords:['headache','migraine','severe headache'], conditions:['Migraine','Tension headache','Dehydration'], recommendation:'home',
    notes:'Rest, hydrate, OTC analgesic. Sudden severe headache or weakness → emergency.' },

  // Heart / chest
  { keywords:['chest pain','tightness in chest','pressure in chest'], conditions:['Heart attack','Angina','CAD'], recommendation:'emergency',
    notes:'Chest pain with sweating or breathlessness → go to ER. If safe, chew aspirin after medical advice.'},
  { keywords:['palpitations','fast heart rate','irregular heartbeat'], conditions:['Arrhythmia','Anxiety','Hyperthyroid'], recommendation:'doctor',
    notes:'If fainting or severe chest pain → emergency.', },

  // Infectious diseases
  { keywords:['smallpox','pustules','scabs','high fever with rash'], conditions:['Smallpox (rare)'], recommendation:'emergency',
    notes:'Isolate and seek emergency care immediately.'},
  { keywords:['chickenpox','itchy rash','blisters','varicella'], conditions:['Chickenpox'], recommendation:'doctor',
    notes:'Calamine for itch, paracetamol for fever. Avoid aspirin in children.' },
  { keywords:['malaria','chills','rigors','sweating after chills','mosquito bite'], conditions:['Malaria'], recommendation:'doctor',
    notes:'Needs malaria test and antimalarials (ACT) prescribed by clinician.'},
  { keywords:['typhoid','abdominal pain','prolonged fever','rose spots'], conditions:['Typhoid fever'], recommendation:'doctor',
    notes:'Blood test and antibiotics by physician required.',},
  { keywords:['pneumonia','productive cough','fever with cough','shortness of breath'], conditions:['Pneumonia'], recommendation:'doctor',
    notes:'Antibiotics if bacterial; seek urgent care for breathlessness.'},

  // Respiratory & chronic
  { keywords:['asthma','wheeze','wheezing','inhaler','bronchospasm'], conditions:['Asthma'], recommendation:'doctor',
    notes:'Use quick-relief inhaler (salbutamol) if prescribed; severe breathing → emergency.'},
  { keywords:['copd','chronic cough','smoker cough','emphysema'], conditions:['COPD','Chronic bronchitis'], recommendation:'doctor',
    notes:'Inhalers and smoking cessation; severe → hospital.'},

  // Metabolic
  { keywords:['diabetes','high sugar','polyuria','polydipsia','sugar disease','mellitus'], conditions:['Diabetes Mellitus'], recommendation:'doctor',
    notes:'Lifestyle + medications like metformin. Monitor blood glucose and follow clinician plan.' },

  // Neurological / neuro emergency
  { keywords:['weakness on one side','face droop','slurred speech','sudden weakness'], conditions:['Possible stroke'], recommendation:'emergency',
    notes:'FAST: Face, Arms, Speech, Time → call emergency immediately.'},

  // GI
  { keywords:['vomiting','nausea','persistent vomiting'], conditions:['Gastroenteritis','Food poisoning'], recommendation:'home',
    notes:'Hydrate (ORS). If persistent or bloody vomiting → see doctor.'},

  // Skin
  { keywords:['rash','skin rash','hives','red spots','swelling face'], conditions:['Allergic reaction','Dermatitis'], recommendation:'doctor',
    notes:'Antihistamine for mild allergy; if face swelling or breathing difficulty → emergency.' },

  // bleeding / trauma
  { keywords:['bleeding','severe bleeding','heavy bleeding'], conditions:['Trauma','Internal bleeding'], recommendation:'emergency',
    notes:'Apply pressure and seek immediate emergency care.' },

  // dizzy / faint
  { keywords:['dizzy','dizziness','lightheaded','faint'], conditions:['Dehydration','Low BP','Vertigo'], recommendation:'home',
    notes:'Lie down, hydrate; fainting or persistent dizziness → doctor.' },

];

// ========== GENERATOR: expand the base to reach N rules (variants & synonyms) ========== 
function generateLargeRules(base, targetCount = 1000) {
  const out = [...base]; 
  const synonymGroups = [
    ['fever','pyrexia','high temperature'],
    ['cough','dry cough','productive cough','sore throat'],
    ['headache','migraine','head pain'],
    ['chest pain','pressure in chest','tight chest','heart pain'],
    ['shortness of breath','breathless','difficulty breathing','dyspnea'],
    ['vomit','vomiting','nausea','throwing up'],
    ['diarrhea','loose stool','runny stool','watery stool'],
    ['rash','skin rash','hives','red spots','blisters'],
    ['weakness','fatigue','tiredness','lethargy'],
    ['dizzy','dizziness','vertigo','lightheaded'],
    ['palpitations','fast heart','fluttering heartbeat'],
    ['sore throat','throat pain','throat irritation'],
    ['abdominal pain','stomach pain','belly pain','tummy pain'],
    ['sweating','excessive sweating','diaphoresis'],
    ['confusion','disoriented','altered mental'],
    ['urination','polyuria','frequent urination','pee more'],
    ['thirst','excessive thirst','polydipsia'],
    ['rash-pustular','pustules','pox-like rash']
  ];

  const medSnippets = [
    // 'Paracetamol for fever (follow dose instructions).',
    // 'Hydration and rest recommended.',
    // 'Use ORS for dehydration.',
    // 'Seek doctor for antibiotics if symptoms persist.',
    // 'Inhaler (salbutamol) if already prescribed for asthma.',
    // 'Avoid aspirin in children with viral illness.',
    'Immediate emergency care if severe breathing difficulty or chest pain.'
  ];

  let idx = 0;
  while (out.length < targetCount) {
    const g = synonymGroups[idx % synonymGroups.length];
    for (let i = 0; i < g.length && out.length < targetCount; i++) {
      const phrase = g[i];
      let cond = ['General symptom'];
      let rec = 'home';
      if (phrase.includes('chest') || phrase.includes('heart') || phrase.includes('pressure')) {
        cond = ['Coronary Artery Disease','Angina'];
        rec = 'emergency';
      } else if (phrase.includes('breath') || phrase.includes('dyspnea') || phrase.includes('wheezing')) {
        cond = ['Asthma','Pneumonia','COPD'];
        rec = 'doctor';
      } else if (phrase.includes('fever') || phrase.includes('pyrexia')) {
        cond = ['Flu','Malaria','Typhoid','Viral infection'];
        rec = 'doctor';
      } else if (phrase.includes('vomit') || phrase.includes('diarrhea')) {
        cond = ['Gastroenteritis','Food poisoning'];
        rec = 'home';
      } else if (phrase.includes('rash') || phrase.includes('hives') || phrase.includes('pustules')) {
        cond = ['Allergic reaction','Chickenpox','Smallpox-like'];
        rec = 'doctor';
      } else if (phrase.includes('dizzy') || phrase.includes('vertigo')) {
        cond = ['Vertigo','Dehydration'];
        rec = 'home';
      } else if (phrase.includes('urination') || phrase.includes('polyuria')) {
        cond = ['Diabetes Mellitus'];
        rec = 'doctor';
      } else if (phrase.includes('confusion') || phrase.includes('altered')) {
        cond = ['Neurological issue','Sepsis','Metabolic disturbance'];
        rec = 'emergency';
      }

      const note = medSnippets[(out.length) % medSnippets.length];

      out.push({
        keywords: [phrase],
        conditions: cond,
        recommendation: rec,
        notes: note
      });
    }
    idx++;
    if (idx > 10000) break;
  }

  return out;
}

// Generate RULES array
const RULES = generateLargeRules(RULES_BASE, 1000);

// ========== Matching helpers ==========
function tokenize(text){ return text.toLowerCase().replace(/[.,!?]/g,' ').split(/\s+/).filter(Boolean); }

function textIncludesPhrase(tokens, phrase){
  const p = phrase.toLowerCase().split(/\s+/).filter(Boolean);
  if (p.length === 1) return tokens.includes(p[0]);
  for (let i=0;i<=tokens.length-p.length;i++){
    let ok = true;
    for (let j=0;j<p.length;j++) if (tokens[i+j] !== p[j]) { ok=false; break; }
    if (ok) return true;
  }
  return false;
}

function scoreMatch(tokens, rule){
  let count = 0;
  for (const k of rule.keywords) if (textIncludesPhrase(tokens,k)) count++;
  return count;
}

function findMatches(input){
  const tokens = tokenize(input);
  const results = [];
  for (const rule of RULES){
    const s = scoreMatch(tokens, rule);
    if (s>0) results.push({ rule, score: s });
  }
  results.sort((a,b) => b.score - a.score);
  return results;
}

function aggregateResponse(matches){
  if (!matches || matches.length === 0) return null;
  const tally = { emergency:0, doctor:0, home:0 };
  const conditions = new Set();
  const notes = new Set();
  for (const m of matches.slice(0,10)) {
    tally[m.rule.recommendation] += m.score;
    for (const c of m.rule.conditions) conditions.add(c);
    if (m.rule.notes) notes.add(m.rule.notes);
  }
  let rec = 'home';
  if (tally.emergency > 0 && tally.emergency >= tally.doctor && tally.emergency >= tally.home) rec = 'emergency';
  else if (tally.doctor > 0 && tally.doctor >= tally.home) rec = 'doctor';
  return { recommendation: rec, conditions: Array.from(conditions).slice(0,6), notes: Array.from(notes).slice(0,3) };
}

// ========== UI helpers ==========
function appendBubble(html, who='bot'){
  const div = document.createElement('div');
  div.className = 'bubble ' + who;
  div.innerHTML = html;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function createTypingBubble(){
  const wrap = document.createElement('div');
  wrap.className = 'bubble bot';
  const span = document.createElement('span');
  span.className = 'typing';
  span.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  wrap.appendChild(span);
  chatEl.appendChild(wrap);
  chatEl.scrollTop = chatEl.scrollHeight;
  return wrap;
}

// ========== Main send logic ==========
function handleSend(){
  const text = msgEl.value.trim();
  if (!text) return;
  appendBubble(`<b>You:</b> ${escapeHtml(text)}`, 'user');
  msgEl.value = '';
  msgEl.focus();

  const typingBubble = createTypingBubble();
  const delay = 900 + Math.min(1500, text.length * 15);

  setTimeout(() => {
    if (typingBubble && typingBubble.parentNode) typingBubble.parentNode.removeChild(typingBubble);

    const matches = findMatches(text);
    const agg = aggregateResponse(matches);

    if (!agg) {
      appendBubble(`<b>Bot:</b> I could not match the symptoms precisely. Rest, hydrate and seek medical care if symptoms worsen.`, 'bot');
      return;
    }

    let recText = '';
    if (agg.recommendation === 'emergency') recText = '⚠️ <b>Recommendation:</b> Emergency — seek immediate medical care (ER).';
    else if (agg.recommendation === 'doctor') recText = '🩺 <b>Recommendation:</b> See a doctor soon (clinic or teleconsultation).';
    else recText = '🏠 <b>Recommendation:</b> Home care — rest, hydrate, OTC remedies. If no improvement, see a doctor.';

    const conditionsStr = agg.conditions.join(', ');
    const notesStr = agg.notes.join(' | ');

    appendBubble(`<b>Bot:</b> Possible: ${escapeHtml(conditionsStr)}<br>${recText}<br><small style="color:#444">${escapeHtml(notesStr)}</small>`, 'bot');

  }, delay);
}

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ========== events ==========
sendBtn.addEventListener('click', handleSend);
msgEl.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });

// welcome
appendBubble('<b>Health Friendly Bot:</b> Hi — describe your symptoms . I provide possible conditions and triage suggestions (not a diagnosis).', 'bot');
