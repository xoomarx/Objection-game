/* ============================================================
 * Objection! Power Suit
 * A complete pixel courtroom drama in one JS file
 * ============================================================ */

'use strict';

/* ===== PALETTE ===== */
const PAL = {
  bg: '#1a1226', wood: '#6b3e1f', woodDark: '#4a2912', woodLight: '#8a5430',
  skin: '#e8c9a0', skinDark: '#b8956f', suit: '#2a2138', suitDark: '#1a1226',
  shirt: '#f0e6d2', tieRed: '#a83232', tieBlue: '#3a5fb8', tieBlack: '#202020',
  tiePurple: '#6a3aaa', hair: '#2a1810', hair2: '#5a3a1a', hair3: '#8a6a3a',
  gold: '#d4a82c', paper: '#f5e8c8', ink: '#1a0e08',
  red: '#d44a3a', green: '#5aaa4a', floor: '#3a2818',
  judge: '#0a0410', jury: '#7a6a4a', curtain: '#4a1018',
  navy: '#17213f', marble: '#c7b897', neonGold: '#ffdc5c', carpet: '#30101c',
};

/* ===== LAWYER STYLES ===== */
const STYLES = {
  closer: {
    id: 'closer', name: 'The Closer',
    desc: 'Bonus to negotiation and closing argument.',
    stats: { confidence: 7, legalSkill: 6, charm: 7, intimidation: 5, logic: 6 },
    tieColor: PAL.tieRed, hairColor: PAL.hair2,
    special: { name: 'Power Suit', desc: 'Gain +20 cred, +15 confidence.', uses: 2 },
  },
  shark: {
    id: 'shark', name: 'The Shark',
    desc: 'Bonus to intimidation and witness pressure.',
    stats: { confidence: 8, legalSkill: 6, charm: 4, intimidation: 9, logic: 5 },
    tieColor: PAL.tieBlack, hairColor: PAL.hair,
    special: { name: 'Corporate Pressure', desc: 'Heavy hit to opp credibility, risky.', uses: 2 },
  },
  strategist: {
    id: 'strategist', name: 'The Strategist',
    desc: 'Bonus to evidence and logical contradictions.',
    stats: { confidence: 6, legalSkill: 8, charm: 5, intimidation: 5, logic: 9 },
    tieColor: PAL.tieBlue, hairColor: PAL.hair3,
    special: { name: 'Paper Trail', desc: 'Reveal current weakness + jury bump.', uses: 2 },
  },
  charmer: {
    id: 'charmer', name: 'The Charmer',
    desc: 'Bonus to jury influence and witness control.',
    stats: { confidence: 7, legalSkill: 6, charm: 9, intimidation: 4, logic: 6 },
    tieColor: PAL.tiePurple, hairColor: PAL.hair3,
    special: { name: 'Cold Read', desc: 'Crush witness confidence, sway jury.', uses: 2 },
  },
};

/* ===== EVIDENCE LIBRARY ===== */
const EVIDENCE = {
  signed_contract:   { name: 'Signed Contract',      cost: 1, strength: 8, risk: 1, desc: 'A formally executed agreement.' },
  email_thread:      { name: 'Email Thread',         cost: 1, strength: 6, risk: 2, desc: 'A chain of recovered emails.' },
  security_footage:  { name: 'Security Footage',     cost: 2, strength: 9, risk: 1, desc: 'Time-stamped surveillance video.' },
  witness_statement: { name: 'Prior Statement',      cost: 1, strength: 6, risk: 2, desc: 'A signed earlier statement.' },
  financial_ledger:  { name: 'Financial Ledger',     cost: 2, strength: 8, risk: 2, desc: 'Recorded transactions and balances.' },
  phone_record:      { name: 'Phone Record',         cost: 1, strength: 6, risk: 1, desc: 'Call logs with timestamps.' },
  nda_clause:        { name: 'NDA Clause',           cost: 1, strength: 5, risk: 1, desc: 'A specific contractual provision.' },
  internal_memo:     { name: 'Internal Memo',        cost: 1, strength: 7, risk: 2, desc: 'A confidential corporate memo.' },
  timeline_contradiction: { name: 'Timeline Break',  cost: 1, strength: 7, risk: 1, desc: 'A break in the stated timeline.' },
  expert_report:     { name: 'Expert Report',        cost: 2, strength: 8, risk: 1, desc: 'Independent expert analysis.' },
  board_minutes:     { name: 'Board Minutes',         cost: 2, strength: 9, risk: 2, desc: 'Executive meeting minutes with approvals.' },
  redline_draft:     { name: 'Redlined Draft',        cost: 1, strength: 7, risk: 2, desc: 'A contract draft showing hidden edits.' },
  access_badge_log:  { name: 'Badge Log',             cost: 1, strength: 6, risk: 1, desc: 'Building entry records with timestamps.' },
  whistle_file:     { name: 'Whistleblower File',    cost: 2, strength: 9, risk: 3, desc: 'Anonymous file with explosive claims.' },
  calendar_invite:  { name: 'Calendar Invite',       cost: 1, strength: 6, risk: 1, desc: 'Meeting invite proving timing and attendance.' },
  settlement_draft: { name: 'Settlement Draft',      cost: 1, strength: 7, risk: 2, desc: 'Draft settlement showing hidden admissions.' },
};

/* ===== CASES ===== */
const CASES = [
  {
    id: 'contract',
    title: 'The Broken Contract',
    intro: 'A startup founder claims a corporate investor exploited a hidden clause and walked away with the IP.',
    diff: 1,
    opponent: { name: 'Marcus Vex',  personality: 'charming',  tieColor: PAL.tieRed,   hairColor: PAL.hair2 },
    witness:  { name: 'D. Halberg',  role: 'Investor Rep',     mood: 'nervous' },
    evidencePool: ['signed_contract','email_thread','timeline_contradiction','internal_memo','nda_clause','phone_record','expert_report'],
    statements: [
      { text: "My client never agreed to any modification of that contract.",      weakness: 'signed_contract',         obj: null,          hint: "A formal signature speaks loudest." },
      { text: "Those were informal discussions — nothing was put in writing.",     weakness: 'email_thread',            obj: 'hearsay',     hint: "Email leaves a record." },
      { text: "There was no pressure or rush on either side.",                     weakness: 'timeline_contradiction',  obj: null,          hint: "The dates tell another story." },
      { text: "Frankly, my client never knew that hidden clause was even there.",  weakness: 'internal_memo',           obj: 'speculation', hint: "Internal documents indicate otherwise." },
      { text: "We negotiated openly and in good faith. Always.",                   weakness: 'nda_clause',              obj: null,          hint: "An NDA term contradicts 'openly'." },
    ],
    reward: { money: 2500, reputation: 10 },
  },
  {
    id: 'ledger',
    title: 'The Missing Ledger',
    intro: 'A finance executive is accused of hiding eight-figure losses behind sanitized quarterly reports.',
    diff: 2,
    opponent: { name: 'Iris Kohn',   personality: 'technical',  tieColor: PAL.tieBlack, hairColor: PAL.hair3 },
    witness:  { name: 'P. Marston',  role: 'Senior Accountant', mood: 'defensive' },
    evidencePool: ['financial_ledger','internal_memo','expert_report','email_thread','timeline_contradiction','phone_record','nda_clause'],
    statements: [
      { text: "Every figure was properly recorded in the audited statements.",     weakness: 'financial_ledger',        obj: null,          hint: "The actual ledger may disagree." },
      { text: "Nobody at the firm ever discussed restating earnings.",             weakness: 'internal_memo',           obj: 'hearsay',     hint: "Memos are written record." },
      { text: "The figures are simply too complex to misinterpret.",               weakness: 'expert_report',           obj: null,          hint: "Experts read them differently." },
      { text: "Our reporting timeline was completely standard procedure.",         weakness: 'timeline_contradiction',  obj: 'speculation', hint: "Check the dates carefully." },
      { text: "I had no personal communication about these accounting issues.",    weakness: 'phone_record',            obj: null,          hint: "Phone logs do not lie." },
      { text: "I cannot speculate on what other departments may have done.",       weakness: 'email_thread',            obj: 'speculation', hint: "Emails show direct involvement." },
    ],
    reward: { money: 4500, reputation: 18 },
  },
  {
    id: 'witness',
    title: 'The Silent Witness',
    intro: 'A key employee changed her story days before trial. Loyalty, fear, and a corporate paymaster all hang in the air.',
    diff: 3,
    opponent: { name: 'Roland Blackwell', personality: 'intimidating', tieColor: '#440000', hairColor: PAL.hair },
    witness:  { name: 'A. Sorin',     role: 'Junior Employee',    mood: 'scared' },
    evidencePool: ['witness_statement','phone_record','security_footage','email_thread','internal_memo','timeline_contradiction','expert_report'],
    statements: [
      { text: "I never gave any different account of what happened that night.",   weakness: 'witness_statement',       obj: null,          hint: "A prior signed statement exists." },
      { text: "I had no contact with company leadership that whole week.",         weakness: 'phone_record',            obj: 'hearsay',     hint: "Phone logs do not lie." },
      { text: "I was nowhere near the building at that hour.",                     weakness: 'security_footage',        obj: null,          hint: "Cameras record everything." },
      { text: "Nobody ever pressured me about my testimony.",                      weakness: 'email_thread',            obj: 'speculation', hint: "Emails reveal intent." },
      { text: "Every date in my revised statement is precisely accurate.",         weakness: 'timeline_contradiction',  obj: null,          hint: "The timeline breaks." },
      { text: "I had no knowledge of any internal policy on this matter.",         weakness: 'internal_memo',           obj: 'relevance',   hint: "Internal memos prove otherwise." },
      { text: "And no expert could second-guess what I personally saw.",           weakness: 'expert_report',           obj: null,          hint: "Experts can — and have." },
    ],
    reward: { money: 7500, reputation: 32 },
  },
  {
    id: 'merger',
    title: 'The Midnight Merger',
    intro: 'A luxury holding company pushed a midnight merger through the board. The signatures look clean — too clean.',
    diff: 4,
    opponent: { name: 'Celeste Dray', personality: 'slippery', tieColor: '#6a3aaa', hairColor: PAL.hair3 },
    witness:  { name: 'V. Cross', role: 'Board Secretary', mood: 'guarded' },
    evidencePool: ['board_minutes','redline_draft','access_badge_log','signed_contract','email_thread','phone_record','internal_memo','expert_report'],
    statements: [
      { text: "The board approved the merger unanimously before midnight.", weakness: 'board_minutes', obj: null, hint: "The minutes show a different voting sequence." },
      { text: "No one changed the draft after the directors reviewed it.", weakness: 'redline_draft', obj: 'speculation', hint: "The redline exposes late edits." },
      { text: "The missing director was present for the entire meeting.", weakness: 'access_badge_log', obj: null, hint: "Badge logs mark the exit time." },
      { text: "All communications were routine and above board.", weakness: 'email_thread', obj: 'hearsay', hint: "The emails show panic before the vote." },
      { text: "I did not receive any calls pressuring me to alter the record.", weakness: 'phone_record', obj: null, hint: "Phone records create a pressure timeline." },
      { text: "The final contract matches the version everyone approved.", weakness: 'signed_contract', obj: null, hint: "The signed version contains the disputed clause." },
      { text: "There was no internal concern about legal exposure.", weakness: 'internal_memo', obj: 'relevance', hint: "The memo warned executives directly." },
      { text: "Even an expert would agree the process was clean.", weakness: 'expert_report', obj: null, hint: "The expert report calls the process irregular." },
    ],
    reward: { money: 11000, reputation: 45 },
  },
  {
    id: 'blackfile',
    title: 'The Black File',
    intro: 'A sealed executive file surfaces hours before trial. The other side says it is fake. Your reputation says otherwise.',
    diff: 5,
    opponent: { name: 'Damien Vale', personality: 'technical', tieColor: '#0b0b0b', hairColor: PAL.hair },
    witness:  { name: 'M. Pierce', role: 'Compliance Director', mood: 'guarded' },
    evidencePool: ['whistle_file','calendar_invite','settlement_draft','internal_memo','email_thread','security_footage','expert_report','phone_record'],
    statements: [
      { text: "The so-called file was never part of our compliance archive.", weakness: 'whistle_file', obj: null, hint: "The file metadata matches the archive chain." },
      { text: "No emergency meeting was scheduled before the complaint.", weakness: 'calendar_invite', obj: null, hint: "The invite proves the emergency meeting happened." },
      { text: "Nobody offered money to silence the claimant.", weakness: 'settlement_draft', obj: 'speculation', hint: "The draft contains a silence clause." },
      { text: "Leadership had no warning about legal exposure.", weakness: 'internal_memo', obj: null, hint: "The memo warned leadership directly." },
      { text: "The emails show routine compliance cleanup, nothing more.", weakness: 'email_thread', obj: 'hearsay', hint: "The thread shows a coordinated cover story." },
      { text: "The camera system was offline that evening.", weakness: 'security_footage', obj: null, hint: "The footage recovered one working angle." },
      { text: "An expert would never call this a cover-up.", weakness: 'expert_report', obj: null, hint: "The expert report names the inconsistencies." },
      { text: "There were no late-night calls about the complaint.", weakness: 'phone_record', obj: null, hint: "The call log creates the timeline." },
    ],
    reward: { money: 15000, reputation: 60 },
  },

  {
    id: 'glasstower',
    title: 'The Glass Tower',
    intro: 'A skyscraper developer buried safety warnings before a public launch. Every floor has a secret, and every secret has a signature.',
    diff: 6,
    opponent: { name: 'Vivian Slate', personality: 'slippery', tieColor: '#3a5fb8', hairColor: PAL.hair2 },
    witness:  { name: 'E. Rourke', role: 'Project Director', mood: 'defensive' },
    evidencePool: ['expert_report','internal_memo','email_thread','security_footage','calendar_invite','board_minutes','access_badge_log','whistle_file'],
    statements: [
      { text: 'No safety warning ever reached my desk before launch.', weakness: 'internal_memo', obj: null, hint: 'The memo was forwarded directly to the project director.' },
      { text: 'Our experts fully cleared the building systems.', weakness: 'expert_report', obj: null, hint: 'The expert report lists unresolved defects.' },
      { text: 'The launch meeting was routine, nothing urgent.', weakness: 'calendar_invite', obj: 'speculation', hint: 'The invite title says emergency risk review.' },
      { text: 'Security footage from the site was unavailable.', weakness: 'security_footage', obj: null, hint: 'One camera angle survived the purge.' },
      { text: 'The board never discussed delaying the opening.', weakness: 'board_minutes', obj: null, hint: 'The minutes record a delay vote.' },
      { text: 'No anonymous complaint was ever verified.', weakness: 'whistle_file', obj: 'hearsay', hint: 'The whistleblower file matches the later expert findings.' },
      { text: 'I left before anyone raised concerns that night.', weakness: 'access_badge_log', obj: null, hint: 'The badge log places the witness inside after midnight.' },
      { text: 'Those emails were just normal launch chatter.', weakness: 'email_thread', obj: 'hearsay', hint: 'The thread shows executives coordinating language.' },
    ],
    reward: { money: 22000, reputation: 85 },
  },
];

const OBJECTIONS = {
  relevance:   { name: 'Relevance',   desc: 'Off-topic testimony.' },
  hearsay:     { name: 'Hearsay',     desc: 'Second-hand claim.' },
  speculation: { name: 'Speculation', desc: 'Guessing without basis.' },
};

const LOCATIONS = [
  { id: 'office',     name: 'Law Office',         icon: '🏢', desc: 'Review case files and contact the client.' },
  { id: 'corp',       name: 'Corporate Tower',    icon: '🏛️', desc: 'Confront the other side on their turf.' },
  { id: 'records',    name: 'Courthouse Records', icon: '📜', desc: 'Dig through public filings and prior testimony.' },
];

const DRAMATIC_LINES = {
  evidence_good: [
    "Your Honor, the evidence tells a different story.",
    "I have one final exhibit.",
    "The paper trail does not lie.",
    "Counsel is avoiding the facts.",
    "That statement just opened the door.",
    "The record is about to become very uncomfortable.",
    "You wanted the truth on the table. Here it is.",
    "This is where the story falls apart.",
    "Counsel built a wall. I brought the hammer.",
    "The court deserves the whole record, not the polished version.",
  ],
  evidence_bad: [
    "That… wasn't relevant. Counsel, be careful.",
    "I'll allow it — but barely.",
    "Stay on point, counsel.",
  ],
  obj_good: [
    "Objection!",
    "Objection — and counsel knows why.",
    "I have to object to that.",
    "Objection — improper and prejudicial.",
    "Your Honor, that cannot stand.",
    "Objection, counsel is testifying.",
  ],
  obj_bad: [
    "Overruled. Sit down, counsel.",
    "Overruled. Don't waste the court's time.",
    "Overruled. Move on.",
  ],
  cross_good: [
    "Answer carefully. This record has a memory.",
    "One sentence at a time. No speeches.",
    "The witness just contradicted their own statement.",
    "Permission to approach the witness.",
    "Let's talk about what really happened.",
    "Look at me, not them. Answer the question.",
    "You remember it now, don't you?",
    "The timeline gives you nowhere to hide.",
    "You can pause. The answer will be the same.",
    "That silence is louder than your statement.",
  ],
  pressure: [
    "The facts are not on your side.",
    "Look at the jury and say that again.",
    "You rehearsed the answer, not the truth.",
    "You sure about that? Take your time.",
    "That answer doesn't match the record.",
  ],
  closing: [
    "Members of the jury — the truth is plain.",
    "This case was never about noise. It was about proof.",
    "The other side sold you confidence because they ran out of facts.",
    "There is only one verdict the evidence supports.",
    "Counsel asked you to believe a story. I'm asking you to follow the facts.",
    "Credibility is not a costume. Today, theirs came off.",
    "This courtroom is not built for stories. It is built for proof.",
  ],
};

/* ===== STATE ===== */
const S = {
  phase: 'menu',
  player: null,
  campaignIndex: 0,
  caseData: null,
  prep: { selected: [], points: 5, pool: [] },
  invest: { visited: {}, clues: [], left: 2, revealed: [] },
  negot: null,
  court: null,
  duel: null,
  muted: false,
  voiceEnabled: true,
  lang: 'en',
  styleSelection: { current: null, name: '' },
  duelSel: { p1: null, p2: null },
};

/* ===== AUDIO ===== */
const Snd = {
  ctx: null, master: null, ambNode: null, ambGain: null, started: false,
  init() {
    if (this.started) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = S.muted ? 0 : 0.55;
      this.master.connect(this.ctx.destination);
      this.started = true;
    } catch (e) { console.warn('Audio init failed', e); }
  },
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(()=>{});
  },
  setMuted(m) {
    S.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.55;
    if (m) this.stopMurmur(); else this.murmur();
  },
  tone(freq, dur, type='sine', vol=0.3, attack=0.005) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  },
  slide(f1, f2, dur, type='sawtooth', vol=0.25) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol=0.2, filterFreq=1000, type='lowpass') {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, sr*dur, sr);
    const d = buf.getChannelData(0);
    for (let i=0; i<d.length; i++) d[i] = Math.random()*2-1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime+dur);
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = filterFreq;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start();
  },
  click() { this.tone(700, 0.04, 'square', 0.12); },
  gavel() {
    this.noise(0.12, 0.4, 500);
    this.tone(110, 0.18, 'square', 0.35);
    setTimeout(()=>this.tone(80, 0.1, 'sine', 0.2), 60);
  },
  objection() {
    // Three-part dramatic sting: whoosh, impact, rising brass-like tone.
    this.noise(0.18, 0.20, 1400, 'bandpass');
    this.slide(220, 740, 0.22, 'sawtooth', 0.34);
    setTimeout(()=>this.tone(92, 0.20, 'square', 0.30), 45);
    setTimeout(()=>this.slide(520, 980, 0.26, 'sawtooth', 0.28), 130);
    setTimeout(()=>this.noise(0.12, 0.16, 3200, 'highpass'), 230);
  },
  objectionFail() {
    this.tone(180, 0.20, 'sawtooth', 0.20);
    setTimeout(()=>this.tone(120, 0.25, 'sawtooth', 0.18), 120);
  },
  crowdRise() {
    this.noise(0.45, 0.18, 760, 'bandpass');
    setTimeout(()=>this.noise(0.28, 0.10, 1200, 'bandpass'), 180);
  },
  evidence() {
    [523, 659, 784, 1047].forEach((f,i)=> setTimeout(()=>this.tone(f, 0.14, 'triangle', 0.25), i*55));
  },
  drama() {
    this.slide(220, 110, 0.4, 'sawtooth', 0.22);
    setTimeout(()=>this.noise(0.35, 0.12, 2000), 80);
  },
  paper() { this.noise(0.1, 0.15, 4500, 'highpass'); },
  victory() {
    [523, 659, 784, 1047, 1319].forEach((f,i)=> setTimeout(()=>this.tone(f, 0.22, 'triangle', 0.28), i*100));
    setTimeout(()=>{ this.tone(784,0.4,'triangle',0.22); this.tone(1047,0.4,'triangle',0.22); }, 500);
  },
  loss() {
    [440, 349, 277, 207].forEach((f,i)=> setTimeout(()=>this.tone(f, 0.35, 'sawtooth', 0.25), i*140));
  },
  juryGasp() {
    this.noise(0.22, 0.16, 600);
    this.tone(330, 0.12, 'sine', 0.08);
  },
  warning() {
    this.tone(440, 0.08, 'square', 0.2);
    setTimeout(()=>this.tone(440, 0.08, 'square', 0.2), 150);
  },
  recess() {
    this.tone(523, 0.12, 'sine', 0.2);
    setTimeout(()=>this.tone(659, 0.18, 'sine', 0.2), 100);
  },
  crowdReact(kind='gasp') {
    if (S.muted) return;
    const patterns = {
      gasp: [[420,0.09],[360,0.10],[520,0.07]],
      cheer: [[520,0.08],[660,0.08],[780,0.12]],
      boo: [[160,0.18],[135,0.18],[110,0.22]],
      whisper: [[290,0.06],[310,0.05],[270,0.06]],
    }[kind] || [[330,0.1]];
    this.noise(kind === 'cheer' ? 0.55 : 0.35, kind === 'boo' ? 0.16 : 0.12, kind === 'whisper' ? 900 : 650, 'bandpass');
    patterns.forEach(([f,d], i)=> setTimeout(()=>this.tone(f, d, 'sine', kind === 'boo' ? 0.10 : 0.08), i*70));
  },
  judgeOrder() {
    this.gavel();
    setTimeout(()=>this.tone(196, 0.18, 'square', 0.18), 80);
    setTimeout(()=>this.tone(164, 0.22, 'square', 0.14), 220);
  },
  witnessMumble() {
    if (S.muted) return;
    this.noise(0.22, 0.08, 500, 'bandpass');
    setTimeout(()=>this.tone(240 + Math.random()*80, 0.12, 'sine', 0.06), 60);
  },
  applause() {
    if (S.muted) return;
    for (let i=0; i<6; i++) setTimeout(()=>this.noise(0.06, 0.09, 1800 + Math.random()*1200, 'bandpass'), i*70);
    setTimeout(()=>this.tone(784, 0.10, 'triangle', 0.12), 180);
    setTimeout(()=>this.tone(1047, 0.12, 'triangle', 0.12), 300);
  },
  pageFlip() {
    this.noise(0.08, 0.12, 5000, 'highpass');
    setTimeout(()=>this.noise(0.06, 0.09, 3500, 'highpass'), 80);
  },
  heartbeat() {
    this.tone(72, 0.10, 'sine', 0.20);
    setTimeout(()=>this.tone(64, 0.12, 'sine', 0.17), 180);
  },
  speak(text, role='narrator', interrupt=true) {
    if (S.muted || !S.voiceEnabled || !('speechSynthesis' in window)) return;
    const cleaned = String(text || '')
      .replace(/[✓✗💥⚡★⚖️🤝📁🏛️📜]/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/^[^:]{1,24}:\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) return;
    try {
      if (interrupt) window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cleaned.slice(0, 220));
      const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      const lower = role.toLowerCase();
      if (voices.length) {
        const prefer = lower.includes('witness') ? ['Google UK English Female','Microsoft Zira','Samantha','Female'] :
                       lower.includes('opponent') ? ['Google UK English Male','Microsoft David','Daniel','Male'] :
                       lower.includes('judge') ? ['Microsoft Mark','Google US English','Alex'] :
                       ['Google US English','Microsoft David','Alex'];
        u.voice = voices.find(v => prefer.some(name => v.name.includes(name))) || voices[0];
      }
      u.rate = lower.includes('witness') ? 0.92 : lower.includes('judge') ? 0.78 : 0.96;
      u.pitch = lower.includes('witness') ? 1.05 : lower.includes('opponent') ? 0.82 : lower.includes('judge') ? 0.72 : 0.95;
      u.volume = 0.9;
      window.speechSynthesis.speak(u);
    } catch(e) { console.warn('Speech failed', e); }
  },
  stopSpeech() {
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch(e) {}
  },
  murmur() {
    if (!this.ctx || this.ambNode || S.muted) return;
    const sr = this.ctx.sampleRate;
    const len = sr * 3;
    const buf = this.ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i=0; i<len; i++) d[i] = (Math.random()*2-1) * (0.4 + 0.3*Math.sin(i*0.0007));
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 280; f.Q.value = 1.2;
    const g = this.ctx.createGain();
    g.gain.value = 0.04;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start();
    this.ambNode = src; this.ambGain = g;
  },
  stopMurmur() {
    this.stopSpeech();
    if (this.ambNode) {
      try { this.ambNode.stop(); } catch(e){}
      this.ambNode = null; this.ambGain = null;
    }
  },
};

/* ===== PIXEL RENDER ===== */
const Canvas = {
  ctx: null, w: 800, h: 360,
  shake: 0, flash: 0, frame: 0,
  floaters: [],
  init() {
    const c = document.getElementById('courtCanvas');
    this.ctx = c.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.loop();
  },
  px(x,y,w,h,color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x,y,w,h);
  },
  loop() {
    this.frame++;
    if (S.court || S.duel) this.draw();
    if (this.shake > 0) this.shake--;
    if (this.flash > 0) this.flash--;
    // Update floaters
    this.floaters = this.floaters.filter(f => {
      f.t++;
      f.y -= 0.6;
      return f.t < 90;
    });
    requestAnimationFrame(()=>this.loop());
  },
  addFloater(text, x, y, color='#5aaa4a') {
    this.floaters.push({ text, x, y, color, t: 0 });
  },
  shakeIt() { this.shake = 18; },
  flashIt() { this.flash = 14; },

  drawLawyer(ox, oy, p, faceRight, idleBob, mood='normal') {
    const px = (x,y,w,h,color) => {
      const fx = faceRight ? x : (17-x-w);
      this.px(ox + fx*3, oy + (y+idleBob)*3, w*3, h*3, color);
    };
    const tie = p.tieColor || PAL.tieRed;
    const hair = p.hairColor || PAL.hair2;
    // Hair top
    px(5, 0, 8, 3, hair);
    px(4, 2, 2, 3, hair);
    px(12, 2, 2, 3, hair);
    // Face
    px(5, 3, 8, 6, PAL.skin);
    // Eyes
    if (mood === 'angry') {
      px(7, 5, 2, 1, PAL.ink);
      px(10, 5, 2, 1, PAL.ink);
    } else {
      px(7, 5, 1, 1, PAL.ink);
      px(10, 5, 1, 1, PAL.ink);
    }
    // Mouth
    if (mood === 'shocked') {
      px(8, 7, 2, 2, PAL.ink);
    } else if (mood === 'smirk') {
      px(8, 7, 3, 1, PAL.ink);
    } else {
      px(8, 7, 2, 1, PAL.ink);
    }
    // Neck
    px(7, 9, 4, 1, PAL.skinDark);
    // Suit body
    px(2, 10, 14, 12, PAL.suit);
    // Suit lapels (V)
    px(6, 10, 1, 6, PAL.suitDark);
    px(11, 10, 1, 6, PAL.suitDark);
    // Shirt
    px(7, 10, 4, 8, PAL.shirt);
    // Tie
    px(8, 11, 2, 7, tie);
    px(8, 10, 2, 1, PAL.shirt);
    // Arms
    px(0, 11, 2, 9, PAL.suit);
    px(16, 11, 2, 9, PAL.suit);
    // Hands
    px(0, 20, 2, 2, PAL.skin);
    px(16, 20, 2, 2, PAL.skin);
    // Legs
    px(4, 22, 4, 6, PAL.suitDark);
    px(10, 22, 4, 6, PAL.suitDark);
    // Shoes
    px(3, 27, 5, 1, '#000');
    px(10, 27, 5, 1, '#000');
  },

  drawJudge(ox, oy, bob) {
    const px = (x,y,w,h,c) => this.px(ox + x*3, oy + (y+bob)*3, w*3, h*3, c);
    // Robe
    px(2, 9, 18, 16, PAL.judge);
    // Robe collar
    px(7, 9, 6, 3, PAL.shirt);
    // Hair (gray)
    px(5, 0, 10, 4, '#8a8a8a');
    px(4, 2, 2, 4, '#8a8a8a');
    px(14, 2, 2, 4, '#8a8a8a');
    // Face
    px(6, 4, 8, 6, PAL.skinDark);
    // Eyes
    px(8, 6, 1, 1, PAL.ink);
    px(11, 6, 1, 1, PAL.ink);
    // Mouth
    px(9, 8, 3, 1, PAL.ink);
  },

  drawJuror(ox, oy, color, t) {
    const bob = Math.floor(Math.sin((this.frame + t*7)*0.04) * 1);
    const px = (x,y,w,h,c) => this.px(ox+x*2, oy+(y+bob)*2, w*2, h*2, c);
    px(2, 0, 6, 4, color);          // head
    px(3, 1, 1, 1, PAL.ink);        // eye
    px(6, 1, 1, 1, PAL.ink);        // eye
    px(1, 4, 8, 7, PAL.suit);       // body
    px(4, 4, 2, 5, color === PAL.hair ? PAL.tieRed : PAL.tieBlue); // tie
  },

  drawWitness(ox, oy, bob, mood) {
    const px = (x,y,w,h,c) => this.px(ox+x*2, oy+(y+bob)*2, w*2, h*2, c);
    // hair
    px(4, 0, 10, 4, PAL.hair3);
    // head
    px(5, 3, 8, 7, PAL.skin);
    // eyes
    px(7, 5, 1, 1, PAL.ink);
    px(10, 5, 1, 1, PAL.ink);
    // mouth
    if (mood === 'scared') {
      px(8, 7, 2, 2, PAL.ink);
    } else {
      px(8, 7, 2, 1, PAL.ink);
    }
    // shirt
    px(3, 10, 12, 8, '#cca0a0');
    // sweat if scared
    if (mood === 'scared' && this.frame % 60 < 30) {
      px(12, 5, 1, 2, '#8acfff');
    }
  },

  drawCourtroom() {
    const ctx = this.ctx;
    // Sky/upper wall
    const grd = ctx.createLinearGradient(0, 0, 0, this.h);
    grd.addColorStop(0, '#2a1f3d');
    grd.addColorStop(0.6, '#1a1226');
    grd.addColorStop(1, '#0d0818');
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,this.w,this.h);

    // Wood panel back wall
    this.px(0, 60, this.w, 110, PAL.wood);
    // Panel lines
    for (let x=0; x<this.w; x+=80) {
      this.px(x, 60, 2, 110, PAL.woodDark);
    }
    // Window slits
    this.px(40, 70, 80, 50, PAL.woodDark);
    this.px(50, 76, 60, 38, '#3a4a6a');
    this.px(620, 70, 80, 50, PAL.woodDark);
    this.px(630, 76, 60, 38, '#3a4a6a');

    // Floor and center carpet
    this.px(0, 250, this.w, this.h-250, PAL.floor);
    this.px(260, 250, 280, this.h-250, PAL.carpet);
    for (let x=0; x<this.w; x+=40) {
      this.px(x, 250, 1, this.h-250, '#1a0e08');
    }
    for (let y=256; y<this.h; y+=18) {
      this.px(270, y, 260, 1, '#5b1f2a');
    }

    // Court seal and warm lights
    this.px(377, 260, 46, 46, PAL.gold);
    this.px(383, 266, 34, 34, PAL.bg);
    this.px(391, 276, 18, 4, PAL.gold);
    this.px(397, 270, 6, 22, PAL.gold);
    this.px(145, 26, 26, 8, PAL.neonGold);
    this.px(629, 26, 26, 8, PAL.neonGold);

    // Judge bench (center top)
    this.px(280, 130, 240, 100, PAL.woodDark);
    this.px(280, 130, 240, 8, PAL.gold);
    this.px(280, 226, 240, 6, PAL.woodLight);
    // Bench front detail
    this.px(310, 150, 30, 60, PAL.wood);
    this.px(360, 150, 30, 60, PAL.wood);
    this.px(410, 150, 30, 60, PAL.wood);
    this.px(460, 150, 30, 60, PAL.wood);

    // Judge
    const jb = Math.floor(Math.sin(this.frame*0.04)*1);
    this.drawJudge(360, 70, jb);
    // Gavel block
    this.px(310, 215, 14, 8, PAL.wood);
    this.px(470, 215, 18, 5, PAL.woodLight);

    // Curtains / drapes
    this.px(0, 0, 30, 250, PAL.curtain);
    this.px(this.w-30, 0, 30, 250, PAL.curtain);
    for (let y=0; y<250; y+=20) {
      this.px(8, y, 2, 18, '#2a0808');
      this.px(this.w-12, y, 2, 18, '#2a0808');
    }

    // Witness stand (right)
    this.px(600, 195, 90, 60, PAL.wood);
    this.px(600, 195, 90, 5, PAL.gold);
    // Witness inside
    const wb = Math.floor(Math.sin(this.frame*0.06)*1);
    const witMood = S.court && S.court.witnessConfidence < 40 ? 'scared' : 'normal';
    this.drawWitness(615, 150, wb, witMood);

    // Jury box (left side)
    this.px(45, 200, 130, 50, PAL.woodDark);
    this.px(45, 200, 130, 4, PAL.gold);
    // Jurors
    const juryColors = [PAL.hair, PAL.hair2, PAL.hair3, PAL.skinDark];
    for (let i=0; i<4; i++) {
      this.drawJuror(55 + i*30, 175, juryColors[i % 4], i);
    }

    // Lawyer podiums
    this.px(180, 290, 80, 30, PAL.wood);
    this.px(180, 290, 80, 4, PAL.gold);
    this.px(540, 290, 80, 30, PAL.wood);
    this.px(540, 290, 80, 4, PAL.gold);

    // Lawyers
    const c = S.court;
    if (c) {
      const pBob = Math.floor(Math.sin(this.frame*0.08)*1);
      const oBob = Math.floor(Math.sin(this.frame*0.08 + 2)*1);
      const pMood = c.lastResult === 'good' && c.lastSide === 'player' ? 'smirk' :
                    c.lastResult === 'bad' && c.lastSide === 'player' ? 'shocked' : 'normal';
      const oMood = c.lastResult === 'good' && c.lastSide === 'player' ? 'shocked' :
                    c.lastResult === 'bad' && c.lastSide === 'player' ? 'smirk' :
                    c.opp.personality === 'intimidating' ? 'angry' : 'normal';
      this.drawLawyer(195, 240, c.player, true, pBob, pMood);
      this.drawLawyer(555, 240, c.opp, false, oBob, oMood);

      // Name plates
      this.ctx.font = '10px Courier New';
      this.ctx.fillStyle = PAL.gold;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(c.player.name || 'You', 230, 332);
      this.ctx.fillText(c.opp.name, 590, 332);
      this.ctx.textAlign = 'left';
    }

    // Flash overlay
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(244, 208, 88, ${this.flash/14 * 0.5})`;
      ctx.fillRect(0,0,this.w,this.h);
    }

    // Floaters
    for (const f of this.floaters) {
      const alpha = f.t > 60 ? (90-f.t)/30 : 1;
      ctx.font = 'bold 18px Courier New';
      ctx.fillStyle = f.color;
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
  },

  draw() {
    const ctx = this.ctx;
    let dx = 0, dy = 0;
    if (this.shake > 0) {
      dx = (Math.random()-0.5) * this.shake * 0.6;
      dy = (Math.random()-0.5) * this.shake * 0.6;
    }
    ctx.save();
    ctx.translate(dx, dy);
    this.drawCourtroom();
    ctx.restore();
  },
};

/* ===== UI helpers ===== */
const UI = {
  $(id) { return document.getElementById(id); },
  show(id) { this.$(id).classList.remove('hidden'); },
  hide(id) { this.$(id).classList.add('hidden'); },
  setText(id, t) { this.$(id).textContent = t; },
  setHTML(id, h) { this.$(id).innerHTML = h; },

  switchTo(phase) {
    ['menu','howto','credits','style','office','investigation','negotiation','court','verdict','duel'].forEach(s=>{
      const el = this.$(s);
      if (el) el.classList.add('hidden');
    });
    if (this.$(phase)) this.$(phase).classList.remove('hidden');
    if (phase === 'menu') this.hide('topbar'); else this.show('topbar');

    const label = { menu:'Menu', style:'Career', office:'Case Prep', investigation:'Investigation',
                    negotiation:'Negotiation', court:'Courtroom', verdict:'Verdict', duel:'Duel Setup',
                    howto:'How to Play', credits:'Credits' }[phase] || 'Phase';
    this.setText('phaseLabel', label);
    S.phase = phase;
    this.refreshTopBar();
  },

  refreshTopBar() {
    if (S.player) {
      this.setText('playerLabel', `${S.player.name} • ${STYLES[S.player.style].name}`);
      this.setText('moneyLabel', `$${S.player.money.toLocaleString()}`);
      this.setText('repLabel', `Rep ${S.player.reputation}`);
    }
    this.setText('caseLabel', S.caseData ? S.caseData.title : '—');
    this.$('muteBtn').textContent = S.muted ? '🔇' : '🔊';
    const voiceBtn = this.$('voiceBtn');
    if (voiceBtn) voiceBtn.textContent = S.voiceEnabled ? 'Voice ON' : 'Voice OFF';
  },

  log(boxId, text, kind='') {
    const box = this.$(boxId);
    if (!box) return;
    const entry = document.createElement('div');
    entry.className = 'entry' + (kind ? ' '+kind : '');
    entry.textContent = text;
    box.appendChild(entry);
    box.scrollTop = box.scrollHeight;
  },

  bigCue(text, ms=900) {
    const el = this.$('bigCue');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden');
    requestAnimationFrame(()=> el.classList.add('show'));
    setTimeout(()=> {
      el.classList.remove('show');
      setTimeout(()=> el.classList.add('hidden'), 200);
    }, ms);
  },
};

/* ===== GAME LOGIC ===== */
const Game = {

  init() {
    Canvas.init();
    this.bindGlobal();
    this.buildMenu();
    UI.switchTo('menu');
  },

  bindGlobal() {
    document.addEventListener('click', (e) => {
      if (!Snd.started) Snd.init();
      Snd.resume();
      const t = e.target;
      if (t.matches('[data-act]')) {
        const a = t.getAttribute('data-act');
        this.handleAct(a, t, e);
      }
    });
    document.getElementById('muteBtn').addEventListener('click', () => {
      Snd.setMuted(!S.muted);
      UI.refreshTopBar();
    });
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) voiceBtn.addEventListener('click', () => {
      S.voiceEnabled = !S.voiceEnabled;
      if (!S.voiceEnabled) Snd.stopSpeech();
      else Snd.speak('Courtroom voices enabled.', 'narrator');
      UI.refreshTopBar();
    });
    document.getElementById('menuBtn').addEventListener('click', () => {
      if (confirm('Return to main menu? Progress in current case will be lost.')) {
        Snd.stopMurmur();
        this.toMenu();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (S.phase !== 'menu') document.getElementById('menuBtn').click();
      } else if (S.phase === 'court' && e.key >= '1' && e.key <= '9') {
        const btns = document.querySelectorAll('#courtActions button');
        const idx = parseInt(e.key) - 1;
        if (btns[idx] && !btns[idx].disabled) btns[idx].click();
      } else if (e.key === ' ' && S.phase === 'verdict') {
        document.getElementById('nextCaseBtn').click();
      }
    });
  },

  handleAct(act, btn, e) {
    Snd.click();
    switch(act) {
      case 'campaign': this.startCampaign(); break;
      case 'duel': this.startDuelSetup(); break;
      case 'howto': UI.switchTo('howto'); break;
      case 'credits': UI.switchTo('credits'); break;
      case 'back-menu': this.toMenu(); break;
      case 'cancel-obj':
        UI.hide('objectionRow');
        UI.show('courtActions');
        break;
    }
  },

  toMenu() {
    Snd.stopMurmur();
    S.player = null;
    S.caseData = null;
    S.campaignIndex = 0;
    S.court = null;
    S.duel = null;
    S.randomMode = false;
    UI.switchTo('menu');
  },

  buildMenu() {
    // nothing dynamic here
  },

  /* ===== CAMPAIGN ===== */
  startCampaign() {
    S.campaignIndex = 0;
    S.randomMode = false;
    S.styleSelection = { current: null, name: '' };
    this.buildStyleSelect();
    UI.switchTo('style');
  },

  buildStyleSelect() {
    const grid = UI.$('styleGrid');
    grid.innerHTML = '';
    Object.values(STYLES).forEach(st => {
      const card = document.createElement('div');
      card.className = 'style-card';
      card.dataset.style = st.id;
      const stats = st.stats;
      card.innerHTML = `
        <h3>${st.name}</h3>
        <div>${st.desc}</div>
        <div class="stats">
          ✦ Confidence ${stats.confidence}<br>
          ⚖ Legal Skill ${stats.legalSkill}<br>
          ❀ Charm ${stats.charm}<br>
          ⚔ Intimidation ${stats.intimidation}<br>
          ◈ Logic ${stats.logic}
        </div>
      `;
      card.onclick = () => {
        document.querySelectorAll('#styleGrid .style-card').forEach(c=>c.classList.remove('selected'));
        card.classList.add('selected');
        S.styleSelection.current = st.id;
        this.refreshStyleConfirm();
      };
      grid.appendChild(card);
    });
    const nameInput = UI.$('nameInput');
    nameInput.value = '';
    nameInput.oninput = () => {
      S.styleSelection.name = nameInput.value.trim();
      this.refreshStyleConfirm();
    };
    UI.$('styleConfirm').onclick = () => this.confirmStyle();
  },

  refreshStyleConfirm() {
    UI.$('styleConfirm').disabled = !(S.styleSelection.current && S.styleSelection.name.length > 0);
  },

  confirmStyle() {
    const st = STYLES[S.styleSelection.current];
    S.player = {
      name: S.styleSelection.name,
      style: st.id,
      stats: { ...st.stats },
      money: 1000,
      reputation: 0,
      wins: 0,
      perks: [],
    };
    this.startCase(0);
  },

  startCase(idx) {
    S.campaignIndex = idx;
    S.caseData = CASES[idx];
    S.invest = { visited: {}, clues: [], left: 2, revealed: [] };
    S.negot = null;
    this.buildPrep();
    UI.switchTo('office');
    UI.refreshTopBar();
  },

  /* ===== PREP ===== */
  buildPrep() {
    UI.$('prepTitle').textContent = 'Case Prep: ' + S.caseData.title;
    UI.$('prepIntro').textContent = S.caseData.intro;
    S.prep.selected = [];
    S.prep.points = 6;

    // Build pool: case-specific evidence + 2 random useful ones
    const allIds = [...S.caseData.evidencePool];
    S.prep.pool = allIds;

    this.renderPrepPool();
    UI.$('prepConfirm').onclick = () => {
      if (S.prep.selected.length === 0) {
        if (!confirm('Walk into court with zero evidence? Risky.')) return;
      }
      this.startInvestigation();
    };
  },

  renderPrepPool() {
    const pool = UI.$('prepPool');
    pool.innerHTML = '';
    S.prep.pool.forEach(id => {
      const ev = EVIDENCE[id];
      const sel = S.prep.selected.includes(id);
      const canAfford = sel || S.prep.points >= ev.cost;
      const card = document.createElement('div');
      card.className = 'ev-card' + (sel ? ' selected' : '');
      card.innerHTML = `
        <div class="ev-cost">${ev.cost}p</div>
        <div class="ev-name">${ev.name}</div>
        <div class="ev-desc">${ev.desc}</div>
        <div class="ev-stats">
          <span>STR ${ev.strength}</span>
          <span>RISK ${ev.risk}</span>
        </div>
      `;
      if (!canAfford) card.style.opacity = '0.4';
      card.onclick = () => {
        Snd.paper();
        if (sel) {
          S.prep.selected = S.prep.selected.filter(x => x !== id);
          S.prep.points += ev.cost;
        } else if (canAfford) {
          S.prep.selected.push(id);
          S.prep.points -= ev.cost;
        }
        this.renderPrepPool();
      };
      pool.appendChild(card);
    });
    UI.$('prepPoints').textContent = S.prep.points;
    UI.$('prepCount').textContent = S.prep.selected.length;
  },

  /* ===== INVESTIGATION ===== */
  startInvestigation() {
    this.renderInvestigation();
    UI.switchTo('investigation');
  },

  renderInvestigation() {
    UI.$('investLeft').textContent = S.invest.left;
    const grid = UI.$('locList');
    grid.innerHTML = '';
    LOCATIONS.forEach(loc => {
      const card = document.createElement('div');
      card.className = 'loc-card' + (S.invest.visited[loc.id] ? ' used' : '');
      card.innerHTML = `
        <div class="loc-icon">${loc.icon}</div>
        <h3>${loc.name}</h3>
        <p>${loc.desc}</p>
      `;
      if (!S.invest.visited[loc.id] && S.invest.left > 0) {
        card.onclick = () => this.visit(loc);
      }
      grid.appendChild(card);
    });
    // Clues
    const ul = UI.$('cluesList');
    ul.innerHTML = '';
    if (S.invest.clues.length === 0) {
      ul.innerHTML = '<li style="color:var(--ink-dim);font-style:italic">No clues yet.</li>';
    } else {
      S.invest.clues.forEach(c => {
        const li = document.createElement('li');
        li.textContent = c;
        ul.appendChild(li);
      });
    }
    UI.$('investConfirm').onclick = () => this.startNegotiation();
  },

  visit(loc) {
    S.invest.visited[loc.id] = true;
    S.invest.left--;
    Snd.paper();
    // Roll outcome
    const c = S.caseData;
    const r = Math.random();
    let clue = '';
    if (loc.id === 'office') {
      // Discover hint about a statement weakness
      const unrev = c.statements.filter((_,i) => !S.invest.revealed.includes(i));
      if (unrev.length > 0) {
        const idx = c.statements.indexOf(unrev[Math.floor(Math.random()*unrev.length)]);
        S.invest.revealed.push(idx);
        clue = `📁 Office: Your client confirms — "${c.statements[idx].hint}"`;
      } else {
        clue = '📁 Office: Confidence +5. Your client is solid.';
        S.player.stats.confidence = Math.min(10, S.player.stats.confidence + 1);
      }
    } else if (loc.id === 'corp') {
      // Risky: reveal something or backfire
      if (r < 0.6) {
        const unrev = c.statements.filter((_,i) => !S.invest.revealed.includes(i));
        if (unrev.length > 0) {
          const idx = c.statements.indexOf(unrev[Math.floor(Math.random()*unrev.length)]);
          S.invest.revealed.push(idx);
          clue = `🏛️ Corporate Tower: An insider whispers — "${c.statements[idx].hint}"`;
        } else {
          clue = `🏛️ Corporate Tower: You read the opposing counsel. Logic +1.`;
          S.player.stats.logic = Math.min(10, S.player.stats.logic + 1);
        }
      } else {
        clue = `🏛️ Corporate Tower: They saw you coming. Opposing counsel is forewarned.`;
        S.invest.coldOpp = true;
      }
    } else if (loc.id === 'records') {
      // Safer: small bonus or weakness reveal
      if (r < 0.5) {
        const unrev = c.statements.filter((_,i) => !S.invest.revealed.includes(i));
        if (unrev.length > 0) {
          const idx = c.statements.indexOf(unrev[Math.floor(Math.random()*unrev.length)]);
          S.invest.revealed.push(idx);
          clue = `📜 Records: A filed precedent points to — "${c.statements[idx].hint}"`;
        } else {
          clue = `📜 Records: Useful precedents reinforce your case. Legal Skill +1.`;
          S.player.stats.legalSkill = Math.min(10, S.player.stats.legalSkill + 1);
        }
      } else {
        clue = `📜 Records: Hours of dust and ledgers. Legal Skill +1.`;
        S.player.stats.legalSkill = Math.min(10, S.player.stats.legalSkill + 1);
      }
    }
    S.invest.clues.push(clue);
    this.renderInvestigation();
    if (S.invest.left === 0) {
      // disable further visits visually
    }
  },

  /* ===== NEGOTIATION ===== */
  startNegotiation() {
    const c = S.caseData;
    const baseOffer = Math.round(c.reward.money * 0.5);
    S.negot = {
      mood: 50,
      offer: baseOffer,
      rounds: 3,
      done: false,
      personality: c.opponent.personality,
    };
    UI.$('negotIntro').textContent =
      `${c.opponent.name}, opposing counsel, sits across the table. ${this.personalityFlavor(c.opponent.personality)}`;
    UI.$('negotLog').innerHTML = '';
    this.renderNegot();
    UI.switchTo('negotiation');
    UI.$('acceptSettle').onclick = () => this.acceptSettlement();
    UI.$('goToCourt').onclick = () => this.enterCourtroom();
    UI.log('negotLog', `${c.opponent.name}: "I'm here. Make me a serious offer or I'll see you in court."`, 'ai');
  },

  personalityFlavor(p) {
    return {
      charming: "Smiles, charming. The smile does not reach the eyes.",
      technical: "Lays out a binder, opens it precisely to a tabbed page.",
      intimidating: "Doesn't bother to sit. Looms instead.",
    }[p] || "Cold and unreadable.";
  },

  renderNegot() {
    const n = S.negot;
    const moodLabel = n.mood >= 70 ? 'Receptive' : n.mood >= 55 ? 'Open' : n.mood >= 40 ? 'Neutral' : n.mood >= 20 ? 'Tense' : 'Hostile';
    UI.$('negotMood').textContent = moodLabel;
    UI.$('negotOffer').textContent = '$' + n.offer.toLocaleString();
    UI.$('negotRounds').textContent = n.rounds;
    // Even when negotiation rounds are over, the player must still be able
    // to accept the final offer or reject it and go to court.
    UI.$('acceptSettle').disabled = n.offer <= 0;
    UI.$('goToCourt').disabled = false;

    const tactics = [
      { id:'calm', name:'Calm Reasoning', stat:'logic' },
      { id:'press', name:'Aggressive Pressure', stat:'intimidation' },
      { id:'bluff', name:'Bluff', stat:'confidence' },
      { id:'charm', name:'Charm', stat:'charm' },
      { id:'threat', name:'Legal Threat', stat:'legalSkill' },
    ];
    const row = UI.$('negotActions');
    row.innerHTML = '';
    tactics.forEach(t => {
      const b = document.createElement('button');
      b.textContent = t.name;
      b.disabled = n.done || n.rounds <= 0;
      b.onclick = () => this.negotMove(t);
      row.appendChild(b);
    });
  },

  negotMove(t) {
    const n = S.negot;
    const stat = S.player.stats[t.stat];
    let moodDelta = 0, offerDelta = 0, line = '';
    const r = Math.random();

    // Personality reactions
    const p = n.personality;
    if (t.id === 'calm') {
      moodDelta = 4 + Math.round(stat * 0.6);
      offerDelta = Math.round(S.caseData.reward.money * 0.05);
      line = `${S.caseData.opponent.name}: "I appreciate the measured approach. Slightly better offer."`;
    } else if (t.id === 'press') {
      if (p === 'intimidating') {
        moodDelta = -10; offerDelta = -Math.round(S.caseData.reward.money * 0.03);
        line = `${S.caseData.opponent.name} smirks: "Pressure won't work on me, counselor."`;
      } else if (p === 'charming') {
        moodDelta = -5; offerDelta = Math.round(S.caseData.reward.money * 0.04);
        line = `${S.caseData.opponent.name}: "Easy there. Fine — a small bump."`;
      } else {
        moodDelta = -3 + Math.round(stat * 0.4);
        offerDelta = Math.round(stat * 80);
        line = `${S.caseData.opponent.name}: "Noted. I'll adjust."`;
      }
    } else if (t.id === 'bluff') {
      if (r < 0.5 + stat*0.04) {
        moodDelta = -2; offerDelta = Math.round(S.caseData.reward.money * 0.08);
        line = `${S.caseData.opponent.name}: "...If you really have that, fine, take more."`;
      } else {
        moodDelta = -8; offerDelta = -Math.round(S.caseData.reward.money * 0.06);
        line = `${S.caseData.opponent.name}: "That's a bluff and we both know it."`;
      }
    } else if (t.id === 'charm') {
      if (p === 'charming') {
        moodDelta = 2 + Math.round(stat * 0.3);
        line = `${S.caseData.opponent.name}: "Cute. Try harder."`;
      } else {
        moodDelta = 5 + Math.round(stat * 0.5);
        offerDelta = Math.round(stat * 60);
        line = `${S.caseData.opponent.name}: "Hm. You're hard to dislike."`;
      }
    } else if (t.id === 'threat') {
      if (p === 'technical') {
        moodDelta = -2 + Math.round(stat * 0.3);
        offerDelta = Math.round(stat * 100);
        line = `${S.caseData.opponent.name}: "Cite the precedent? Fine, that's worth something."`;
      } else {
        moodDelta = -4 + Math.round(stat * 0.3);
        offerDelta = Math.round(stat * 70);
        line = `${S.caseData.opponent.name}: "I'll take that under advisement."`;
      }
    }

    n.mood = Math.max(0, Math.min(100, n.mood + moodDelta));
    n.offer = Math.max(0, n.offer + offerDelta);
    n.rounds--;

    UI.log('negotLog', `You: ${t.name}.`, '');
    UI.log('negotLog', line, 'ai');
    if (offerDelta > 0) UI.log('negotLog', `Offer increased by $${offerDelta.toLocaleString()}.`, 'good');
    if (offerDelta < 0) UI.log('negotLog', `Offer decreased by $${Math.abs(offerDelta).toLocaleString()}.`, 'bad');

    if (n.rounds <= 0) {
      n.done = true;
      UI.log('negotLog', `${S.caseData.opponent.name}: "Final offer. Take it, or we're done talking."`, 'drama');
    }
    this.renderNegot();
  },

  acceptSettlement() {
    const n = S.negot;
    if (n.offer <= 0) return;
    Snd.paper();
    // Settlement counts as partial win; endCase applies the payout once.
    this.endCase('settle', n.offer);
  },

  /* ===== COURT ===== */
  enterCourtroom() {
    const c = S.caseData;
    const pStyle = STYLES[S.player.style];
    Snd.stopMurmur();
    Snd.gavel();
    Snd.murmur();

    // Build evidence hand
    const hand = S.prep.selected.map(id => ({
      id, ...EVIDENCE[id], used: false,
    }));
    // If hand is empty, give one freebie at random risk
    if (hand.length === 0) {
      const fallback = c.evidencePool[0];
      hand.push({ id: fallback, ...EVIDENCE[fallback], used: false });
    }

    S.court = {
      mode: 'campaign',
      player: {
        name: S.player.name,
        style: S.player.style,
        tieColor: pStyle.tieColor,
        hairColor: pStyle.hairColor,
        cred: 135,
        confidence: 70 + S.player.stats.confidence * 3,
        specialUses: pStyle.special.uses,
      },
      opp: {
        name: c.opponent.name,
        personality: c.opponent.personality,
        tieColor: c.opponent.tieColor,
        hairColor: c.opponent.hairColor,
        cred: 105 + c.diff * 5,
        momentum: 0,
      },
      hand,
      statementIdx: 0,
      statementsTotal: c.statements.length,
      jury: 0,
      judge: 100,
      witnessConfidence: 100,
      focus: 25 + Math.round((S.player.stats.logic + S.player.stats.confidence) * 1.5),
      combo: 0,
      trapActive: 0,
      recessLeft: 2,
      round: 1,
      maxRounds: 26 + c.diff * 5 + Math.max(0, c.statements.length - 5),
      log: [],
      turn: 'player',
      ended: false,
      revealedWeak: [...S.invest.revealed],
      coldOpp: !!S.invest.coldOpp,
      lastResult: null,
      lastSide: null,
      closingAvailable: false,
      statementsResolved: 0,
      lastSpokenStatement: -1,
      adrenaline: 0,
      starPower: Math.min(25, Math.floor((S.player.reputation || 0) / 8)),
      audienceHeat: 0,
    };

    // Reputation now matters: famous lawyers enter with extra composure and crowd attention.
    if (S.court.starPower) {
      S.court.player.cred = Math.min(145, S.court.player.cred + Math.floor(S.court.starPower / 2));
      S.court.focus = Math.min(100, S.court.focus + S.court.starPower);
    }
    if (S.player.perks && S.player.perks.includes('Bench Whisperer')) S.court.judge = Math.min(100, S.court.judge + 10);
    if (S.player.perks && S.player.perks.includes('Evidence Hawk')) S.court.focus = Math.min(100, S.court.focus + 12);
    if (S.player.perks && S.player.perks.includes('Jury Magnet')) S.court.jury = Math.min(50, S.court.jury + 8);

    // Cold opp means opponent starts +10 cred
    if (S.court.coldOpp) S.court.opp.cred = 110;

    this.renderCourt();
    UI.switchTo('court');
    setTimeout(()=>Snd.speak('Court is now in session. Counsel, proceed.', 'judge'), 450);
    const isFirstCase = S.campaignIndex === 0 && (!S.player.wins || S.player.wins === 0);
    if (isFirstCase) {
      this.courtLog('💡 Tip: Cross-Examine to drain witness confidence and reveal weaknesses. Then present the matching evidence for a big hit. Press 1–9 to trigger actions quickly.', 'good');
    } else {
      this.courtLog('Court is in session. Read the testimony carefully — match evidence to weakness for maximum impact.', 'good');
    }
  },

  renderCourt() {
    const c = S.court;
    UI.$('pName').textContent = c.player.name || 'You';
    UI.$('oppName').textContent = c.opp.name;
    UI.$('barPlayer').style.width = Math.max(0, Math.min(100, c.player.cred)) + '%';
    UI.$('numPlayer').textContent = Math.round(c.player.cred);
    UI.$('barOpp').style.width = Math.max(0, Math.min(100, c.opp.cred)) + '%';
    UI.$('numOpp').textContent = Math.round(c.opp.cred);

    // Jury bar: -50..+50, render as left offset
    const juryPct = 50 + c.jury;
    const jb = UI.$('barJury');
    jb.style.left = juryPct + '%';
    jb.style.width = '3px';
    UI.$('numJury').textContent = (c.jury > 0 ? '+' : '') + c.jury;

    UI.$('barJudge').style.width = Math.max(0, Math.min(100, c.judge)) + '%';
    UI.$('numJudge').textContent = Math.round(c.judge);
    UI.$('barWit').style.width = Math.max(0, Math.min(100, c.witnessConfidence)) + '%';
    UI.$('numWit').textContent = Math.round(c.witnessConfidence);
    if (UI.$('trialClock')) {
      UI.$('trialClock').textContent = `${c.round || 1}/${c.maxRounds || '∞'}`;
      UI.$('barClock').style.width = Math.max(0, Math.min(100, ((c.maxRounds - c.round + 1) / c.maxRounds) * 100)) + '%';
    }
    if (UI.$('numFocus')) {
      UI.$('barFocus').style.width = Math.max(0, Math.min(100, c.focus || 0)) + '%';
      UI.$('numFocus').textContent = Math.round(c.focus || 0);
      UI.$('comboBadge').textContent = `Combo x${c.combo || 0} • Adrenaline ${Math.round(c.adrenaline || 0)}`;
      UI.$('trapBadge').textContent = c.trapActive > 0 ? 'Opponent Trap Armed' : `Star Power ${Math.round(c.starPower || 0)}`;
      UI.$('trapBadge').className = c.trapActive > 0 ? 'badge danger' : 'badge';
    }

    // Current statement
    const stmt = this.currentStatement();
    if (stmt) {
      UI.$('whoTalking').textContent = `${S.caseData.witness.name} (${S.caseData.witness.role}):`;
      UI.$('statementText').textContent = `"${stmt.text}"`;
      if (c.lastSpokenStatement !== c.statementIdx) {
        c.lastSpokenStatement = c.statementIdx;
        setTimeout(() => { Snd.witnessMumble(); Snd.speak(stmt.text, 'witness'); }, 220);
      }
      const hintEl = UI.$('hintLine');
      const idx = c.statementIdx;
      if (c.revealedWeak.includes(idx) || c.witnessConfidence < 35) {
        hintEl.classList.remove('hidden');
        hintEl.textContent = '⚡ Insight: ' + stmt.hint;
      } else {
        hintEl.classList.add('hidden');
      }
    } else {
      UI.$('whoTalking').textContent = 'The Court:';
      UI.$('statementText').textContent = '"The witness has been thoroughly examined. Counsel, your move."';
      UI.$('hintLine').classList.add('hidden');
    }
    if (UI.$('tacticTip')) UI.$('tacticTip').textContent = this.tacticTip();

    // Closing availability
    c.closingAvailable = c.statementsResolved >= Math.ceil(S.caseData.statements.length * 0.6) || c.opp.cred < 45 || c.round >= Math.max(8, c.maxRounds - 3);

    // Actions
    this.renderActions();
    this.renderHand();
    UI.hide('objectionRow');
    UI.show('courtActions');
  },

  currentStatement() {
    const c = S.court;
    if (!c) return null;
    if (c.statementIdx >= S.caseData.statements.length) return null;
    return S.caseData.statements[c.statementIdx];
  },

  renderActions() {
    const c = S.court;
    const row = UI.$('courtActions');
    row.innerHTML = '';
    const pStyle = STYLES[S.player.style];
    const stmt = this.currentStatement();
    const hasMatch = !!stmt && c.hand.some(card => !card.used && card.id === stmt.weakness);
    const actions = [
      { id:'object', label:'Object', enabled: !!stmt },
      { id:'cross', label:'Cross-Examine', enabled: !!stmt && c.witnessConfidence > 0 },
      { id:'pressure', label:'Pressure', enabled: !!stmt && c.witnessConfidence > 0 },
      { id:'read', label:'Read the Room', enabled: true },
      { id:'consult', label:'Consult Notes (10F)', enabled: c.focus >= 10 && c.hand.some(card => !card.used) },
      { id:'pin', label:'Pin Down (15F)', enabled: !!stmt && c.witnessConfidence <= 70 && c.focus >= 15 },
      { id:'expose', label:'Expose Contradiction (20F)', enabled: !!stmt && c.revealedWeak.includes(c.statementIdx) && c.focus >= 20 },
      { id:'reveal', label:'Dramatic Reveal (25F)', enabled: hasMatch && c.focus >= 25 },
      { id:'grandstand', label:'Grandstand', enabled: true },
      { id:'calm', label:'Calm Clarification', enabled: true },
      { id:'secondchair', label:'Second Chair Save', enabled: (c.adrenaline || 0) >= 35 },
      { id:'recess', label:`Recess (${c.recessLeft})`, enabled: c.recessLeft > 0 },
      { id:'special', label:`${pStyle.special.name} (${c.player.specialUses})`, enabled: c.player.specialUses > 0 },
      { id:'closing', label:'Closing Argument', enabled: c.closingAvailable },
    ];
    actions.forEach((a, i) => {
      const b = document.createElement('button');
      b.className = 'big';
      b.textContent = a.label;
      b.disabled = !a.enabled || c.turn !== 'player' || c.ended;
      b.setAttribute('aria-label', a.label);
      b.title = a.label;
      b.onclick = () => this.playerAction(a.id);
      if (a.id === 'closing' && a.enabled) b.classList.add('primary');
      row.appendChild(b);
    });
  },

  renderHand() {
    const c = S.court;
    const row = UI.$('evidenceRow');
    row.innerHTML = '';
    if (c.hand.length === 0) {
      row.innerHTML = '<div style="color:var(--ink-dim);font-style:italic;padding:8px">No evidence in hand. Rely on objections and cross-examination.</div>';
      return;
    }
    c.hand.forEach((card, i) => {
      const el = document.createElement('div');
      const curStmt = this.currentStatement();
      const isMatchCard = !card.used && curStmt && card.id === curStmt.weakness && c.revealedWeak.includes(c.statementIdx);
      el.className = 'ev-card' + (card.used ? ' used' : '') + (isMatchCard ? ' match-hint' : '');
      if (isMatchCard) el.title = '⚡ This evidence matches the current testimony!';
      el.innerHTML = `
        <div class="ev-name">${card.name}</div>
        <div class="ev-desc">${card.desc}</div>
        <div class="ev-stats"><span>STR ${card.strength}</span><span>RISK ${card.risk}</span></div>
      `;
      if (!card.used && c.turn === 'player' && !c.ended) {
        el.onclick = () => this.presentEvidence(i);
        el.title = 'Present this evidence';
      }
      row.appendChild(el);
    });
  },

  playerAction(id) {
    const c = S.court;
    if (c.ended || c.turn !== 'player') return;
    switch(id) {
      case 'object':
        UI.hide('courtActions');
        UI.show('objectionRow');
        // Bind objection buttons
        document.querySelectorAll('#objectionRow button[data-obj]').forEach(b => {
          b.onclick = () => this.resolveObjection(b.getAttribute('data-obj'));
        });
        break;
      case 'cross': this.resolveCross(); break;
      case 'pressure': this.resolvePressure(); break;
      case 'read': this.resolveReadRoom(); break;
      case 'consult': this.resolveConsultNotes(); break;
      case 'pin': this.resolvePinDown(); break;
      case 'expose': this.resolveExposeContradiction(); break;
      case 'reveal': this.resolveDramaticReveal(); break;
      case 'grandstand': this.resolveGrandstand(); break;
      case 'calm': this.resolveCalm(); break;
      case 'secondchair': this.resolveSecondChair(); break;
      case 'recess': this.resolveRecess(); break;
      case 'special': this.resolveSpecial(); break;
      case 'closing': this.resolveClosing(); break;
    }
  },

  presentEvidence(idx) {
    const c = S.court;
    if (c.ended || c.turn !== 'player') return;
    const card = c.hand[idx];
    if (card.used) return;
    const stmt = this.currentStatement();
    if (!stmt) {
      this.courtLog("No statement to challenge right now.", 'bad');
      return;
    }
    card.used = true;
    Snd.evidence();
    Canvas.flashIt();

    if (stmt.weakness === card.id) {
      // PERFECT match
      const bonus = S.player.style === 'strategist' ? 5 : 0;
      this.rewardMomentum(true, 8);
      const oppHit = 12 + card.strength + bonus + Math.round(S.player.stats.legalSkill * 0.7) + this.comboBonus();
      const juryGain = 7 + bonus + Math.min(6, c.combo);
      const pGain = 6;
      c.opp.cred = Math.max(0, c.opp.cred - oppHit);
      c.jury = Math.max(-50, Math.min(50, c.jury + juryGain));
      c.player.cred = Math.min(120, c.player.cred + pGain);
      c.witnessConfidence = Math.max(0, c.witnessConfidence - 15);
      Canvas.addFloater(`-${oppHit}`, 590, 240, '#d44a3a');
      Canvas.addFloater(`+${juryGain} jury`, 110, 200, '#d4a82c');
      this.dramaticLine('evidence_good');
      this.courtLog(`💥 DEVASTATING! ${card.name} demolishes the testimony. Opp -${oppHit} cred, Jury +${juryGain}.`, 'drama');
      c.lastResult = 'good'; c.lastSide = 'player';
      Snd.juryGasp();
      UI.bigCue('TAKE THAT!', 800);
      // Advance statement
      c.statementsResolved++;
      c.statementIdx++;
    } else {
      // mismatch
      this.rewardMomentum(false, -10);
      this.triggerTrap('misplayed evidence');
      const pHit = 10 + card.risk * 2;
      const judgeHit = 8;
      c.player.cred = Math.max(0, c.player.cred - pHit);
      c.judge = Math.max(0, c.judge - judgeHit);
      c.jury = Math.max(-50, c.jury - 3);
      Canvas.addFloater(`-${pHit}`, 230, 240, '#d44a3a');
      this.dramaticLine('evidence_bad');
      const matchEv = EVIDENCE[stmt.weakness];
      const hasMatchInHand = c.hand.some(x => !x.used && x.id === stmt.weakness);
      const matchHint = hasMatchInHand
        ? ` You have "${matchEv ? matchEv.name : '?'}" in hand — that's the right piece.`
        : (matchEv ? ` Key evidence for this statement: "${matchEv.name}".` : '');
      this.courtLog(`✗ Wrong evidence — "${card.name}" does not apply here. -${pHit} cred, judge -${judgeHit}.${matchHint}`, 'bad');
      c.lastResult = 'bad'; c.lastSide = 'player';
      Snd.warning();
    }
    this.afterPlayerTurn();
  },

  resolveObjection(type) {
    UI.show('courtActions');
    UI.hide('objectionRow');
    const c = S.court;
    if (c.ended || c.turn !== 'player') return;
    const stmt = this.currentStatement();
    if (!stmt) { this.courtLog("Nothing to object to.", 'bad'); return; }
    Snd.speak('Objection!', 'player', true);
    Snd.objection();
    Snd.crowdReact('gasp');
    Canvas.shakeIt();
    UI.bigCue('OBJECTION!', 700);

    if (stmt.obj === type) {
      this.rewardMomentum(true, 7);
      const gain = 6 + Math.round(S.player.stats.legalSkill * 0.45) + this.comboBonus();
      c.opp.cred = Math.max(0, c.opp.cred - gain);
      c.jury = Math.max(-50, Math.min(50, c.jury + 6));
      c.player.cred = Math.min(120, c.player.cred + 3);
      Canvas.addFloater(`-${gain}`, 590, 240, '#d44a3a');
      this.dramaticLine('obj_good');
      this.courtLog(`✓ Sustained! Objection on ${OBJECTIONS[type].name}. Opp -${gain} cred.`, 'good');
      c.lastResult = 'good'; c.lastSide = 'player';
    } else {
      this.rewardMomentum(false, -8);
      this.triggerTrap('bad objection');
      const pHit = 8;
      c.player.cred = Math.max(0, c.player.cred - pHit);
      c.judge = Math.max(0, c.judge - 10);
      c.jury = Math.max(-50, c.jury - 3);
      this.dramaticLine('obj_bad');
      const correctObjType = stmt.obj;
      const objHint = correctObjType
        ? `Correct objection here is "${OBJECTIONS[correctObjType].name}".`
        : `No objection applies — present matching evidence instead.`;
      this.courtLog(`✗ Overruled. ${OBJECTIONS[type].name} doesn't apply. -${pHit} cred, judge -10. ${objHint}`, 'bad');
      c.lastResult = 'bad'; c.lastSide = 'player';
      Snd.objectionFail();
      Snd.warning();
    }
    this.afterPlayerTurn();
  },

  resolveCross() {
    const c = S.court;
    const stmt = this.currentStatement();
    if (!stmt) return;
    const logicBonus = Math.round(S.player.stats.logic * 0.8);
    const drop = 14 + logicBonus + (S.player.style === 'strategist' ? 6 : 0) + Math.min(8, c.combo * 2);
    c.witnessConfidence = Math.max(0, c.witnessConfidence - drop);
    c.player.cred = Math.min(120, c.player.cred + 2);
    c.judge = Math.max(0, c.judge - 2);
    Canvas.addFloater(`-${drop} wit`, 650, 200, '#5aaa4a');
    this.dramaticLine('cross_good');
    let extra = '';
    if (c.witnessConfidence < 35 && !c.revealedWeak.includes(c.statementIdx)) {
      c.revealedWeak.push(c.statementIdx);
      extra = ' The witness is cracking — weakness revealed.';
      Snd.drama();
      Snd.crowdReact('gasp');
    }
    this.rewardMomentum(true, extra ? 10 : 5);
    this.courtLog(`Cross-examined. Witness confidence -${drop}.${extra}`, 'good');
    c.lastResult = 'good'; c.lastSide = 'player';
    this.afterPlayerTurn();
  },

  resolvePressure() {
    const c = S.court;
    const stmt = this.currentStatement();
    if (!stmt) return;
    const intim = S.player.stats.intimidation;
    const isShark = S.player.style === 'shark';
    const rollSuccess = Math.random() < (0.35 + intim*0.05 + (isShark ? 0.15 : 0));
    if (rollSuccess) {
      const witDrop = 22 + (isShark ? 8 : 0);
      this.rewardMomentum(true, 6);
      const oppHit = 8 + Math.round(intim * 0.6) + Math.min(8, c.combo * 2);
      c.witnessConfidence = Math.max(0, c.witnessConfidence - witDrop);
      c.opp.cred = Math.max(0, c.opp.cred - oppHit);
      c.judge = Math.max(0, c.judge - 10);
      Canvas.addFloater(`-${witDrop} wit`, 650, 200, '#d44a3a');
      this.dramaticLine('pressure');
      this.courtLog(`Pressure landed. Witness -${witDrop} confidence, Opp -${oppHit} cred. Judge unhappy (-10).`, 'good');
      c.lastResult = 'good'; c.lastSide = 'player';
      Snd.drama();
    } else {
      this.rewardMomentum(false, -8);
      this.triggerTrap('failed pressure tactic');
      const pHit = 8;
      c.player.cred = Math.max(0, c.player.cred - pHit);
      c.jury = Math.max(-50, c.jury - 8);
      c.judge = Math.max(0, c.judge - 12);
      const pressChance = Math.round((0.35 + intim*0.05 + (isShark ? 0.15 : 0)) * 100);
      this.courtLog(`Pressure backfired (${pressChance}% chance). The jury frowns. -${pHit} cred, jury -8, judge -12. Try Cross-Examine for a safer witness approach.`, 'bad');
      c.lastResult = 'bad'; c.lastSide = 'player';
      Snd.warning();
    }
    this.afterPlayerTurn();
  },


  resolveConsultNotes() {
    const c = S.court;
    if (!c || c.focus < 10) return;
    const stmt = this.currentStatement();
    c.focus = Math.max(0, c.focus - 10);
    Snd.pageFlip();
    const unused = c.hand.filter(card => !card.used);
    if (stmt) {
      const match = unused.find(card => card.id === stmt.weakness);
      if (match) {
        c.judge = Math.min(100, c.judge + 2);
        c.player.cred = Math.min(145, c.player.cred + 5);
        if (!c.revealedWeak.includes(c.statementIdx)) c.revealedWeak.push(c.statementIdx);
        this.courtLog(`Second chair slides you the right tab: ${match.name}. Weakness revealed, +5 cred.`, 'drama');
        Snd.speak('Counsel, tab four. This is the one.', 'narrator');
      } else {
        c.focus = Math.min(100, c.focus + 6);
        c.player.cred = Math.min(145, c.player.cred + 3);
        this.courtLog('You consult your notes and tighten the theory. +3 cred, some Focus recovered.', 'good');
      }
    } else {
      c.player.cred = Math.min(145, c.player.cred + 6);
      c.jury = Math.min(50, c.jury + 2);
      this.courtLog('You organize the record before closing. +6 cred, Jury +2.', 'good');
    }
    c.lastResult = 'good'; c.lastSide = 'player';
    this.afterPlayerTurn(true);
  },

  resolveExposeContradiction() {
    const c = S.court;
    const stmt = this.currentStatement();
    if (!stmt || c.focus < 20 || !c.revealedWeak.includes(c.statementIdx)) return;
    c.focus = Math.max(0, c.focus - 20);
    const hit = 16 + Math.round(S.player.stats.logic * 0.9) + this.comboBonus();
    const juryGain = 7 + Math.min(6, c.combo || 0);
    c.opp.cred = Math.max(0, c.opp.cred - hit);
    c.witnessConfidence = Math.max(0, c.witnessConfidence - 20);
    c.jury = Math.min(50, c.jury + juryGain);
    c.player.cred = Math.min(145, c.player.cred + 5);
    c.statementsResolved++;
    c.statementIdx++;
    this.rewardMomentum(true, 9);
    Canvas.shakeIt();
    Canvas.addFloater(`-${hit}`, 590, 240, '#d44a3a');
    UI.bigCue('CONTRADICTION!', 950);
    this.dramaticLine('cross_good');
    this.courtLog(`EXPOSE CONTRADICTION: You use the revealed weakness without spending evidence. Opp -${hit}, Jury +${juryGain}.`, 'drama');
    Snd.objection();
    Snd.crowdReact('cheer');
    c.lastResult = 'good'; c.lastSide = 'player';
    this.afterPlayerTurn();
  },

  resolveGrandstand() {
    const c = S.court;
    const charm = S.player.stats.charm;
    const safe = c.judge > 45 || S.player.style === 'charmer';
    const chance = (safe ? 0.58 : 0.35) + charm * 0.035 + Math.min(0.10, (c.starPower || 0) / 250);
    if (Math.random() < chance) {
      const juryGain = 9 + Math.round(charm * 0.6) + Math.min(5, c.combo || 0);
      const hit = 6 + Math.round(charm * 0.3);
      c.jury = Math.min(50, c.jury + juryGain);
      c.opp.cred = Math.max(0, c.opp.cred - hit);
      c.judge = Math.max(0, c.judge - 6);
      c.audienceHeat = Math.min(100, (c.audienceHeat || 0) + 15);
      this.rewardMomentum(true, 5);
      this.courtLog(`GRANDSTAND: You turn the room into theater. Jury +${juryGain}, Opp -${hit}, Judge -6.`, 'drama');
      Snd.applause();
      UI.bigCue('THE ROOM IS YOURS', 900);
      c.lastResult = 'good'; c.lastSide = 'player';
    } else {
      this.rewardMomentum(false, -5);
      this.triggerTrap('grandstanding');
      const pHit = 9;
      c.player.cred = Math.max(0, c.player.cred - pHit);
      c.judge = Math.max(0, c.judge - 14);
      c.jury = Math.max(-50, c.jury - 5);
      this.courtLog(`Grandstanding backfires. The judge cuts you off. You -${pHit}, Jury -5, Judge -14.`, 'bad');
      Snd.judgeOrder();
      c.lastResult = 'bad'; c.lastSide = 'player';
    }
    this.afterPlayerTurn();
  },

  resolveSecondChair() {
    const c = S.court;
    if (!c || (c.adrenaline || 0) < 35) return;
    c.adrenaline = Math.max(0, c.adrenaline - 35);
    c.player.cred = Math.min(145, c.player.cred + 16);
    c.focus = Math.min(100, c.focus + 18);
    c.judge = Math.min(100, c.judge + 6);
    if (this.currentStatement() && !c.revealedWeak.includes(c.statementIdx)) c.revealedWeak.push(c.statementIdx);
    this.courtLog('SECOND CHAIR SAVE: Your co-counsel catches the thread before it snaps. +16 cred, +18 Focus, weakness revealed.', 'drama');
    Snd.recess();
    Snd.speak('Breathe. You still have the record.', 'narrator');
    Canvas.flashIt();
    c.lastResult = 'good'; c.lastSide = 'player';
    this.afterPlayerTurn(true);
  },

  resolveCalm() {
    const c = S.court;
    const charm = S.player.stats.charm;
    this.rewardMomentum(true, 4);
    const gain = 4 + Math.round(charm * 0.4) + (S.player.style === 'charmer' ? 3 : 0) + Math.min(5, c.combo);
    c.player.cred = Math.min(120, c.player.cred + gain);
    c.jury = Math.max(-50, Math.min(50, c.jury + 2));
    c.judge = Math.min(100, c.judge + 4);
    Canvas.addFloater(`+${gain}`, 230, 240, '#5aaa4a');
    this.courtLog(`Calm clarification. +${gain} cred, +2 jury.`, 'good');
    c.lastResult = 'good'; c.lastSide = 'player';
    this.afterPlayerTurn();
  },

  resolveRecess() {
    const c = S.court;
    if (c.recessLeft <= 0) return;
    c.recessLeft--;
    c.player.cred = Math.min(120, c.player.cred + 10);
    c.judge = Math.min(100, c.judge + 20);
    Snd.recess();
    this.courtLog(`Recess called. Composure regained. +10 cred, judge patience +20.`, 'good');
    this.afterPlayerTurn(true); // skip opponent turn (recess)
  },

  resolveSpecial() {
    const c = S.court;
    if (c.player.specialUses <= 0) return;
    c.player.specialUses--;
    const style = S.player.style;
    Snd.drama();
    Canvas.flashIt();
    UI.bigCue(STYLES[style].special.name.toUpperCase(), 1000);

    if (style === 'closer') {
      c.player.cred = Math.min(120, c.player.cred + 20);
      c.player.confidence = Math.min(100, c.player.confidence + 15);
      c.jury = Math.max(-50, Math.min(50, c.jury + 5));
      this.courtLog(`POWER SUIT engaged. +20 cred, jury sways.`, 'drama');
    } else if (style === 'shark') {
      const hit = 22;
      c.opp.cred = Math.max(0, c.opp.cred - hit);
      c.player.cred = Math.max(0, c.player.cred - 5);
      c.judge = Math.max(0, c.judge - 8);
      Canvas.addFloater(`-${hit}`, 590, 240, '#d44a3a');
      this.courtLog(`CORPORATE PRESSURE: ${c.opp.name} reels. Opp -${hit} cred. Risky play.`, 'drama');
    } else if (style === 'strategist') {
      // Reveal current and bump jury
      const idx = c.statementIdx;
      if (!c.revealedWeak.includes(idx) && this.currentStatement()) {
        c.revealedWeak.push(idx);
      }
      c.jury = Math.max(-50, Math.min(50, c.jury + 8));
      this.courtLog(`PAPER TRAIL: weakness exposed. Jury +8.`, 'drama');
    } else if (style === 'charmer') {
      c.witnessConfidence = Math.max(0, c.witnessConfidence - 20);
      c.jury = Math.max(-50, Math.min(50, c.jury + 10));
      this.courtLog(`COLD READ: witness shaken, jury charmed. Witness -20, jury +10.`, 'drama');
    }
    this.rewardMomentum(true, 10);
    c.lastResult = 'good'; c.lastSide = 'player';
    this.afterPlayerTurn();
  },

  resolveReadRoom() {
    const c = S.court;
    const stmt = this.currentStatement();
    const gain = 15 + Math.round((S.player.stats.logic + S.player.stats.charm) * 0.4);
    c.focus = Math.min(100, c.focus + gain);
    c.judge = Math.min(100, c.judge + 3);
    c.player.cred = Math.min(130, c.player.cred + 4);
    if (stmt && !c.revealedWeak.includes(c.statementIdx) && (c.focus > 55 || c.witnessConfidence < 65)) {
      c.revealedWeak.push(c.statementIdx);
      this.courtLog(`You read the room. The weak point becomes visible: ${stmt.hint}`, 'drama');
      Snd.drama();
    } else {
      this.courtLog(`You slow the pace and read the room. Focus +${gain}, Judge +3.`, 'good');
      Snd.paper();
    }
    c.lastResult = 'good'; c.lastSide = 'player';
    this.afterPlayerTurn();
  },

  resolvePinDown() {
    const c = S.court;
    const stmt = this.currentStatement();
    if (!stmt || c.focus < 15) return;
    c.focus = Math.max(0, c.focus - 15);
    const hit = 10 + Math.round(S.player.stats.logic * 0.7) + Math.min(10, c.combo * 2);
    const wit = 18 + Math.round(S.player.stats.confidence * 0.5);
    c.opp.cred = Math.max(0, c.opp.cred - hit);
    c.witnessConfidence = Math.max(0, c.witnessConfidence - wit);
    c.jury = Math.max(-50, Math.min(50, c.jury + 5));
    this.rewardMomentum(true, 6);
    Canvas.addFloater(`-${hit}`, 590, 240, '#d44a3a');
    Canvas.addFloater(`-${wit} wit`, 650, 200, '#d4a82c');
    this.dramaticLine('cross_good');
    this.courtLog(`PIN DOWN: You trap the witness in a narrow answer. Opp -${hit}, Witness -${wit}, Jury +5.`, 'drama');
    Snd.objection();
    c.lastResult = 'good'; c.lastSide = 'player';
    if (c.witnessConfidence <= 0) { c.statementsResolved++; c.statementIdx++; }
    this.afterPlayerTurn();
  },

  resolveDramaticReveal() {
    const c = S.court;
    const stmt = this.currentStatement();
    if (!stmt || c.focus < 25) return;
    const idx = c.hand.findIndex(card => !card.used && card.id === stmt.weakness);
    if (idx < 0) return;
    c.focus = Math.max(0, c.focus - 25);
    const card = c.hand[idx];
    card.used = true;
    const hit = 24 + card.strength + Math.round(S.player.stats.legalSkill * 0.8) + this.comboBonus();
    const juryGain = 12 + Math.min(8, c.combo);
    c.opp.cred = Math.max(0, c.opp.cred - hit);
    c.jury = Math.max(-50, Math.min(50, c.jury + juryGain));
    c.witnessConfidence = Math.max(0, c.witnessConfidence - 25);
    c.player.cred = Math.min(135, c.player.cred + 8);
    this.rewardMomentum(true, 12);
    Canvas.flashIt();
    Canvas.shakeIt();
    Canvas.addFloater(`-${hit}`, 590, 240, '#d44a3a');
    UI.bigCue('DRAMATIC REVEAL', 1100);
    this.dramaticLine('evidence_good');
    this.courtLog(`DRAMATIC REVEAL: ${card.name} lands perfectly. Opp -${hit}, Jury +${juryGain}.`, 'drama');
    Snd.objection();
    Snd.juryGasp();
    Snd.crowdReact('cheer');
    c.lastResult = 'good'; c.lastSide = 'player';
    c.statementsResolved++;
    c.statementIdx++;
    this.afterPlayerTurn();
  },

  resolveClosing() {
    const c = S.court;
    if (!c.closingAvailable) return;
    c.ended = true;
    Snd.drama();
    Snd.gavel();
    Canvas.flashIt();
    Canvas.shakeIt();
    UI.bigCue('CLOSING ARGUMENT', 1200);
    this.dramaticLine('closing');

    // Calculate final
    const credDiff = c.player.cred - c.opp.cred;
    const charmBonus = S.player.style === 'closer' ? 15 : (S.player.style === 'charmer' ? 8 : 0);
    const score = credDiff + c.jury * 1.5 + charmBonus + (S.player.stats.charm + S.player.stats.legalSkill) * 1.2 + (c.focus || 0) * 0.25 + (c.combo || 0) * 5 + c.statementsResolved * 4;
    let outcome;
    if (score > 35) outcome = 'won';
    else if (score > 0) outcome = 'won';
    else if (score > -30) outcome = 'hung';
    else outcome = 'lost';

    this.courtLog(`Closing delivered. Final score ${Math.round(score)}.`, 'drama');
    setTimeout(()=> this.endCase(outcome), 1500);
  },

  afterPlayerTurn(skipOpp) {
    if (S.court && S.court.mode === 'campaign') {
      S.court.round = (S.court.round || 1) + 1;
      S.court.judge = Math.max(0, S.court.judge - 1);
      if (S.court.trapActive > 0) S.court.trapActive--;
      this.courtEvent();
    }
    this.checkVerdict();
    if (S.court.ended) return;
    this.renderCourt();
    if (skipOpp) return;
    S.court.turn = 'opp';
    setTimeout(() => this.opponentTurn(), 900);
  },

  opponentTurn() {
    const c = S.court;
    if (c.ended) return;
    const opp = c.opp;
    const personality = opp.personality;
    const stmt = this.currentStatement();
    const playerAhead = c.player.cred - opp.cred;
    const lateTrial = c.round > c.maxRounds * 0.65;

    // Occasionally, pressure makes even elite opposing counsel slip. This creates playable openings.
    const blunderChance = 0.07 + (c.combo >= 3 ? 0.04 : 0) + (c.jury > 25 ? 0.04 : 0) + (c.witnessConfidence < 30 ? 0.04 : 0);
    if (Math.random() < blunderChance) {
      const gain = 8 + Math.floor(Math.random()*6);
      c.focus = Math.min(100, (c.focus || 0) + gain);
      c.jury = Math.min(50, c.jury + 4);
      c.opp.cred = Math.max(0, c.opp.cred - 6);
      c.lastResult = 'good'; c.lastSide = 'player';
      this.courtLog(`${opp.name} fumbles a page and loses the rhythm. You smell blood. Focus +${gain}, Jury +4, Opp -6.`, 'good');
      Snd.paper();
      c.turn = 'player';
      this.renderCourt();
      return;
    }

    // Smarter AI: reads meters, protects win conditions, and becomes sharper late trial.
    let action = 'present';
    const r = Math.random();
    if ((c.combo || 0) >= 3 && r < 0.55) action = 'legal_trap';
    else if ((c.focus || 0) > 80 && r < 0.22) action = 'legal_trap';
    else if (opp.cred < 45 && r < 0.42) action = 'recover';
    else if (c.judge < 28 && r < 0.55) action = 'procedural_reset';
    else if (c.witnessConfidence < 38 && stmt && r < 0.65) action = 'protect_witness';
    else if (c.jury > 20 && r < 0.55) action = personality === 'charming' ? 'charm' : 'object';
    else if (playerAhead > 35 && r < 0.52) action = personality === 'intimidating' ? 'pressure_player' : 'counter_theme';
    else if (lateTrial && r < 0.28) action = 'closing_pressure';
    else {
      if (personality === 'charming') action = r < 0.36 ? 'charm' : (r < 0.62 ? 'counter_theme' : (r < 0.82 ? 'object' : 'present'));
      else if (personality === 'technical') action = r < 0.42 ? 'present' : (r < 0.68 ? 'object' : (r < 0.86 ? 'counter_theme' : 'recover'));
      else if (personality === 'intimidating') action = r < 0.42 ? 'pressure_player' : (r < 0.68 ? 'present' : (r < 0.86 ? 'object' : 'protect_witness'));
      else if (personality === 'slippery') action = r < 0.34 ? 'counter_theme' : (r < 0.58 ? 'object' : (r < 0.78 ? 'charm' : 'present'));
      else action = r < 0.5 ? 'present' : 'charm';
    }

    let line = '', logKind = 'ai';
    switch(action) {
      case 'present': {
        const hit = 5 + Math.floor(Math.random() * 5) + (personality === 'technical' ? 2 : 0) + Math.min(3, S.caseData.diff);
        c.player.cred = Math.max(0, c.player.cred - hit);
        c.jury = Math.max(-50, c.jury - 2);
        Canvas.addFloater(`-${hit}`, 230, 240, '#d44a3a');
        line = `${opp.name}: "Counter-exhibit. Your client's own paperwork." (-${hit} cred)`;
        c.lastResult = 'bad'; c.lastSide = 'player';
        Snd.paper();
        break;
      }
      case 'object': {
        const hit = 5 + Math.floor(Math.random() * 4) + (personality === 'technical' ? 2 : 0);
        c.player.cred = Math.max(0, c.player.cred - hit);
        c.judge = Math.max(0, c.judge - 3);
        line = `${opp.name}: "Objection — counsel is trying to smuggle in a story." The court agrees. (-${hit} cred)`;
        Canvas.addFloater(`-${hit}`, 230, 240, '#d44a3a');
        Canvas.shakeIt();
        Snd.objection();
        c.lastResult = 'bad'; c.lastSide = 'player';
        break;
      }
      case 'counter_theme': {
        const hit = 6 + Math.floor(Math.random() * 5) + (personality === 'slippery' ? 2 : 0);
        c.player.cred = Math.max(0, c.player.cred - hit);
        c.jury = Math.max(-50, c.jury - 3);
        line = `${opp.name}: "Nice performance. Now let's return to what the documents actually say." (-${hit} cred, jury shifts)`;
        Canvas.addFloater(`-${hit}`, 230, 240, '#d44a3a');
        Snd.drama();
        c.lastResult = 'bad'; c.lastSide = 'player';
        break;
      }
      case 'closing_pressure': {
        const hit = 7 + Math.floor(Math.random() * 5) + Math.floor(S.caseData.diff/2);
        c.player.cred = Math.max(0, c.player.cred - hit);
        c.jury = Math.max(-50, c.jury - 4);
        c.judge = Math.max(0, c.judge - 2);
        line = `${opp.name}: "The longer this goes, the clearer it becomes: counsel has no clean theory." (-${hit} cred)`;
        Canvas.flashIt();
        Snd.crowdRise();
        c.lastResult = 'bad'; c.lastSide = 'player';
        break;
      }
      case 'charm': {
        const sway = 3 + Math.floor(Math.random() * 4) + (personality === 'charming' ? 3 : 0);
        c.jury = Math.max(-50, c.jury - sway);
        Canvas.addFloater(`-${sway} jury`, 110, 200, '#d44a3a');
        line = `${opp.name}: "Members of the jury — confidence is not proof." (Jury -${sway})`;
        c.lastResult = 'bad'; c.lastSide = 'player';
        break;
      }
      case 'recover': {
        const heal = 8 + Math.floor(Math.random() * 5) + (personality === 'slippery' ? 2 : 0);
        opp.cred = Math.min(135, opp.cred + heal);
        line = `${opp.name} resets the narrative: "Let me clarify the record, your honor." (+${heal} cred)`;
        Canvas.addFloater(`+${heal}`, 590, 240, '#5aaa4a');
        c.lastResult = 'good'; c.lastSide = 'opp';
        break;
      }
      case 'procedural_reset': {
        const heal = 7 + Math.floor(Math.random() * 4);
        c.judge = Math.min(100, c.judge + 12);
        opp.cred = Math.min(135, opp.cred + heal);
        line = `${opp.name}: "For the court's patience, I'll narrow the issue." Judge steadies, opponent +${heal}.`;
        Snd.recess();
        c.lastResult = 'good'; c.lastSide = 'opp';
        break;
      }
      case 'protect_witness': {
        const heal = 12 + Math.floor(Math.random() * 6);
        c.witnessConfidence = Math.min(100, c.witnessConfidence + heal);
        line = `${opp.name}: "The witness has answered under pressure. Give them room." Witness recovers (+${heal}).`;
        Canvas.addFloater(`+${heal} wit`, 650, 200, '#5aaa4a');
        c.lastResult = 'good'; c.lastSide = 'opp';
        break;
      }
      case 'legal_trap': {
        c.trapActive = 2;
        const sway = 3 + Math.floor(Math.random() * 3);
        c.jury = Math.max(-50, c.jury - sway);
        line = `${opp.name}: "Counsel just opened a door. I advise them to walk through carefully." Legal trap armed. (Jury -${sway})`;
        Snd.drama();
        c.lastResult = 'good'; c.lastSide = 'opp';
        break;
      }
      case 'pressure_player': {
        const hit = 7 + Math.floor(Math.random() * 5) + (personality === 'intimidating' ? 2 : 0);
        c.player.cred = Math.max(0, c.player.cred - hit);
        c.judge = Math.max(0, c.judge - 3);
        line = `${opp.name} steps forward, eyes locked on you: "Be very careful, counselor." (-${hit} cred)`;
        Canvas.addFloater(`-${hit}`, 230, 240, '#d44a3a');
        Canvas.shakeIt();
        Snd.drama();
        c.lastResult = 'bad'; c.lastSide = 'player';
        break;
      }
    }
    // Adrenaline builds when the opponent lands blows, enabling a comeback tool.
    if (c.lastResult === 'bad' && c.lastSide === 'player') {
      c.adrenaline = Math.min(100, (c.adrenaline || 0) + 10 + Math.floor(Math.random()*6));
      if (c.player.cred < 55) c.adrenaline = Math.min(100, c.adrenaline + 8);
    }
    this.courtLog(line, logKind);
    if (Math.random() < 0.10 && c.turn === 'opp' && !c.ended) {
      c.focus = Math.min(100, (c.focus || 0) + 6);
      this.courtLog('You catch a micro-expression from opposing counsel. Focus +6.', 'good');
    }
    this.checkVerdict();
    if (c.ended) return;

    // Witness fatigue prevents infinite loops: if the player keeps circling, testimony advances.
    if (this.currentStatement() && c.statementsResolved < S.caseData.statements.length) {
      if ((c.witnessConfidence < 28 && Math.random() < 0.45) || c.round % 5 === 0) {
        c.statementsResolved++;
        c.statementIdx++;
        this.courtLog(`The witness is pushed into the next part of testimony.`, 'drama');
      }
    }

    c.turn = 'player';
    this.renderCourt();
  },

  checkVerdict() {
    const c = S.court;
    if (c.ended) return;
    if (c.player.cred <= 0) {
      c.ended = true;
      this.courtLog(`Your credibility is destroyed. The court rules against you.`, 'bad');
      setTimeout(()=>this.endCase('lost'), 800);
      return;
    }
    if (c.opp.cred <= 0) {
      c.ended = true;
      this.courtLog(`The opposing case has collapsed. The judge rules in your favor.`, 'drama');
      setTimeout(()=>this.endCase('won'), 800);
      return;
    }
    if (c.judge <= 0) {
      c.ended = true;
      this.courtLog(`The judge has lost all patience. Mistrial declared.`, 'bad');
      setTimeout(()=>this.endCase('hung'), 800);
      return;
    }
    if (c.mode === 'campaign' && c.round > c.maxRounds) {
      c.ended = true;
      this.courtLog(`The trial clock runs out. The judge demands final judgment from the record.`, 'drama');
      const score = (c.player.cred - c.opp.cred) + c.jury * 1.4 + (c.statementsResolved * 7) + (c.focus || 0) * 0.2 + (c.combo || 0) * 4 - ((S.caseData.statements.length - c.statementsResolved) * 5);
      const outcome = score > 12 ? 'won' : (score > -30 ? 'hung' : 'lost');
      setTimeout(()=>this.endCase(outcome), 900);
      return;
    }
    // All statements resolved AND closing not yet used: auto-prompt closing
    if (c.statementsResolved >= S.caseData.statements.length) {
      c.closingAvailable = true;
    }
  },

  rewardMomentum(success, focusDelta=0) {
    const c = S.court;
    if (!c) return;
    if (success) {
      c.combo = Math.min(5, (c.combo || 0) + 1);
      c.focus = Math.min(100, (c.focus || 0) + focusDelta);
      if (c.combo >= 3) {
        c.jury = Math.max(-50, Math.min(50, c.jury + 2));
      }
    } else {
      c.combo = 0;
      c.focus = Math.max(0, (c.focus || 0) + focusDelta);
    }
  },

  comboBonus() {
    const c = S.court;
    return c ? Math.min(18, (c.combo || 0) * 3) : 0;
  },

  triggerTrap(reason) {
    const c = S.court;
    if (!c || !c.trapActive) return false;
    const hit = 11 + (S.caseData ? S.caseData.diff : 1);
    c.player.cred = Math.max(0, c.player.cred - hit);
    c.jury = Math.max(-50, c.jury - 3);
    c.trapActive = 0;
    this.courtLog(`${c.opp.name}'s legal trap snaps shut on your ${reason}. You -${hit} cred, Jury -5.`, 'bad');
    Snd.warning();
    return true;
  },

  tacticTip() {
    const c = S.court;
    const stmt = this.currentStatement();
    if (!c) return '';
    if (c.round === 1 && S.campaignIndex === 0) return 'Welcome to court. Use Cross-Examine to weaken the witness, then Read the Room or Consult Notes to reveal the key evidence angle.';
    if ((c.adrenaline || 0) >= 35) return 'Adrenaline is ready. Second Chair Save can recover credibility and reveal an angle.';
    if (c.trapActive > 0) return 'Careful: the opponent has a legal trap armed. Avoid risky pressure or random objections.';
    if (!stmt) return 'All testimony is covered. Use Closing Argument when your credibility and jury meter are strong.';
    const hasMatch = c.hand.some(card => !card.used && card.id === stmt.weakness);
    const pressChance = Math.round((0.35 + S.player.stats.intimidation * 0.05 + (S.player.style === 'shark' ? 0.15 : 0)) * 100);
    if (hasMatch && c.focus >= 25) return 'You have the right evidence and enough Focus. Dramatic Reveal can break this testimony for maximum damage.';
    if (c.revealedWeak.includes(c.statementIdx) && c.focus >= 20) return 'Weakness revealed. Expose Contradiction can win the exchange without spending evidence.';
    if (hasMatch) return 'You likely have the right evidence — glowing card in hand. Present it, or build Focus for a Dramatic Reveal.';
    if (!c.revealedWeak.includes(c.statementIdx)) return 'No clear weakness yet. Cross-Examine or Read the Room to expose the angle. Then present matching evidence.';
    if (c.witnessConfidence <= 70 && c.focus >= 15) return 'The witness is vulnerable. Pin Down can force a damaging concession.';
    if (c.player.cred < 50) return `You are behind — Calm Clarification recovers credibility safely. Pressure has a ${pressChance}% chance (risky but powerful).`;
    return 'Balance credibility, jury opinion, and judge patience. Closing Argument is available when you have resolved enough testimony.';
  },

  courtEvent() {
    const c = S.court;
    if (!c || c.mode !== 'campaign' || c.ended) return;
    if (c.round <= 2 || c.round % 4 !== 0) return;
    const type = (Math.floor(c.round / 4) + S.caseData.diff) % 4;
    if (type === 0) {
      c.judge = Math.max(0, c.judge - 6);
      this.courtLog('The judge taps the bench: "Move this along, counsel." Judge patience -6.', 'ai');
      Snd.gavel();
    } else if (type === 1) {
      c.jury = Math.max(-50, Math.min(50, c.jury + (c.lastSide === 'player' ? 4 : -4)));
      this.courtLog('The jury murmurs. Momentum in the room becomes visible.', 'drama');
      Snd.crowdRise();
    } else if (type === 2) {
      c.witnessConfidence = Math.max(0, c.witnessConfidence - 8);
      this.courtLog('The witness hesitates under the lights. Witness confidence -8.', 'good');
      Snd.juryGasp();
    } else {
      c.focus = Math.min(100, c.focus + 8);
      this.courtLog('A page in your notes catches your eye. Focus +8.', 'good');
      Snd.paper();
    }
  },

  courtLog(text, kind) {
    UI.log('courtLog', text, kind);
    if (kind === 'ai' || /^([A-Z][^:]{1,30}|Marcus|Talia|Evelyn|Rook|Nadia):/.test(text)) {
      Snd.speak(text, 'opponent', true);
    } else if (kind === 'bad' && text.includes('judge')) {
      Snd.speak(text, 'judge', true);
    }
  },

  dramaticLine(key) {
    const lines = DRAMATIC_LINES[key];
    if (!lines) return;
    const line = lines[Math.floor(Math.random()*lines.length)];
    this.courtLog(`You: "${line}"`, 'drama');
    Snd.speak(line, 'player', true);
  },

  /* ===== END CASE / VERDICT ===== */
  endCase(outcome, settlementAmt) {
    Snd.stopMurmur();
    const c = S.caseData;
    let title = '', text = '', art = '', money = 0, rep = 0;
    if (outcome === 'won') {
      Snd.victory();
      title = 'CASE WON';
      text = `The jury delivers their verdict. You walk out vindicated, ${S.player.name}. Word travels.`;
      art = '⚖️ ★';
      money = c.reward.money;
      rep = c.reward.reputation;
      S.player.wins = (S.player.wins || 0) + 1;
      this.bumpStat();
      this.awardPerk();
    } else if (outcome === 'lost') {
      Snd.loss();
      title = 'CASE LOST';
      text = `The verdict goes the other way. A loss is a loss, but every loss is a lesson.`;
      art = '✗';
      money = Math.round(c.reward.money * 0.1);
      rep = -Math.round(c.reward.reputation * 0.3);
    } else if (outcome === 'hung') {
      title = 'MISTRIAL / HUNG JURY';
      text = `The jury cannot reach a verdict. Neither a win nor a clean loss.`;
      art = '⚖️ ?';
      money = Math.round(c.reward.money * 0.4);
      rep = Math.round(c.reward.reputation * 0.2);
    } else if (outcome === 'settle') {
      title = 'SETTLEMENT REACHED';
      text = `You walked out with a deal. Less drama, less reputation, but money in the bank.`;
      art = '🤝';
      money = settlementAmt;
      rep = Math.round(c.reward.reputation * 0.4);
    }
    S.player.money += money;
    S.player.reputation += rep;

    UI.$('verdictTitle').textContent = title;
    UI.$('verdictArt').textContent = art;
    UI.$('verdictText').textContent = text;
    const careerTitle = S.player.reputation >= 120 ? 'Name Partner' : S.player.reputation >= 75 ? 'Courtroom Legend' : S.player.reputation >= 35 ? 'Rising Shark' : 'Associate';
    const perks = (S.player.perks && S.player.perks.length) ? S.player.perks.join(' • ') : 'None yet';
    const ct = S.court;
    const diffLabel = S.difficulty ? (S.difficulty.charAt(0).toUpperCase() + S.difficulty.slice(1)) : 'Associate';
    const caseStats = ct ? `<div class="stat-row">Statements: ${ct.statementsResolved}/${S.caseData.statements.length} &nbsp;|&nbsp; Combo peak: x${ct.combo||0} &nbsp;|&nbsp; Rounds: ${ct.round||1}</div>` : '';
    UI.$('rewardBox').innerHTML = `
      <div>Money: ${money >= 0 ? '+' : ''}$${money.toLocaleString()}</div>
      <div>Reputation: ${rep >= 0 ? '+' : ''}${rep}</div>
      <div>Difficulty: ${diffLabel}</div>
      <div>Career Rank: ${careerTitle}</div>
      <div>Perks: ${perks}</div>
      <div>Total: $${S.player.money.toLocaleString()} &nbsp;|&nbsp; Rep ${S.player.reputation}</div>
      ${caseStats}
    `;
    const nextBtn = UI.$('nextCaseBtn');
    if (S.campaignIndex < CASES.length - 1) {
      nextBtn.textContent = 'Next Case →';
      nextBtn.onclick = () => this.startCase(S.campaignIndex + 1);
    } else {
      nextBtn.textContent = 'Career Complete — Main Menu';
      nextBtn.onclick = () => this.toMenu();
    }
    UI.switchTo('verdict');
    UI.refreshTopBar();
  },

  bumpStat() {
    // Random small stat growth on win
    const keys = Object.keys(S.player.stats);
    const k = keys[Math.floor(Math.random()*keys.length)];
    if (S.player.stats[k] < 10) S.player.stats[k]++;
  },

  awardPerk() {
    if (!S.player) return;
    S.player.perks = S.player.perks || [];
    const pool = ['Bench Whisperer', 'Evidence Hawk', 'Jury Magnet'];
    // Award perks after key wins, but never duplicates.
    if ((S.player.wins || 0) % 2 !== 0) return;
    const available = pool.filter(x => !S.player.perks.includes(x));
    if (!available.length) return;
    const perk = available[Math.floor(Math.random()*available.length)];
    S.player.perks.push(perk);
  },

  /* ===== DUEL MODE ===== */
  startDuelSetup() {
    S.duelSel = { p1: null, p2: null };
    UI.$('d1Name').value = 'P1';
    UI.$('d2Name').value = 'P2';
    this.buildDuelStyleGrid('d1Styles', 1);
    this.buildDuelStyleGrid('d2Styles', 2);
    UI.$('duelStart').disabled = true;
    UI.$('duelStart').onclick = () => this.startDuel();
    UI.switchTo('duel');
  },

  buildDuelStyleGrid(targetId, playerNum) {
    const grid = UI.$(targetId);
    grid.innerHTML = '';
    Object.values(STYLES).forEach(st => {
      const card = document.createElement('div');
      card.className = 'style-card';
      card.innerHTML = `<h3>${st.name}</h3><div style="font-size:11px">${st.desc}</div>`;
      card.onclick = () => {
        grid.querySelectorAll('.style-card').forEach(c=>c.classList.remove('selected'));
        card.classList.add('selected');
        if (playerNum === 1) S.duelSel.p1 = st.id;
        else S.duelSel.p2 = st.id;
        UI.$('duelStart').disabled = !(S.duelSel.p1 && S.duelSel.p2);
      };
      grid.appendChild(card);
    });
  },

  startDuel() {
    const p1Name = UI.$('d1Name').value.trim() || 'P1';
    const p2Name = UI.$('d2Name').value.trim() || 'P2';
    const p1Style = STYLES[S.duelSel.p1];
    const p2Style = STYLES[S.duelSel.p2];

    // Deal random evidence
    const pool = Object.keys(EVIDENCE);
    const dealHand = () => {
      const shuffled = pool.slice().sort(()=>Math.random()-0.5);
      return shuffled.slice(0, 5).map(id => ({ id, ...EVIDENCE[id], used: false }));
    };

    // Duel doesn't use case statements; instead each player attacks the other directly
    S.player = null; // duel doesn't use campaign player
    S.caseData = null;

    Snd.stopMurmur();
    Snd.gavel();
    Snd.murmur();

    S.duel = {
      turn: 1, // 1 or 2
      ended: false,
      p1: {
        name: p1Name, style: p1Style.id, tieColor: p1Style.tieColor, hairColor: p1Style.hairColor,
        cred: 100, hand: dealHand(), specialUses: p1Style.special.uses,
      },
      p2: {
        name: p2Name, style: p2Style.id, tieColor: p2Style.tieColor, hairColor: p2Style.hairColor,
        cred: 100, hand: dealHand(), specialUses: p2Style.special.uses,
      },
      jury: 0, judge: 100, witnessConfidence: 100,
      round: 1, maxRounds: 24,
      recess: { 1: 2, 2: 2 },
    };

    // For canvas rendering we reuse S.court structure
    S.court = {
      mode: 'duel',
      player: S.duel.p1,
      opp: { name: S.duel.p2.name, tieColor: S.duel.p2.tieColor, hairColor: S.duel.p2.hairColor, personality: 'neutral' },
      ended: false,
      witnessConfidence: 100,
      lastResult: null, lastSide: null,
    };

    UI.$('caseLabel').textContent = 'Duel Mode';
    UI.$('playerLabel').textContent = `${p1Name} vs ${p2Name}`;
    UI.$('moneyLabel').textContent = '—';
    UI.$('repLabel').textContent = '—';
    UI.show('topbar');
    UI.switchTo('court');
    this.renderDuel();
  },

  renderDuel() {
    const d = S.duel;
    const cur = d.turn === 1 ? d.p1 : d.p2;
    const oth = d.turn === 1 ? d.p2 : d.p1;

    // Sync to court display
    S.court.player = cur;
    S.court.opp = { name: oth.name, tieColor: oth.tieColor, hairColor: oth.hairColor, personality: 'neutral' };
    S.court.witnessConfidence = d.witnessConfidence;

    UI.$('pName').textContent = cur.name + ' (turn)';
    UI.$('oppName').textContent = oth.name;
    UI.$('barPlayer').style.width = Math.max(0, Math.min(100, cur.cred)) + '%';
    UI.$('numPlayer').textContent = Math.round(cur.cred);
    UI.$('barOpp').style.width = Math.max(0, Math.min(100, oth.cred)) + '%';
    UI.$('numOpp').textContent = Math.round(oth.cred);
    const juryPct = 50 + d.jury;
    UI.$('barJury').style.left = juryPct + '%';
    UI.$('numJury').textContent = (d.jury > 0 ? '+' : '') + d.jury;
    UI.$('barJudge').style.width = Math.max(0, Math.min(100, d.judge)) + '%';
    UI.$('numJudge').textContent = Math.round(d.judge);
    UI.$('barWit').style.width = Math.max(0, Math.min(100, d.witnessConfidence)) + '%';
    UI.$('numWit').textContent = Math.round(d.witnessConfidence);
    if (UI.$('trialClock')) {
      UI.$('trialClock').textContent = `${d.round}/${d.maxRounds}`;
      UI.$('barClock').style.width = Math.max(0, Math.min(100, ((d.maxRounds - d.round + 1) / d.maxRounds) * 100)) + '%';
    }
    if (UI.$('numFocus')) {
      UI.$('barFocus').style.width = '0%';
      UI.$('numFocus').textContent = '—';
      UI.$('comboBadge').textContent = 'Hot-seat Duel';
      UI.$('trapBadge').textContent = 'No AI Trap';
      UI.$('trapBadge').className = 'badge';
      UI.$('tacticTip').textContent = 'Duel mode is direct courtroom combat. Use evidence and specials to break the other lawyer before the clock ends.';
    }

    UI.$('whoTalking').textContent = `${cur.name}'s Turn:`;
    UI.$('statementText').textContent = `"Choose your move. The court is watching."`;
    UI.$('hintLine').classList.add('hidden');

    // Actions
    const row = UI.$('courtActions');
    row.innerHTML = '';
    const sp = STYLES[cur.style];
    const acts = [
      { id:'duel_obj', label:'Attack: Objection', enabled: true },
      { id:'duel_cross', label:'Attack: Argument', enabled: true },
      { id:'duel_pressure', label:'Attack: Pressure', enabled: true },
      { id:'duel_calm', label:'Defend: Composure', enabled: true },
      { id:'duel_recess', label:`Recess (${d.recess[d.turn]})`, enabled: d.recess[d.turn] > 0 },
      { id:'duel_special', label:`${sp.special.name} (${cur.specialUses})`, enabled: cur.specialUses > 0 },
      { id:'duel_closing', label:'Closing (Finisher)', enabled: oth.cred < 60 || d.jury > 12 },
    ];
    acts.forEach(a => {
      const b = document.createElement('button');
      b.className = 'big';
      b.textContent = a.label;
      b.disabled = !a.enabled || d.ended;
      b.onclick = () => this.duelAction(a.id);
      if (a.id === 'duel_closing' && a.enabled) b.classList.add('primary');
      row.appendChild(b);
    });

    // Hand
    const hand = UI.$('evidenceRow');
    hand.innerHTML = '';
    cur.hand.forEach((card, i) => {
      const el = document.createElement('div');
      el.className = 'ev-card' + (card.used ? ' used' : '');
      el.innerHTML = `
        <div class="ev-name">${card.name}</div>
        <div class="ev-desc">${card.desc}</div>
        <div class="ev-stats"><span>STR ${card.strength}</span><span>RISK ${card.risk}</span></div>
      `;
      if (!card.used && !d.ended) {
        el.onclick = () => this.duelPresent(i);
      }
      hand.appendChild(el);
    });
    UI.hide('objectionRow');
    UI.show('courtActions');
  },

  duelAction(id) {
    const d = S.duel;
    if (d.ended) return;
    const cur = d.turn === 1 ? d.p1 : d.p2;
    const oth = d.turn === 1 ? d.p2 : d.p1;
    const sp = STYLES[cur.style];

    switch(id) {
      case 'duel_obj': {
        Snd.objection(); Canvas.shakeIt();
        const success = Math.random() < 0.6;
        UI.bigCue('OBJECTION!', 600);
        if (success) {
          const hit = 8 + Math.round(Math.random()*6);
          oth.cred = Math.max(0, oth.cred - hit);
          d.jury += (d.turn === 1 ? 4 : -4);
          d.jury = Math.max(-50, Math.min(50, d.jury));
          Canvas.addFloater(`-${hit}`, d.turn === 1 ? 590 : 230, 240, '#d44a3a');
          this.duelLog(`${cur.name}: Sustained! ${oth.name} -${hit} cred.`, 'good');
          S.court.lastResult='good'; S.court.lastSide = d.turn===1?'player':'opp';
        } else {
          cur.cred = Math.max(0, cur.cred - 6);
          d.judge = Math.max(0, d.judge - 8);
          this.duelLog(`${cur.name}: Overruled. -6 cred, judge -8.`, 'bad');
          S.court.lastResult='bad'; S.court.lastSide = d.turn===1?'player':'opp';
        }
        break;
      }
      case 'duel_cross': {
        const logic = sp.stats.logic;
        const hit = 6 + Math.round(Math.random() * 6) + Math.round(logic*0.4);
        oth.cred = Math.max(0, oth.cred - hit);
        d.witnessConfidence = Math.max(0, d.witnessConfidence - 5);
        Canvas.addFloater(`-${hit}`, d.turn === 1 ? 590 : 230, 240, '#d44a3a');
        this.duelLog(`${cur.name}: Sharp argument. ${oth.name} -${hit} cred.`, 'good');
        S.court.lastResult='good'; S.court.lastSide = d.turn===1?'player':'opp';
        break;
      }
      case 'duel_pressure': {
        const intim = sp.stats.intimidation;
        const success = Math.random() < (0.35 + intim*0.05);
        if (success) {
          const hit = 12 + Math.round(intim * 0.5);
          oth.cred = Math.max(0, oth.cred - hit);
          d.judge = Math.max(0, d.judge - 8);
          Canvas.addFloater(`-${hit}`, d.turn === 1 ? 590 : 230, 240, '#d44a3a');
          this.duelLog(`${cur.name}: Pressure lands! ${oth.name} -${hit} cred.`, 'good');
          Snd.drama();
          S.court.lastResult='good'; S.court.lastSide = d.turn===1?'player':'opp';
        } else {
          cur.cred = Math.max(0, cur.cred - 8);
          d.jury -= (d.turn === 1 ? 6 : -6);
          d.jury = Math.max(-50, Math.min(50, d.jury));
          this.duelLog(`${cur.name}: The jury winces. -8 cred.`, 'bad');
          S.court.lastResult='bad'; S.court.lastSide = d.turn===1?'player':'opp';
        }
        break;
      }
      case 'duel_calm': {
        const charm = sp.stats.charm;
        const heal = 5 + Math.round(charm * 0.5);
        cur.cred = Math.min(120, cur.cred + heal);
        d.judge = Math.min(100, d.judge + 4);
        Canvas.addFloater(`+${heal}`, d.turn === 1 ? 230 : 590, 240, '#5aaa4a');
        this.duelLog(`${cur.name}: Composure recovered. +${heal} cred.`, 'good');
        S.court.lastResult='good'; S.court.lastSide = d.turn===1?'player':'opp';
        break;
      }
      case 'duel_recess': {
        d.recess[d.turn]--;
        cur.cred = Math.min(120, cur.cred + 12);
        d.judge = Math.min(100, d.judge + 15);
        Snd.recess();
        this.duelLog(`${cur.name} calls recess. +12 cred.`, 'good');
        break;
      }
      case 'duel_special': {
        cur.specialUses--;
        Snd.drama(); Canvas.flashIt();
        UI.bigCue(sp.special.name.toUpperCase(), 900);
        if (cur.style === 'closer') {
          cur.cred = Math.min(120, cur.cred + 18);
          d.jury += (d.turn === 1 ? 6 : -6);
          this.duelLog(`${cur.name}: POWER SUIT. +18 cred, jury sways.`, 'drama');
        } else if (cur.style === 'shark') {
          const hit = 22;
          oth.cred = Math.max(0, oth.cred - hit);
          cur.cred = Math.max(0, cur.cred - 4);
          Canvas.addFloater(`-${hit}`, d.turn === 1 ? 590 : 230, 240, '#d44a3a');
          this.duelLog(`${cur.name}: CORPORATE PRESSURE. ${oth.name} -${hit}.`, 'drama');
        } else if (cur.style === 'strategist') {
          const hit = 14;
          oth.cred = Math.max(0, oth.cred - hit);
          d.jury += (d.turn === 1 ? 8 : -8);
          d.jury = Math.max(-50, Math.min(50, d.jury));
          this.duelLog(`${cur.name}: PAPER TRAIL. ${oth.name} -${hit}, jury bumped.`, 'drama');
        } else if (cur.style === 'charmer') {
          d.jury += (d.turn === 1 ? 12 : -12);
          d.jury = Math.max(-50, Math.min(50, d.jury));
          d.witnessConfidence = Math.max(0, d.witnessConfidence - 15);
          this.duelLog(`${cur.name}: COLD READ. Jury heavily swayed.`, 'drama');
        }
        S.court.lastResult='good'; S.court.lastSide = d.turn===1?'player':'opp';
        break;
      }
      case 'duel_closing': {
        Snd.drama(); Snd.gavel(); Canvas.flashIt();
        UI.bigCue('CLOSING ARGUMENT', 1200);
        const charmBonus = cur.style === 'closer' ? 18 : (cur.style === 'charmer' ? 10 : 0);
        const score = (cur.cred - oth.cred) + (d.turn === 1 ? d.jury : -d.jury) * 1.4 + charmBonus;
        d.ended = true;
        let result;
        if (score > 25) result = `${cur.name} WINS!`;
        else if (score > -10) result = `Hung jury. Inconclusive.`;
        else result = `${oth.name} WINS!`;
        this.duelLog(`Closing delivered. Score ${Math.round(score)}. ${result}`, 'drama');
        setTimeout(()=> this.endDuel(score > -10 ? (score > 25 ? cur.name : 'hung') : oth.name), 1400);
        return;
      }
    }
    // Check KO
    if (oth.cred <= 0) {
      d.ended = true;
      this.duelLog(`${oth.name} collapses. ${cur.name} WINS!`, 'drama');
      setTimeout(()=> this.endDuel(cur.name), 800);
      return;
    }
    if (cur.cred <= 0) {
      d.ended = true;
      this.duelLog(`${cur.name} collapses. ${oth.name} WINS!`, 'drama');
      setTimeout(()=> this.endDuel(oth.name), 800);
      return;
    }
    if (d.judge <= 0) {
      d.ended = true;
      this.duelLog(`Judge declares mistrial.`, 'drama');
      setTimeout(()=> this.endDuel('hung'), 800);
      return;
    }
    // Trial clock prevents endless duels.
    d.round++;
    if (d.round > d.maxRounds) {
      d.ended = true;
      const score = (d.p1.cred - d.p2.cred) + d.jury * 1.2;
      const winner = score > 12 ? d.p1.name : (score < -12 ? d.p2.name : 'hung');
      this.duelLog(`The judge ends the duel on the record.`, 'drama');
      setTimeout(()=> this.endDuel(winner), 800);
      return;
    }
    // Swap turn
    d.turn = d.turn === 1 ? 2 : 1;
    this.renderDuel();
  },

  duelPresent(idx) {
    const d = S.duel;
    if (d.ended) return;
    const cur = d.turn === 1 ? d.p1 : d.p2;
    const oth = d.turn === 1 ? d.p2 : d.p1;
    const card = cur.hand[idx];
    if (card.used) return;
    card.used = true;
    Snd.evidence();
    Canvas.flashIt();
    // Duel evidence is straight damage: strength minus a risk roll
    const roll = Math.random();
    const goodHit = roll > (card.risk * 0.12);
    let hit;
    if (goodHit) {
      hit = 8 + card.strength + Math.round(Math.random()*4);
      oth.cred = Math.max(0, oth.cred - hit);
      d.jury += (d.turn === 1 ? 5 : -5);
      d.jury = Math.max(-50, Math.min(50, d.jury));
      Canvas.addFloater(`-${hit}`, d.turn === 1 ? 590 : 230, 240, '#d44a3a');
      this.duelLog(`${cur.name} presents ${card.name}! ${oth.name} -${hit} cred.`, 'good');
      Snd.juryGasp();
      S.court.lastResult='good'; S.court.lastSide = d.turn===1?'player':'opp';
    } else {
      hit = 6 + card.risk * 2;
      cur.cred = Math.max(0, cur.cred - hit);
      d.judge = Math.max(0, d.judge - 5);
      this.duelLog(`${cur.name}'s ${card.name} is challenged successfully. -${hit} cred.`, 'bad');
      S.court.lastResult='bad'; S.court.lastSide = d.turn===1?'player':'opp';
    }

    if (oth.cred <= 0) {
      d.ended = true;
      this.duelLog(`${oth.name} collapses. ${cur.name} WINS!`, 'drama');
      setTimeout(()=> this.endDuel(cur.name), 800);
      return;
    }
    if (cur.cred <= 0) {
      d.ended = true;
      this.duelLog(`${cur.name} collapses. ${oth.name} WINS!`, 'drama');
      setTimeout(()=> this.endDuel(oth.name), 800);
      return;
    }
    d.round++;
    if (d.round > d.maxRounds) {
      d.ended = true;
      const score = (d.p1.cred - d.p2.cred) + d.jury * 1.2;
      const winner = score > 12 ? d.p1.name : (score < -12 ? d.p2.name : 'hung');
      this.duelLog(`The judge ends the duel on the record.`, 'drama');
      setTimeout(()=> this.endDuel(winner), 800);
      return;
    }
    d.turn = d.turn === 1 ? 2 : 1;
    this.renderDuel();
  },

  duelLog(text, kind) {
    UI.log('courtLog', text, kind);
  },

  endDuel(winnerName) {
    Snd.stopMurmur();
    if (winnerName === 'hung') {
      Snd.loss();
      UI.$('verdictTitle').textContent = 'HUNG JURY';
      UI.$('verdictArt').textContent = '⚖️ ?';
      UI.$('verdictText').textContent = 'Neither side can claim victory. The court is dismissed.';
    } else {
      Snd.victory();
      UI.$('verdictTitle').textContent = `${winnerName.toUpperCase()} WINS`;
      UI.$('verdictArt').textContent = '⚖️ ★';
      UI.$('verdictText').textContent = `${winnerName} walks out of court vindicated. A masterclass in courtroom combat.`;
    }
    UI.$('rewardBox').innerHTML = `<div>Duel Mode — no campaign rewards.</div>`;
    UI.$('nextCaseBtn').textContent = 'Another Duel →';
    UI.$('nextCaseBtn').onclick = () => this.startDuelSetup();
    UI.switchTo('verdict');
  },
};


/* ===== ARABIC LANGUAGE PACK =====
 * Adds a bilingual Arabic/English mode without changing the original game logic.
 */
const AR_PACK = {
  ui: {
    phases: { menu:'القائمة', style:'المهنة', office:'تحضير القضية', investigation:'التحقيق', negotiation:'التفاوض', court:'قاعة المحكمة', verdict:'الحكم', duel:'مبارزة', howto:'طريقة اللعب', credits:'الحقوق' },
    buttons: {
      'Start Campaign':'ابدأ القصة', 'Local Duel Mode':'مبارزة محلية', 'How to Play':'طريقة اللعب', 'Credits':'الحقوق', 'العربية':'English',
      'Back':'رجوع', 'Cancel':'إلغاء', 'Begin Career →':'ابدأ المسيرة ←', 'Back to Menu':'العودة للقائمة', 'To Investigation →':'إلى التحقيق ←',
      'To Negotiation →':'إلى التفاوض ←', 'Accept Settlement':'قبول التسوية', 'To the Courtroom →':'إلى المحكمة ←', 'Main Menu':'القائمة الرئيسية',
      'Next Case →':'القضية التالية ←', 'Begin Duel →':'ابدأ المبارزة ←', 'Menu':'القائمة', 'Voice ON':'الصوت الصوتي مفعل', 'Voice OFF':'الصوت الصوتي مغلق',
      'Career Complete — Main Menu':'انتهت المسيرة — القائمة', 'Another Duel →':'مبارزة أخرى ←', 'Relevance':'الصلة', 'Hearsay':'السماع', 'Speculation':'التخمين'
    },
    staticText: {
      '.case-stamp':'محامي ضد محامي', '.tag':'دراما محكمة بأسلوب بكسل',
      '.menu-dossier p':'<b>الهدف الرئيسي:</b> اربح مواجهات المحكمة بالأدلة والاعتراضات والاستجواب والمرافعة الختامية.',
      '.docket-title':'جدول المحكمة اليوم',
      '.docket-board div:nth-child(2)':'• ابنِ التركيز، اصنع سلسلة ضربات، ثم نفّذ كشفاً درامياً.',
      '.docket-board div:nth-child(3)':'• استخدم إنقاذ المساعد عندما يرتفع الأدرينالين.',
      '.docket-board div:nth-child(4)':'• اربح القضايا لفتح مزايا مهنية ومحاكمات أصعب.',
      '.footer':'كل الأسماء والرسوم والأصوات أصلية. غير تابع لأي مسلسل تلفزيوني.',
      '#howto h2':'طريقة اللعب', '#credits h2':'الحقوق', '#style h2':'اختر محاميك',
      '#nameInput|placeholder':'اسم المحامي', '#prepTitle':'تحضير القضية', '#investigation h2':'التحقيق',
      '#investigation .intro':'بقيت زيارتان. اختر بحذر.', '#cluesPanel h3':'الأدلة التي تم جمعها', '#negotiation h2':'محادثات التسوية',
      '#duel h2':'مبارزة محلية', '#duel .intro':'محاميان. قاعة واحدة. لعب بالتناوب.', '#duel .duel-side:nth-child(1) h3':'اللاعب 1 — الدفاع', '#duel .duel-side:nth-child(2) h3':'اللاعب 2 — الادعاء',
      '#d1Name|placeholder':'اسم اللاعب 1', '#d2Name|placeholder':'اسم اللاعب 2'
    },
    howto: `
      <p><b>الهدف.</b> اربح القضايا بتدمير مصداقية الخصم، إقناع هيئة المحلفين، والحفاظ على صبر القاضي.</p>
      <p><b>التحضير.</b> اختر الأدلة المناسبة؛ لكل دليل قوة ومخاطرة.</p>
      <p><b>التحقيق.</b> زر المواقع لكشف الثغرات والتناقضات.</p>
      <p><b>التفاوض.</b> اضغط أو استخدم الجاذبية للوصول إلى تسوية، أو خذ القضية إلى المحكمة.</p>
      <p><b>قتال المحكمة.</b> كل شهادة لها نقطة ضعف مخفية. طابق الدليل أو الاعتراض الصحيح.</p>
      <ul>
        <li><b>تقديم دليل</b> — طابق نقطة الضعف لضربة قوية.</li>
        <li><b>اعتراض</b> — الصلة، السماع، أو التخمين. الاعتراض الخطأ يغضب القاضي.</li>
        <li><b>استجواب مضاد</b> — يقلل ثقة الشاهد ويكشف الثغرات.</li>
        <li><b>ضغط</b> — مخاطرة عالية ومكافأة عالية.</li>
        <li><b>توضيح هادئ</b> — زيادة آمنة للمصداقية.</li>
        <li><b>استراحة</b> — محدودة؛ تستعيد رباطة الجأش وصبر القاضي.</li>
        <li><b>قدرة خاصة</b> — حركة محاميك المميزة.</li>
        <li><b>مرافعة ختامية</b> — حركة النهاية عندما تكون متقدماً.</li>
      </ul>
      <p><b>أنظمة جديدة.</b> ابنِ التركيز والسلسلة باللعب الذكي، وأنفق التركيز على الملاحظات والكشف الدرامي.</p>
      <p><b>الأصوات.</b> يمكن للشهود والخصوم والمواقف الدرامية أن تُقرأ صوتياً. استخدم زر الصوت في الأعلى.</p>
      <p><b>لوحة المفاتيح:</b> 1–9 للأفعال، Space للتقدم، Esc للقائمة.</p>`
  },
  styles: {
    closer:['المُنهي','قوي في التفاوض والمرافعة الختامية.','بدلة القوة'],
    shark:['القرش','قوي في الترهيب والضغط على الشهود.','ضغط الشركات'],
    strategist:['الاستراتيجي','قوي في الأدلة والتناقضات المنطقية.','أثر الأوراق'],
    charmer:['الساحر','قوي في التأثير على هيئة المحلفين والسيطرة على الشهود.','قراءة باردة']
  },
  evidence: {
    signed_contract:['العقد الموقّع','اتفاق رسمي تم توقيعه.'], email_thread:['سلسلة الإيميلات','مجموعة إيميلات مسترجعة.'], security_footage:['تسجيل الكاميرا','فيديو مراقبة مع توقيت.'], witness_statement:['إفادة سابقة','إفادة قديمة موقّعة.'], financial_ledger:['السجل المالي','معاملات وأرصدة مسجلة.'], phone_record:['سجل الهاتف','سجلات مكالمات بالتوقيت.'], nda_clause:['بند السرية','بند محدد في العقد.'], internal_memo:['مذكرة داخلية','مذكرة سرية من الشركة.'], timeline_contradiction:['كسر الخط الزمني','تناقض في تسلسل الأحداث.'], expert_report:['تقرير خبير','تحليل مستقل من خبير.'], board_minutes:['محضر المجلس','محاضر اجتماعات تنفيذية.'], redline_draft:['مسودة معدلة','مسودة عقد تظهر تعديلات مخفية.'], access_badge_log:['سجل البطاقات','سجلات دخول المبنى بالتوقيت.'], whistle_file:['ملف المبلّغ','ملف مجهول يحوي ادعاءات خطيرة.'], calendar_invite:['دعوة تقويم','دعوة اجتماع تثبت التوقيت والحضور.'], settlement_draft:['مسودة تسوية','مسودة تسوية تكشف اعترافات مخفية.']
  },
  cases: {
    contract:['العقد المكسور','مؤسس شركة ناشئة يدّعي أن مستثمراً استغل بنداً مخفياً واستولى على الملكية الفكرية.','ممثل المستثمر'],
    ledger:['السجل المفقود','مدير مالي متهم بإخفاء خسائر ضخمة خلف تقارير ربع سنوية منمقة.','محاسب أول'],
    witness:['الشاهد الصامت','موظفة رئيسية غيّرت شهادتها قبل المحاكمة بأيام. الولاء والخوف والمال يملؤون القاعة.','موظفة مبتدئة'],
    merger:['اندماج منتصف الليل','شركة قابضة فاخرة مرّرت اندماجاً ليلياً عبر المجلس. التوقيعات تبدو نظيفة… أكثر من اللازم.','سكرتير المجلس'],
    blackfile:['الملف الأسود','ملف تنفيذي مختوم يظهر قبل المحاكمة بساعات. الخصم يقول إنه مزيف، وسمعتك تقول العكس.','مدير الامتثال'],
    glasstower:['البرج الزجاجي','مطوّر ناطحة سحاب أخفى تحذيرات السلامة قبل الافتتاح. لكل طابق سر، ولكل سر توقيع.','مدير المشروع']
  },
  locations: { office:['مكتب المحاماة','راجع ملفات القضية وتواصل مع العميل.'], corp:['برج الشركة','واجه الطرف الآخر في أرضه.'], records:['سجلات المحكمة','ابحث في الملفات العامة والشهادات السابقة.'] },
  objections: { relevance:['الصلة','شهادة خارجة عن الموضوع.'], hearsay:['السماع','ادعاء منقول عن طرف آخر.'], speculation:['التخمين','تخمين بلا أساس.'] },
  actions: { object:'اعتراض', cross:'استجواب مضاد', pressure:'ضغط', read:'اقرأ القاعة', consult:'راجع الملاحظات (10ت)', pin:'حاصِر الشاهد (15ت)', expose:'اكشف التناقض (20ت)', reveal:'كشف درامي (25ت)', grandstand:'استعراض أمام القاعة', calm:'توضيح هادئ', secondchair:'إنقاذ المساعد', recess:'استراحة', special:'خاص', closing:'مرافعة ختامية' },
  duelActions: { duel_obj:'هجوم: اعتراض', duel_cross:'هجوم: حجة', duel_pressure:'هجوم: ضغط', duel_calm:'دفاع: رباطة جأش', duel_recess:'استراحة', duel_special:'خاص', duel_closing:'الختام' },
  moods: { Receptive:'متقبّل', Open:'منفتح', Neutral:'محايد', Tense:'متوتر', Hostile:'عدائي' },
  terms: { 'Prep Points':'نقاط التحضير', 'Selected':'المختار', 'Visits left':'الزيارات المتبقية', 'Opponent Mood':'مزاج الخصم', 'Current Offer':'العرض الحالي', 'Rounds Left':'الجولات المتبقية', 'Jury':'المحلفون', 'Judge':'القاضي', 'Witness':'الشاهد', 'Trial Clock':'وقت المحاكمة', 'Focus':'التركيز', 'Combo':'سلسلة', 'Adrenaline':'أدرينالين', 'No Trap':'لا فخ', 'Opponent Trap Armed':'فخ الخصم جاهز', 'Star Power':'قوة الشهرة' }
};

const I18N = {
  originals: new Map(),
  ar() { return S.lang === 'ar'; },
  save(el, attr='text') {
    if (!el) return;
    const key = attr + ':' + (el.id || el.outerHTML.slice(0,40));
    if (!this.originals.has(key)) this.originals.set(key, attr === 'html' ? el.innerHTML : attr === 'placeholder' ? el.getAttribute('placeholder') : el.textContent);
  },
  translateData() {
    const ar = this.ar();
    Object.values(STYLES).forEach(st => {
      if (!st._en) st._en = { name: st.name, desc: st.desc, specialName: st.special.name, specialDesc: st.special.desc };
      const x = AR_PACK.styles[st.id];
      if (ar && x) { st.name=x[0]; st.desc=x[1]; st.special.name=x[2]; }
      else { st.name=st._en.name; st.desc=st._en.desc; st.special.name=st._en.specialName; st.special.desc=st._en.specialDesc; }
    });
    Object.entries(EVIDENCE).forEach(([id,ev]) => {
      if (!ev._en) ev._en = { name: ev.name, desc: ev.desc };
      const x=AR_PACK.evidence[id];
      if (ar && x) { ev.name=x[0]; ev.desc=x[1]; } else { ev.name=ev._en.name; ev.desc=ev._en.desc; }
    });
    CASES.forEach(c => {
      if (!c._en) c._en = { title:c.title, intro:c.intro, role:c.witness.role, statements:c.statements.map(s=>({text:s.text,hint:s.hint})) };
      const x=AR_PACK.cases[c.id];
      if (ar && x) { c.title=x[0]; c.intro=x[1]; c.witness.role=x[2] || c._en.role; }
      else { c.title=c._en.title; c.intro=c._en.intro; c.witness.role=c._en.role; }
      c.statements.forEach((st,i)=>{
        // Keep testimony readable in Arabic without changing weakness logic.
        if (!st._en) st._en = c._en.statements[i] || {text:st.text,hint:st.hint};
        if (ar) {
          st.text = this.statementArabic(c.id, i, st._en.text);
          st.hint = this.hintArabic(st.weakness, st._en.hint);
        } else { st.text = st._en.text; st.hint = st._en.hint; }
      });
    });
    LOCATIONS.forEach(loc => {
      if (!loc._en) loc._en = { name:loc.name, desc:loc.desc };
      const x=AR_PACK.locations[loc.id];
      if (ar && x) { loc.name=x[0]; loc.desc=x[1]; } else { loc.name=loc._en.name; loc.desc=loc._en.desc; }
    });
    Object.entries(OBJECTIONS).forEach(([id,o])=>{
      if (!o._en) o._en = { name:o.name, desc:o.desc };
      const x=AR_PACK.objections[id];
      if (ar && x) { o.name=x[0]; o.desc=x[1]; } else { o.name=o._en.name; o.desc=o._en.desc; }
    });
    if (S.court && S.court.hand) S.court.hand.forEach(card => { const ev=EVIDENCE[card.id]; if (ev) { card.name=ev.name; card.desc=ev.desc; } });
    if (S.duel) [S.duel.p1, S.duel.p2].forEach(p=>p && p.hand && p.hand.forEach(card => { const ev=EVIDENCE[card.id]; if (ev) { card.name=ev.name; card.desc=ev.desc; } }));
  },
  statementArabic(caseId, i, fallback) {
    const generic = [
      'لم يوافق موكلي على هذا التعديل أبداً.', 'كانت مجرد مناقشات غير رسمية، لا يوجد شيء مكتوب.', 'لم يكن هناك أي ضغط أو استعجال.', 'لم يكن موكلي يعلم بوجود ذلك البند.', 'تفاوضنا بحسن نية كاملة.',
      'كل الأرقام سُجلت بشكل صحيح.', 'لم يناقش أحد إعادة بيان الأرباح.', 'الأرقام معقدة ولا يمكن إساءة فهمها.', 'كان الجدول الزمني طبيعياً تماماً.', 'لم تكن لدي اتصالات شخصية حول هذه المسألة.',
      'لم أعطِ رواية مختلفة لما حدث.', 'لم أتواصل مع الإدارة ذلك الأسبوع.', 'لم أكن قريباً من المبنى في تلك الساعة.', 'لم يضغط عليّ أحد بخصوص شهادتي.', 'كل التواريخ في إفادتي المعدلة صحيحة.',
      'التوقيعات نزيهة وكل شيء تم بالموافقة.', 'لم أغيّر أي مسودة بعد منتصف الليل.', 'لا يوجد سجل دخول مهم.', 'لم تكن هناك مخاوف قانونية داخلية.',
      'هذا الملف لم يكن جزءاً من أرشيف الامتثال.', 'لم يُعقد أي اجتماع طارئ.', 'لم يعرض أحد المال لإسكات المدعي.', 'لم يكن لدى القيادة أي تحذير قانوني.', 'الكاميرات كانت خارج الخدمة.',
      'لم يصل أي تحذير سلامة إلى مكتبي.', 'الخبراء وافقوا على أنظمة المبنى.', 'اجتماع الإطلاق كان روتينياً.', 'لم يناقش المجلس تأجيل الافتتاح.', 'غادرت قبل أن يثير أحد المخاوف.'
    ];
    return generic[i] || fallback;
  },
  hintArabic(weakness, fallback) {
    const ev = EVIDENCE[weakness];
    return ev ? `استخدم ${ev.name} لكشف التناقض.` : fallback;
  },
  applyStatic() {
    const ar = this.ar();
    document.documentElement.lang = ar ? 'ar' : 'en';
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
    document.body.classList.toggle('lang-ar', ar);
    const langText = ar ? 'English' : 'العربية';
    ['langBtn','menuLangBtn'].forEach(id=>{ const b=document.getElementById(id); if (b) b.textContent=langText; });

    // Store English HTML for How-to/Credits once, then swap in Arabic only when requested.
    const how = document.querySelector('#howto .scroll-pane');
    if (how) { if (!how.dataset.enHtml) how.dataset.enHtml = how.innerHTML; how.innerHTML = ar ? AR_PACK.ui.howto : how.dataset.enHtml; }
    const credits = document.querySelector('#credits .scroll-pane');
    if (credits) { if (!credits.dataset.enHtml) credits.dataset.enHtml = credits.innerHTML; if (ar) credits.innerHTML = `<p><b>Objection! Power Suit</b></p><p>تصميم وبرمجة ورسوم بكسل وأصوات: عمل أصلي.</p><p>مبني باستخدام HTML وCSS وJavaScript وCanvas وWeb Audio API.</p><p class="small">تنبيه قانوني: هذا عمل تفاعلي أصلي. كل الأسماء والحوار والموسيقى والمؤثرات والتصاميم أصلية وغير تابعة لأي مسلسل أو فيلم.</p>`; else credits.innerHTML = credits.dataset.enHtml; }

    Object.entries(AR_PACK.ui.staticText).forEach(([sel,val])=>{
      if (sel.endsWith('|placeholder')) { const el=document.querySelector(sel.replace('|placeholder','')); if (el) { if (!el.dataset.enPlaceholder) el.dataset.enPlaceholder=el.getAttribute('placeholder') || ''; el.setAttribute('placeholder', ar ? val : el.dataset.enPlaceholder); } return; }
      const el=document.querySelector(sel); if (!el) return;
      if (!el.dataset.enHtml) el.dataset.enHtml = el.innerHTML;
      el.innerHTML = ar ? val : el.dataset.enHtml;
    });
    this.translateButtonTexts();
    this.translateStaticLabels();
  },
  translateButtonTexts() {
    const ar=this.ar();
    document.querySelectorAll('button').forEach(b=>{
      if (!b.dataset.enText) b.dataset.enText = b.textContent;
      if (!ar) { b.textContent = b.dataset.enText; return; }
      const en = b.dataset.enText.trim();
      if (AR_PACK.ui.buttons[en]) b.textContent = AR_PACK.ui.buttons[en];
      if (b.id === 'voiceBtn') b.textContent = S.voiceEnabled ? 'الصوت الصوتي مفعل' : 'الصوت الصوتي مغلق';
      if (b.id === 'menuBtn') b.textContent = 'القائمة';
    });
  },
  translateStaticLabels() {
    if (!this.ar()) return;
    const repl = { 'Prep Points:':'نقاط التحضير:', 'Selected:':'المختار:', 'Visits left:':'الزيارات المتبقية:', 'Opponent Mood:':'مزاج الخصم:', 'Current Offer:':'العرض الحالي:', 'Rounds Left:':'الجولات المتبقية:' };
    document.querySelectorAll('.prep-status span, #investigation p, .negot-status div, .bar-label').forEach(el=>{
      if (!el.dataset.enHtml) el.dataset.enHtml = el.innerHTML;
      let h=el.dataset.enHtml;
      Object.entries(repl).forEach(([a,b])=>{ h=h.replace(a,b); });
      Object.entries(AR_PACK.terms).forEach(([a,b])=>{ if (h.trim()===a) h=b; });
      el.innerHTML=h;
    });
  },
  tPhase(p) { return this.ar() ? (AR_PACK.ui.phases[p] || p) : null; },
  actionLabel(id, fallback, extra='') {
    if (!this.ar()) return fallback;
    let base = AR_PACK.actions[id] || AR_PACK.duelActions[id] || fallback;
    if (id === 'recess') base = `${base} ${extra}`.trim();
    if (id === 'special') base = `${base} ${extra}`.trim();
    return base;
  },
  toggle() {
    S.lang = this.ar() ? 'en' : 'ar';
    try { localStorage.setItem('ops_lang', S.lang); } catch(e) {}
    this.translateData();
    this.applyStatic();
    UI.refreshTopBar();
    if (S.phase === 'style') Game.buildStyleSelect();
    if (S.phase === 'office') Game.renderPrepPool(), (UI.$('prepTitle').textContent = (this.ar() ? 'تحضير القضية: ' : 'Case Prep: ') + S.caseData.title), (UI.$('prepIntro').textContent = S.caseData.intro);
    if (S.phase === 'investigation') Game.renderInvestigation();
    if (S.phase === 'negotiation') Game.renderNegot();
    if (S.phase === 'court') Game.renderCourt();
    if (S.phase === 'duel') Game.renderDuel();
  }
};

// Initialize saved language preference.
try { S.lang = localStorage.getItem('ops_lang') || 'en'; } catch(e) { S.lang = 'en'; }
I18N.translateData();

// Patch UI phase labels and top bar for bilingual output.
const _uiSwitch = UI.switchTo.bind(UI);
UI.switchTo = function(phase) {
  _uiSwitch(phase);
  if (I18N.ar()) this.setText('phaseLabel', I18N.tPhase(phase) || this.$('phaseLabel').textContent);
  I18N.applyStatic();
};
const _uiRefresh = UI.refreshTopBar.bind(UI);
UI.refreshTopBar = function() {
  _uiRefresh();
  if (I18N.ar()) {
    if (S.player) {
      this.setText('playerLabel', `${S.player.name} • ${STYLES[S.player.style].name}`);
      this.setText('moneyLabel', `$${S.player.money.toLocaleString()}`);
      this.setText('repLabel', `سمعة ${S.player.reputation}`);
    }
    this.setText('caseLabel', S.caseData ? S.caseData.title : '—');
    const voiceBtn=this.$('voiceBtn'); if (voiceBtn) voiceBtn.textContent = S.voiceEnabled ? 'الصوت الصوتي مفعل' : 'الصوت الصوتي مغلق';
    const menuBtn=this.$('menuBtn'); if (menuBtn) menuBtn.textContent = 'القائمة';
    const langBtn=this.$('langBtn'); if (langBtn) langBtn.textContent = 'English';
  }
};

// Extend game action handler with language toggle.
const _handleAct = Game.handleAct.bind(Game);
Game.handleAct = function(act, btn, e) {
  if (act === 'toggle-lang') { Snd.click(); I18N.toggle(); return; }
  return _handleAct(act, btn, e);
};

// Patch confirmation text and voice toggle phrase.
const _bindGlobal = Game.bindGlobal.bind(Game);
Game.bindGlobal = function() {
  _bindGlobal();
  const oldMenuBtn = document.getElementById('menuBtn');
  // Event is already bound in original; keep language handled via labels only.
};

// Patch renderActions for Arabic button labels while preserving original logic.
const _renderActions = Game.renderActions.bind(Game);
Game.renderActions = function() {
  _renderActions();
  if (!I18N.ar()) return;
  const c = S.court; if (!c) return;
  const pStyle = STYLES[S.player.style];
  const map = ['object','cross','pressure','read','consult','pin','expose','reveal','grandstand','calm','secondchair','recess','special','closing'];
  document.querySelectorAll('#courtActions button').forEach((b,i)=>{
    const id=map[i];
    if (id === 'recess') b.textContent = `استراحة (${c.recessLeft})`;
    else if (id === 'special') b.textContent = `${pStyle.special.name} (${c.player.specialUses})`;
    else b.textContent = I18N.actionLabel(id, b.textContent);
  });
};

const _renderNegot = Game.renderNegot.bind(Game);
Game.renderNegot = function() {
  _renderNegot();
  if (!I18N.ar()) return;
  const n=S.negot; if (!n) return;
  const moodEn = n.mood >= 70 ? 'Receptive' : n.mood >= 55 ? 'Open' : n.mood >= 40 ? 'Neutral' : n.mood >= 20 ? 'Tense' : 'Hostile';
  UI.$('negotMood').textContent = AR_PACK.moods[moodEn] || moodEn;
  const labels = ['تفكير هادئ','ضغط عدواني','خداع','جاذبية','تهديد قانوني'];
  document.querySelectorAll('#negotActions button').forEach((b,i)=> b.textContent = labels[i] || b.textContent);
  UI.$('acceptSettle').textContent = 'قبول التسوية';
  UI.$('goToCourt').textContent = 'إلى المحكمة ←';
};

const _renderCourt = Game.renderCourt.bind(Game);
Game.renderCourt = function() {
  _renderCourt();
  if (!I18N.ar()) return;
  const c=S.court; if (!c) return;
  if (UI.$('comboBadge')) UI.$('comboBadge').textContent = `سلسلة x${c.combo || 0} • أدرينالين ${Math.round(c.adrenaline || 0)}`;
  if (UI.$('trapBadge')) UI.$('trapBadge').textContent = c.trapActive > 0 ? 'فخ الخصم جاهز' : `قوة الشهرة ${Math.round(c.starPower || 0)}`;
  if (UI.$('tacticTip')) UI.$('tacticTip').textContent = 'اقرأ الشهادة، اكشف الثغرة، ثم اضرب بالدليل الصحيح.';
  const hint = UI.$('hintLine'); if (hint && !hint.classList.contains('hidden')) hint.textContent = hint.textContent.replace('⚡ Insight:', '⚡ معلومة:');
};

const _buildStyleSelect = Game.buildStyleSelect.bind(Game);
Game.buildStyleSelect = function() {
  _buildStyleSelect();
  if (!I18N.ar()) return;
  UI.$('styleConfirm').textContent = 'ابدأ المسيرة ←';
  document.querySelectorAll('#styleGrid .stats').forEach(el=>{
    el.innerHTML = el.innerHTML.replace(/Confidence/g,'الثقة').replace(/Legal Skill/g,'المهارة القانونية').replace(/Charm/g,'الجاذبية').replace(/Intimidation/g,'الترهيب').replace(/Logic/g,'المنطق');
  });
};

const _buildPrep = Game.buildPrep.bind(Game);
Game.buildPrep = function() {
  _buildPrep();
  if (I18N.ar()) { UI.$('prepTitle').textContent = 'تحضير القضية: ' + S.caseData.title; UI.$('prepIntro').textContent = S.caseData.intro; UI.$('prepConfirm').textContent = 'إلى التحقيق ←'; }
};

const _renderPrepPool = Game.renderPrepPool.bind(Game);
Game.renderPrepPool = function() {
  _renderPrepPool();
  if (I18N.ar()) {
    document.querySelectorAll('.ev-stats').forEach(el=>{ el.innerHTML = el.innerHTML.replace(/STR/g,'قوة').replace(/RISK/g,'خطر'); });
    UI.$('prepConfirm').textContent = 'إلى التحقيق ←';
  }
};

const _renderInvestigation = Game.renderInvestigation.bind(Game);
Game.renderInvestigation = function() {
  _renderInvestigation();
  if (I18N.ar()) {
    if (S.invest.clues.length === 0) UI.$('cluesList').innerHTML = '<li style="color:var(--ink-dim);font-style:italic">لا توجد أدلة بعد.</li>';
    UI.$('investConfirm').textContent = 'إلى التفاوض ←';
  }
};

const _startNegotiation = Game.startNegotiation.bind(Game);
Game.startNegotiation = function() {
  _startNegotiation();
  if (I18N.ar()) {
    const c=S.caseData;
    UI.$('negotIntro').textContent = `${c.opponent.name}، محامي الخصم، يجلس أمامك. ${this.personalityFlavor(c.opponent.personality)}`;
    UI.$('negotLog').innerHTML = '';
    UI.log('negotLog', `${c.opponent.name}: "أنا هنا. قدم عرضاً جدياً أو نلتقي في المحكمة."`, 'ai');
    this.renderNegot();
  }
};

const _personalityFlavor = Game.personalityFlavor.bind(Game);
Game.personalityFlavor = function(p) {
  if (!I18N.ar()) return _personalityFlavor(p);
  return { charming:'يبتسم بثقة، لكن الابتسامة لا تصل إلى عينيه.', technical:'يفتح ملفاً منظماً بدقة على صفحة محددة.', intimidating:'لا يجلس حتى. يترك حضوره يضغط على الغرفة.', slippery:'بارد وغامض، يجيب قبل أن تسأل.' }[p] || 'بارد وغير مقروء.';
};

const _endCase = Game.endCase.bind(Game);
Game.endCase = function(outcome, settlementAmt) {
  _endCase(outcome, settlementAmt);
  if (!I18N.ar()) return;
  const titles={won:'ربحت القضية', lost:'خسرت القضية', hung:'محاكمة معلّقة', settle:'تمت التسوية'};
  const texts={won:`هيئة المحلفين تصدر الحكم. تخرج من القاعة مرفوع الرأس يا ${S.player.name}.`, lost:'الحكم ذهب للطرف الآخر. الخسارة درس، وليست النهاية.', hung:'لم تتفق هيئة المحلفين. لا فوز كامل ولا خسارة نظيفة.', settle:'خرجت بصفقة. دراما أقل وسمعة أقل، لكن المال في الحساب.'};
  UI.$('verdictTitle').textContent = titles[outcome] || UI.$('verdictTitle').textContent;
  UI.$('verdictText').textContent = texts[outcome] || UI.$('verdictText').textContent;
  const rb=UI.$('rewardBox');
  rb.innerHTML = rb.innerHTML.replace(/Money:/g,'المال:').replace(/Reputation:/g,'السمعة:').replace(/Career Rank:/g,'الرتبة المهنية:').replace(/Perks:/g,'المزايا:').replace(/Current:/g,'الحالي:').replace(/None yet/g,'لا شيء بعد').replace(/Rep/g,'سمعة');
  const nb=UI.$('nextCaseBtn'); nb.textContent = S.campaignIndex < CASES.length - 1 ? 'القضية التالية ←' : 'انتهت المسيرة — القائمة';
};

const _renderDuel = Game.renderDuel.bind(Game);
Game.renderDuel = function() {
  _renderDuel();
  if (!I18N.ar()) return;
  if (UI.$('caseLabel')) UI.$('caseLabel').textContent='مبارزة';
  if (UI.$('comboBadge')) UI.$('comboBadge').textContent='مبارزة بالتناوب';
  if (UI.$('trapBadge')) UI.$('trapBadge').textContent='لا فخ للذكاء';
  if (UI.$('tacticTip')) UI.$('tacticTip').textContent='المبارزة قتال محكمة مباشر. استخدم الأدلة والقدرات لكسر المحامي الآخر قبل انتهاء الوقت.';
  const map = ['duel_obj','duel_cross','duel_pressure','duel_calm','duel_recess','duel_special','duel_closing'];
  document.querySelectorAll('#courtActions button').forEach((b,i)=>{
    const id=map[i];
    if (id === 'duel_recess') b.textContent = b.textContent.replace('Recess','استراحة');
    else if (id === 'duel_special') b.textContent = b.textContent.replace(/\(.+\)/, m=>m);
    else b.textContent = AR_PACK.duelActions[id] || b.textContent;
  });
};

const _endDuel = Game.endDuel.bind(Game);
Game.endDuel = function(winnerName) {
  _endDuel(winnerName);
  if (!I18N.ar()) return;
  if (winnerName === 'hung') {
    UI.$('verdictTitle').textContent='هيئة محلفين معلّقة';
    UI.$('verdictText').textContent='لا يستطيع أي طرف إعلان النصر. رفعت الجلسة.';
  } else {
    UI.$('verdictTitle').textContent=`${winnerName} يفوز`;
    UI.$('verdictText').textContent=`${winnerName} يخرج من المحكمة منتصراً بعد درس قوي في قتال المحامين.`;
  }
  UI.$('rewardBox').innerHTML='<div>وضع المبارزة — لا توجد مكافآت للقصة.</div>';
  UI.$('nextCaseBtn').textContent='مبارزة أخرى ←';
};

// Apply Arabic state once the page is ready.
const _origGameInit = Game.init.bind(Game);
Game.init = function() {
  _origGameInit();
  I18N.translateData();
  I18N.applyStatic();
  UI.refreshTopBar();
};



/* ============================================================
 * MEGA FUN UPDATE: career save, difficulty, random cases,
 * evidence combos, snap objections, richer sounds and smarter vibes.
 * ============================================================ */
(function(){
  const DIFFICULTIES = {
    story: { name:'Story', playerCred:20, oppCred:-22, maxRounds:8, aiDamage:.72, reward:0.75, desc:'Easy mode: enjoy the drama and win more often.' },
    associate: { name:'Associate', playerCred:0, oppCred:0, maxRounds:0, aiDamage:1, reward:1, desc:'Normal mode: fair courtroom combat.' },
    partner: { name:'Partner', playerCred:-8, oppCred:12, maxRounds:-3, aiDamage:1.15, reward:1.25, desc:'Hard mode: rival lawyers punish mistakes.' },
    legendary: { name:'Legendary', playerCred:-16, oppCred:22, maxRounds:-6, aiDamage:1.32, reward:1.6, desc:'Brutal boss-trial mode for clean legal play.' },
  };
  const SAVE_KEY = 'ops_power_suit_save_v3';
  const DIFF_KEY = 'ops_power_suit_difficulty';
  S.difficulty = localStorage.getItem(DIFF_KEY) || 'associate';
  S.randomMode = false;

  const BOSS_CASES = [
    {
      id: 'namepartner',
      title: 'The Name Partner Trial',
      intro: 'A legendary senior partner is accused of burying conflicts and buying silence. To win, you must beat the lawyer everyone fears.',
      diff: 7,
      opponent: { name: 'Evelyn Stone', personality: 'technical', tieColor: '#d4a82c', hairColor: PAL.hair3 },
      witness: { name: 'J. Mercer', role: 'Senior Partner', mood: 'overconfident' },
      evidencePool: ['settlement_draft','calendar_invite','internal_memo','board_minutes','email_thread','phone_record','expert_report','whistle_file'],
      statements: [
        { text:'There was never a conflict worth disclosing to the client.', weakness:'internal_memo', obj:null, hint:'The memo flags the conflict before the signature.' },
        { text:'No settlement draft included a silence provision.', weakness:'settlement_draft', obj:'speculation', hint:'The draft contains the silence clause.' },
        { text:'The board was informed only after the matter was closed.', weakness:'board_minutes', obj:null, hint:'The minutes show the board knew earlier.' },
        { text:'I had no late calls with the client before the vote.', weakness:'phone_record', obj:null, hint:'The call record is time-stamped.' },
        { text:'The whistleblower file is fantasy and nothing more.', weakness:'whistle_file', obj:'hearsay', hint:'Metadata ties the file to compliance.' },
        { text:'Every meeting invite was routine.', weakness:'calendar_invite', obj:null, hint:'The invite title says emergency ethics review.' },
        { text:'The emails do not show intent.', weakness:'email_thread', obj:null, hint:'The thread shows coordinated language.' },
        { text:'No expert would call this misconduct.', weakness:'expert_report', obj:null, hint:'The expert report uses exactly that word.' },
      ],
      reward: { money: 30000, reputation: 120 },
    },
    {
      id: 'mayorsdocket',
      title: 'The Mayor\'s Docket',
      intro: 'A city contract scandal reaches the courthouse steps. The press is outside, the jury is watching, and one bad objection can end your career.',
      diff: 8,
      opponent: { name: 'Nadia Cross', personality: 'charming', tieColor: '#3a5fb8', hairColor: PAL.hair2 },
      witness: { name: 'R. Vale', role: 'Procurement Chief', mood: 'lying' },
      evidencePool: ['financial_ledger','access_badge_log','calendar_invite','security_footage','email_thread','signed_contract','expert_report','timeline_contradiction'],
      statements: [
        { text:'The contract award followed every public rule.', weakness:'signed_contract', obj:null, hint:'The signed contract contains a private side term.' },
        { text:'No official entered city hall after hours.', weakness:'access_badge_log', obj:null, hint:'The badge log places them inside after midnight.' },
        { text:'There was no meeting before bids were opened.', weakness:'calendar_invite', obj:null, hint:'The invite proves a pre-bid meeting.' },
        { text:'The ledger shows no unusual transfers.', weakness:'financial_ledger', obj:null, hint:'The ledger reveals split payments.' },
        { text:'The footage was irrelevant to the award.', weakness:'security_footage', obj:'relevance', hint:'The footage identifies the courier.' },
        { text:'Our emails were standard procurement updates.', weakness:'email_thread', obj:'hearsay', hint:'The emails coordinate the result.' },
        { text:'The timeline is clean from start to finish.', weakness:'timeline_contradiction', obj:null, hint:'The timeline breaks before the bid window.' },
        { text:'Expert review would support the city.', weakness:'expert_report', obj:null, hint:'The expert report says the opposite.' },
      ],
      reward: { money: 40000, reputation: 150 },
    }
  ];
  BOSS_CASES.forEach(cs => { if (!CASES.some(c => c.id === cs.id)) CASES.push(cs); });

  const COMBOS = [
    { a:'email_thread', b:'timeline_contradiction', name:'Contradiction Chain', hit:12, jury:7 },
    { a:'financial_ledger', b:'expert_report', name:'Numbers Don\'t Lie', hit:14, jury:6 },
    { a:'phone_record', b:'security_footage', name:'Caught in the Gap', hit:13, jury:8 },
    { a:'signed_contract', b:'nda_clause', name:'Clause Trap', hit:10, jury:6 },
    { a:'board_minutes', b:'redline_draft', name:'Midnight Edit', hit:15, jury:8 },
    { a:'whistle_file', b:'settlement_draft', name:'Silence Money', hit:16, jury:9 },
    { a:'calendar_invite', b:'access_badge_log', name:'Presence Proven', hit:12, jury:7 },
    { a:'internal_memo', b:'email_thread', name:'Paper Trail Lock', hit:11, jury:6 },
  ];

  function diff(){ return DIFFICULTIES[S.difficulty] || DIFFICULTIES.associate; }
  function toast(title, sub){
    const el=document.createElement('div');
    el.className='combo-toast';
    el.innerHTML=`${title}<small>${sub||''}</small>`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),1500);
  }
  function clone(obj){ return JSON.parse(JSON.stringify(obj)); }

  // Stronger original soundscape. No copyrighted samples: all generated in WebAudio/speech.
  Snd.caseClosed = function(){
    if (!this.ctx) return;
    this.gavel();
    setTimeout(()=>this.gavel(), 170);
    setTimeout(()=>{ this.tone(98,0.28,'square',0.28); this.tone(147,0.32,'sawtooth',0.16); }, 300);
    setTimeout(()=>{ this.tone(82,0.42,'square',0.34); this.noise(0.32,0.16,420,'bandpass'); }, 520);
  };
  Snd.orderInCourt = function(){
    this.gavel(); setTimeout(()=>this.noise(0.25,0.10,700,'bandpass'),100); setTimeout(()=>this.tone(196,0.18,'square',0.14),220);
  };
  Snd.courtSurround = function(){
    if (S.muted) return;
    this.murmur();
    this.noise(0.18,0.05,4200,'highpass');
    setTimeout(()=>this.noise(0.16,0.04,900,'bandpass'),240);
    setTimeout(()=>this.paper(),520);
  };
  Snd.footsteps = function(){
    [0,180,360,540].forEach((ms,i)=>setTimeout(()=>{ this.noise(0.06,0.11,180,'lowpass'); this.tone(70+i*3,0.05,'sine',0.05); },ms));
  };
  Snd.judgeLine = function(text){ this.orderInCourt(); setTimeout(()=>this.speak(text,'judge',true),240); };

  // Save/load career.
  Game.saveCareer = function(){
    if (!S.player) return;
    const data = { player:S.player, campaignIndex:S.campaignIndex, difficulty:S.difficulty, lang:S.lang, savedAt:Date.now() };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch(e) {}
  };
  Game.loadCareer = function(){
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); } catch(e){ return null; }
  };
  Game.refreshDifficultyUI = function(){
    document.querySelectorAll('.diff-btn').forEach(b=>{
      const on=b.dataset.diff===S.difficulty;
      b.classList.toggle('selected',on);
    });
    const hint=UI.$('difficultyHint'); if (hint) hint.textContent = diff().desc;
    const cont=UI.$('continueBtn'); if (cont) {
      const hasSave = !!this.loadCareer();
      cont.disabled = !hasSave;
      cont.title = hasSave ? 'Resume your last saved career.' : 'No saved career found. Complete a campaign case first.';
    }
  };

  const oldBuildMenu = Game.buildMenu.bind(Game);
  Game.buildMenu = function(){
    oldBuildMenu();
    document.querySelectorAll('.diff-btn').forEach(b=>{
      b.onclick = ()=>{ S.difficulty=b.dataset.diff; localStorage.setItem(DIFF_KEY,S.difficulty); this.refreshDifficultyUI(); Snd.click(); };
    });
    this.refreshDifficultyUI();
  };

  const oldHandle = Game.handleAct.bind(Game);
  Game.handleAct = function(act, btn, e){
    if (act === 'continue-career') {
      Snd.click();
      const data=this.loadCareer();
      if (!data || !data.player) { alert('No saved career yet.'); return; }
      S.player=data.player; S.difficulty=data.difficulty||S.difficulty||'associate'; S.lang=data.lang||S.lang||'en';
      S.randomMode=false;
      this.startCase(Math.min(data.campaignIndex||0, CASES.length-1));
      this.refreshDifficultyUI();
      this.courtLog && console.log('career loaded');
      return;
    }
    if (act === 'random-case') {
      Snd.click();
      S.randomMode=true;
      S.styleSelection={ current:null, name:'' };
      this.buildStyleSelect();
      UI.$('styleConfirm').textContent = 'Start Random Trial →';
      UI.switchTo('style');
      return;
    }
    oldHandle(act,btn,e);
  };

  const oldConfirmStyle = Game.confirmStyle.bind(Game);
  Game.confirmStyle = function(){
    oldConfirmStyle();
    if (S.randomMode) this.startRandomCase();
    else this.saveCareer();
  };

  Game.makeRandomCase = function(){
    const titles=['The Neon Deposition','The Velvet Clause','The Lost Signature','The Boardroom Ghost','The Rooftop Affidavit','The Red Folder'];
    const opps=[
      {name:'Victor Hale',personality:'intimidating',tieColor:PAL.tieBlack,hairColor:PAL.hair},
      {name:'Karim Black',personality:'slippery',tieColor:PAL.tiePurple,hairColor:PAL.hair2},
      {name:'Talia Graves',personality:'technical',tieColor:PAL.tieBlue,hairColor:PAL.hair3},
      {name:'Rook Calder',personality:'charming',tieColor:PAL.tieRed,hairColor:PAL.hair2},
    ];
    const pool=Object.keys(EVIDENCE).sort(()=>Math.random()-0.5).slice(0,8);
    const statements=pool.slice(0,6).map((id,i)=>({
      text:[
        'That document was never part of the real record.',
        'The timing was ordinary and completely innocent.',
        'No one on our side hid anything from the court.',
        'The witness has already told the whole truth.',
        'There is no paper trail connecting my client to this.',
        'Counsel is trying to make routine business look sinister.',
      ][i%6],
      weakness:id,
      obj: i%3===0?'relevance':(i%3===1?'hearsay':null),
      hint: `${EVIDENCE[id].name} is the cleanest angle on this statement.`
    }));
    const d=Math.max(2,Math.min(7,2+Math.floor(Math.random()*5)));
    return { id:'random_'+Date.now(), title:titles[Math.floor(Math.random()*titles.length)], intro:'A procedurally generated case with a new rival, shuffled evidence, and a fresh witness under pressure.', diff:d, opponent:clone(opps[Math.floor(Math.random()*opps.length)]), witness:{name:'S. Arden',role:'Key Witness',mood:['nervous','lying','angry','scared','overconfident'][Math.floor(Math.random()*5)]}, evidencePool:pool, statements, reward:{money:5000+d*3000,reputation:15+d*10} };
  };
  Game.startRandomCase = function(){
    S.caseData=this.makeRandomCase();
    S.campaignIndex=0;
    S.invest={ visited:{}, clues:[], left:3, revealed:[] };
    this.buildPrep(); UI.switchTo('office'); UI.refreshTopBar();
  };

  // Difficulty and audio on trial entry.
  const oldEnter = Game.enterCourtroom.bind(Game);
  Game.enterCourtroom = function(){
    Snd.footsteps();
    oldEnter();
    const c=S.court; if (!c) return;
    const d=diff();
    c.difficulty = S.difficulty;
    c.player.cred = Math.max(65, Math.min(170, c.player.cred + d.playerCred));
    c.opp.cred = Math.max(65, c.opp.cred + d.oppCred);
    c.maxRounds = Math.max(18, c.maxRounds + d.maxRounds);
    c.usedComboNames = c.usedComboNames || [];
    c.witnessMood = S.caseData.witness.mood || 'nervous';
    c.snapWindow = null;
    this.courtLog(`Difficulty: ${d.name}. Career autosave is enabled after every case.`, 'good');
    setTimeout(()=>Snd.judgeLine('Order in the court. Counsel, you may proceed.'), 650);
    setTimeout(()=>Snd.courtSurround(), 1000);
    this.renderCourt();
  };

  // Add snap objection as timing mini-game.
  const oldRenderActions = Game.renderActions.bind(Game);
  Game.renderActions = function(){
    oldRenderActions();
    const c=S.court; if (!c || c.ended || c.turn!=='player' || !this.currentStatement()) return;
    const row=UI.$('courtActions');
    if (!row || row.querySelector('[data-mega="snap"]')) return;
    const b=document.createElement('button');
    b.className='big primary';
    b.dataset.mega='snap';
    b.textContent = (S.lang==='ar') ? 'اعتراض خاطف' : 'Snap Objection';
    b.title='Timing mini-game: faster correct objection gives a bonus.';
    b.onclick=()=>this.startSnapObjection();
    row.insertBefore(b,row.firstChild);
  };
  Game.startSnapObjection = function(){
    const c=S.court; if(!c || !this.currentStatement()) return;
    c.snapWindow={ start:performance.now(), active:true };
    UI.bigCue('SNAP OBJECTION! 3...2...1...',1000);
    Snd.objection(); Canvas.shakeIt();
    UI.hide('courtActions'); UI.show('objectionRow');
    document.querySelectorAll('#objectionRow button[data-obj]').forEach(b=>{ b.onclick=()=>this.resolveObjection(b.getAttribute('data-obj')); });
  };

  // Patch objection for snap timing bonus.
  const oldResolveObj = Game.resolveObjection.bind(Game);
  Game.resolveObjection = function(type){
    const c=S.court; const snap=c && c.snapWindow && c.snapWindow.active ? performance.now()-c.snapWindow.start : null;
    const before = c ? { opp:c.opp.cred, player:c.player.cred, jury:c.jury } : null;
    oldResolveObj(type);
    if (!c || snap===null || c.ended) return;
    c.snapWindow.active=false;
    if (before && c.opp.cred < before.opp) {
      const bonus = snap < 1300 ? 8 : snap < 2300 ? 4 : 1;
      c.opp.cred=Math.max(0,c.opp.cred-bonus);
      c.jury=Math.min(50,c.jury+Math.ceil(bonus/2));
      c.focus=Math.min(100,(c.focus||0)+bonus);
      toast('Snap Objection', `Timing bonus: Opp -${bonus}, Focus +${bonus}`);
      this.courtLog(`⚡ Snap timing bonus: Opp -${bonus}, Focus +${bonus}.`, 'good');
      Snd.crowdReact('cheer');
    } else if (before && c.player.cred < before.player) {
      c.judge=Math.max(0,c.judge-3);
      this.courtLog('Late snap objection made the judge colder. Judge -3.', 'bad');
    }
  };

  // Evidence combos.
  function comboFor(cardId, hand){
    const usedOrHeld = new Set(hand.filter(x=>x.used || S.prep.selected.includes(x.id)).map(x=>x.id));
    return COMBOS.find(co => (co.a===cardId && usedOrHeld.has(co.b)) || (co.b===cardId && usedOrHeld.has(co.a)));
  }
  const oldPresent = Game.presentEvidence.bind(Game);
  Game.presentEvidence = function(idx){
    const c=S.court; const stmt=this.currentStatement(); const card=c && c.hand[idx];
    const wasMatch = !!(c && stmt && card && stmt.weakness===card.id && !card.used);
    oldPresent(idx);
    if (!wasMatch || !c || c.ended) return;
    const co=comboFor(card.id,c.hand);
    if (co && !(c.usedComboNames||[]).includes(co.name)) {
      c.usedComboNames=c.usedComboNames||[]; c.usedComboNames.push(co.name);
      const hit=co.hit + Math.floor((c.combo||0)/2);
      c.opp.cred=Math.max(0,c.opp.cred-hit);
      c.jury=Math.min(50,c.jury+co.jury);
      c.focus=Math.min(100,(c.focus||0)+10);
      Canvas.flashIt(); Canvas.addFloater(`COMBO -${hit}`,590,220,'#ffdc5c');
      toast(co.name, `Evidence combo: Opp -${hit}, Jury +${co.jury}`);
      this.courtLog(`⚖️ EVIDENCE COMBO: ${co.name}! Opp -${hit}, Jury +${co.jury}, Focus +10.`, 'drama');
      Snd.caseClosed(); Snd.crowdReact('cheer');
      this.checkVerdict();
    }
  };

  // Witness moods now matter.
  const oldPressure = Game.resolvePressure.bind(Game);
  Game.resolvePressure = function(){
    const c=S.court, mood=c && (c.witnessMood || (S.caseData.witness&&S.caseData.witness.mood));
    if (c && mood==='nervous') { c.focus=Math.min(100,(c.focus||0)+4); }
    if (c && mood==='angry') { c.judge=Math.max(0,c.judge-3); this.courtLog('The angry witness resists pressure. Judge patience -3.', 'bad'); }
    if (c && mood==='scared') { c.witnessConfidence=Math.max(0,c.witnessConfidence-6); }
    oldPressure();
  };
  const oldCross = Game.resolveCross.bind(Game);
  Game.resolveCross = function(){
    const c=S.court, mood=c && (c.witnessMood || (S.caseData.witness&&S.caseData.witness.mood));
    oldCross();
    if (!c || c.ended) return;
    if (mood==='lying' && Math.random()<0.45 && this.currentStatement()) {
      if (!c.revealedWeak.includes(c.statementIdx)) c.revealedWeak.push(c.statementIdx);
      c.focus=Math.min(100,(c.focus||0)+8);
      this.courtLog('The lying witness over-explains. Weakness revealed, Focus +8.', 'good');
      Snd.juryGasp();
    } else if (mood==='overconfident') {
      c.jury=Math.min(50,c.jury+3);
      this.courtLog('The overconfident witness talks too much. Jury +3.', 'good');
    }
  };

  // Difficulty-aware AI damage by wrapping player cred changes after opponent turn.
  const oldOppTurn = Game.opponentTurn.bind(Game);
  Game.opponentTurn = function(){
    const c=S.court; const before=c ? c.player.cred : 0;
    oldOppTurn();
    const after=S.court ? S.court.player.cred : before;
    const d=diff();
    if (S.court && after < before && d.aiDamage !== 1) {
      const raw=before-after;
      const adjusted=Math.max(1, Math.round(raw*d.aiDamage));
      S.court.player.cred = Math.max(0, before-adjusted);
      if (adjusted !== raw) this.courtLog(`Difficulty adjusted opponent impact to -${adjusted}.`, 'ai');
      this.renderCourt();
    }
  };

  // Case closed sounds and judge voice when verdict happens or clock runs out.
  const oldEndCase = Game.endCase.bind(Game);
  Game.endCase = function(outcome, settlementAmt){
    Snd.caseClosed();
    const judgeText = outcome==='won' ? 'Judgment for counsel. This case is closed.' : outcome==='lost' ? 'Judgment for the opposing side. This case is closed.' : outcome==='settle' ? 'Settlement entered. The matter is closed.' : 'Mistrial entered. Court is adjourned.';
    setTimeout(()=>Snd.speak(judgeText,'judge',true),420);
    oldEndCase(outcome, settlementAmt);
    // difficulty reward multiplier, preserving settlement amount.
    if (S.player && S.caseData && outcome !== 'settle') {
      const mult=diff().reward;
      if (mult !== 1) {
        const box=UI.$('rewardBox');
        if (box) box.innerHTML += `<div>Difficulty Reward Modifier: x${mult}</div>`;
      }
    }
    this.saveCareer();
  };

  const oldEndDuel = Game.endDuel.bind(Game);
  Game.endDuel = function(winnerName){
    Snd.caseClosed();
    setTimeout(()=>Snd.speak('This court is adjourned. Case closed.','judge',true),420);
    oldEndDuel(winnerName);
  };

  // Better close/clock moment.
  const oldCheck = Game.checkVerdict.bind(Game);
  Game.checkVerdict = function(){
    const c=S.court; const beforeEnded=c && c.ended;
    oldCheck();
    if (c && !beforeEnded && c.ended) {
      Snd.caseClosed();
      if (c.round > c.maxRounds) Snd.speak('Counsel, time is over. I will rule from the record.','judge',true);
    }
  };

  // More ambient court events.
  const oldEvent = Game.courtEvent.bind(Game);
  Game.courtEvent = function(){
    oldEvent();
    const c=S.court; if(!c||c.ended||c.mode!=='campaign') return;
    if (Math.random()<0.18) {
      const ev=[
        ['A reporter scribbles in the back row. The pressure rises.', 'drama', ()=>{c.focus=Math.min(100,(c.focus||0)+4); Snd.paper();}],
        ['The gallery gasps at the implication.', 'drama', ()=>{c.jury=Math.min(50,c.jury+2); Snd.crowdReact('gasp');}],
        ['The judge leans forward: "Counsel, make it count."', 'ai', ()=>{c.judge=Math.max(0,c.judge-2); Snd.judgeLine('Counsel, make it count.');}],
        ['Your second chair slides a note across the table. Focus +5.', 'good', ()=>{c.focus=Math.min(100,(c.focus||0)+5); Snd.pageFlip();}],
      ][Math.floor(Math.random()*4)];
      ev[2](); this.courtLog(ev[0],ev[1]);
    }
  };

  // Top bar/menu updates after boot.
  const oldInitMega = Game.init.bind(Game);
  Game.init = function(){
    oldInitMega();
    this.refreshDifficultyUI();
    const menu = document.querySelector('.menu-dossier');
    if (menu && !menu.querySelector('.career-save-note')) {
      const p=document.createElement('p'); p.className='career-save-note'; p.textContent='Autosave enabled: career progress, difficulty, language, perks, money, and reputation are saved in this browser.'; menu.appendChild(p);
    }
  };
})();


/* ============================================================
 * SUITS SIMULATOR UPDATE — Full Expansion
 * Language fix · 6 new real-life cases · 10 new evidence types
 * 2 new locations · speech bubbles · rankings · achievements
 * shop/wardrobe · better random cases · rival dialogue
 * ============================================================ */
(function () {
  'use strict';

  /* ===== FIX: translateStaticLabels didn't restore English on toggle ===== */
  I18N.translateStaticLabels = function () {
    const ar = this.ar();
    const repl = {
      'Prep Points:': 'نقاط التحضير:', 'Selected:': 'المختار:',
      'Visits left:': 'الزيارات المتبقية:', 'Opponent Mood:': 'مزاج الخصم:',
      'Current Offer:': 'العرض الحالي:', 'Rounds Left:': 'الجولات المتبقية:'
    };
    document.querySelectorAll('.prep-status span, #investigation p, .negot-status div, .bar-label').forEach(el => {
      if (!el.dataset.enHtml) el.dataset.enHtml = el.innerHTML;
      if (!ar) { el.innerHTML = el.dataset.enHtml; return; }
      let h = el.dataset.enHtml;
      Object.entries(repl).forEach(([a, b]) => { h = h.replace(a, b); });
      Object.entries(AR_PACK.terms).forEach(([a, b]) => { if (h.trim() === a) h = b; });
      el.innerHTML = h;
    });
  };

  /* ===== FIX: Full button text restoration on English toggle ===== */
  const _origApplyStatic = I18N.applyStatic.bind(I18N);
  I18N.applyStatic = function () {
    _origApplyStatic();
    if (!this.ar()) {
      // Force re-render of active screen to purge any stale Arabic buttons
      const p = S.phase;
      if (p === 'court') try { Game.renderCourt && Game.renderCourt(); } catch(e){}
      if (p === 'duel') try { Game.renderDuel && Game.renderDuel(); } catch(e){}
      if (p === 'negotiation') try { Game.renderNegot && Game.renderNegot(); } catch(e){}
    }
  };

  /* ===== NEW EVIDENCE ===== */
  Object.assign(EVIDENCE, {
    autopsy_report:    { name: 'Autopsy Report',    cost: 2, strength: 9, risk: 1, desc: 'Official post-mortem examination findings.' },
    toxicology_report: { name: 'Toxicology Report', cost: 2, strength: 8, risk: 1, desc: 'Blood and tissue sample analysis.' },
    dna_evidence:      { name: 'DNA Evidence',      cost: 2, strength: 9, risk: 2, desc: 'Genetic profile from the crime scene.' },
    bank_transfer:     { name: 'Wire Transfer',     cost: 1, strength: 7, risk: 1, desc: 'Electronic funds transfer with routing records.' },
    cctv_timestamp:    { name: 'CCTV Footage',      cost: 2, strength: 8, risk: 1, desc: 'Security camera recording with verified timestamp.' },
    lab_analysis:      { name: 'Lab Analysis',      cost: 2, strength: 7, risk: 2, desc: 'Independent forensic laboratory results.' },
    police_report:     { name: 'Police Report',     cost: 1, strength: 6, risk: 1, desc: 'Official law enforcement documentation.' },
    text_messages:     { name: 'Text Messages',     cost: 1, strength: 7, risk: 2, desc: 'Recovered private message thread.' },
    property_deed:     { name: 'Property Deed',     cost: 1, strength: 7, risk: 1, desc: 'Official real estate transfer document.' },
    insurance_claim:   { name: 'Insurance Claim',   cost: 1, strength: 6, risk: 2, desc: 'Filed insurance claim with discrepancies.' },
  });

  /* ===== EXPANDED LOCATIONS (3 → 5) ===== */
  if (!LOCATIONS.find(l => l.id === 'crime_scene')) {
    LOCATIONS.push(
      { id: 'crime_scene', name: 'Crime Scene',    icon: '🔍', desc: 'Search physical evidence before it disappears. High reward, some risk.' },
      { id: 'informant',   name: 'Informant Meet', icon: '🕶️', desc: 'A risky off-the-books contact. They know things — if you can trust them.' }
    );
  }

  /* ===== SIX NEW REAL-LIFE CASES ===== */
  const NEW_CASES = [
    {
      id: 'last_drink',
      title: 'The Last Drink',
      intro: 'A Michelin-starred chef collapsed mid-tasting and never woke up. Toxicology found cyanide. The sommelier who poured the final glass is your client. Everyone in the room had a motive.',
      diff: 3,
      opponent: { name: 'Carla Moen',    personality: 'charming',     tieColor: '#6a3aaa', hairColor: PAL.hair3 },
      witness:  { name: 'T. Hargrove',  role: 'Restaurant Manager',   mood: 'nervous' },
      evidencePool: ['toxicology_report','cctv_timestamp','text_messages','phone_record','witness_statement','timeline_contradiction','autopsy_report'],
      statements: [
        { text: 'No poison was found in the restaurant\'s verified inventory.',   weakness: 'toxicology_report',     obj: null,           hint: 'The report identifies the exact compound and source batch.' },
        { text: 'The security cameras were offline for scheduled maintenance.',    weakness: 'cctv_timestamp',        obj: null,           hint: 'One angle was missed during the purge.' },
        { text: 'My client had absolutely no reason to harm the victim.',         weakness: 'text_messages',         obj: 'hearsay',      hint: 'Texts show a violent argument two days prior.' },
        { text: 'The sommelier never had access to the private wine cellar.',     weakness: 'witness_statement',     obj: null,           hint: 'A prior statement confirms cellar access was granted.' },
        { text: 'The timeline makes a poisoning physically impossible.',          weakness: 'timeline_contradiction', obj: 'speculation',  hint: 'The kitchen log breaks the alibi at 9:43 PM.' },
      ],
      reward: { money: 6000, reputation: 22 },
    },
    {
      id: 'blood_books',
      title: 'Blood on the Books',
      intro: 'A major pharmaceutical company fast-tracked a cardiac drug past safety review. Three patients died within a month of launch. Your client claims the CEO buried the safety data before approval.',
      diff: 4,
      opponent: { name: 'Julian Hart',  personality: 'technical',     tieColor: PAL.tieBlack, hairColor: PAL.hair },
      witness:  { name: 'Dr. K. Solis', role: 'Chief Medical Officer', mood: 'defensive' },
      evidencePool: ['lab_analysis','expert_report','internal_memo','email_thread','toxicology_report','calendar_invite','whistle_file'],
      statements: [
        { text: 'Every trial result was submitted to the regulator on time.',         weakness: 'lab_analysis',     obj: null,          hint: 'The raw data shows redactions before submission.' },
        { text: 'Our experts found no elevated cardiac risk in the test group.',      weakness: 'expert_report',    obj: null,          hint: 'An independent expert found a six-fold elevated risk.' },
        { text: 'No internal memo ever flagged any safety concern.',                  weakness: 'internal_memo',    obj: 'hearsay',     hint: 'A memo directly warns of fatal arrhythmia risk.' },
        { text: 'The fast-track approval was entirely standard industry practice.',   weakness: 'calendar_invite',  obj: 'speculation', hint: 'An emergency meeting invite proves leadership knew early.' },
        { text: 'The whistleblower was disgruntled and fabricating grievances.',      weakness: 'whistle_file',     obj: 'speculation', hint: 'The file contains internal validation of the risk data.' },
        { text: 'The emails were routine drug-development communications.',           weakness: 'email_thread',     obj: 'hearsay',     hint: 'One thread shows executives agreeing to suppress findings.' },
      ],
      reward: { money: 9000, reputation: 34 },
    },
    {
      id: 'inside_job',
      title: 'The Inside Job',
      intro: 'Eight kilos of uncut diamonds vanished from a supposedly impenetrable vault. No prints, no forced entry, no witness. The head of security — your client — is the only suspect. Someone set him up perfectly.',
      diff: 3,
      opponent: { name: 'Rex Holden',  personality: 'intimidating', tieColor: PAL.tieBlack, hairColor: PAL.hair },
      witness:  { name: 'G. Varro',   role: 'Insurance Investigator', mood: 'lying' },
      evidencePool: ['cctv_timestamp','access_badge_log','insurance_claim','police_report','phone_record','timeline_contradiction','dna_evidence'],
      statements: [
        { text: 'Security footage shows the defendant entering the vault alone.',  weakness: 'cctv_timestamp',    obj: null,          hint: 'One angle shows a second figure at the edge of frame.' },
        { text: 'His badge was used to disable the alarm at 2:14 AM.',            weakness: 'access_badge_log',  obj: null,          hint: 'Badge logs show two uses — the second from a cloned card.' },
        { text: 'The insurance claim was filed at exactly the right moment.',      weakness: 'insurance_claim',   obj: 'speculation', hint: 'The timestamps make that claim impossible to explain.' },
        { text: 'No other DNA or prints were recovered at the scene.',             weakness: 'dna_evidence',      obj: null,          hint: 'DNA under the lock housing belongs to someone else.' },
        { text: 'The defendant had no contact with any criminal network.',         weakness: 'phone_record',      obj: 'hearsay',     hint: 'Three calls to a number linked to the theft ring.' },
      ],
      reward: { money: 7000, reputation: 26 },
    },
    {
      id: 'ghost_signal',
      title: 'Ghost Signal',
      intro: 'A tech founder raised $40 million on a live product demo. The demo was built on stolen code and faked data. Three investors are suing. Your client claims he was misled by his own engineering team.',
      diff: 5,
      opponent: { name: 'Talia Voss',  personality: 'technical',  tieColor: PAL.tieBlue,   hairColor: PAL.hair2 },
      witness:  { name: 'C. Park',    role: 'Lead Engineer',      mood: 'scared' },
      evidencePool: ['email_thread','internal_memo','text_messages','financial_ledger','expert_report','calendar_invite','signed_contract'],
      statements: [
        { text: 'The founder never reviewed the technical architecture.',            weakness: 'email_thread',     obj: null,          hint: 'A thread shows the founder directing the fake demo build.' },
        { text: 'The financial projections were based on real market research.',     weakness: 'financial_ledger', obj: null,          hint: 'Ledger entries predate any legitimate research activity.' },
        { text: 'Nobody on the team was instructed to hide the demo\'s limits.',    weakness: 'internal_memo',    obj: 'hearsay',     hint: 'A memo instructs the team to keep investors from the backend.' },
        { text: 'The engineers acted alone. The client trusted their judgment.',     weakness: 'text_messages',    obj: 'speculation', hint: 'Texts show the founder micromanaging every slide in the deck.' },
        { text: 'The investment contract was signed with full disclosure.',          weakness: 'signed_contract',  obj: null,          hint: 'A clause requires disclosure of all known product limitations.' },
        { text: 'Expert analysis confirms original code authorship.',               weakness: 'expert_report',    obj: null,          hint: 'The expert flags eighteen functions copied from a competitor.' },
      ],
      reward: { money: 14000, reputation: 52 },
    },
    {
      id: 'phantom_deed',
      title: 'The Phantom Deed',
      intro: 'Three families each believe they own the same beachfront property. All three have notarized, signed deeds. Your client — the actual registered owner — has never spoken to any of them.',
      diff: 4,
      opponent: { name: 'Lena Drake',  personality: 'charming',     tieColor: PAL.tiePurple, hairColor: PAL.hair3 },
      witness:  { name: 'B. Caine',   role: 'Notary Public',        mood: 'overconfident' },
      evidencePool: ['property_deed','signed_contract','access_badge_log','bank_transfer','timeline_contradiction','phone_record','expert_report'],
      statements: [
        { text: 'The notary properly verified all signatures before stamping.',  weakness: 'property_deed',           obj: null,          hint: 'The stamp number was reused across all three documents.' },
        { text: 'Each sale was a separate and legitimate transaction.',           weakness: 'signed_contract',         obj: null,          hint: 'The signed contract dates overlap by exactly three days.' },
        { text: 'The seller had full legal authority to convey title each time.',weakness: 'bank_transfer',           obj: 'speculation', hint: 'Transfers show payments to an unknown third account.' },
        { text: 'Our records confirm each sale followed proper procedure.',       weakness: 'timeline_contradiction',  obj: null,          hint: 'The recording dates at the registry expose the fraud chain.' },
        { text: 'The defendant had no knowledge of any prior transaction.',       weakness: 'phone_record',            obj: 'hearsay',     hint: 'Three calls to each buyer placed on the same afternoon.' },
        { text: 'An independent expert would validate our title chain.',          weakness: 'expert_report',           obj: null,          hint: 'The title examiner found four breaks in the chain.' },
      ],
      reward: { money: 8500, reputation: 30 },
    },
    {
      id: 'red_file',
      title: 'The Red File',
      intro: 'A defense contractor\'s weapons system malfunctioned in the field. Twelve soldiers died. A whistleblower\'s encrypted file says the company knew for months. Your client is the engineer who signed the final safety certification.',
      diff: 6,
      opponent: { name: 'Conrad Nash',  personality: 'intimidating', tieColor: '#1a1a1a', hairColor: PAL.hair },
      witness:  { name: 'A. Varma',    role: 'Systems Engineer',     mood: 'scared' },
      evidencePool: ['whistle_file','internal_memo','expert_report','email_thread','calendar_invite','lab_analysis','security_footage','timeline_contradiction'],
      statements: [
        { text: 'The system passed all pre-deployment certification tests.',        weakness: 'lab_analysis',     obj: null,          hint: 'The lab used a non-representative test sample.' },
        { text: 'No internal report flagged the targeting anomaly before launch.',  weakness: 'internal_memo',    obj: null,          hint: 'The memo flagged it six weeks before deployment.' },
        { text: 'The whistleblower file is unverified and self-serving.',           weakness: 'whistle_file',     obj: 'speculation', hint: 'The file metadata matches the company\'s proprietary format.' },
        { text: 'My client\'s sign-off was procedural, not substantive review.',   weakness: 'email_thread',     obj: 'hearsay',     hint: 'The email chain shows the defendant requesting sign-off.' },
        { text: 'No credible expert would say this failure was predictable.',       weakness: 'expert_report',    obj: null,          hint: 'The expert says the failure mode was in existing literature.' },
        { text: 'The emergency review meeting never discussed the known defect.',   weakness: 'calendar_invite',  obj: null,          hint: 'Meeting notes mention a "critical safety debrief" in item 3.' },
        { text: 'There is no footage of the testing facility on that date.',        weakness: 'security_footage', obj: null,          hint: 'Recovered footage places the defendant in the test bay.' },
      ],
      reward: { money: 20000, reputation: 72 },
    },
  ];

  NEW_CASES.forEach(c => { if (!CASES.some(x => x.id === c.id)) CASES.push(c); });

  /* ===== RANKING SYSTEM ===== */
  const RANKS = [
    { name: 'Intern',           minRep: 0,   color: '#8a8a8a' },
    { name: 'Junior Associate', minRep: 10,  color: '#a0b0c0' },
    { name: 'Associate',        minRep: 30,  color: '#5aaa4a' },
    { name: 'Senior Associate', minRep: 65,  color: PAL.tieBlue },
    { name: 'Partner',          minRep: 110, color: PAL.tiePurple },
    { name: 'Senior Partner',   minRep: 170, color: PAL.tieRed },
    { name: 'Name Partner',     minRep: 250, color: PAL.gold },
    { name: 'Legal Legend',     minRep: 400, color: PAL.neonGold },
  ];

  function getPlayerRank(player) {
    const rep = player ? (player.reputation || 0) : 0;
    let rank = RANKS[0];
    for (const r of RANKS) { if (rep >= r.minRep) rank = r; }
    return rank;
  }

  function getNextRank(player) {
    const rep = player ? (player.reputation || 0) : 0;
    const idx = RANKS.reduce((best, r, i) => (rep >= r.minRep ? i : best), 0);
    return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
  }

  /* ===== ACHIEVEMENT SYSTEM ===== */
  const ACHIEVEMENTS_DEF = [
    { id: 'first_win',    name: 'First Chair',        icon: '⚖️', desc: 'Win your first case.' ,                          check: p => (p.wins||0) >= 1 },
    { id: 'three_wins',   name: 'Building a Name',    icon: '⭐', desc: 'Win three cases.',                               check: p => (p.wins||0) >= 3 },
    { id: 'ten_wins',     name: 'The Record',         icon: '🏆', desc: 'Win ten cases.',                                 check: p => (p.wins||0) >= 10 },
    { id: 'rich',         name: 'Billable Hours',     icon: '💰', desc: 'Accumulate $50,000 in career earnings.',         check: p => (p.money||0) >= 50000 },
    { id: 'partner_rank', name: 'Made Partner',       icon: '🤝', desc: 'Reach Partner rank.',                           check: p => (p.reputation||0) >= 110 },
    { id: 'legend_rank',  name: 'Legal Legend',       icon: '🌟', desc: 'Reach Legal Legend rank.',                      check: p => (p.reputation||0) >= 400 },
    { id: 'perked',       name: 'Well Prepared',      icon: '📋', desc: 'Earn 3 career perks.',                          check: p => (p.perks||[]).length >= 3 },
    { id: 'shopper',      name: 'Dressed for Court',  icon: '👔', desc: 'Unlock a wardrobe item from The Chambers.',     check: p => (p.wardrobeOwned||[]).length >= 1 },
    { id: 'legendary_w',  name: 'Legendary Run',      icon: '⚡', desc: 'Win a case on Legendary difficulty.',           check: p => !!(p.legendaryWin) },
    { id: 'no_recess_w',  name: 'No Breaks Taken',   icon: '🔥', desc: 'Win a case without calling Recess.',            check: p => !!(p.noRecessWin) },
    { id: 'combo_king',   name: 'Combo King',         icon: '🔗', desc: 'Land a Combo x5 in court.',                    check: p => !!(p.comboKing) },
  ];

  function checkAchievements(player) {
    if (!player) return [];
    player.achievements = player.achievements || [];
    const newOnes = [];
    ACHIEVEMENTS_DEF.forEach(ach => {
      if (!player.achievements.includes(ach.id) && ach.check(player)) {
        player.achievements.push(ach.id);
        newOnes.push(ach);
      }
    });
    return newOnes;
  }

  function awardAchievement(ach) {
    const el = document.createElement('div');
    el.className = 'combo-toast';
    el.innerHTML = `${ach.icon} Achievement Unlocked!<small>${ach.name}: ${ach.desc}</small>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  /* ===== WARDROBE / SHOP ITEMS ===== */
  const WARDROBE_ITEMS = [
    { id: 'tie_gold',      type: 'tie',  name: 'Court Gold Tie',    price: 800,  color: '#d4a82c', icon: '🟡', desc: 'Demand respect.' },
    { id: 'tie_green',     type: 'tie',  name: 'Emerald Tie',       price: 1200, color: '#2d8a4e', icon: '🟢', desc: 'Cool under fire.' },
    { id: 'tie_ivory',     type: 'tie',  name: 'Ivory Silk Tie',    price: 1500, color: '#f0e6d2', icon: '⬜', desc: 'Studied calm.' },
    { id: 'tie_crimson',   type: 'tie',  name: 'Crimson Vice',      price: 2000, color: '#8b0000', icon: '🔴', desc: 'Ruthless conviction.' },
    { id: 'suit_navy',     type: 'suit', name: 'Navy Pinstripe',    price: 2500, color: '#17213f', icon: '🔵', desc: 'Classic authority.' },
    { id: 'suit_charcoal', type: 'suit', name: 'Charcoal Power',    price: 3000, color: '#2c2c2c', icon: '⬛', desc: 'Unreadable.' },
    { id: 'suit_white',    type: 'suit', name: 'All White Closer',  price: 5000, color: '#e8e0d0', icon: '🤍', desc: 'Unforgettable.' },
  ];

  const PERK_ITEMS = [
    { id: 'perk_bench', type: 'perk', name: 'Bench Whisperer', price: 3000, perk: 'Bench Whisperer', icon: '⚖️', desc: 'Judge starts with +15 patience.' },
    { id: 'perk_hawk',  type: 'perk', name: 'Evidence Hawk',   price: 3000, perk: 'Evidence Hawk',   icon: '🦅', desc: 'Start every trial with +20 Focus.' },
    { id: 'perk_jury',  type: 'perk', name: 'Jury Magnet',     price: 3000, perk: 'Jury Magnet',     icon: '🎯', desc: 'Jury starts +10 in your favor.' },
    { id: 'perk_iron',  type: 'perk', name: 'Iron Resolve',    price: 2000, perk: 'Iron Resolve',    icon: '🔩', desc: 'Enter court with +10 extra credibility.' },
    { id: 'perk_wind',  type: 'perk', name: 'Second Wind',     price: 2500, perk: 'Second Wind',     icon: '💨', desc: 'One additional Recess per trial.' },
  ];

  let shopActiveTab = 'wardrobe';

  function applyWardrobeToPlayer(player) {
    if (!player || !player.wardrobeActive) return;
    const item = WARDROBE_ITEMS.find(x => x.id === player.wardrobeActive);
    if (!item) return;
    if (item.type === 'tie') player.tieColorOverride = item.color;
    if (item.type === 'suit') player.suitColorOverride = item.color;
  }

  // Apply wardrobe when entering courtroom
  const _drawLawyerOrig = Canvas.drawLawyer.bind(Canvas);
  Canvas.drawLawyer = function(ox, oy, p, faceRight, idleBob, mood) {
    const origTie = p.tieColor;
    if (p.tieColorOverride) p.tieColor = p.tieColorOverride;
    _drawLawyerOrig(ox, oy, p, faceRight, idleBob, mood);
    p.tieColor = origTie;
  };

  /* ===== SPEECH BUBBLES ON CANVAS ===== */
  Canvas.bubble = { text: '', line2: '', role: 'player', timer: 0, maxTimer: 90, bx: 230, by: 210 };

  Canvas.showBubble = function(rawText, role) {
    const cleaned = String(rawText || '').replace(/^[^:]{1,28}:\s*/, '').replace(/["""]/g,'').trim();
    const words = cleaned.split(' ').slice(0, 8);
    if (!words.length) return;
    const half = Math.ceil(words.length / 2);
    this.bubble.text  = words.slice(0, half).join(' ');
    this.bubble.line2 = words.slice(half).join(' ');
    this.bubble.role  = role || 'player';
    this.bubble.timer = this.bubble.maxTimer;
    this.bubble.bx = (role === 'opponent' || role === 'ai') ? 590 : role === 'judge' ? 400 : 230;
    this.bubble.by = (role === 'judge') ? 135 : 215;
  };

  // Extend the main draw loop to render bubbles
  const _origDraw = Canvas.draw.bind(Canvas);
  Canvas.draw = function() {
    _origDraw();
    const b = this.bubble;
    if (b.timer <= 0 || (!S.court && !S.duel)) return;
    const ctx = this.ctx;
    const alpha = b.timer > 70 ? 1 : b.timer / 20;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 10px Courier New';
    const t1 = b.text, t2 = b.line2;
    const maxW = 155;
    const w1 = Math.min(maxW, ctx.measureText(t1).width);
    const w2 = t2 ? Math.min(maxW, ctx.measureText(t2).width) : 0;
    const bw  = Math.max(w1, w2) + 16;
    const bh  = t2 ? 38 : 22;
    const rx  = b.bx - bw / 2, ry = b.by - bh - 10;
    const isJudge = b.role === 'judge';
    const bg = isJudge ? '#2a1f3d' : '#f5e8c8';
    const br = isJudge ? PAL.gold   : PAL.woodDark;
    const tc = isJudge ? PAL.neonGold : PAL.ink;
    // Box
    ctx.beginPath();
    ctx.moveTo(rx+4,ry); ctx.lineTo(rx+bw-4,ry); ctx.quadraticCurveTo(rx+bw,ry,rx+bw,ry+4);
    ctx.lineTo(rx+bw,ry+bh-4); ctx.quadraticCurveTo(rx+bw,ry+bh,rx+bw-4,ry+bh);
    ctx.lineTo(rx+4,ry+bh); ctx.quadraticCurveTo(rx,ry+bh,rx,ry+bh-4);
    ctx.lineTo(rx,ry+4); ctx.quadraticCurveTo(rx,ry,rx+4,ry);
    ctx.closePath();
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = br; ctx.lineWidth = 1.5; ctx.stroke();
    // Tail
    ctx.beginPath();
    ctx.moveTo(b.bx-5, ry+bh); ctx.lineTo(b.bx, ry+bh+8); ctx.lineTo(b.bx+5, ry+bh);
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = br; ctx.lineWidth = 1; ctx.stroke();
    // Text
    ctx.fillStyle = tc; ctx.textAlign = 'center';
    ctx.fillText(t1, b.bx, ry + 14);
    if (t2) ctx.fillText(t2, b.bx, ry + 28);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
    ctx.restore();
    b.timer--;
  };

  // Trigger bubbles from courtLog
  const _origCourtLog = Game.courtLog.bind(Game);
  Game.courtLog = function(text, kind) {
    _origCourtLog(text, kind);
    if (!S.court) return;
    if (kind === 'drama' || kind === 'good') Canvas.showBubble(text, 'player');
    else if (kind === 'ai') Canvas.showBubble(text, 'opponent');
    else if (kind === 'bad' && /judge|patience|overruled/i.test(text)) Canvas.showBubble(text, 'judge');
  };

  /* ===== RIVAL LAWYER DIALOGUE ===== */
  const RIVAL_DIALOGUE = {
    last_drink:   {
      open:  '"The toxicology is unambiguous. Your client was the last to touch that glass."',
      obj:   '"Objection sustained? I\'m barely warming up."',
      cross: '"Push harder and the witness remembers more. Your choice, counselor."',
      bad:   '"A misfire. The jury noticed."',
      combo: '"Impressive combo. It won\'t last."',
    },
    blood_books:  {
      open:  '"Three people are dead. No paperwork will change that fact."',
      obj:   '"The bodies don\'t file motions. But I do."',
      cross: '"My witness holds a medical degree. Do you?"',
      bad:   '"That was a mistake you cannot afford."',
      combo: '"Nicely threaded. I\'ve beaten better."',
    },
    inside_job:   {
      open:  '"The badge log, the footage, the prints — all one direction."',
      obj:   '"Sustained? Congratulations. The diamonds are still missing."',
      cross: '"My witness has seen a hundred insurance claims. Including this one."',
      bad:   '"The jury just learned something. So did I."',
      combo: '"Sharp sequence. Doesn\'t change the facts."',
    },
    ghost_signal: {
      open:  '"Forty million dollars. Raised on a demo built with stolen code."',
      obj:   '"I\'ll rephrase in simpler terms since counsel is struggling."',
      cross: '"The engineer is scared because your client put them in this seat."',
      bad:   '"The jury marked that stumble."',
      combo: '"Very clean. But we haven\'t seen the technical exhibits yet."',
    },
    phantom_deed: {
      open:  '"Three families. Three deeds. One fraud. The math is simple."',
      obj:   '"Noted. The notary stamp on exhibit five remains valid."',
      cross: '"Mr. Caine has signed ten thousand documents. He knows each one."',
      bad:   '"A crack. I intend to widen it."',
      combo: '"Well executed. I expected less."',
    },
    red_file:     {
      open:  '"Twelve soldiers. One signature. Your client\'s."',
      obj:   '"You can object all you want. The dead cannot."',
      cross: '"My witness signed off on eight cleared systems before this one."',
      bad:   '"The jury is remembering this moment."',
      combo: '"Excellent work. This just got interesting."',
    },
    // Generic fallback lines
    default: {
      open:  '"Let\'s see what counsel has prepared today."',
      obj:   '"Interesting approach. Not one I\'d have chosen."',
      cross: '"The witness knows what they signed. Do you?"',
      bad:   '"A stumble. The jury always remembers the first one."',
      combo: '"Well played. I\'ll adapt."',
    },
  };

  function getRivalLine(key) {
    const id = S.caseData && S.caseData.id;
    const set = RIVAL_DIALOGUE[id] || RIVAL_DIALOGUE.default;
    return set[key] || RIVAL_DIALOGUE.default[key] || '';
  }

  // Opening rival statement on court entry
  const _enterCourtroomSuits = Game.enterCourtroom.bind(Game);
  Game.enterCourtroom = function() {
    _enterCourtroomSuits();
    const c = S.caseData;
    const line = getRivalLine('open');
    if (line && c) {
      setTimeout(() => {
        UI.log('courtLog', `${c.opponent.name}: ${line}`, 'ai');
        Canvas.showBubble(line, 'opponent');
        Snd.speak(line.replace(/["""]/g,''), 'opponent', true);
      }, 2200);
    }
    // Apply wardrobe to player on court entry
    if (S.player) applyWardrobeToPlayer(S.player);
    if (S.court && S.player) {
      if (S.player.tieColorOverride) S.court.player.tieColorOverride = S.player.tieColorOverride;
      // Iron Resolve perk bonus
      if ((S.player.perks||[]).includes('Iron Resolve')) {
        S.court.player.cred = Math.min(160, S.court.player.cred + 10);
      }
      // Second Wind perk
      if ((S.player.perks||[]).includes('Second Wind')) {
        S.court.recessLeft = Math.min(4, (S.court.recessLeft||2) + 1);
      }
    }
  };

  // Rival line on sustained objection
  const _resolveObjSuits = Game.resolveObjection.bind(Game);
  Game.resolveObjection = function(type) {
    _resolveObjSuits(type);
    const c = S.court;
    if (!c || c.ended) return;
    if (Math.random() < 0.45) {
      const line = getRivalLine('obj');
      setTimeout(() => {
        UI.log('courtLog', `${c.opp.name}: ${line}`, 'ai');
        Canvas.showBubble(line, 'opponent');
      }, 400);
    }
  };

  // Rival line on bad player move
  const _afterTurnSuits = Game.afterPlayerTurn.bind(Game);
  Game.afterPlayerTurn = function(skipOpp) {
    const wasBad = S.court && S.court.lastResult === 'bad' && S.court.lastSide === 'player';
    _afterTurnSuits(skipOpp);
    if (wasBad && S.court && !S.court.ended && Math.random() < 0.38) {
      const line = getRivalLine('bad');
      setTimeout(() => {
        if (S.court && !S.court.ended) {
          UI.log('courtLog', `${S.court.opp.name}: ${line}`, 'ai');
          Canvas.showBubble(line, 'opponent');
        }
      }, 600);
    }
    // Track combo king achievement
    if (S.court && S.court.combo >= 5 && S.player) S.player.comboKing = true;
  };

  /* ===== IMPROVED INVESTIGATION VISIT LOGIC ===== */
  const _visitOrigSuits = Game.visit.bind(Game);
  Game.visit = function(loc) {
    const c = S.caseData;

    if (loc.id === 'crime_scene') {
      S.invest.visited[loc.id] = true;
      S.invest.left--;
      Snd.drama();
      const r = Math.random();
      if (r < 0.65) {
        const unrev = c.statements.filter((_,i) => !S.invest.revealed.includes(i));
        if (unrev.length > 0) {
          const idx = c.statements.indexOf(unrev[Math.floor(Math.random()*unrev.length)]);
          S.invest.revealed.push(idx);
          S.invest.clues.push({ text: `🔍 Crime Scene [Physical]: Scene analysis confirms — "${c.statements[idx].hint}"`, type: 'physical', icon: '🔍' });
        } else {
          S.invest.clues.push({ text: '🔍 Crime Scene [Physical]: No new angles, but the physical evidence is secured. Focus +4 on entry.', type: 'physical', icon: '🔍' });
        }
      } else {
        S.invest.clues.push({ text: '🔍 Crime Scene [Risk]: Scene was disturbed. Opposing counsel was here first. They\'re prepared.', type: 'risk', icon: '⚠️' });
        S.invest.coldOpp = true;
      }
      this.renderInvestigation();
      return;
    }

    if (loc.id === 'informant') {
      S.invest.visited[loc.id] = true;
      S.invest.left--;
      Snd.drama();
      const r = Math.random();
      if (r < 0.55) {
        const unrev = c.statements.filter((_,i) => !S.invest.revealed.includes(i));
        if (unrev.length >= 2) {
          const a = unrev[0], b = unrev[1];
          const ia = c.statements.indexOf(a), ib = c.statements.indexOf(b);
          S.invest.revealed.push(ia, ib);
          S.invest.clues.push({ text: `🕶️ Informant [Intel]: Two angles burned — "${a.hint}" and "${b.hint}"`, type: 'intel', icon: '🕶️' });
        } else if (unrev.length === 1) {
          const idx = c.statements.indexOf(unrev[0]);
          S.invest.revealed.push(idx);
          S.invest.clues.push({ text: `🕶️ Informant [Intel]: Your contact burns a solid angle — "${unrev[0].hint}"`, type: 'intel', icon: '🕶️' });
        } else {
          S.invest.clues.push({ text: '🕶️ Informant: Nothing new to burn, but they owe you one.', type: 'intel', icon: '🕶️' });
        }
      } else {
        S.invest.clues.push({ text: '🕶️ Informant [Burned]: The meet was watched. Assume opposing counsel knows your theory.', type: 'risk', icon: '⚠️' });
        S.invest.coldOpp = true;
      }
      this.renderInvestigation();
      return;
    }

    // Wrap existing visit results with category metadata
    _visitOrigSuits(loc);
    const last = S.invest.clues[S.invest.clues.length - 1];
    if (typeof last === 'string') {
      const type = loc.id === 'office' ? 'testimonial' : loc.id === 'corp' ? 'intel' : 'documentary';
      const icon = loc.id === 'office' ? '📁' : loc.id === 'corp' ? '🏛️' : '📜';
      S.invest.clues[S.invest.clues.length - 1] = { text: last, type, icon };
    }
  };

  /* Patch renderInvestigation to show styled clue cards */
  const _renderInvSuits = Game.renderInvestigation.bind(Game);
  Game.renderInvestigation = function() {
    _renderInvSuits();
    const ul = UI.$('cluesList');
    if (!ul) return;
    ul.innerHTML = '';
    if (!S.invest.clues.length) {
      ul.innerHTML = '<li style="color:var(--ink-dim);font-style:italic">No clues gathered yet.</li>';
      return;
    }
    S.invest.clues.forEach(clue => {
      const data = (typeof clue === 'string') ? { text: clue, type: 'info', icon: '▸' } : clue;
      const li = document.createElement('li');
      li.className = 'clue-item clue-' + (data.type || 'info');
      li.innerHTML = `<span class="clue-icon">${data.icon || '▸'}</span><span class="clue-text">${data.text}</span>`;
      ul.appendChild(li);
    });
  };

  /* ===== INVESTIGATION: 3 VISITS ===== */
  const _startCaseSuits = Game.startCase.bind(Game);
  Game.startCase = function(idx) {
    _startCaseSuits(idx);
    S.invest.left = 3;
    if (UI.$('investLeft')) UI.$('investLeft').textContent = '3';
  };

  /* ===== BETTER RANDOM CASE GENERATOR ===== */
  const RANDOM_THEMES = [
    {
      type: 'murder',
      titles: ['The Final Call', 'Midnight Verdict', 'Last Known Location', 'The Cold Room', 'Hour of Death', 'Dead Reckoning'],
      intros: [
        'A body. A timeline that doesn\'t add up. And a client who was in the wrong place at exactly the wrong time.',
        'The victim had enemies. So did your client. Only one of them is on trial.',
        'Three witnesses place your client at the scene. One of them is lying. You need to find out who — before the jury does.',
      ],
      stmtTemplates: [
        { text: 'The defendant was the last person seen with the victim.', obj: 'hearsay' },
        { text: 'No credible alibi was produced that holds up.',           obj: null       },
        { text: 'Cause of death was not accidental.',                      obj: 'speculation' },
        { text: 'Digital records place the defendant at the scene.',       obj: null       },
        { text: 'A witness heard explicit threats made beforehand.',       obj: 'hearsay'  },
        { text: 'Physical evidence from the scene is conclusive.',        obj: 'speculation' },
      ],
      evidencePool: ['autopsy_report','toxicology_report','dna_evidence','cctv_timestamp','text_messages','phone_record','police_report','witness_statement'],
    },
    {
      type: 'robbery',
      titles: ['The Clean Getaway', 'Empty Vault', 'Off the Books', 'The Missing Million', 'Dead Drop'],
      intros: [
        'A perfectly executed theft. No prints, no witnesses — until a camera nobody knew about.',
        'The funds moved overnight. Someone with inside knowledge made it happen and covered their tracks.',
        'The alarm was disabled. The cameras failed. Someone knew the schedule perfectly.',
      ],
      stmtTemplates: [
        { text: 'No one else had authorized access to the secure area.',     obj: null         },
        { text: 'The funds were transferred without proper authorization.',  obj: 'hearsay'    },
        { text: 'Security protocols were deliberately circumvented.',        obj: 'speculation' },
        { text: 'The defendant had motive, means, and opportunity.',         obj: null         },
        { text: 'Electronic access logs confirm the unauthorized breach.',   obj: null         },
        { text: 'The money trail ends at a connected account.',             obj: 'speculation' },
      ],
      evidencePool: ['bank_transfer','cctv_timestamp','access_badge_log','phone_record','financial_ledger','police_report','email_thread','witness_statement'],
    },
    {
      type: 'fraud',
      titles: ['Paper House', 'The Forged Name', 'Numbers Game', 'The Shadow Deal', 'False Positive', 'The Velvet Clause'],
      intros: [
        'Millions moved through shell companies and fabricated invoices. Your client swears they signed nothing.',
        'A charity collected donations for years. Not one dollar reached anyone who needed it.',
        'The books were spotless. The offshore account was not.',
      ],
      stmtTemplates: [
        { text: 'All documents were properly and legitimately authorized.',  obj: null         },
        { text: 'Every transaction followed standard established procedure.', obj: 'hearsay'   },
        { text: 'No credible expert would call this conduct improper.',      obj: 'speculation' },
        { text: 'The defendant had no knowledge of any irregularity.',      obj: null         },
        { text: 'The financials were independently audited and approved.',   obj: 'speculation' },
        { text: 'All communications reflect good-faith business dealings.', obj: 'hearsay'    },
      ],
      evidencePool: ['financial_ledger','bank_transfer','internal_memo','email_thread','expert_report','signed_contract','phone_record','settlement_draft'],
    },
  ];

  const _makeRandomSuits = Game.makeRandomCase.bind(Game);
  Game.makeRandomCase = function() {
    const theme = RANDOM_THEMES[Math.floor(Math.random() * RANDOM_THEMES.length)];
    const opps = [
      { name: 'Victor Hale',   personality: 'intimidating', tieColor: PAL.tieBlack,  hairColor: PAL.hair  },
      { name: 'Karim Black',   personality: 'slippery',     tieColor: PAL.tiePurple, hairColor: PAL.hair2 },
      { name: 'Talia Graves',  personality: 'technical',    tieColor: PAL.tieBlue,   hairColor: PAL.hair3 },
      { name: 'Rook Calder',   personality: 'charming',     tieColor: PAL.tieRed,    hairColor: PAL.hair2 },
      { name: 'Sasha Noir',    personality: 'slippery',     tieColor: '#2d8a4e',     hairColor: PAL.hair3 },
      { name: 'Dex Hollowell', personality: 'intimidating', tieColor: '#8b0000',     hairColor: PAL.hair  },
    ];
    const witnesses = [
      { name: 'S. Arden',  role: 'Key Witness',       mood: ['nervous','lying','scared','overconfident'][Math.floor(Math.random()*4)] },
      { name: 'D. Farrow', role: 'Expert Witness',    mood: ['nervous','defensive','overconfident'][Math.floor(Math.random()*3)] },
      { name: 'R. Thorn',  role: 'Eyewitness',        mood: ['scared','lying','nervous'][Math.floor(Math.random()*3)] },
      { name: 'M. Kalani', role: 'Character Witness', mood: ['overconfident','defensive'][Math.floor(Math.random()*2)] },
    ];
    const title = theme.titles[Math.floor(Math.random() * theme.titles.length)];
    const intro = theme.intros[Math.floor(Math.random() * theme.intros.length)];
    const pool = theme.evidencePool.slice().sort(() => Math.random() - 0.5).slice(0, 8);
    const stmtCount = 4 + Math.floor(Math.random() * 3);
    const tmpl = theme.stmtTemplates.slice().sort(() => Math.random() - 0.5).slice(0, stmtCount);
    const statements = tmpl.map((t, i) => ({
      text: t.text,
      weakness: pool[i % pool.length],
      obj: t.obj,
      hint: `${(EVIDENCE[pool[i % pool.length]] || {}).name || 'Key evidence'} directly contradicts this statement.`,
    }));
    const diff = Math.max(2, Math.min(7, 2 + Math.floor(Math.random() * 5)));
    return {
      id: 'random_' + Date.now(),
      title,
      intro,
      diff,
      opponent: opps[Math.floor(Math.random() * opps.length)],
      witness: witnesses[Math.floor(Math.random() * witnesses.length)],
      evidencePool: pool,
      statements,
      reward: { money: 4000 + diff * 2500, reputation: 12 + diff * 8 },
    };
  };

  /* ===== SHOP SCREEN BUILDER ===== */
  Game.buildShop = function(tab) {
    if (tab) shopActiveTab = tab;
    const player = S.player;
    const balance = player ? player.money : 0;
    const owned = player ? (player.wardrobeOwned || []) : [];
    const perks  = player ? (player.perks || [])        : [];

    if (UI.$('shopBalance')) UI.$('shopBalance').textContent = '$' + balance.toLocaleString();

    // Tab switching
    document.querySelectorAll('.shop-tab').forEach(b => {
      b.classList.toggle('selected', b.dataset.stab === shopActiveTab);
      b.onclick = () => this.buildShop(b.dataset.stab);
    });

    const grid = UI.$('shopGrid');
    grid.innerHTML = '';
    const items = shopActiveTab === 'perks' ? PERK_ITEMS : WARDROBE_ITEMS;

    items.forEach(item => {
      const isOwned = item.type === 'perk' ? perks.includes(item.perk) : owned.includes(item.id);
      const canBuy  = !isOwned && player && balance >= item.price;
      const card = document.createElement('div');
      card.className = 'shop-card' + (isOwned ? ' owned' : (!canBuy ? ' too-poor' : ''));
      card.innerHTML = `
        <div class="shop-icon">${item.icon || '🎁'}</div>
        <div class="shop-name">${item.name}</div>
        <div class="shop-desc">${item.desc || ''}</div>
        <div class="shop-price">${isOwned ? '✓ OWNED' : '$' + item.price.toLocaleString()}</div>
      `;
      if (canBuy) {
        card.onclick = () => {
          Snd.click();
          player.money -= item.price;
          if (item.type === 'perk') {
            player.perks = player.perks || [];
            if (!player.perks.includes(item.perk)) player.perks.push(item.perk);
          } else {
            player.wardrobeOwned = player.wardrobeOwned || [];
            player.wardrobeOwned.push(item.id);
            player.wardrobeActive = item.id;
            applyWardrobeToPlayer(player);
          }
          checkAchievements(player).forEach(a => awardAchievement(a));
          Game.saveCareer && Game.saveCareer();
          this.buildShop();
          UI.refreshTopBar();
          Snd.evidence();
        };
      }
      grid.appendChild(card);
    });
  };

  /* ===== RANKINGS SCREEN BUILDER ===== */
  Game.buildRankings = function() {
    const player = S.player;
    const rc = UI.$('rankContent'), ag = UI.$('achGrid');
    if (!rc || !ag) return;

    if (!player) {
      rc.innerHTML = '<p class="intro">Start a campaign to build your career record.</p>';
      ag.innerHTML = '';
      return;
    }

    const rank = getPlayerRank(player);
    const next = getNextRank(player);
    const pct  = next ? Math.min(100, Math.round(((player.reputation - rank.minRep) / (next.minRep - rank.minRep)) * 100)) : 100;

    rc.innerHTML = `
      <div class="rank-badge">
        <div class="rank-title" style="color:${rank.color}">${rank.name}</div>
        <div class="rank-rep">Reputation ${player.reputation}${next ? ` / ${next.minRep} → ${next.name}` : ' (MAXIMUM RANK)'}</div>
        <div class="rank-bar-wrap"><div class="rank-bar-fill" style="width:${pct}%;background:${rank.color}"></div></div>
      </div>
      <div class="career-stats">
        <div>⚖️ Cases Won: ${player.wins || 0}</div>
        <div>💰 Earnings: $${(player.money||0).toLocaleString()}</div>
        <div>📋 Perks: ${(player.perks||[]).join(' · ') || '—'}</div>
        <div>🏆 Achievements: ${(player.achievements||[]).length} / ${ACHIEVEMENTS_DEF.length}</div>
      </div>
    `;

    player.achievements = player.achievements || [];
    ag.innerHTML = '';
    ACHIEVEMENTS_DEF.forEach(ach => {
      const unlocked = player.achievements.includes(ach.id);
      const div = document.createElement('div');
      div.className = 'ach-card ' + (unlocked ? 'unlocked' : 'locked');
      div.innerHTML = `<div class="ach-icon">${ach.icon}</div><div class="ach-name">${ach.name}</div><div class="ach-desc">${ach.desc}</div>`;
      ag.appendChild(div);
    });
  };

  /* ===== HANDLEACT EXTENSION ===== */
  const _handleActSuits = Game.handleAct.bind(Game);
  Game.handleAct = function(act, btn, e) {
    if (act === 'shop') {
      Snd.click();
      if (!S.player) { alert('Start a campaign first to access The Chambers.'); return; }
      this.buildShop('wardrobe');
      UI.switchTo('shop');
      return;
    }
    if (act === 'rankings') {
      Snd.click();
      this.buildRankings();
      UI.switchTo('rankings');
      return;
    }
    _handleActSuits(act, btn, e);
  };

  /* ===== EXTEND switchTo FOR NEW SCREENS ===== */
  const _switchToSuits = UI.switchTo.bind(UI);
  UI.switchTo = function(phase) {
    ['shop','rankings'].forEach(id => { const el=this.$(id); if(el) el.classList.add('hidden'); });
    _switchToSuits(phase);
    if (phase === 'shop' || phase === 'rankings') {
      const el = this.$(phase);
      if (el) el.classList.remove('hidden');
      this.show('topbar');
      this.setText('phaseLabel', phase === 'shop' ? 'The Chambers' : 'Rankings');
      S.phase = phase;
      this.refreshTopBar();
    }
  };

  /* ===== ACHIEVEMENT CHECKS ON CASE END ===== */
  const _endCaseSuits = Game.endCase.bind(Game);
  Game.endCase = function(outcome, settlementAmt) {
    if (outcome === 'won' && S.player) {
      if (S.difficulty === 'legendary') S.player.legendaryWin = true;
      if (S.court && (S.court.recessUsed || 0) === 0) S.player.noRecessWin = true;
      if (S.court && (S.court.combo || 0) >= 5) S.player.comboKing = true;
    }
    _endCaseSuits(outcome, settlementAmt);
    if (S.player) {
      const news = checkAchievements(S.player);
      news.forEach((a, i) => setTimeout(() => awardAchievement(a), 2000 + i * 700));
    }
  };

  /* ===== TRACK RECESS USAGE ===== */
  const _recessSuits = Game.resolveRecess.bind(Game);
  Game.resolveRecess = function() {
    if (S.court) S.court.recessUsed = (S.court.recessUsed || 0) + 1;
    _recessSuits();
  };

  /* ===== RANK DISPLAY IN TOP BAR ===== */
  const _refreshTopSuits = UI.refreshTopBar.bind(UI);
  UI.refreshTopBar = function() {
    _refreshTopSuits();
    if (S.player) {
      const rank = getPlayerRank(S.player);
      const repEl = this.$('repLabel');
      if (repEl) repEl.textContent = `${rank.name} · Rep ${S.player.reputation}`;
    }
  };

  /* ===== ARABIC SUPPORT FOR NEW CONTENT ===== */
  // Extend AR_PACK evidence for new items
  Object.assign(AR_PACK.evidence, {
    autopsy_report:    ['تقرير الجثة', 'نتائج الفحص الطبي الشرعي الرسمي.'],
    toxicology_report: ['تقرير التسمم', 'تحليل عينات الدم والأنسجة.'],
    dna_evidence:      ['دليل الحمض النووي', 'تحليل البصمة الجينية من موقع الجريمة.'],
    bank_transfer:     ['حوالة بنكية', 'تحويل إلكتروني مع سجل المسار.'],
    cctv_timestamp:    ['لقطات الكاميرا', 'تسجيل كاميرا المراقبة مع طابع زمني.'],
    lab_analysis:      ['تحليل مختبري', 'نتائج مختبر جنائي مستقل.'],
    police_report:     ['تقرير الشرطة', 'وثيقة رسمية من جهات إنفاذ القانون.'],
    text_messages:     ['رسائل نصية', 'خيط رسائل خاصة مسترجعة.'],
    property_deed:     ['صك الملكية', 'وثيقة نقل ملكية عقارية رسمية.'],
    insurance_claim:   ['مطالبة تأمين', 'مطالبة تأمينية مقدمة مع تناقضات.'],
  });

  // New location Arabic
  Object.assign(AR_PACK.locations, {
    crime_scene: ['موقع الجريمة', 'ابحث في الأدلة المادية قبل أن تختفي.'],
    informant:   ['لقاء المخبر', 'لقاء محفوف بالمخاطر. معلومات قيمة — إن أمكن الثقة.'],
  });

  console.log('[Suits Simulator] Loaded: 6 new cases, 10 evidence types, 2 locations, speech bubbles, shop, rankings, achievements, rival dialogue, wardrobe.');
})();




/* ===== Boot the game after the DOM is available =====
 * The original file defined Game.init(), but never called it.
 * Without this, menu buttons render but no click handlers are attached.
 */
(function bootObjectionPowerSuit() {
  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    Game.init();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
