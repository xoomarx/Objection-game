/* ============================================================
 * SUITS SIMULATOR — IMPROVEMENTS PATCH v2
 * Sections:
 *   1-7  : Original fixes (lang, themes, randomization, locations,
 *           rebuttals, witness summon, career confirmation)
 *   8    : Witness Personality System
 *   9    : Press Witness action
 *   10   : Suspect Hidden Traits
 *   11   : 6 new case themes
 *   12   : Last-Chance Objection mechanic
 *   13   : Enhanced Combo / Objection Chain feedback
 *   14   : Enhanced crowd & jury atmospheric text
 *   15   : Daily Case system (seeded by date)
 *   16   : Better verdict screen + Career rank overhaul
 *   17   : Time Pressure mode (optional per-turn timer)
 * ============================================================ */
(function suitsImprovements() {
  if (typeof Game === 'undefined' || typeof I18N === 'undefined') return;

  /* --------------------------------------------------------
   * 1) LANGUAGE TOGGLE BUG FIX
   * -------------------------------------------------------- */
  const AR2EN = {};
  Object.entries(AR_PACK.ui.buttons || {}).forEach(([en, ar]) => { AR2EN[ar] = en; });
  Object.entries(AR_PACK.actions || {}).forEach(([id, ar]) => { AR2EN[ar] = ar; });
  const PHASE_AR2EN = {};
  Object.entries(AR_PACK.ui.phases || {}).forEach(([en, ar]) => { PHASE_AR2EN[ar] = en; });

  const _origTranslateBtns = I18N.translateButtonTexts.bind(I18N);
  I18N.translateButtonTexts = function () {
    const ar = this.ar();
    document.querySelectorAll('button').forEach(b => {
      const cur = (b.textContent || '').trim();
      if (b.dataset.enText && AR2EN[b.dataset.enText.trim()]) {
        b.dataset.enText = AR2EN[b.dataset.enText.trim()];
      }
      if (!b.dataset.enText) {
        b.dataset.enText = AR2EN[cur] || cur;
      }
    });
    _origTranslateBtns();
  };

  const _origApplyStatic = I18N.applyStatic.bind(I18N);
  I18N.applyStatic = function () {
    document.querySelectorAll('[data-en-html]').forEach(el => {
      const v = el.dataset.enHtml;
      if (v && /[؀-ۿ]/.test(v)) {
        if (!this.ar()) delete el.dataset.enHtml;
      }
    });
    _origApplyStatic();
  };

  const _origToggle = I18N.toggle.bind(I18N);
  I18N.toggle = function () {
    _origToggle();
    try {
      if (S.phase === 'menu') Game.buildMenu && Game.buildMenu();
      if (Game.buildShop && document.querySelector('#shop:not(.hidden)')) Game.buildShop();
      if (Game.buildRankings && document.querySelector('#rankings:not(.hidden)')) Game.buildRankings();
    } catch (e) {}
    if (Canvas && Canvas.bubble) Canvas.bubble.timer = 0;
  };

  /* --------------------------------------------------------
   * 2) 5 NEW THEMES (kidnapping, arson, cybercrime, malpractice, blackmail)
   * -------------------------------------------------------- */
  if (Array.isArray(window.RANDOM_THEMES) || typeof RANDOM_THEMES !== 'undefined') {
    try {
      const EXTRA_THEMES = [
        {
          type: 'kidnapping',
          titles: ['The Vanished Heir', 'No Ransom, No Trace', 'Forty-Eight Hours', 'The Empty Cradle'],
          intros: [
            'A child gone. A family fortune at stake. Your client says they were home. The phone records say otherwise.',
            'A businessman disappears for two days, then walks back in. Everyone is lying about something.',
          ],
          stmtTemplates: [
            { text: 'My client was home the entire weekend.', obj: null },
            { text: 'No ransom communication ever reached us.', obj: 'hearsay' },
            { text: 'There was no financial motive whatsoever.', obj: 'speculation' },
            { text: 'No one matching that description was ever seen with the victim.', obj: null },
            { text: 'The defendant has no connection to the location.', obj: null },
            { text: 'No threats were ever made — the relationship was friendly.', obj: 'hearsay' },
          ],
          evidencePool: ['phone_record','cctv_timestamp','text_messages','bank_transfer','witness_statement','access_badge_log','expert_report','police_report'],
        },
        {
          type: 'arson',
          titles: ['Burn Order', 'The Insurance Payout', 'Match and Motive', 'Smoke Signal'],
          intros: [
            'A warehouse went up two weeks before the policy expired. The owner says it was an accident. Faulty wiring tells a different story.',
            'A family home burned to the foundation. The only person who escaped unhurt is on trial.',
          ],
          stmtTemplates: [
            { text: 'My client was nowhere near the property that night.', obj: null },
            { text: 'The fire was clearly an accidental electrical fault.', obj: 'speculation' },
            { text: 'No accelerant was found at the scene.', obj: null },
            { text: 'The insurance claim was filed in good faith.', obj: 'hearsay' },
            { text: 'No motive existed for setting the fire deliberately.', obj: 'speculation' },
          ],
          evidencePool: ['expert_report','cctv_timestamp','police_report','phone_record','bank_transfer','witness_statement','internal_memo','text_messages'],
        },
        {
          type: 'cybercrime',
          titles: ['Zero Day', 'Ghost in the Server', 'The Encrypted Confession', 'Backdoor Politics'],
          intros: [
            'A breach. A leak. A whistleblower. Your client is accused of selling customer data to the highest bidder.',
            'Ten million dollars in crypto walked out of a hedge fund overnight. The trail leads to one keyboard.',
          ],
          stmtTemplates: [
            { text: 'No unauthorized access ever originated from my client\'s account.', obj: null },
            { text: 'The login records were certainly tampered with after the fact.', obj: 'speculation' },
            { text: 'No one shared credentials outside the security protocol.', obj: 'hearsay' },
            { text: 'My client has no technical ability to execute such an attack.', obj: null },
            { text: 'No funds reached any account connected to the defendant.', obj: null },
          ],
          evidencePool: ['access_badge_log','bank_transfer','email_thread','text_messages','expert_report','internal_memo','phone_record','whistle_file'],
        },
        {
          type: 'malpractice',
          titles: ['First, Do No Harm', 'The Wrong Chart', 'Operating Theatre', 'Off-Label'],
          intros: [
            'A routine surgery. A preventable death. The hospital closed ranks. The family wants the truth — and damages.',
            'A misdiagnosis ruined a life. The doctor says it was textbook. The textbook disagrees.',
          ],
          stmtTemplates: [
            { text: 'The standard of care was met in every respect.', obj: null },
            { text: 'No deviation from established protocol occurred.', obj: 'speculation' },
            { text: 'The patient\'s outcome was not foreseeable.', obj: 'hearsay' },
            { text: 'Every member of the team performed their duties properly.', obj: null },
            { text: 'There was no failure to obtain informed consent.', obj: null },
          ],
          evidencePool: ['expert_report','internal_memo','email_thread','witness_statement','phone_record','whistle_file','signed_contract','settlement_draft'],
        },
        {
          type: 'blackmail',
          titles: ['Pay or Print', 'The Velvet Threat', 'Dossier 7', 'A Civilized Extortion'],
          intros: [
            'A senator. A photograph. A demand. Your client says they were just delivering an envelope.',
            'A CEO paid a stranger six figures. They say it was charity. The wire memo reads: "for your discretion."',
          ],
          stmtTemplates: [
            { text: 'No threat was ever made to anyone, at any time.', obj: 'hearsay' },
            { text: 'The payment was a legitimate consulting arrangement.', obj: null },
            { text: 'My client never possessed the materials in question.', obj: null },
            { text: 'No communication contained anything coercive in nature.', obj: 'speculation' },
            { text: 'There was no relationship that could give rise to leverage.', obj: 'hearsay' },
          ],
          evidencePool: ['text_messages','bank_transfer','email_thread','phone_record','witness_statement','settlement_draft','cctv_timestamp','internal_memo'],
        },
      ];
      try { EXTRA_THEMES.forEach(t => RANDOM_THEMES.push(t)); } catch (e) {}
    } catch (e) { console.warn('Theme extension skipped:', e); }
  }

  /* --------------------------------------------------------
   * 3) CAMPAIGN RANDOMIZATION
   * -------------------------------------------------------- */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const FIXED_CASES = (typeof CASES !== 'undefined') ? CASES.slice() : [];

  function rebuildCampaignDeck() {
    if (typeof CASES === 'undefined' || !FIXED_CASES.length) return;
    const fixedShuffled = shuffle(FIXED_CASES);
    const proceduralCount = 2 + Math.floor(Math.random() * 2);
    const procedural = [];
    for (let i = 0; i < proceduralCount; i++) {
      try { procedural.push(Game.makeRandomCase()); } catch (e) {}
    }
    const deck = shuffle(fixedShuffled.concat(procedural));
    CASES.length = 0;
    deck.forEach(c => CASES.push(c));
    try { I18N.translateData(); } catch (e) {}
  }

  const _origStartCampaign = Game.startCampaign.bind(Game);
  Game.startCampaign = function () {
    rebuildCampaignDeck();
    _origStartCampaign();
  };

  /* --------------------------------------------------------
   * 4) BIGGER MAP — 5 visits, 3 new locations
   * -------------------------------------------------------- */
  if (typeof LOCATIONS !== 'undefined') {
    const NEW_LOCS = [
      { id: 'crimescene', name: 'Crime Scene',     icon: '🔦', desc: 'Walk the scene. Read what the police missed.' },
      { id: 'speakeasy',  name: 'Underground Bar', icon: '🥃', desc: 'Find the witness who would never come forward.' },
      { id: 'archive',    name: 'Press Archives',  icon: '🗞️', desc: 'Old headlines hold patterns the prosecution buried.' },
    ];
    NEW_LOCS.forEach(l => { if (!LOCATIONS.find(x => x.id === l.id)) LOCATIONS.push(l); });
    if (AR_PACK && AR_PACK.locations) {
      Object.assign(AR_PACK.locations, {
        crimescene: ['مسرح الجريمة', 'تجوّل في المكان. اقرأ ما فات الشرطة.'],
        speakeasy:  ['الحانة السرية', 'اعثر على الشاهد الذي لن يتقدم أبداً.'],
        archive:    ['أرشيف الصحف', 'العناوين القديمة تخفي أنماطاً دفنها الادعاء.'],
      });
      try { I18N.translateData(); } catch (e) {}
    }
  }

  const _origStartCase = Game.startCase.bind(Game);
  Game.startCase = function (idx) {
    _origStartCase(idx);
    if (S.invest) {
      S.invest.left = 5;
      const el = document.getElementById('investLeft');
      if (el) el.textContent = '5';
    }
  };

  /* --------------------------------------------------------
   * 5) OPPOSING-LAWYER REBUTTAL LINES
   * -------------------------------------------------------- */
  const REBUTTALS_EN = {
    obj_good: [
      "Counsel grasps at procedure when the facts fail them.",
      "A clever objection. It changes nothing.",
      "Sustained today, irrelevant tomorrow.",
    ],
    obj_bad: [
      "Your Honor — counsel is fishing.",
      "That objection has no foundation in this jurisdiction.",
      "I would remind my colleague which century we are in.",
    ],
    evidence_good: [
      "One document does not unravel a case, Your Honor.",
      "Counsel mistakes drama for proof.",
      "I will address that exhibit in my closing.",
    ],
    evidence_bad: [
      "Withdrawn — and rightly so.",
      "Curious choice of exhibit. Did counsel even read it?",
      "The jury saw exactly what I needed them to see.",
    ],
    cross: [
      "My witness has answered fully and truthfully.",
      "Counsel is badgering — move on.",
      "Asked and answered, Your Honor.",
    ],
    pressure_good: [
      "Theatrics. The record will not remember them.",
      "Pressure is not evidence.",
    ],
    pressure_bad: [
      "Your Honor, the witness is plainly distressed.",
      "Counsel's intimidation tactics speak for themselves.",
    ],
  };

  const REBUTTALS_AR = {
    obj_good: [
      'الزميل يتشبّث بالإجراءات حين تخذله الوقائع.',
      'اعتراض ذكي. لكنه لا يغيّر شيئاً.',
      'سيُقبل اليوم، ولن يهم غداً.',
    ],
    obj_bad: [
      'سيادة القاضي — الزميل يجرّب حظه.',
      'هذا الاعتراض لا أساس له هنا.',
      'أذكّر زميلي بالقرن الذي نعيش فيه.',
    ],
    evidence_good: [
      'وثيقة واحدة لا تهدم قضية كاملة، سيادة القاضي.',
      'الزميل يخلط بين الدراما والدليل.',
      'سأتناول هذا المستند في مرافعتي الختامية.',
    ],
    evidence_bad: [
      'سُحبت — وعن حق.',
      'اختيار غريب. هل قرأ الزميل المستند أصلاً؟',
      'هيئة المحلفين رأت بالضبط ما أردت.',
    ],
    cross: [
      'شاهدي أجاب بصدق وكامل.',
      'الزميل يضايق الشاهد — فلينتقل.',
      'سُئل وأُجيب، سيادة القاضي.',
    ],
    pressure_good: [
      'استعراض. السجل لن يذكره.',
      'الضغط ليس دليلاً.',
    ],
    pressure_bad: [
      'سيادة القاضي، الشاهد في حالة استياء واضحة.',
      'أساليب الترهيب تتحدث عن نفسها.',
    ],
  };

  function pickRebuttal(kind) {
    const pack = I18N.ar() ? REBUTTALS_AR : REBUTTALS_EN;
    const list = pack[kind] || pack.obj_bad;
    return list[Math.floor(Math.random() * list.length)];
  }

  function oppRebut(kind) {
    if (!S.court || S.court.ended) return;
    const line = pickRebuttal(kind);
    const oppName = (S.caseData && S.caseData.opponent && S.caseData.opponent.name) || 'Opposing Counsel';
    setTimeout(() => {
      try { Game.courtLog(`${oppName}: "${line}"`, 'info'); } catch (e) {}
      try { Canvas.showBubble && Canvas.showBubble(line, 'opponent'); } catch (e) {}
      try { Snd.speak && Snd.speak(line, 'opponent', false); } catch (e) {}
    }, 700);
  }

  const _origResolveObj = Game.resolveObjection && Game.resolveObjection.bind(Game);
  if (_origResolveObj) {
    Game.resolveObjection = function (type) {
      _origResolveObj(type);
      const c = S.court;
      if (!c || c.ended) return;
      oppRebut(c.lastResult === 'good' ? 'obj_good' : 'obj_bad');
    };
  }

  const evidenceFn = Game.presentEvidence || Game.playEvidence || Game.useEvidence;
  if (evidenceFn) {
    const fnName = Game.presentEvidence ? 'presentEvidence' : (Game.playEvidence ? 'playEvidence' : 'useEvidence');
    const _orig = Game[fnName].bind(Game);
    Game[fnName] = function (...args) {
      const out = _orig(...args);
      const c = S.court;
      if (!c || c.ended) return out;
      oppRebut(c.lastResult === 'good' ? 'evidence_good' : 'evidence_bad');
      return out;
    };
  }

  const crossFn = Game.crossExamine || Game.cross;
  if (crossFn) {
    const fnName = Game.crossExamine ? 'crossExamine' : 'cross';
    const _orig = Game[fnName].bind(Game);
    Game[fnName] = function (...args) {
      const out = _orig(...args);
      const c = S.court;
      if (c && !c.ended) oppRebut('cross');
      return out;
    };
  }

  if (Game.pressure) {
    const _orig = Game.pressure.bind(Game);
    Game.pressure = function (...args) {
      const out = _orig(...args);
      const c = S.court;
      if (c && !c.ended) oppRebut(c.lastResult === 'good' ? 'pressure_good' : 'pressure_bad');
      return out;
    };
  }

  /* --------------------------------------------------------
   * 6) SUMMON A WITNESS — new court action
   * -------------------------------------------------------- */
  const SUMMON_LINES_EN = [
    "I call to the stand a witness who saw what really happened.",
    "Your Honor, the defense calls a surprise witness.",
    "There is one more voice this courtroom must hear.",
  ];
  const SUMMON_LINES_AR = [
    'أستدعي شاهداً رأى ما حدث حقاً.',
    'سيادة القاضي، الدفاع يستدعي شاهداً مفاجئاً.',
    'ثمة صوت آخر يجب أن تسمعه هذه القاعة.',
  ];

  Game.summonWitness = function () {
    const c = S.court;
    if (!c || c.ended || c.turn !== 'player') return;
    if (c.summonedWitness) {
      this.courtLog(I18N.ar() ? 'لا يمكن استدعاء شاهد آخر في هذه المحاكمة.' : 'No more witnesses can be summoned this trial.', 'bad');
      return;
    }
    c.summonedWitness = true;
    const lines = I18N.ar() ? SUMMON_LINES_AR : SUMMON_LINES_EN;
    const line = lines[Math.floor(Math.random() * lines.length)];
    try { Snd.gavel && Snd.gavel(); } catch (e) {}
    try { Snd.crowdReact && Snd.crowdReact('gasp'); } catch (e) {}
    try { Canvas.showBubble && Canvas.showBubble(line, 'player'); } catch (e) {}
    try { Snd.speak && Snd.speak(line, 'player', true); } catch (e) {}
    UI.bigCue && UI.bigCue(I18N.ar() ? 'الشاهد المفاجئ!' : 'SURPRISE WITNESS!', 900);

    const stmt = c.statements && c.statements.find(s => !s.revealed && !s.spent);
    if (stmt) { stmt.revealed = true; stmt.hintShown = true; }
    c.jury = Math.max(-50, Math.min(50, c.jury + 10));
    c.opp.cred = Math.max(0, c.opp.cred - 12);
    c.player.cred = Math.min(120, c.player.cred + 6);
    Canvas.addFloater && Canvas.addFloater('+10 JURY', 400, 200, '#36c46f');
    this.courtLog(I18N.ar() ? '🎙️ شاهد مفاجئ! +10 محلفون، الخصم -12، نقطة ضعف انكشفت.' : '🎙️ Surprise witness called! Jury +10, Opp -12 cred, weakness revealed.', 'drama');
    setTimeout(() => oppRebut('cross'), 900);
    Game.renderCourt && Game.renderCourt();
  };

  const _origRenderActions = Game.renderActions && Game.renderActions.bind(Game);
  if (_origRenderActions) {
    Game.renderActions = function () {
      _origRenderActions();
      if (S.phase !== 'court' || !S.court || S.court.ended) return;
      const bar = document.getElementById('courtActions');
      if (!bar) return;
      if (bar.querySelector('[data-act="summon-witness"]')) return;
      const btn = document.createElement('button');
      btn.dataset.act = 'summon-witness';
      btn.className = 'court-act' + (S.court.summonedWitness ? ' disabled' : '');
      btn.textContent = I18N.ar() ? '🎙️ استدعاء شاهد' : '🎙️ Summon Witness';
      if (S.court.summonedWitness) btn.disabled = true;
      btn.onclick = () => Game.summonWitness();
      bar.appendChild(btn);
    };
  }

  /* --------------------------------------------------------
   * 7) CAREER CONFIRMATION
   * -------------------------------------------------------- */
  const _origStartCamp2 = Game.startCampaign.bind(Game);
  Game.startCampaign = function () {
    let hasSave = false;
    try { hasSave = !!localStorage.getItem('ops_save'); } catch (e) {}
    if (hasSave && !window.__opsConfirmedNew) {
      const msg = I18N.ar()
        ? 'لديك مسيرة محفوظة. هل تريد بدء مسيرة جديدة؟ (سيتم استبدال الحفظ السابق عند الفوز بقضية)'
        : 'You have a saved career. Start a NEW career? (Your previous save will be overwritten when you win a case.)';
      if (!window.confirm(msg)) return;
    }
    window.__opsConfirmedNew = true;
    setTimeout(() => { window.__opsConfirmedNew = false; }, 100);
    _origStartCamp2();
  };

  /* ============================================================
   * 8) WITNESS PERSONALITY SYSTEM
   * Each mood has distinct dialogue that fires during testimony.
   * Mood also affects cross-exam and pressure success rates.
   * ============================================================ */
  const WITNESS_MOODS = {
    nervous: {
      badge: '😰 Nervous',
      color: '#ffd580',
      lines: [
        "I… I need a moment. This is very stressful.",
        "Could you please repeat that? I lost my train of thought.",
        "I'm trying to remember exactly — it was a while ago.",
        "My hands won't stop shaking. I apologize.",
        "I just — I want to tell the truth here.",
      ],
      crossBonus: 0.15,  // +15% chance of revealing weakness
      pressureRisk: -0.10, // pressure is riskier (witness clams up)
    },
    aggressive: {
      badge: '😤 Aggressive',
      color: '#ff7b7b',
      lines: [
        "You're twisting my words. I said what I said.",
        "Is counsel seriously suggesting I would lie under oath?",
        "That question is insulting and you know it.",
        "I've answered this three times. Three. Times.",
        "My lawyer told me to expect exactly this kind of harassment.",
      ],
      crossBonus: -0.10, // harder to cross (fights back)
      pressureRisk: 0.15, // pressure more effective
    },
    corrupt: {
      badge: '🕶️ Evasive',
      color: '#b46aff',
      lines: [
        "That's... not a question I can answer precisely.",
        "My recollection of that period is limited.",
        "I was advised by counsel to keep certain matters private.",
        "I'm not sure what you mean by 'agreement.'",
        "Everything I did was consistent with industry practice.",
      ],
      crossBonus: 0.05,
      pressureRisk: 0.05,
    },
    forgetful: {
      badge: '🤔 Uncertain',
      color: '#80caff',
      lines: [
        "I honestly can't be certain — it was months ago.",
        "I think it was Tuesday? Or possibly Wednesday.",
        "The details blur a bit at this distance.",
        "I remember the broad strokes, but the specifics escape me.",
        "I may have said that — I'm not sure now.",
      ],
      crossBonus: 0.20, // very vulnerable to cross
      pressureRisk: -0.05,
    },
    overconfident: {
      badge: '😎 Overconfident',
      color: '#4ea3ff',
      lines: [
        "I'm absolutely certain of what I saw. No question.",
        "My memory is quite good, counsel. Ask anyone.",
        "You won't find a hole in my account because there isn't one.",
        "I've told this story a hundred times and it never changes.",
        "I don't make mistakes. I don't need notes.",
      ],
      crossBonus: 0.12,  // overconfidence creates blind spots to exploit
      pressureRisk: -0.15, // pressure rolls off them
    },
    scared: {
      badge: '😨 Frightened',
      color: '#ff9e5e',
      lines: [
        "I… I want to tell the truth but I'm worried about consequences.",
        "Can someone tell me if I'm protected here?",
        "I didn't think it would end up in court. I really didn't.",
        "Please don't ask me about that specific part.",
        "I've already said more than I was supposed to.",
      ],
      crossBonus: 0.18, // easy to push
      pressureRisk: 0.20, // very responsive to pressure
    },
    defensive: {
      badge: '🛡️ Defensive',
      color: '#aaffaa',
      lines: [
        "Everything I did was completely by the book.",
        "I followed all procedures. All of them.",
        "I resent the implication behind that question.",
        "My record speaks for itself, counselor.",
        "That characterization is simply not accurate.",
      ],
      crossBonus: 0.08,
      pressureRisk: -0.05,
    },
    guarded: {
      badge: '🔒 Guarded',
      color: '#d4af37',
      lines: [
        "I'll answer that within the scope of what I actually know.",
        "I prefer to be precise here — let me choose my words.",
        "I don't want to speculate beyond what I witnessed.",
        "I've been advised to limit my answers to direct knowledge.",
        "That's a broader question than I can responsibly address.",
      ],
      crossBonus: 0.05,
      pressureRisk: 0.00,
    },
  };

  // Inject personality badge near statement box
  function ensurePersonalityBadge() {
    if (!S.caseData || !S.caseData.witness) return;
    let badge = document.getElementById('witnessMoodBadge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'witnessMoodBadge';
      badge.className = 'witness-mood-badge';
      const stmtBox = document.getElementById('statementBox');
      if (stmtBox && stmtBox.parentNode) {
        stmtBox.parentNode.insertBefore(badge, stmtBox);
      }
    }
    const mood = (S.caseData.witness.mood || 'nervous').toLowerCase();
    const moodData = WITNESS_MOODS[mood] || WITNESS_MOODS.nervous;
    badge.textContent = moodData.badge;
    badge.style.borderColor = moodData.color;
    badge.style.color = moodData.color;
    if (S.court && S.court.witnessConfidence < 40) {
      badge.classList.add('mood-rattled');
    } else {
      badge.classList.remove('mood-rattled');
    }
  }

  // Fire personality dialogue during opponent's turn occasionally
  const _origAfterPlayerTurn = Game.afterPlayerTurn.bind(Game);
  Game.afterPlayerTurn = function (skipOpp) {
    _origAfterPlayerTurn(skipOpp);
    const c = S.court;
    if (!c || c.ended || !S.caseData || !S.caseData.witness) return;
    if (c.round % 3 !== 0) return; // fire every 3rd round
    const mood = (S.caseData.witness.mood || 'nervous').toLowerCase();
    const moodData = WITNESS_MOODS[mood];
    if (!moodData) return;
    const line = moodData.lines[Math.floor(Math.random() * moodData.lines.length)];
    const wName = S.caseData.witness.name || 'Witness';
    setTimeout(() => {
      if (!S.court || S.court.ended) return;
      try { Game.courtLog(`${wName}: "${line}"`, 'drama'); } catch (e) {}
      try { Canvas.showBubble && Canvas.showBubble(line, 'witness'); } catch (e) {}
      try { Snd.speak && Snd.speak(line, 'witness', false); } catch (e) {}
    }, 400);
    ensurePersonalityBadge();
  };

  // Patch renderCourt to show badge
  const _origRenderCourt = Game.renderCourt.bind(Game);
  Game.renderCourt = function () {
    _origRenderCourt();
    ensurePersonalityBadge();
    updateTimerBar();
  };

  /* ============================================================
   * 9) PRESS WITNESS ACTION
   * Applies psychological pressure specific to witness mood.
   * Distinct from generic "Pressure" — targets the testimony.
   * ============================================================ */
  Game.pressWitness = function () {
    const c = S.court;
    if (!c || c.ended || c.turn !== 'player') return;
    if (c.pressUsed >= 2) {
      this.courtLog('You have already pressed this witness twice. They are steeled against further pressing.', 'bad');
      return;
    }
    c.pressUsed = (c.pressUsed || 0) + 1;
    const mood = (S.caseData && S.caseData.witness && S.caseData.witness.mood || 'nervous').toLowerCase();
    const moodData = WITNESS_MOODS[mood] || WITNESS_MOODS.nervous;
    const traits = c.witnessTraits || {};
    const nervousness = traits.nervousness || 5;
    const lyingSkill = traits.lyingSkill || 5;

    // Base success chance modified by mood and hidden traits
    const baseChance = 0.50 + (moodData.crossBonus || 0) + (nervousness - lyingSkill) * 0.04;
    const success = Math.random() < Math.min(0.85, Math.max(0.15, baseChance));

    try { Snd.witnessMumble && Snd.witnessMumble(); } catch (e) {}

    if (success) {
      const stmt = this.currentStatement();
      const witHit = 12 + Math.round(nervousness * 0.8);
      c.witnessConfidence = Math.max(0, c.witnessConfidence - witHit);
      c.jury = Math.max(-50, Math.min(50, c.jury + 4));

      // Reveal weakness on a very good press
      if (Math.random() < 0.45 && stmt && !c.revealedWeak.includes(c.statementIdx)) {
        c.revealedWeak.push(c.statementIdx);
        this.courtLog(`📌 PRESS: You found the crack. The witness buckles. "${stmt.hint}" — witness -${witHit}, jury +4, weakness revealed.`, 'drama');
        try { UI.bigCue && UI.bigCue('PRESSED!', 650); } catch (e) {}
      } else {
        this.courtLog(`📌 PRESS: The witness shifts under your stare. Witness confidence -${witHit}, jury +4.`, 'good');
      }
      try { Canvas.addFloater && Canvas.addFloater(`-${witHit} wit`, 650, 200, '#d4a82c'); } catch (e) {}
      c.lastResult = 'good'; c.lastSide = 'player';
      if (c.rewardMomentum) c.rewardMomentum(true, 4);
      else try { this.rewardMomentum && this.rewardMomentum(true, 4); } catch (e) {}
    } else {
      // Witness resists — mild hit to credibility
      c.player.cred = Math.max(0, c.player.cred - 6);
      c.judge = Math.max(0, c.judge - 5);
      const resistLine = [
        "The witness holds steady. The judge gives you a look.",
        "That approach misfired. The jury shifts.",
        "The witness doesn't budge — if anything they look more credible.",
      ][Math.floor(Math.random() * 3)];
      this.courtLog(`📌 PRESS failed: ${resistLine} You -6 cred, judge -5.`, 'bad');
      try { Canvas.addFloater && Canvas.addFloater('-6', 230, 240, '#d44a3a'); } catch (e) {}
      c.lastResult = 'bad'; c.lastSide = 'player';
    }
    this.afterPlayerTurn();
  };

  // Inject Press Witness into actions row (alongside Summon Witness)
  const _origRenderActions2 = Game.renderActions.bind(Game);
  Game.renderActions = function () {
    _origRenderActions2();
    if (S.phase !== 'court' || !S.court || S.court.ended) return;
    const bar = document.getElementById('courtActions');
    if (!bar) return;
    const c = S.court;
    const pressCount = c.pressUsed || 0;
    if (bar.querySelector('[data-act="press-witness"]')) return;
    const btn = document.createElement('button');
    btn.dataset.act = 'press-witness';
    btn.className = 'court-act press-witness-btn' + (pressCount >= 2 ? ' disabled' : '');
    btn.textContent = I18N.ar() ? `📌 ضغط على الشاهد (${2 - pressCount})` : `📌 Press Witness (${2 - pressCount})`;
    btn.disabled = pressCount >= 2 || c.turn !== 'player';
    btn.onclick = () => Game.pressWitness();
    bar.appendChild(btn);
  };

  /* ============================================================
   * 10) SUSPECT HIDDEN TRAITS
   * Generated fresh per trial. Affects press, cross, pressure.
   * Displayed subtly in the court interface.
   * ============================================================ */
  const MOTIVES = ['financial', 'personal', 'professional', 'political', 'revenge', 'fear'];
  const TRAIT_NAMES = { motive: 'Motive', lyingSkill: 'Deception', nervousness: 'Nerves', alibiStrength: 'Alibi' };

  function generateWitnessTraits() {
    const mood = (S.caseData && S.caseData.witness && S.caseData.witness.mood) || 'nervous';
    const moodData = WITNESS_MOODS[mood] || WITNESS_MOODS.nervous;
    // Seed traits slightly from mood
    const nervBase = mood === 'nervous' ? 7 : mood === 'aggressive' ? 4 : mood === 'scared' ? 8 : 5;
    const lyingBase = mood === 'corrupt' ? 8 : mood === 'overconfident' ? 6 : mood === 'guarded' ? 7 : 5;
    return {
      motive: MOTIVES[Math.floor(Math.random() * MOTIVES.length)],
      lyingSkill:     Math.max(1, Math.min(10, lyingBase  + Math.floor(Math.random() * 4) - 2)),
      nervousness:    Math.max(1, Math.min(10, nervBase   + Math.floor(Math.random() * 4) - 2)),
      alibiStrength:  Math.max(1, Math.min(10, 5          + Math.floor(Math.random() * 6) - 3)),
    };
  }

  function renderTraitsPanel() {
    let panel = document.getElementById('witnessTraitsPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'witnessTraitsPanel';
      panel.className = 'witness-traits-panel';
      const stmtBox = document.getElementById('statementBox');
      if (stmtBox && stmtBox.parentNode) {
        stmtBox.parentNode.insertBefore(panel, stmtBox.nextSibling);
      }
    }
    if (!S.court || !S.court.witnessTraits) { panel.style.display = 'none'; return; }
    const t = S.court.witnessTraits;
    const c = S.court;
    // Only fully reveal if witness confidence is low or weakness is known
    const revealed = c.witnessConfidence < 50 || c.revealedWeak.length > 0;
    panel.style.display = '';
    const motiveText = revealed ? t.motive.toUpperCase() : '???';
    const bar = (val) => '▓'.repeat(val) + '░'.repeat(10 - val);
    panel.innerHTML = `
      <div class="trait-row"><span class="trait-label">Motive</span><span class="trait-value">${motiveText}</span></div>
      <div class="trait-row"><span class="trait-label">Deception</span><span class="trait-bar">${bar(t.lyingSkill)}</span></div>
      <div class="trait-row"><span class="trait-label">Nerves</span><span class="trait-bar">${bar(t.nervousness)}</span></div>
      <div class="trait-row"><span class="trait-label">Alibi</span><span class="trait-bar">${bar(t.alibiStrength)}</span></div>
    `;
  }

  const _origEnterCourtroom = Game.enterCourtroom.bind(Game);
  Game.enterCourtroom = function () {
    _origEnterCourtroom();
    if (S.court) {
      S.court.witnessTraits = generateWitnessTraits();
      S.court.pressUsed = 0;
      S.court.moveCount = 0;
      S.court.goodMoveCount = 0;
      S.court.objChain = 0;
      S.court.lastChanceUsed = false;
    }
    // Brief log describing witness demeanor
    if (S.caseData && S.caseData.witness) {
      const mood = (S.caseData.witness.mood || 'nervous').toLowerCase();
      const desc = {
        nervous: 'The witness seems shaky. Careful cross-examination could crack them open.',
        aggressive: 'This witness is combative. Pressure may land hard — or backfire.',
        corrupt: 'Something about this witness doesn\'t add up. Probe carefully.',
        forgetful: 'The witness is hazy on details. Cross-examination may reveal gaps.',
        overconfident: 'This witness is very sure of themselves. Overconfidence can be an opening.',
        scared: 'The witness looks frightened. The right pressure could break them.',
        defensive: 'The witness has their guard up. Methodical pressure is the key.',
        guarded: 'The witness speaks only in carefully measured sentences.',
      }[mood] || 'Observe the witness carefully before committing to a strategy.';
      setTimeout(() => {
        try { Game.courtLog(`🔍 Demeanor: ${desc}`, 'good'); } catch(e) {}
      }, 2800);
    }
  };

  // Patch renderCourt to also show traits
  const _origRenderCourt2 = Game.renderCourt.bind(Game);
  Game.renderCourt = function () {
    _origRenderCourt2();
    renderTraitsPanel();
  };

  /* ============================================================
   * 11) 6 MORE CASE THEMES
   * mafia, celebrity_scandal, school_mystery, corruption,
   * haunted_mansion, corporate_espionage
   * ============================================================ */
  try {
    const MORE_THEMES = [
      {
        type: 'mafia',
        titles: ['The Underboss', 'Family Business', 'Red Ledger', 'The Silent Witness'],
        intros: [
          'A mob lieutenant faces RICO charges. The star witness is willing — until they\'re not.',
          'Three crime families. One missing accountant. The money went somewhere. Find it before they do.',
        ],
        stmtTemplates: [
          { text: 'My client is a legitimate businessman with no criminal associates.', obj: null },
          { text: 'The informant has a history of fabrication and personal grudges.', obj: 'hearsay' },
          { text: 'No transaction was conducted outside standard business practice.', obj: 'speculation' },
          { text: 'The wire transfer records were obviously forged after the fact.', obj: null },
          { text: 'My client has never attended a meeting with anyone by that name.', obj: null },
          { text: 'The phone calls were personal — not operational in any sense.', obj: 'hearsay' },
        ],
        evidencePool: ['bank_transfer','phone_record','witness_statement','email_thread','internal_memo','expert_report','cctv_timestamp','whistle_file'],
      },
      {
        type: 'celebrity_scandal',
        titles: ['The Leaked Files', 'Tabloid Justice', 'Thirty Seconds of Tape', 'Red Carpet, Red Hands'],
        intros: [
          'A pop star\'s private recordings surface twenty-four hours before the charity gala. Someone wanted them out.',
          'A celebrated director is accused of orchestrating a smear campaign against a rival. The evidence is digital and damning.',
        ],
        stmtTemplates: [
          { text: 'My client never authorized the release of any private material.', obj: null },
          { text: 'The so-called recording was clearly edited and out of context.', obj: 'speculation' },
          { text: 'No payment was made in connection with any media story.', obj: null },
          { text: 'My client had no knowledge of the tabloid\'s source or methods.', obj: 'hearsay' },
          { text: 'The timing of the leak was entirely coincidental.', obj: 'speculation' },
        ],
        evidencePool: ['email_thread','text_messages','bank_transfer','phone_record','cctv_timestamp','internal_memo','expert_report','witness_statement'],
      },
      {
        type: 'school_mystery',
        titles: ['The Missing Grade', 'After Hours', 'The Scholarship Fraud', 'Honor Code'],
        intros: [
          'A student is expelled for cheating on a scholarship exam. They swear the answer key appeared on their desk. Someone put it there.',
          'A beloved principal is accused of falsifying records to help donors\' children gain admission. The records tell a very specific story.',
        ],
        stmtTemplates: [
          { text: 'My client did not access the examination files at any point.', obj: null },
          { text: 'The document was found in their bag — that proves nothing about intent.', obj: 'speculation' },
          { text: 'No faculty member corroborated the accusation directly.', obj: 'hearsay' },
          { text: 'The access logs showing the breach can be easily spoofed.', obj: 'speculation' },
          { text: 'My client has a spotless academic and conduct record.', obj: null },
        ],
        evidencePool: ['access_badge_log','email_thread','internal_memo','witness_statement','phone_record','expert_report','calendar_invite','text_messages'],
      },
      {
        type: 'corruption',
        titles: ['The Envelope', 'The Tender Fix', 'Above Suspicion', 'Public Trust'],
        intros: [
          'A city official steered a $40 million infrastructure contract to a shell company. The paperwork is pristine. The payments are not.',
          'A customs inspector is accused of clearing containers without inspection — for a fee. The paper trail is longer than expected.',
        ],
        stmtTemplates: [
          { text: 'Every contract decision was made through official channels only.', obj: null },
          { text: 'There is no paper trail connecting any payment to my client.', obj: 'speculation' },
          { text: 'The bidding process was reviewed and approved at every stage.', obj: null },
          { text: 'The transfer was a personal gift and fully disclosed per ethics rules.', obj: 'hearsay' },
          { text: 'My client acted entirely within the discretionary authority of the office.', obj: null },
        ],
        evidencePool: ['bank_transfer','internal_memo','email_thread','witness_statement','phone_record','signed_contract','expert_report','whistle_file'],
      },
      {
        type: 'haunted_mansion',
        titles: ['The Estate Dispute', 'The Will and the Witness', 'Last Signature', 'Midnight Codicil'],
        intros: [
          'An elderly heiress rewrote her will three days before dying. Her family says she was manipulated. The nurse says she was lucid.',
          'A sprawling manor. Six potential heirs. One forged codicil. Somebody in this courtroom knows exactly who signed it.',
        ],
        stmtTemplates: [
          { text: 'My client exercised no undue influence over the deceased at any time.', obj: null },
          { text: 'The testator was of completely sound mind when she signed.', obj: 'speculation' },
          { text: 'No medication administered would affect legal capacity.', obj: 'hearsay' },
          { text: 'The signature on the codicil matches all known exemplars.', obj: null },
          { text: 'My client had no special access to the testator in the final weeks.', obj: null },
        ],
        evidencePool: ['signed_contract','expert_report','witness_statement','calendar_invite','phone_record','email_thread','internal_memo','access_badge_log'],
      },
      {
        type: 'corporate_espionage',
        titles: ['The Stolen Deck', 'Trade Secret', 'The Competitor\'s Leak', 'IP Theft'],
        intros: [
          'A star engineer leaves one tech firm on a Friday and joins the direct competitor the following Monday. Someone else\'s code shipped six weeks later.',
          'A pharmaceutical company\'s new molecule appears in a rival\'s patent application filed one month after an employee\'s departure.',
        ],
        stmtTemplates: [
          { text: 'My client took no proprietary data or materials upon leaving.', obj: null },
          { text: 'The similarity between the products is pure coincidence of parallel development.', obj: 'speculation' },
          { text: 'No company files were accessed outside normal business hours.', obj: null },
          { text: 'My client\'s new employer independently developed their solution.', obj: 'hearsay' },
          { text: 'All IP at the previous firm was adequately protected under existing NDAs.', obj: null },
        ],
        evidencePool: ['access_badge_log','email_thread','internal_memo','expert_report','phone_record','signed_contract','whistle_file','text_messages'],
      },
    ];
    try { MORE_THEMES.forEach(t => RANDOM_THEMES.push(t)); } catch (e) {}
  } catch (e) { console.warn('More themes skipped:', e); }

  /* ============================================================
   * 12) LAST-CHANCE OBJECTION MECHANIC
   * When player cred hits 0, one dramatic final plea activates.
   * Right call = survive with cred boost.
   * Wrong call = instant loss.
   * ============================================================ */
  const _origCheckVerdict = Game.checkVerdict.bind(Game);
  Game.checkVerdict = function () {
    const c = S.court;
    if (!c || c.ended) { _origCheckVerdict(); return; }

    if (c.player.cred <= 0 && !c.lastChanceUsed && !c.lastChanceActive) {
      c.lastChanceActive = true;
      c.player.cred = 2; // keep alive briefly
      triggerLastChance();
      return;
    }
    _origCheckVerdict();
  };

  function triggerLastChance() {
    const c = S.court;
    if (!c || c.ended) return;
    try { Snd.drama && Snd.drama(); } catch (e) {}
    try { Canvas.flashIt && Canvas.flashIt(); } catch (e) {}
    try { UI.bigCue && UI.bigCue('FINAL OBJECTION!', 1400); } catch (e) {}
    Game.courtLog('⚡ LAST CHANCE: Your credibility is gone. One final objection stands between you and defeat. Choose correctly.', 'drama');

    // Find what the current statement actually needs
    const stmt = Game.currentStatement ? Game.currentStatement() : null;
    const correctType = stmt ? stmt.obj : (['relevance','hearsay','speculation'][Math.floor(Math.random()*3)]);

    // Show objection options directly
    const row = document.getElementById('courtActions');
    if (row) {
      row.innerHTML = '';
      row.insertAdjacentHTML('beforebegin', '<div class="last-chance-header">⚡ FINAL OBJECTION — choose wisely</div>');
    }
    const objRow = document.getElementById('objectionRow');
    if (objRow) {
      objRow.classList.remove('hidden');
      // Patch the objection buttons to use last-chance logic
      objRow.querySelectorAll('[data-obj]').forEach(btn => {
        const type = btn.dataset.obj;
        btn.onclick = () => resolveLastChance(type, correctType);
        btn.classList.add('last-chance-btn');
      });
      const cancel = objRow.querySelector('[data-act="cancel-obj"]');
      if (cancel) cancel.style.display = 'none';
    }
  }

  function resolveLastChance(chosen, correct) {
    const c = S.court;
    if (!c || !c.lastChanceActive) return; // guard against stale onclick
    c.lastChanceUsed = true;
    c.lastChanceActive = false;

    // Remove last-chance header
    const hdr = document.querySelector('.last-chance-header');
    if (hdr) hdr.remove();

    const objRow = document.getElementById('objectionRow');
    if (objRow) {
      objRow.classList.add('hidden');
      objRow.querySelectorAll('[data-obj]').forEach(btn => {
        btn.classList.remove('last-chance-btn');
        btn.onclick = null; // restore normal event delegation
      });
      const cancel = objRow.querySelector('[data-act="cancel-obj"]');
      if (cancel) cancel.style.display = '';
    }

    // null correct means the statement has no objection — any choice is wrong
    const isRight = correct !== null && chosen === correct;

    if (isRight) {
      c.player.cred = 22;
      c.opp.cred = Math.max(0, c.opp.cred - 18);
      c.jury = Math.max(-50, Math.min(50, c.jury + 12));
      c.judge = Math.min(100, c.judge + 5);
      try { Snd.objection && Snd.objection(); } catch (e) {}
      try { Canvas.shakeIt && Canvas.shakeIt(); } catch (e) {}
      try { UI.bigCue && UI.bigCue('OBJECTION SUSTAINED!', 1000); } catch (e) {}
      try { Snd.crowdReact && Snd.crowdReact('cheer'); } catch (e) {}
      Game.courtLog(`⚡ LAST CHANCE SUSTAINED! You rise from the ashes. Cred restored to 22, opp -18, jury +12.`, 'drama');
    } else {
      c.player.cred = 0;
      c.ended = true;
      try { Snd.objectionFail && Snd.objectionFail(); } catch (e) {}
      try { Snd.crowdReact && Snd.crowdReact('boo'); } catch (e) {}
      Game.courtLog(`⚡ LAST CHANCE FAILED. The wrong objection seals your fate. The court rules against you.`, 'bad');
      setTimeout(() => { try { Game.endCase('lost'); } catch(e) {} }, 1200);
      return;
    }
    try { Game.renderCourt && Game.renderCourt(); } catch (e) {}
  }

  /* ============================================================
   * 13) ENHANCED COMBO + OBJECTION CHAIN FEEDBACK
   * ============================================================ */
  const COMBO_TOASTS = {
    2: { text: 'COMBO x2!', color: '#d4a82c' },
    3: { text: 'OBJECTION CHAIN!', color: '#ff9e5e' },
    4: { text: 'ON A ROLL!', color: '#ff7b7b' },
    5: { text: '★ COURTROOM LEGEND ★', color: '#b46aff' },
  };

  if (Game.rewardMomentum) {
    const _origRewardMomentum = Game.rewardMomentum.bind(Game);
    Game.rewardMomentum = function (success, focusDelta) {
      const prevCombo = (S.court && S.court.combo) || 0;
      _origRewardMomentum(success, focusDelta);
      const c = S.court;
      if (!c || !success) return;
      const newCombo = c.combo || 0;
      if (newCombo > prevCombo && COMBO_TOASTS[newCombo]) {
        const t = COMBO_TOASTS[newCombo];
        try { showComboToast(t.text, t.color); } catch(e) {}
        if (newCombo >= 3) {
          try { Snd.crowdReact && Snd.crowdReact('cheer'); } catch(e) {}
        }
        if (newCombo >= 5) {
          try { UI.bigCue && UI.bigCue('★ LEGENDARY ARGUMENT ★', 1200); } catch(e) {}
        }
      }
    };
  }

  function showComboToast(text, color) {
    let toast = document.getElementById('comboToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'comboToast';
      toast.className = 'combo-toast';
      const courtEl = document.getElementById('court');
      if (courtEl) courtEl.appendChild(toast);
    }
    toast.textContent = text;
    toast.style.setProperty('--toast-color', color || '#d4a82c');
    toast.classList.remove('combo-toast-active');
    void toast.offsetWidth; // reflow
    toast.classList.add('combo-toast-active');
    setTimeout(() => toast.classList.remove('combo-toast-active'), 1600);
  }

  // Objection chain tracking (separate from combo)
  const _origResolveObjChain = Game.resolveObjection && Game.resolveObjection.bind(Game);
  if (_origResolveObjChain) {
    Game.resolveObjection = function (type) {
      _origResolveObjChain(type);
      const c = S.court;
      if (!c || c.ended) return;
      if (c.lastResult === 'good') {
        c.objChain = (c.objChain || 0) + 1;
        if (c.objChain === 2) {
          try { showComboToast('DOUBLE OBJECTION!', '#80caff'); } catch(e) {}
          c.jury = Math.max(-50, Math.min(50, c.jury + 3));
          Game.courtLog('Double objection sustained! Jury +3.', 'drama');
        } else if (c.objChain >= 3) {
          try { showComboToast('TRIPLE OBJECTION!!!', '#ff7b7b'); } catch(e) {}
          try { UI.bigCue && UI.bigCue('OBJECTION CHAIN!', 900); } catch(e) {}
          c.jury = Math.max(-50, Math.min(50, c.jury + 6));
          c.opp.cred = Math.max(0, c.opp.cred - 8);
          Game.courtLog('Triple objection chain! Jury +6, opp -8 cred. The court is stunned.', 'drama');
          try { Snd.crowdReact && Snd.crowdReact('gasp'); } catch(e) {}
          c.objChain = 0; // reset after triple
        }
      } else {
        c.objChain = 0;
      }
    };
  }

  // Reset objChain when player takes a non-objection action
  const _origPlayerAction = Game.playerAction && Game.playerAction.bind(Game);
  if (_origPlayerAction) {
    Game.playerAction = function (id) {
      if (id !== 'object' && S.court) S.court.objChain = 0;
      _origPlayerAction(id);
    };
  }

  /* ============================================================
   * 14) ENHANCED CROWD & JURY ATMOSPHERIC TEXT
   * ============================================================ */
  const CROWD_LINES = {
    jury_high: [
      "The jury foreman sits forward. Something just shifted.",
      "Juror 7 scribbles a note. Juror 3 nods.",
      "The jury box has gone very quiet — in your favor.",
      "One juror makes eye contact with you. Hold it.",
    ],
    jury_low: [
      "The jury is drifting. You can see it in the back row.",
      "Murmurs in the box. Not the kind you want.",
      "Juror 4 looks unconvinced. You need something big.",
      "The jury foreman has stopped taking notes.",
    ],
    player_cred_low: [
      "The gallery watches with hushed concern. You're on the ropes.",
      "A reporter in the back row leans over and whispers.",
      "The judge's expression is difficult to read — that's never good.",
      "Even your client is looking at you differently.",
    ],
    player_cred_high: [
      "The gallery is electric. You can feel the momentum.",
      "A few spectators exchange glances — this is going your way.",
      "The public gallery rustles. Counsel has found their rhythm.",
      "For the first time today, opposing counsel looks uncomfortable.",
    ],
    judge_low: [
      "The judge glances at the clock. That look means something.",
      "'Counsel, I would caution you.' Those words hang in the air.",
      "The gavel hovers. The judge's patience is almost gone.",
      "A court officer shifts their weight. The tension is real.",
    ],
    opp_cred_low: [
      "Opposing counsel confers with their second chair in urgent whispers.",
      "The other table is rearranging papers. A tell.",
      "Opposing counsel's jaw tightens. You've got them.",
      "The other side's client touches their lawyer's arm — a silent question.",
    ],
  };

  function fireAtmosphericLine() {
    const c = S.court;
    if (!c || c.ended) return;
    if (Math.random() > 0.30) return; // 30% chance per turn

    let pool = null;
    if (c.jury > 20) pool = CROWD_LINES.jury_high;
    else if (c.jury < -10) pool = CROWD_LINES.jury_low;
    else if (c.player.cred < 30) pool = CROWD_LINES.player_cred_low;
    else if (c.player.cred > 85) pool = CROWD_LINES.player_cred_high;
    else if (c.judge < 35) pool = CROWD_LINES.judge_low;
    else if (c.opp.cred < 35) pool = CROWD_LINES.opp_cred_low;

    if (!pool) return;
    const line = pool[Math.floor(Math.random() * pool.length)];
    setTimeout(() => {
      if (S.court && !S.court.ended) {
        try { Game.courtLog(`〔Courtroom〕 ${line}`, 'info'); } catch(e) {}
        try { Snd.crowdReact && Snd.crowdReact('whisper'); } catch(e) {}
      }
    }, 200);
  }

  const _origCourtEvent = Game.courtEvent && Game.courtEvent.bind(Game);
  if (_origCourtEvent) {
    Game.courtEvent = function () {
      _origCourtEvent();
      fireAtmosphericLine();
    };
  }

  /* ============================================================
   * 15) DAILY CASE SYSTEM
   * Seeded PRNG ensures same case all day; resets at midnight.
   * ============================================================ */
  function dailySeed() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function seededRandom(seed) {
    let s = seed;
    return function () {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }

  Game.startDailyCase = function () {
    try {
      const rng = seededRandom(dailySeed());
      // Self-contained themes — no dependency on RANDOM_THEMES global
      const themes = [
        { type: 'fraud', titles: ['The Forged Ledger', 'Paper Ghost', 'The Silent Partner', 'Off the Books'],
          intros: ['Millions moved through shell accounts. Your client signed the transfers. But someone else held the pen.', 'A business partner vanished with the books. Now your client faces the audit alone.'],
          stmtTemplates: [
            { text: 'My client had no knowledge of the fraudulent transfers.', obj: null },
            { text: 'The accounting discrepancy was an honest clerical error.', obj: 'speculation' },
            { text: 'All transactions were approved by both directors.', obj: 'hearsay' },
            { text: 'The missing funds were reinvested as per standard procedure.', obj: null },
            { text: 'No personal benefit was derived from these transactions.', obj: 'speculation' },
          ],
          evidencePool: ['bank_transfer','email_thread','internal_memo','phone_record','signed_contract','expert_report','witness_statement','text_messages'] },
        { type: 'murder', titles: ['The Last Call', 'Reasonable Doubt', 'No Witness Left', 'The Alibi'],
          intros: ['A man is found dead. Your client was the last to see him. The timeline is everything.', 'Three witnesses. Two contradict each other. One is lying — but which one?'],
          stmtTemplates: [
            { text: 'My client left the premises before 10 PM as confirmed by security.', obj: null },
            { text: 'No forensic evidence links my client to the scene.', obj: null },
            { text: 'The witness identification was made under duress.', obj: 'hearsay' },
            { text: 'My client had no motive to harm the victim.', obj: 'speculation' },
            { text: 'The timeline presented by the prosecution is impossible.', obj: null },
          ],
          evidencePool: ['cctv_timestamp','phone_record','expert_report','witness_statement','text_messages','access_badge_log','police_report','email_thread'] },
        { type: 'kidnapping', titles: ['The Vanished Heir', 'No Ransom, No Trace', 'Forty-Eight Hours', 'The Empty Cradle'],
          intros: ['A child gone. A family fortune at stake. Your client says they were home. The phone records say otherwise.', 'A businessman disappears for two days, then walks back in. Everyone is lying about something.'],
          stmtTemplates: [
            { text: 'My client was home the entire weekend.', obj: null },
            { text: 'No ransom communication ever reached us.', obj: 'hearsay' },
            { text: 'There was no financial motive whatsoever.', obj: 'speculation' },
            { text: 'No one matching that description was seen with the victim.', obj: null },
            { text: 'No threats were ever made — the relationship was friendly.', obj: 'hearsay' },
          ],
          evidencePool: ['phone_record','cctv_timestamp','text_messages','bank_transfer','witness_statement','access_badge_log','expert_report','police_report'] },
        { type: 'cybercrime', titles: ['Zero Day', 'Ghost in the Server', 'The Encrypted Confession', 'Backdoor Politics'],
          intros: ['A breach. A leak. Your client is accused of selling customer data to the highest bidder.', 'Ten million in crypto walked out of a hedge fund overnight. The trail leads to one keyboard.'],
          stmtTemplates: [
            { text: 'No unauthorized access originated from my client\'s account.', obj: null },
            { text: 'The login records were tampered with after the fact.', obj: 'speculation' },
            { text: 'No credentials were shared outside the security protocol.', obj: 'hearsay' },
            { text: 'My client has no technical ability to execute such an attack.', obj: null },
            { text: 'No funds reached any account connected to the defendant.', obj: null },
          ],
          evidencePool: ['access_badge_log','bank_transfer','email_thread','text_messages','expert_report','internal_memo','phone_record','whistle_file'] },
        { type: 'corruption', titles: ['The Envelope', 'The Tender Fix', 'Above Suspicion', 'Public Trust'],
          intros: ['A city official steered a $40 million contract to a shell company. The paperwork is pristine. The payments are not.', 'A customs inspector is accused of clearing containers without inspection — for a fee.'],
          stmtTemplates: [
            { text: 'Every contract decision was made through official channels.', obj: null },
            { text: 'No paper trail connects any payment to my client.', obj: 'speculation' },
            { text: 'The bidding process was reviewed and approved at every stage.', obj: null },
            { text: 'The transfer was a personal gift and fully disclosed.', obj: 'hearsay' },
            { text: 'My client acted within the discretionary authority of the office.', obj: null },
          ],
          evidencePool: ['bank_transfer','internal_memo','email_thread','witness_statement','phone_record','signed_contract','expert_report','whistle_file'] },
        { type: 'arson', titles: ['Burn Order', 'The Insurance Payout', 'Match and Motive', 'Smoke Signal'],
          intros: ['A warehouse went up two weeks before the policy expired. Faulty wiring tells a different story.', 'A family home burned to the foundation. The only person who escaped unhurt is on trial.'],
          stmtTemplates: [
            { text: 'My client was nowhere near the property that night.', obj: null },
            { text: 'The fire was clearly an accidental electrical fault.', obj: 'speculation' },
            { text: 'No accelerant was found at the scene.', obj: null },
            { text: 'The insurance claim was filed in good faith.', obj: 'hearsay' },
            { text: 'No motive existed for setting the fire deliberately.', obj: 'speculation' },
          ],
          evidencePool: ['expert_report','cctv_timestamp','police_report','phone_record','bank_transfer','witness_statement','internal_memo','text_messages'] },
        { type: 'espionage', titles: ['The Stolen Deck', 'Trade Secret', 'The Competitor Leak', 'IP Theft'],
          intros: ['A star engineer joins a direct competitor on Monday. The rival\'s product shipped six weeks later.', 'A pharmaceutical firm\'s new molecule appears in a rival\'s patent filed one month after an employee quit.'],
          stmtTemplates: [
            { text: 'My client took no proprietary data upon leaving.', obj: null },
            { text: 'The product similarity is pure coincidence of parallel development.', obj: 'speculation' },
            { text: 'No company files were accessed outside normal business hours.', obj: null },
            { text: 'My client\'s new employer developed their solution independently.', obj: 'hearsay' },
            { text: 'All IP at the previous firm was protected under existing NDAs.', obj: null },
          ],
          evidencePool: ['access_badge_log','email_thread','internal_memo','expert_report','phone_record','signed_contract','whistle_file','text_messages'] },
      ];
      if (!themes.length) { alert('Daily case unavailable.'); return; }
      const themeIdx = Math.floor(rng() * themes.length);
      const theme = themes[themeIdx];

      // Build a minimal random case using the seeded rng
      const titleIdx = Math.floor(rng() * theme.titles.length);
      const introIdx = Math.floor(rng() * theme.intros.length);
      const stmts = (theme.stmtTemplates || []).map((t, i) => ({
        text: t.text,
        obj: t.obj,
        hint: t.hint || 'Look carefully at the evidence.',
        weakness: (theme.evidencePool || [])[i % (theme.evidencePool || ['phone_record']).length] || 'phone_record',
      }));

      const dailyCase = {
        id: 'daily_' + dailySeed(),
        title: '📅 ' + (theme.titles[titleIdx] || 'Daily Trial'),
        intro: theme.intros[introIdx] || 'Today\'s case. Same as every colleague\'s today.',
        diff: 2 + Math.floor(rng() * 3),
        daily: true,
        opponent: {
          name: ['A. Crane', 'M. Holt', 'V. Paige', 'D. Summers', 'N. Cross'][Math.floor(rng() * 5)],
          personality: ['charming', 'technical', 'intimidating', 'slippery'][Math.floor(rng() * 4)],
          tieColor: ['#a83232', '#3a5fb8', '#6a3aaa', '#0b0b0b'][Math.floor(rng() * 4)],
          hairColor: '#2a1810',
        },
        witness: {
          name: ['T. Walsh', 'S. Monroe', 'P. Gray', 'K. Adler', 'L. Finch'][Math.floor(rng() * 5)],
          role: ['Principal Witness', 'Expert Witness', 'Character Witness', 'Eyewitness'][Math.floor(rng() * 4)],
          mood: ['nervous', 'aggressive', 'corrupt', 'forgetful', 'overconfident', 'scared'][Math.floor(rng() * 6)],
        },
        evidencePool: theme.evidencePool || ['phone_record', 'email_thread', 'witness_statement'],
        statements: stmts.slice(0, Math.min(stmts.length, 5)),
        reward: { money: 3000 + Math.floor(rng() * 5000), reputation: 15 + Math.floor(rng() * 20) },
      };

      // Start case like a regular campaign
      if (!S.player) {
        alert('Please start a campaign first to set up your lawyer before playing the daily case.');
        return;
      }
      S.campaignIndex = 0;
      S.caseData = dailyCase;
      try { Game.startPrep && Game.startPrep(dailyCase); }
      catch(e) { try { Game.enterCourtroom && Game.enterCourtroom(); } catch(e2) {} }
    } catch (e) {
      console.warn('Daily case error:', e);
      alert('Could not load daily case. Try starting a campaign first.');
    }
  };

  // Inject Daily Case button into menu on DOM ready / after menu renders
  function injectDailyButton() {
    const col = document.querySelector('.btn-col.menu-buttons');
    if (!col || col.querySelector('[data-act="daily-case"]')) return;
    const d = new Date();
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    const btn = document.createElement('button');
    btn.className = 'big daily-case-btn';
    btn.dataset.act = 'daily-case';
    btn.textContent = `📅 Daily Case (${dateStr})`;
    btn.onclick = () => Game.startDailyCase();
    // Insert after the "Random Case" button
    const randomBtn = col.querySelector('[data-act="random-case"]');
    if (randomBtn && randomBtn.nextSibling) {
      col.insertBefore(btn, randomBtn.nextSibling);
    } else {
      col.appendChild(btn);
    }
  }

  // Try to inject now and also patch toMenu/buildMenu
  try { injectDailyButton(); } catch(e) {}
  const _origToMenu = Game.toMenu && Game.toMenu.bind(Game);
  if (_origToMenu) {
    Game.toMenu = function () {
      _origToMenu();
      setTimeout(injectDailyButton, 100);
    };
  }

  /* ============================================================
   * 16) BETTER VERDICT SCREEN + CAREER RANK OVERHAUL
   * ============================================================ */
  const CAREER_RANKS = [
    { min: 0,   title: 'Rookie Attorney',      badge: '⚖' },
    { min: 15,  title: 'Associate Counsel',    badge: '📋' },
    { min: 35,  title: 'Defense Specialist',   badge: '🛡' },
    { min: 65,  title: 'Truth Hunter',         badge: '🔍' },
    { min: 100, title: 'Senior Counsel',       badge: '⭐' },
    { min: 150, title: 'Courtroom Legend',     badge: '🏛' },
    { min: 210, title: 'Legendary Prosecutor', badge: '👑' },
  ];

  function getCareerRank(rep) {
    let rank = CAREER_RANKS[0];
    for (const r of CAREER_RANKS) {
      if (rep >= r.min) rank = r;
    }
    return rank;
  }

  // Track move quality during court phase
  const _origAfterPlayerTurn2 = Game.afterPlayerTurn.bind(Game);
  Game.afterPlayerTurn = function (skipOpp) {
    const c = S.court;
    if (c && !c.ended) {
      c.moveCount = (c.moveCount || 0) + 1;
      if (c.lastResult === 'good' && c.lastSide === 'player') {
        c.goodMoveCount = (c.goodMoveCount || 0) + 1;
      }
    }
    _origAfterPlayerTurn2(skipOpp);
  };

  const _origEndCase = Game.endCase.bind(Game);
  Game.endCase = function (outcome, settlementAmt) {
    _origEndCase(outcome, settlementAmt);

    const ct = S.court;
    const rewardBox = document.getElementById('rewardBox');
    if (!rewardBox || !ct) return;

    const totalMoves = ct.moveCount || 1;
    const goodMoves  = ct.goodMoveCount || 0;
    const accuracy   = Math.round((goodMoves / totalMoves) * 100);
    const judgeApproval = Math.round(Math.max(0, Math.min(100, ct.judge || 0)));
    const totalEvidence = (ct.hand || []).length;
    const usedEvidence  = (ct.hand || []).filter(c => c.used).length;
    const matchedEvidence = ct.statementsResolved || 0;
    const effPct = usedEvidence > 0 ? Math.round((matchedEvidence / Math.max(1, usedEvidence)) * 100) : 0;

    const rank = getCareerRank(S.player ? S.player.reputation : 0);
    const wins  = S.player ? (S.player.wins || 0) : 0;
    const perks = (S.player && S.player.perks && S.player.perks.length)
                ? S.player.perks.join(' • ') : 'None yet';

    // Grade
    let grade = 'C';
    if (accuracy >= 80 && judgeApproval >= 60) grade = 'S';
    else if (accuracy >= 65 && judgeApproval >= 45) grade = 'A';
    else if (accuracy >= 50) grade = 'B';

    const gradeColor = { S: '#ffd700', A: '#b46aff', B: '#4ea3ff', C: '#aaa' }[grade];

    rewardBox.insertAdjacentHTML('afterbegin', `
      <div class="verdict-extended">
        <div class="verdict-grade" style="color:${gradeColor}">${grade}</div>
        <div class="verdict-stats-grid">
          <div class="vs-row"><span>Move Accuracy</span><span>${accuracy}%  (${goodMoves}/${totalMoves})</span></div>
          <div class="vs-row"><span>Judge Approval</span><span>${judgeApproval}%</span></div>
          <div class="vs-row"><span>Evidence Efficiency</span><span>${effPct}%</span></div>
          <div class="vs-row"><span>Peak Combo</span><span>x${ct.combo || 0}</span></div>
          <div class="vs-row"><span>Statements Broken</span><span>${ct.statementsResolved || 0}/${S.caseData ? S.caseData.statements.length : '?'}</span></div>
        </div>
        <div class="verdict-rank-badge">
          ${rank.badge} ${rank.title}
          <span class="rank-sub">Win ${wins} • Rep ${S.player ? S.player.reputation : 0}</span>
        </div>
        <div class="verdict-perks">Perks: ${perks}</div>
      </div>
    `);

    // Update topbar rank label
    try {
      const repEl = document.getElementById('repLabel');
      if (repEl && S.player) repEl.textContent = `${rank.badge} ${rank.title}`;
    } catch(e) {}
  };

  // Also update rank in topbar on refresh
  const _origRefreshTopBar = UI.refreshTopBar && UI.refreshTopBar.bind(UI);
  if (_origRefreshTopBar) {
    UI.refreshTopBar = function () {
      _origRefreshTopBar();
      if (S.player) {
        const rank = getCareerRank(S.player.reputation || 0);
        const repEl = document.getElementById('repLabel');
        if (repEl) repEl.textContent = `${rank.badge} ${rank.title}`;
      }
    };
  }

  /* ============================================================
   * 17) TIME PRESSURE MODE (optional per-turn countdown)
   * Toggle persists to localStorage. Visible timer bar in court.
   * ============================================================ */
  const TP_KEY = 'ops_time_pressure';
  let timePressureEnabled = false;
  try { timePressureEnabled = localStorage.getItem(TP_KEY) === '1'; } catch(e) {}

  let _tpTimer = null;
  let _tpSeconds = 0;

  function clearTimerBar() {
    if (_tpTimer) { clearInterval(_tpTimer); _tpTimer = null; }
    const bar = document.getElementById('timePressureBar');
    if (bar) bar.style.display = 'none';
  }

  function startTimerBar(seconds, onExpire) {
    clearTimerBar();
    if (!timePressureEnabled) return;
    _tpSeconds = seconds;
    let bar = document.getElementById('timePressureBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'timePressureBar';
      bar.className = 'tp-bar-wrap';
      bar.innerHTML = '<div class="tp-bar-fill"></div><div class="tp-bar-label"></div>';
      const courtEl = document.getElementById('court');
      if (courtEl) courtEl.insertBefore(bar, courtEl.firstChild);
    }
    bar.style.display = '';
    const fill = bar.querySelector('.tp-bar-fill');
    const label = bar.querySelector('.tp-bar-label');
    let remaining = seconds;

    _tpTimer = setInterval(() => {
      remaining--;
      const pct = Math.max(0, (remaining / seconds)) * 100;
      if (fill) { fill.style.width = pct + '%'; fill.style.background = pct > 50 ? '#5aaa4a' : pct > 25 ? '#d4a82c' : '#d44a3a'; }
      if (label) label.textContent = `⏱ ${remaining}s`;
      if (remaining <= 0) {
        clearTimerBar();
        onExpire();
      } else if (remaining <= 5) {
        try { Snd.heartbeat && Snd.heartbeat(); } catch(e) {}
      }
    }, 1000);
  }

  function updateTimerBar() {
    if (!timePressureEnabled) {
      const bar = document.getElementById('timePressureBar');
      if (bar) bar.style.display = 'none';
    }
  }

  // Start timer when it's the player's turn
  const _origRenderCourt3 = Game.renderCourt.bind(Game);
  Game.renderCourt = function () {
    _origRenderCourt3();
    const c = S.court;
    if (!c || c.ended || c.turn !== 'player') { clearTimerBar(); return; }
    if (!timePressureEnabled) return;
    // Only restart if not already running
    if (!_tpTimer) {
      const difficulty = S.difficulty || 'associate';
      const seconds = { story: 30, associate: 22, partner: 16, legendary: 12 }[difficulty] || 20;
      startTimerBar(seconds, () => {
        const c2 = S.court;
        if (!c2 || c2.ended || c2.turn !== 'player') return;
        // Auto-select safest action on timeout
        try {
          Game.courtLog('⏱ Time expired! Calm Clarification taken automatically.', 'bad');
          if (Game.playerAction) Game.playerAction('calm');
        } catch(e) {}
      });
    }
  };

  // Stop timer on opponent's turn or end
  const _origAfterPlayerTurn3 = Game.afterPlayerTurn.bind(Game);
  Game.afterPlayerTurn = function (skipOpp) {
    clearTimerBar();
    _origAfterPlayerTurn3(skipOpp);
  };

  // Toggle button — inject into menu and court topbar
  function buildTimePressureToggle() {
    const col = document.querySelector('.btn-col.menu-buttons');
    if (!col) return;
    let tBtn = col.querySelector('[data-act="toggle-time-pressure"]');
    if (!tBtn) {
      tBtn = document.createElement('button');
      tBtn.className = 'big';
      tBtn.dataset.act = 'toggle-time-pressure';
      // Add after "How to Play" button
      const howto = col.querySelector('[data-act="howto"]');
      if (howto && howto.nextSibling) col.insertBefore(tBtn, howto.nextSibling);
      else col.appendChild(tBtn);
    }
    tBtn.textContent = timePressureEnabled ? '⏱ Time Pressure: ON' : '⏱ Time Pressure: OFF';
    tBtn.style.opacity = timePressureEnabled ? '1' : '0.6';
    tBtn.onclick = () => {
      timePressureEnabled = !timePressureEnabled;
      try { localStorage.setItem(TP_KEY, timePressureEnabled ? '1' : '0'); } catch(e) {}
      buildTimePressureToggle();
    };
  }

  try { buildTimePressureToggle(); } catch(e) {}

  const _origToMenu2 = Game.toMenu && Game.toMenu.bind(Game);
  if (_origToMenu2) {
    Game.toMenu = function () {
      clearTimerBar();
      _origToMenu2();
      setTimeout(() => {
        injectDailyButton();
        buildTimePressureToggle();
      }, 100);
    };
  }

  /* ============================================================
   * MISC: Track move quality in opponent turn too
   * ============================================================ */
  const _origOpponentTurn = Game.opponentTurn && Game.opponentTurn.bind(Game);
  if (_origOpponentTurn) {
    Game.opponentTurn = function () {
      clearTimerBar(); // never run timer during opponent turn
      _origOpponentTurn();
    };
  }

  /* ============================================================
   * FINAL BOOT
   * ============================================================ */
  // Inject UI elements once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      try { injectDailyButton(); } catch(e) {}
      try { buildTimePressureToggle(); } catch(e) {}
    }, 400);
  });

  // If DOM is already ready (script loaded late)
  if (document.readyState !== 'loading') {
    setTimeout(() => {
      try { injectDailyButton(); } catch(e) {}
      try { buildTimePressureToggle(); } catch(e) {}
    }, 600);
  }

  /* ============================================================
   * 18) VOICE DELAY FIX
   * Speech now waits 800ms after text appears so you can read
   * before hearing the voice. Interrupt still cancels immediately.
   * ============================================================ */
  if (Snd && Snd.speak) {
    const _origSndSpeak = Snd.speak.bind(Snd);
    Snd.speak = function (text, role, interrupt) {
      if (interrupt) {
        try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch(e) {}
      }
      setTimeout(() => {
        try { _origSndSpeak.call(Snd, text, role, false); } catch(e) {}
      }, 850);
    };
  }

  /* ============================================================
   * 19) COURT LOG — DIALOGUE MODE
   * Character speech gets speech-bubble styling.
   * System/mechanics messages are dimmed so dialogue stands out.
   * A "Show All / Dialogue Only" toggle lets you filter the log.
   * ============================================================ */
  let _dialogueOnly = false;

  function isSpeechLine(text, kind) {
    if (kind === 'ai') return true;
    // Name: "quote" pattern — covers opponent rebuttals, witness lines, player dramatic lines
    if (/^[A-ZÀ-Ÿ][a-zA-ZÀ-Ÿ.\s]{1,28}:\s*["'"❝]/.test(text)) return true;
    // Courtroom atmospheric commentary is NOT speech
    if (/^〔/.test(text)) return false;
    // Judge/court system messages
    if (/^(Court is now|💡|🔍 Demeanor|⏱|⚡|📌|🎙️|🔷|✓|✗|Judge|Recess|Closing|PRESS|PIN DOWN|Cross|Expose|Grandstand|Second Chair|Calm|Focus|Combo|Adrenaline)/i.test(text)) return false;
    return false;
  }

  // Intercept UI.log after game.js defined it
  const _origUILog = UI.log.bind(UI);
  UI.log = function (boxId, text, kind) {
    _origUILog(boxId, text, kind);
    if (boxId !== 'courtLog') return;
    const box = document.getElementById(boxId);
    if (!box) return;
    const entry = box.lastElementChild;
    if (!entry) return;
    const isSpeech = isSpeechLine(text, kind);
    if (isSpeech) {
      entry.classList.add('log-speech');
    } else {
      entry.classList.add('log-system');
      if (_dialogueOnly) entry.style.display = 'none';
    }
  };

  // Inject dialogue toggle button above the court log
  function injectLogToggle() {
    const log = document.getElementById('courtLog');
    if (!log || document.getElementById('logToggleBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'logToggleBtn';
    btn.className = 'log-toggle-btn';
    btn.textContent = '💬 Dialogue Only';
    btn.title = 'Show only character speech';
    btn.onclick = () => {
      _dialogueOnly = !_dialogueOnly;
      btn.textContent = _dialogueOnly ? '📋 Show All' : '💬 Dialogue Only';
      btn.classList.toggle('log-toggle-active', _dialogueOnly);
      document.querySelectorAll('#courtLog .log-system').forEach(el => {
        el.style.display = _dialogueOnly ? 'none' : '';
      });
    };
    log.parentNode.insertBefore(btn, log);
  }

  const _origRenderCourt4 = Game.renderCourt.bind(Game);
  Game.renderCourt = function () {
    _origRenderCourt4();
    injectLogToggle();
    updateStatementCounter();
  };

  /* ============================================================
   * 20) STATEMENT BOX — CLEARER TESTIMONY DISPLAY
   * Adds statement number, testimony header, and a subtle
   * typewriter reveal when moving to a new statement.
   * ============================================================ */
  let _lastRenderedStmtIdx = -1;

  function updateStatementCounter() {
    const c = S.court;
    if (!c || !S.caseData) return;

    // Statement counter badge
    let counter = document.getElementById('stmtCounter');
    if (!counter) {
      counter = document.createElement('div');
      counter.id = 'stmtCounter';
      counter.className = 'stmt-counter';
      const whoTalking = document.getElementById('whoTalking');
      if (whoTalking && whoTalking.parentNode) {
        whoTalking.parentNode.insertBefore(counter, whoTalking);
      }
    }
    const stmts = S.caseData.statements || [];
    const total = stmts.length;
    const idx = c.statementIdx || 0;
    const current = Math.min(idx + 1, total);
    const resolved = c.statementsResolved || 0;
    const isAr = typeof I18N !== 'undefined' && I18N.ar();
    if (isAr) {
      counter.setAttribute('dir', 'rtl');
      counter.innerHTML = `<span class="stmt-resolved">${resolved} مكسور</span><span class="stmt-num">شهادة ${current} / ${total}</span>`;
    } else {
      counter.removeAttribute('dir');
      counter.innerHTML = `<span class="stmt-num">TESTIMONY ${current} / ${total}</span><span class="stmt-resolved">${resolved} broken</span>`;
    }

    // Typewriter effect on new statement
    const stmtEl = document.getElementById('statementText');
    if (stmtEl && idx !== _lastRenderedStmtIdx && stmts[idx]) {
      _lastRenderedStmtIdx = idx;
      const fullText = `"${stmts[idx].text}"`;
      stmtEl.textContent = '';
      stmtEl.classList.add('typing');
      let i = 0;
      const tick = setInterval(() => {
        stmtEl.textContent = fullText.slice(0, ++i);
        if (i >= fullText.length) {
          clearInterval(tick);
          stmtEl.classList.remove('typing');
        }
      }, 22);
    }
  }

  /* ============================================================
   * 21) REMOVE "Random Case Generator" — ABSORBED INTO CAMPAIGN
   * Start Campaign already runs rebuildCampaignDeck() which
   * mixes fixed + procedural cases. The dedicated button is gone.
   * ============================================================ */
  function hideRandomCaseBtn() {
    document.querySelectorAll('[data-act="random-case"]').forEach(btn => {
      btn.style.display = 'none';
    });
  }

  // Hide on load and after every return to menu
  try { hideRandomCaseBtn(); } catch(e) {}
  const _origToMenu3 = Game.toMenu && Game.toMenu.bind(Game);
  if (_origToMenu3) {
    Game.toMenu = function () {
      clearTimerBar();
      _origToMenu3();
      setTimeout(() => {
        injectDailyButton();
        buildTimePressureToggle();
        hideRandomCaseBtn();
      }, 120);
    };
  }

  // Also remove it via CSS as a belt-and-suspenders approach
  (function injectHideRandom() {
    const s = document.createElement('style');
    s.textContent = 'button[data-act="random-case"] { display: none !important; }';
    document.head.appendChild(s);
  })();

  /* ============================================================
   * 22) VISIT HANDLERS — new locations (crimescene, speakeasy, archive)
   * These IDs were added in section 4 but had no clue handlers.
   * Now they generate real, contextual clue text.
   * ============================================================ */
  const _origVisitFinal = Game.visit.bind(Game);
  Game.visit = function (loc) {
    const id = loc.id;
    // Handle our new location IDs before passing to original
    if (id === 'crimescene' || id === 'speakeasy' || id === 'archive') {
      S.invest.visited[id] = true;
      S.invest.left--;
      try { Snd.paper && Snd.paper(); } catch(e) {}
      const c = S.caseData;
      const r = Math.random();
      let clue;

      if (id === 'crimescene') {
        const unrev = c.statements.filter((_, i) => !S.invest.revealed.includes(i));
        if (unrev.length > 0 && r < 0.7) {
          const idx = c.statements.indexOf(unrev[Math.floor(Math.random() * unrev.length)]);
          S.invest.revealed.push(idx);
          clue = { text: `🔦 Crime Scene [Physical]: Your eyes catch what the police missed — "${c.statements[idx].hint}"`, type: 'physical', icon: '🔦' };
        } else if (r < 0.85) {
          clue = { text: '🔦 Crime Scene [Secured]: No new angles, but you lock down the physical evidence before the prosecution can spin it. Focus +3 on entry.', type: 'physical', icon: '🔦' };
          if (S.court) S.court.focus = Math.min(100, (S.court.focus || 0) + 3);
        } else {
          clue = { text: '🔦 Crime Scene [Compromised]: Opposing counsel was here first. Expect them to cite scene contamination.', type: 'risk', icon: '⚠️' };
          S.invest.coldOpp = true;
        }

      } else if (id === 'speakeasy') {
        const unrev = c.statements.filter((_, i) => !S.invest.revealed.includes(i));
        if (r < 0.55 && unrev.length > 0) {
          const idx = c.statements.indexOf(unrev[Math.floor(Math.random() * unrev.length)]);
          S.invest.revealed.push(idx);
          const second = unrev.find((_, ii) => ii > 0);
          if (second) {
            const idx2 = c.statements.indexOf(second);
            if (!S.invest.revealed.includes(idx2)) S.invest.revealed.push(idx2);
            clue = { text: `🥃 Underground Bar [Double Burn]: Your contact whispers two angles — "${c.statements[idx].hint}" and "${c.statements[idx2].hint}"`, type: 'intel', icon: '🥃' };
          } else {
            clue = { text: `🥃 Underground Bar [Intel]: A contact who would never come forward burns this for you — "${c.statements[idx].hint}"`, type: 'intel', icon: '🥃' };
          }
        } else if (r < 0.75) {
          clue = { text: '🥃 Underground Bar [Loyalty]: Nothing fresh, but the contact owes you. Jury sympathy angle noted — Court entry bonus incoming.', type: 'intel', icon: '🥃' };
          if (S.court) S.court.jury = Math.min(50, (S.court.jury || 0) + 5);
        } else {
          clue = { text: '🥃 Underground Bar [Burned]: The meet was watched. Opposing counsel will know you\'re fishing. Expect aggression early.', type: 'risk', icon: '⚠️' };
          S.invest.coldOpp = true;
        }

      } else if (id === 'archive') {
        if (r < 0.65) {
          const unrev = c.statements.filter((_, i) => !S.invest.revealed.includes(i));
          if (unrev.length > 0) {
            const idx = c.statements.indexOf(unrev[Math.floor(Math.random() * unrev.length)]);
            S.invest.revealed.push(idx);
            clue = { text: `🗞️ Press Archives [Pattern]: An old headline surfaces a pattern the prosecution buried — "${c.statements[idx].hint}"`, type: 'precedent', icon: '🗞️' };
          } else {
            clue = { text: '🗞️ Press Archives [Precedent]: Hours in the stacks. Legal Skill refined. +1 Legal Skill.', type: 'precedent', icon: '🗞️' };
            if (S.player) S.player.stats.legalSkill = Math.min(10, S.player.stats.legalSkill + 1);
          }
        } else {
          clue = { text: '🗞️ Press Archives [Timing]: The story was planted. Someone fed the press at a very specific moment. You now know why.', type: 'precedent', icon: '🗞️' };
          if (S.court) S.court.judge = Math.min(100, (S.court.judge || 0) + 5);
        }
      }

      S.invest.clues.push(clue);
      try { this.renderInvestigation(); } catch(e) {}
      if (S.invest.left === 0) {
        try { this.renderInvestigation(); } catch(e) {}
      }
      return;
    }
    // Fall through to original for office, corp, records, crime_scene, informant
    _origVisitFinal(loc);
  };

  /* ============================================================
   * 23) PRESERVE S.PLAYER THROUGH MENU (fixes The Chambers)
   * game.js toMenu() sets S.player = null, breaking the shop
   * and making the menu feel anonymous after finishing a case.
   * We save the player and restore it after the original runs.
   * ============================================================ */
  let _preservedPlayer = null;

  const _origToMenuPreserve = Game.toMenu.bind(Game);
  Game.toMenu = function () {
    if (S.player) _preservedPlayer = S.player;
    _origToMenuPreserve();
    // Restore player so The Chambers and topbar still work
    if (_preservedPlayer) {
      S.player = _preservedPlayer;
      // Refresh topbar with career info
      try {
        if (S.player) {
          const rank = getCareerRank(S.player.reputation || 0);
          const repEl = document.getElementById('repLabel');
          if (repEl) repEl.textContent = `${rank.badge} ${rank.title}`;
          if (UI.refreshTopBar) UI.refreshTopBar();
        }
      } catch(e) {}
      // Inject career banner into menu if there is one
      setTimeout(() => {
        try { injectMenuCareerBanner(); } catch(e) {}
      }, 150);
    }
  };

  function injectMenuCareerBanner() {
    const menuEl = document.getElementById('menu');
    if (!menuEl || !_preservedPlayer) return;
    let banner = menuEl.querySelector('.menu-career-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'menu-career-banner';
      const col = menuEl.querySelector('.btn-col.menu-buttons');
      if (col) menuEl.insertBefore(banner, col);
      else menuEl.insertBefore(banner, menuEl.firstChild);
    }
    const p = _preservedPlayer;
    const rank = getCareerRank(p.reputation || 0);
    banner.innerHTML = `<strong>${rank.badge} ${p.name}</strong> &nbsp;•&nbsp; ${rank.title} &nbsp;•&nbsp; ${p.wins || 0} wins &nbsp;•&nbsp; $${(p.money || 0).toLocaleString()} &nbsp;•&nbsp; Rep ${p.reputation || 0}`;
  }

  /* ============================================================
   * 24) SETTLEMENT UI OVERHAUL
   * Replaces the plain negot-status block with a visual mood bar,
   * animated offer display, round pips, and personality flavour.
   * ============================================================ */
  const PERSONALITY_ICONS = { charming: '😏', technical: '📐', intimidating: '😤', slippery: '🃏' };
  const PERSONALITY_LABELS = { charming: 'Charming', technical: 'Technical', intimidating: 'Intimidating', slippery: 'Slippery' };

  function moodColor(mood) {
    if (mood >= 70) return '#5aaa4a';
    if (mood >= 55) return '#8bbf40';
    if (mood >= 40) return '#d4a82c';
    if (mood >= 20) return '#d4703a';
    return '#d44a3a';
  }
  function moodLabel(mood) {
    if (mood >= 70) return 'Receptive';
    if (mood >= 55) return 'Open';
    if (mood >= 40) return 'Neutral';
    if (mood >= 20) return 'Tense';
    return 'Hostile';
  }

  let _lastOfferForAnim = 0;

  const _origRenderNegotUI = Game.renderNegot.bind(Game);
  Game.renderNegot = function () {
    _origRenderNegotUI();
    const n = S.negot;
    if (!n || !S.caseData) return;

    // Inject panel if not present
    let panel = document.getElementById('negotPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'negotPanel';
      panel.className = 'negot-panel';
      const statusEl = document.querySelector('.negot-status');
      if (statusEl && statusEl.parentNode) {
        statusEl.parentNode.insertBefore(panel, statusEl);
      }
    }

    const opp = S.caseData.opponent;
    const icon = PERSONALITY_ICONS[opp.personality] || '⚖️';
    const ptypLabel = PERSONALITY_LABELS[opp.personality] || opp.personality;
    const mc = moodColor(n.mood);
    const ml = moodLabel(n.mood);
    const moodPct = n.mood;
    const offerChanged = n.offer !== _lastOfferForAnim;
    _lastOfferForAnim = n.offer;

    // Build round pips
    let pips = '';
    const totalRounds = 3;
    for (let i = 0; i < totalRounds; i++) {
      pips += `<div class="negot-pip${i < n.rounds ? ' active' : ''}"></div>`;
    }

    const flavorTexts = {
      charming: '"I like you, counselor. Don\'t make me stop."',
      technical: '"I have precedent. I have precedent for everything."',
      intimidating: '"You have three rounds. I\'ve done this in one."',
      slippery: '"Every offer I make comes with conditions you\'ll read later."',
    };
    const flavor = flavorTexts[opp.personality] || '"Make it quick."';

    panel.innerHTML = `
      <div class="negot-opponent-header">
        <div class="negot-avatar">${icon}</div>
        <div class="negot-opp-info">
          <div class="negot-opp-name">${opp.name}</div>
          <div class="negot-opp-type">${ptypLabel} Counsel</div>
        </div>
        <div class="negot-rounds-pips">${pips}</div>
      </div>
      <div class="negot-offer-row">
        <div class="negot-offer-amount${offerChanged ? ' changed' : ''}" id="negotOfferDisplay">$${n.offer.toLocaleString()}</div>
        <div style="font-size:11px;color:var(--ink-dim);text-align:right">Current Offer<br><span style="font-size:9px">${n.done ? 'FINAL OFFER' : n.rounds + ' rounds left'}</span></div>
      </div>
      <div class="negot-mood-row">
        <div class="negot-mood-label">Mood</div>
        <div class="negot-mood-bar-wrap">
          <div class="negot-mood-bar-fill" style="width:${moodPct}%;background:${mc}"></div>
        </div>
        <div class="negot-mood-value" style="color:${mc}">${ml}</div>
      </div>
      <div class="negot-flavor">${flavor}</div>
    `;

    // Sync the hidden original elements so game.js acceptSettlement still works
    const negotOffer = document.getElementById('negotOffer');
    if (negotOffer) negotOffer.textContent = '$' + n.offer.toLocaleString();
    const negotMood = document.getElementById('negotMood');
    if (negotMood) negotMood.textContent = ml;
    const negotRounds = document.getElementById('negotRounds');
    if (negotRounds) negotRounds.textContent = n.rounds;
  };

  /* ============================================================
   * 25) CAREER PROFILE OVERLAY (post-verdict)
   * Intercepts the "back to menu" button on the verdict screen.
   * Shows a full career summary modal before returning to menu.
   * ============================================================ */
  function buildCareerOverlay(outcome) {
    let overlay = document.getElementById('careerProfileOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'careerProfileOverlay';
      document.body.appendChild(overlay);
    }
    // Reset in case it was previously hidden via display:none
    overlay.style.display = '';
    overlay.classList.remove('visible');

    const p = _preservedPlayer || S.player;
    if (!p) return;
    const rank = getCareerRank(p.reputation || 0);
    const outcomeTag = outcome === 'won' ? 'WON' : outcome === 'settle' ? 'SETTLED' : 'LOST';
    const outcomeClass = outcome === 'won' ? 'won' : outcome === 'settle' ? 'settle' : 'lost';
    const caseName = (S.caseData && S.caseData.title) || '—';

    const perks = (p.perks && p.perks.length) ? p.perks.join(' • ') : 'None yet';
    const wl = `${p.wins || 0}W / ${p.losses || 0}L`;

    overlay.innerHTML = `
      <div class="career-profile-card">
        <h2>Career Update</h2>
        <div class="career-rank-display">
          <span class="career-rank-badge-large">${rank.badge}</span>
          <div class="career-rank-title">${rank.title}</div>
        </div>
        <div class="career-last-case">
          <span class="case-result-tag ${outcomeClass}">${outcomeTag}</span>
          <div style="font-size:13px;color:var(--ink)">${caseName}</div>
        </div>
        <div class="career-stats-grid">
          <div class="career-stat">
            <div class="career-stat-label">Record</div>
            <div class="career-stat-value" style="font-size:15px">${wl}</div>
          </div>
          <div class="career-stat">
            <div class="career-stat-label">Reputation</div>
            <div class="career-stat-value">${p.reputation || 0}</div>
          </div>
          <div class="career-stat">
            <div class="career-stat-label">Balance</div>
            <div class="career-stat-value" style="font-size:14px">$${(p.money || 0).toLocaleString()}</div>
          </div>
          <div class="career-stat">
            <div class="career-stat-label">Perks</div>
            <div class="career-stat-value" style="font-size:11px;color:var(--ink-dim)">${perks}</div>
          </div>
        </div>
        <button class="career-profile-close" id="careerProfileCloseBtn">
          ${typeof I18N !== 'undefined' && I18N.ar() ? 'العودة إلى القائمة ←' : 'Return to Menu →'}
        </button>
      </div>
    `;

    // Show overlay
    requestAnimationFrame(() => overlay.classList.add('visible'));

    // Close button → dismiss overlay (game already switched to menu or will)
    document.getElementById('careerProfileCloseBtn').onclick = () => {
      overlay.classList.remove('visible');
      setTimeout(() => { overlay.style.display = 'none'; }, 400);
    };
    // Auto-hide after 30s if user ignores it
    setTimeout(() => {
      if (overlay.classList.contains('visible')) {
        overlay.classList.remove('visible');
        setTimeout(() => { overlay.style.display = 'none'; }, 400);
      }
    }, 30000);
  }

  // Intercept endCase to show the career overlay
  const _origEndCaseCareer = Game.endCase.bind(Game);
  Game.endCase = function (outcome, settlementAmt) {
    _origEndCaseCareer(outcome, settlementAmt);
    // Show career overlay after verdict renders (small delay)
    const outcomeForOverlay = outcome;
    setTimeout(() => {
      try { buildCareerOverlay(outcomeForOverlay); } catch(e) { console.warn('Career overlay error:', e); }
    }, 800);
  };

  /* ============================================================
   * 26) HOME PAGE UI ENHANCEMENT
   * Injects ambient scanline overlay, animated court seal,
   * and enriches the dossier panel on the menu screen.
   * ============================================================ */
  function enhanceMenuScreen() {
    const menu = document.getElementById('menu');
    if (!menu || menu.dataset.enhanced) return;
    menu.dataset.enhanced = '1';

    // Animated background scanline overlay
    const scan = document.createElement('div');
    scan.className = 'menu-scanlines';
    scan.style.cssText = `
      position:absolute;inset:0;pointer-events:none;z-index:0;
      background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.07) 3px,rgba(0,0,0,0.07) 4px);
      border-radius:4px;
    `;
    menu.insertBefore(scan, menu.firstChild);

    // Make all menu children sit above scanline
    Array.from(menu.children).forEach(el => { if (el !== scan) el.style.position = 'relative'; });

    // Inject live "case count" stat into dossier
    const dossier = menu.querySelector('.menu-dossier');
    if (dossier && typeof CASES !== 'undefined') {
      const stat = document.createElement('div');
      stat.style.cssText = 'margin-top:10px;font-size:11px;color:var(--ink-dim);letter-spacing:1.5px;text-transform:uppercase;';
      stat.innerHTML = `📁 ${CASES.length} cases on the docket &nbsp;•&nbsp; ${new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })}`;
      dossier.appendChild(stat);
    }
  }

  // Run now and after menu renders
  try { enhanceMenuScreen(); } catch(e) {}
  const _origBuildMenu = Game.buildMenu.bind(Game);
  Game.buildMenu = function() {
    _origBuildMenu();
    setTimeout(() => { try { enhanceMenuScreen(); } catch(e) {} }, 80);
  };

  /* ============================================================
   * 27) FULL ARABIC TRANSLATION EXPANSION
   * Extends AR_PACK with missing translations: court actions,
   * combo text, outcome messages, improvement UI labels,
   * body language states, settlement lines, cutscene text.
   * ============================================================ */
  if (typeof AR_PACK !== 'undefined' && AR_PACK.ui) {
    // Missing button translations
    const extraButtons = {
      '⚖ Start Campaign':    'ابدأ القصة',
      '▶ Continue Career':   'استمر في المسيرة',
      '⚔ Local Duel Mode':   'مبارزة محلية',
      '🌐 Online Duel':      'مبارزة أونلاين',
      '❓ How to Play':      'طريقة اللعب',
      'Back to Lobby':        'العودة إلى اللوبي',
      '💬 Dialogue Only':    '💬 حوار فقط',
      '📋 Show All':         '📋 إظهار الكل',
      '🎙️ Summon Witness':   '🎙️ استدعاء شاهد',
      'Return to Menu →':    'العودة إلى القائمة ←',
      'Career Update':        'تحديث المسيرة',
      'Create Room':         'إنشاء غرفة',
      'Join Room':           'الانضمام لغرفة',
      'Connect →':           'اتصال ←',
      'Ready →':             'جاهز ←',
      '📋 Copy Code':        '📋 نسخ الكود',
      'Snap Objection':       'اعتراض خاطف',
      'Press Witness':        'الضغط على الشاهد',
    };
    Object.assign(AR_PACK.ui.buttons, extraButtons);

    // Court actions (the in-court action buttons)
    if (!AR_PACK.actions) AR_PACK.actions = {};
    Object.assign(AR_PACK.actions, {
      'Object': 'اعتراض',
      'Cross-Examine': 'استجواب مضاد',
      'Present Evidence': 'تقديم دليل',
      'Pressure': 'ضغط',
      'Calm Clarification': 'توضيح هادئ',
      'Recess': 'استراحة',
      'Special': 'قدرة خاصة',
      'Closing Argument': 'المرافعة الختامية',
      'Consult Notes': 'مراجعة الملاحظات',
      'Pin Down': 'تثبيت التناقض',
      'Expose Contradiction': 'كشف التناقض',
      'Dramatic Reveal': 'الكشف الدرامي',
      'Second Chair Save': 'إنقاذ المساعد',
    });

    // Phases in court
    if (!AR_PACK.ui.courtLabels) AR_PACK.ui.courtLabels = {};
    Object.assign(AR_PACK.ui.courtLabels, {
      'Witness:': 'الشاهد:',
      'Judge:': 'القاضي:',
      'Prosecution:': 'الادعاء:',
      'Defense:': 'الدفاع:',
      'Jury:': 'هيئة المحلفين:',
      'Combo x': 'سلسلة x',
      'Adrenaline': 'الأدرينالين',
      'Focus': 'التركيز',
      'TESTIMONY': 'شهادة',
      'broken': 'مكسورة',
      'Trap active': 'الفخ جاهز',
      'Star Power': 'قوة النجومية',
      'No Trap': 'لا فخ',
    });

    // Difficulty labels
    if (!AR_PACK.ui.difficulty) AR_PACK.ui.difficulty = {};
    Object.assign(AR_PACK.ui.difficulty, {
      'Story': 'قصة',
      'Associate': 'مساعد',
      'Partner': 'شريك',
      'Legendary': 'أسطوري',
      'Story is easy, Associate is normal, Partner is hard, Legendary is brutal.':
        'قصة سهل، مساعد عادي، شريك صعب، أسطوري لا يرحم.',
    });

    // Mood labels for negotiation
    if (!AR_PACK.moods) AR_PACK.moods = {};
    Object.assign(AR_PACK.moods, {
      'Receptive': 'متقبّل', 'Open': 'منفتح', 'Neutral': 'محايد',
      'Tense': 'متوتر', 'Hostile': 'عدائي',
    });

    // Body language states
    if (!AR_PACK.bodyLang) AR_PACK.bodyLang = {};
    Object.assign(AR_PACK.bodyLang, {
      'Confident': 'واثق', 'Nervous': 'متوتر', 'Aggressive': 'عدواني',
      'Defeated': 'مهزوم', 'Focused': 'مركّز', 'Desperate': 'يائس',
    });

    // Outcome messages
    if (!AR_PACK.outcomes) AR_PACK.outcomes = {};
    Object.assign(AR_PACK.outcomes, {
      'WON': 'فاز', 'LOST': 'خسر', 'SETTLED': 'تسوية',
      'Record': 'السجل', 'Reputation': 'السمعة', 'Balance': 'الرصيد', 'Perks': 'المزايا',
    });

    // Extend static text for remaining screens
    Object.assign(AR_PACK.ui.staticText || (AR_PACK.ui.staticText = {}), {
      '#shop h2': '⚖ الغرف',
      '#shop .intro': 'استثمر أرباحك. بدلة أفضل، حافة أحدّ.',
      '.shop-balance-bar': 'الرصيد:',
      '#rankings h2': '🏆 تصنيفات المسيرة',
      '#verdict h2': 'الحكم',
      '#nextCaseBtn': 'القضية التالية ←',
      '.duel-side:nth-child(1) h3': 'اللاعب 1 — الدفاع',
      '.duel-side:nth-child(2) h3': 'اللاعب 2 — الادعاء',
    });
  }

  // Patch the Arabic translation function to also translate court UI labels
  const _origApplyStatic2 = I18N.applyStatic && I18N.applyStatic.bind(I18N);
  if (_origApplyStatic2) {
    I18N.applyStatic = function () {
      _origApplyStatic2();
      if (!I18N.ar()) return;
      // Translate difficulty buttons
      document.querySelectorAll('.diff-btn').forEach(b => {
        const ar = AR_PACK.ui && AR_PACK.ui.difficulty && AR_PACK.ui.difficulty[b.dataset.diff.charAt(0).toUpperCase() + b.dataset.diff.slice(1)];
        if (ar) b.textContent = ar;
      });
      // Translate court UI bar labels
      const courtLabels = AR_PACK.ui.courtLabels || {};
      document.querySelectorAll('.bar-label').forEach(el => {
        const t = el.textContent.trim();
        if (courtLabels[t]) el.textContent = courtLabels[t];
      });
      // Translate body language badges
      if (AR_PACK.bodyLang) {
        document.querySelectorAll('.body-lang-badge').forEach(el => {
          const txt = el.textContent.replace(/[⚡💪😰]/g, '').trim();
          const ar = AR_PACK.bodyLang[txt];
          if (ar) el.textContent = el.textContent.replace(txt, ar);
        });
      }
      // Translate objection row buttons
      const objMap = { relevance: 'الصلة', hearsay: 'السماع', speculation: 'التخمين' };
      document.querySelectorAll('[data-obj]').forEach(b => {
        const ar = objMap[b.dataset.obj];
        if (ar) b.textContent = ar;
      });
    };
  }

  /* ============================================================
   * 28) IN-GAME CUTSCENE SYSTEM
   * Dramatic full-screen sequences at key story moments.
   * Non-blocking: auto-dismisses after a configurable duration.
   * ============================================================ */
  const CUTSCENES = {
    trial_start: {
      icon: '⚖️', type: 'drama',
      title: { en: 'COURT IS IN SESSION', ar: 'الجلسة منعقدة' },
      subtitle: { en: 'The jury watches. The judge waits. Make every word count.', ar: 'هيئة المحلفين تراقب. القاضي ينتظر. اجعل كل كلمة تُحسب.' },
      duration: 2200,
    },
    objection_sustained: {
      icon: '⚡', type: 'objection',
      title: { en: 'OBJECTION SUSTAINED', ar: 'الاعتراض مقبول' },
      subtitle: { en: 'The judge sides with you. The courtroom holds its breath.', ar: 'القاضي إلى جانبك. القاعة تحبس أنفاسها.' },
      duration: 1800,
    },
    evidence_combo: {
      icon: '🗂️', type: 'evidence',
      title: { en: 'EVIDENCE CHAIN', ar: 'سلسلة الأدلة' },
      subtitle: { en: 'A sequence of proof that leaves no doubt.', ar: 'سلسلة من الأدلة لا تترك مجالاً للشك.' },
      duration: 1600,
    },
    jury_swing: {
      icon: '🏛️', type: 'drama',
      title: { en: 'THE JURY TURNS', ar: 'هيئة المحلفين تتحول' },
      subtitle: { en: 'You can feel the momentum shift. Push harder.', ar: 'تستطيع الإحساس بتحول الزخم. اضغط أكثر.' },
      duration: 1800,
    },
    witness_breaks: {
      icon: '💥', type: 'witness',
      title: { en: 'WITNESS BREAKS', ar: 'الشاهد ينهار' },
      subtitle: { en: 'The story unravels. A crack appears. Strike now.', ar: 'القصة تنهار. شقّ يظهر. اضرب الآن.' },
      duration: 1800,
    },
    case_won: {
      icon: '⭐', type: 'verdict',
      title: { en: 'NOT GUILTY', ar: 'بريء' },
      subtitle: { en: 'Justice delivered. The court stands adjourned.', ar: 'تحقّقت العدالة. انتهت الجلسة.' },
      duration: 2800,
    },
    case_lost: {
      icon: '🔨', type: 'lost',
      title: { en: 'VERDICT: GUILTY', ar: 'الحكم: مدان' },
      subtitle: { en: 'A case lost is a lesson filed. Rise again.', ar: 'قضية خاسرة هي درس مقيّد. انهض مجدداً.' },
      duration: 2800,
    },
    combo_legendary: {
      icon: '👑', type: 'drama',
      title: { en: 'LEGENDARY COUNSEL', ar: 'محامٍ أسطوري' },
      subtitle: { en: 'Five moves without a single mistake. The gallery applauds.', ar: 'خمس خطوات دون خطأ واحد. الجمهور يصفّق.' },
      duration: 2000,
    },
    opponent_witness: {
      icon: '🎭', type: 'witness',
      title: { en: 'SURPRISE WITNESS', ar: 'شاهد مفاجئ' },
      subtitle: { en: 'Opposing counsel calls a witness you didn\'t prepare for.', ar: 'محامي الخصم يستدعي شاهداً لم تستعد له.' },
      duration: 2000,
    },
  };

  let _cutsceneQueue = [];
  let _cutsceneRunning = false;

  function playCutscene(key) {
    const c = CUTSCENES[key];
    if (!c) return;
    _cutsceneQueue.push(c);
    if (!_cutsceneRunning) drainCutsceneQueue();
  }

  function drainCutsceneQueue() {
    if (!_cutsceneQueue.length) { _cutsceneRunning = false; return; }
    _cutsceneRunning = true;
    const c = _cutsceneQueue.shift();
    const overlay = document.getElementById('cutsceneOverlay');
    if (!overlay) { drainCutsceneQueue(); return; }

    const isAr = typeof I18N !== 'undefined' && I18N.ar();
    document.getElementById('cutsceneIcon').textContent = c.icon;
    document.getElementById('cutsceneTitle').textContent = isAr ? (c.title.ar || c.title.en) : c.title.en;
    document.getElementById('cutsceneSubtitle').textContent = isAr ? (c.subtitle.ar || c.subtitle.en) : c.subtitle.en;

    // Remove old type classes
    overlay.className = overlay.className.replace(/type-\w+/g, '');
    overlay.classList.remove('hidden', 'active');
    overlay.classList.add('type-' + c.type);

    requestAnimationFrame(() => {
      overlay.classList.add('active');
      try { Snd.drama && c.type !== 'verdict' && Snd.drama(); } catch(e) {}
    });

    setTimeout(() => {
      overlay.classList.remove('active');
      setTimeout(() => { overlay.classList.add('hidden'); drainCutsceneQueue(); }, 350);
    }, c.duration);
  }

  // Hook cutscene triggers into game events
  const _origEnterCourt = Game.enterCourtroom.bind(Game);
  Game.enterCourtroom = function () {
    _origEnterCourt();
    setTimeout(() => playCutscene('trial_start'), 500);
  };

  // Combo x5 → legendary cutscene
  const _origRenderCourt5 = Game.renderCourt.bind(Game);
  Game.renderCourt = function () {
    _origRenderCourt5();
    const c = S.court;
    if (!c || c.ended) return;
    if (c.combo === 5 && !c._legendaryCutscenePlayed) {
      c._legendaryCutscenePlayed = true;
      setTimeout(() => playCutscene('combo_legendary'), 300);
    }
  };

  // Jury swing > 20 swing in one move
  const _origAfterPlayerTurnCuts = Game.afterPlayerTurn.bind(Game);
  Game.afterPlayerTurn = function (skipOpp) {
    const juryBefore = (S.court && S.court.jury) || 0;
    _origAfterPlayerTurnCuts(skipOpp);
    const juryAfter = (S.court && S.court.jury) || 0;
    if (Math.abs(juryAfter - juryBefore) >= 18 && !S.court?.ended) {
      setTimeout(() => playCutscene('jury_swing'), 400);
    }
  };

  // Witness confidence collapse
  const _origResolveObj2 = Game.resolveObjection && Game.resolveObjection.bind(Game);
  if (_origResolveObj2) {
    Game.resolveObjection = function (type) {
      _origResolveObj2(type);
      const c = S.court;
      if (c && !c.ended && (c.witnessConfidence || 0) < 20 && !(c._witBreakPlayed)) {
        c._witBreakPlayed = true;
        setTimeout(() => playCutscene('witness_breaks'), 300);
      }
    };
  }

  /* ============================================================
   * 29) BODY LANGUAGE SYSTEM
   * Characters visually express their psychological state.
   * Updates each turn based on cred, jury, combo, and pressure.
   * ============================================================ */
  const BODY_LANG_STATES = {
    player: [
      { cond: c => (c.combo||0) >= 3,                  cls: 'confident', en: '💪 Confident', ar: '💪 واثق' },
      { cond: c => (c.player.cred||0) < 25,            cls: 'desperate', en: '⚡ Desperate', ar: '⚡ يائس' },
      { cond: c => (c.player.cred||0) < 60,            cls: 'nervous',   en: '😰 Nervous',  ar: '😰 متوتر' },
      { cond: c => (c.jury||0) > 20,                   cls: 'confident', en: '💪 Confident', ar: '💪 واثق' },
      { cond: c => (c.player.cred||0) > 100,           cls: 'focused',   en: '🎯 Focused',  ar: '🎯 مركّز' },
      { cond: _c => true,                              cls: '',           en: '⚖ Steady',   ar: '⚖ ثابت'  },
    ],
    opp: [
      { cond: c => (c.opp.cred||0) < 25,              cls: 'desperate', en: '⚡ Desperate', ar: '⚡ يائس' },
      { cond: c => (c.opp.cred||0) < 50,              cls: 'nervous',   en: '😰 Nervous',  ar: '😰 متوتر' },
      { cond: c => (c.jury||0) < -15,                 cls: 'aggressive',en: '😤 Aggressive',ar: '😤 عدواني' },
      { cond: c => (c.opp.cred||0) > 100,             cls: 'confident', en: '💪 Confident', ar: '💪 واثق' },
      { cond: _c => true,                             cls: '',           en: '⚖ Composed',  ar: '⚖ هادئ'  },
    ],
  };

  function updateBodyLanguage() {
    const c = S.court;
    if (!c || c.mode !== 'campaign') return;

    // Inject panel if missing
    let panel = document.getElementById('bodyLangPanel');
    if (!panel) return;

    const courtEl = document.getElementById('court');
    if (courtEl && !courtEl.contains(panel) && !panel.parentNode?.id) {
      const canvasWrap = document.getElementById('courtCanvasWrap');
      if (canvasWrap && canvasWrap.parentNode) canvasWrap.parentNode.insertBefore(panel, canvasWrap.nextSibling);
    }
    panel.classList.remove('hidden');

    const isAr = typeof I18N !== 'undefined' && I18N.ar();
    const pBadge = document.getElementById('playerBodyLang');
    const oBadge = document.getElementById('oppBodyLang');

    ['player', 'opp'].forEach(side => {
      const badge = side === 'player' ? pBadge : oBadge;
      if (!badge) return;
      const states = BODY_LANG_STATES[side];
      const state = states.find(s => s.cond(c)) || states[states.length - 1];
      badge.className = `body-lang-badge ${side}-side ${state.cls}`;
      const label = state[isAr ? 'ar' : 'en'];
      const name = side === 'player' ? (c.player.name || 'You') : (c.opp.name || 'Opponent');
      badge.textContent = `${name} — ${label}`;
    });

    // Canvas wrapper state class
    const wrap = document.getElementById('courtCanvasWrap');
    if (wrap) {
      wrap.classList.remove('state-winning', 'state-losing', 'state-tense');
      if ((c.player.cred - (c.opp.cred||0)) > 25) wrap.classList.add('state-winning');
      else if ((c.player.cred||0) < 50) wrap.classList.add('state-losing');
      else if (Math.abs(c.jury||0) > 20) wrap.classList.add('state-tense');
    }
  }

  const _origRenderCourt6 = Game.renderCourt.bind(Game);
  Game.renderCourt = function () {
    _origRenderCourt6();
    try { updateBodyLanguage(); } catch(e) {}
  };

  /* ============================================================
   * 30) SMART OPPONENT AI + OPPONENT WITNESS SYSTEM
   * Opponent evaluates game state each turn and picks the
   * strategically optimal response. Can call their own witness.
   * ============================================================ */
  const OPP_WITNESSES = [
    { name: 'Dr. Elena Cross',   role: 'Expert Witness',   icon: '🔬',
      lines: [
        '"My analysis is unambiguous. The evidence supports only one conclusion."',
        '"Every scientific test corroborates the prosecution\'s timeline."',
        '"I have testified in 200 trials. I do not speculate."',
      ],
      testimony: 'The forensic evidence is consistent with the prosecution\'s theory and inconsistent with the defense\'s account.',
    },
    { name: 'Marcus Webb',       role: 'Eyewitness',       icon: '👁',
      lines: [
        '"I saw what I saw. I will not change my statement."',
        '"The defendant was there. I am certain of it."',
        '"I have nothing to gain by lying in this courtroom."',
      ],
      testimony: 'I saw the defendant at the scene at the exact time the prosecution has described.',
    },
    { name: 'Lina Park',         role: 'Character Witness', icon: '📜',
      lines: [
        '"The defendant has a long history of exactly this kind of behavior."',
        '"I worked with this person for years. This does not surprise me."',
        '"The pattern is clear to anyone who knew them."',
      ],
      testimony: 'The defendant\'s past conduct is entirely consistent with the allegations being made today.',
    },
    { name: 'Commissioner Hart', role: 'Investigating Officer', icon: '🔎',
      lines: [
        '"Every lead pointed to the same person."',
        '"We followed the evidence. It led us here."',
        '"Fifteen years in homicide. The case is airtight."',
      ],
      testimony: 'Our investigation was thorough. The evidence chain is complete and unbroken.',
    },
  ];

  // Arabic witness lines
  const OPP_WITNESSES_AR = [
    { lines: ['"تحليلي لا لبس فيه. الأدلة تدعم نتيجة واحدة فقط."', '"كل اختبار علمي يؤكد توقيت النيابة."'], testimony: 'الأدلة الجنائية تدعم نظرية الادعاء.' },
    { lines: ['"رأيت ما رأيت. لن أغيّر شهادتي."', '"المتهم كان هناك. أنا متأكد."'], testimony: 'رأيت المتهم في موقع الحادثة في الوقت الذي وصفه الادعاء.' },
    { lines: ['"للمتهم تاريخ طويل من هذا السلوك بالضبط."', '"عملت معه سنوات. هذا لا يفاجئني."'], testimony: 'سلوك المتهم السابق يتسق تماماً مع الاتهامات المطروحة.' },
    { lines: ['"كل خيط أدى إلى نفس الشخص."', '"اتبعنا الأدلة. أوصلتنا إلى هنا."'], testimony: 'تحقيقنا كان شاملاً. سلسلة الأدلة مكتملة.' },
  ];

  // Opponent strategy weights by personality
  const OPP_STRATEGIES = {
    charming:     { wait: 3, aggress: 1, pressure: 1, objection: 2 },
    technical:    { wait: 1, aggress: 1, pressure: 2, objection: 4 },
    intimidating: { wait: 1, aggress: 4, pressure: 3, objection: 1 },
    slippery:     { wait: 2, aggress: 2, pressure: 2, objection: 2 },
  };

  let _oppWitnessActive = false;

  function shouldOppCallWitness(c) {
    if (_oppWitnessActive) return false;
    if (c.mode !== 'campaign') return false;
    if (c.opp.cred > 60) return false;           // Only when trailing
    if ((c.round || 0) < 6) return false;         // Not too early
    if (c._oppWitnessCalled) return false;         // Only once per trial
    return Math.random() < 0.28;                  // 28% chance when eligible
  }

  function triggerOpponentWitness(c) {
    c._oppWitnessCalled = true;
    _oppWitnessActive = true;
    const isAr = typeof I18N !== 'undefined' && I18N.ar();
    const witIdx = Math.floor(Math.random() * OPP_WITNESSES.length);
    const wit = OPP_WITNESSES[witIdx];
    const witAr = OPP_WITNESSES_AR[witIdx];

    const oppName = (S.caseData && S.caseData.opponent && S.caseData.opponent.name) || 'Opposing Counsel';

    // Announce
    const callLine = isAr
      ? `${oppName}: "أستدعي شاهداً من جانبي."`
      : `${oppName}: "Your Honor, the prosecution calls a witness."`;
    try { Game.courtLog(callLine, 'ai'); } catch(e) {}
    try { Snd.gavel && Snd.gavel(); } catch(e) {}
    playCutscene('opponent_witness');

    // Show witness banner after cutscene
    setTimeout(() => {
      const witLine = isAr
        ? (witAr.lines[Math.floor(Math.random() * witAr.lines.length)])
        : wit.lines[Math.floor(Math.random() * wit.lines.length)];
      const testimony = isAr ? witAr.testimony : wit.testimony;

      // Cred penalty to player (witness is testifying against them)
      c.player.cred = Math.max(0, c.player.cred - 14);
      c.jury = Math.max(-50, Math.min(50, c.jury - 10));

      try { Game.courtLog(`${wit.icon} ${wit.name} [${wit.role}]: ${witLine}`, 'ai'); } catch(e) {}
      try { Snd.speak && Snd.speak(witLine, 'opponent', false); } catch(e) {}

      // Show interactive witness response box
      injectOppWitnessActions(wit, testimony, c, isAr);

    }, 2400);
  }

  function injectOppWitnessActions(wit, testimony, c, isAr) {
    let box = document.getElementById('oppWitnessBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'oppWitnessBox';
      box.className = 'opp-witness-banner';
      const stmtBox = document.getElementById('statementBox');
      if (stmtBox && stmtBox.parentNode) stmtBox.parentNode.insertBefore(box, stmtBox);
    }

    box.innerHTML = `
      <div class="opp-witness-name">${wit.icon} ${wit.name}</div>
      <div class="opp-witness-role">${isAr ? 'شاهد من جانب الادعاء' : wit.role + ' — Prosecution\'s Witness'}</div>
      <div class="opp-witness-line">"${testimony}"</div>
      <div class="opp-witness-actions">
        <button onclick="window._handleOppWitness('cross')" class="court-act">${isAr ? '🎯 استجواب مضاد' : '🎯 Cross-Examine'}</button>
        <button onclick="window._handleOppWitness('evidence')" class="court-act">${isAr ? '🗂️ طعن بدليل' : '🗂️ Counter with Evidence'}</button>
        <button onclick="window._handleOppWitness('let_go')" class="court-act">${isAr ? '⚖ تجاهل' : '⚖ Let It Go'}</button>
      </div>
    `;

    window._handleOppWitness = function(action) {
      _oppWitnessActive = false;
      if (box.parentNode) box.parentNode.removeChild(box);
      delete window._handleOppWitness;
      const isArNow = typeof I18N !== 'undefined' && I18N.ar();

      if (action === 'cross') {
        const roll = Math.random() + (S.player ? S.player.stats.logic * 0.06 : 0);
        if (roll > 0.45) {
          c.player.cred = Math.min(140, c.player.cred + 12);
          c.opp.cred = Math.max(0, c.opp.cred - 10);
          c.jury = Math.min(50, c.jury + 8);
          try { Game.courtLog(isArNow ? '🎯 استجواب ناجح! ثغرة في شهادة الشاهد.' : '🎯 Cross-examination lands! Witness exposed a contradiction.', 'good'); } catch(e) {}
          try { Snd.objection && Snd.objection(); } catch(e) {}
        } else {
          c.player.cred = Math.max(0, c.player.cred - 6);
          try { Game.courtLog(isArNow ? '🎯 الاستجواب لم ينجح. الشاهد يحافظ على موقفه.' : '🎯 Cross-examination fails. Witness holds firm.', 'bad'); } catch(e) {}
        }
      } else if (action === 'evidence') {
        const hand = c.hand || [];
        const unused = hand.filter(e => !e.used);
        if (unused.length) {
          const card = unused[Math.floor(Math.random() * unused.length)];
          card.used = true;
          const hit = 8 + card.strength;
          c.opp.cred = Math.max(0, c.opp.cred - hit);
          c.jury = Math.min(50, c.jury + 6);
          try { Game.courtLog(isArNow ? `🗂️ دليل "${card.name}" يعارض شهادة الشاهد. -${hit} مصداقية.` : `🗂️ "${card.name}" counters the testimony. Opp -${hit}.`, 'good'); } catch(e) {}
          try { Snd.evidence && Snd.evidence(); } catch(e) {}
        } else {
          try { Game.courtLog(isArNow ? '🗂️ لا توجد أدلة متاحة للطعن.' : '🗂️ No evidence available to counter.', 'bad'); } catch(e) {}
        }
      } else {
        try { Game.courtLog(isArNow ? '⚖ تجاهلت شهادة الشاهد.' : '⚖ You let the testimony stand unchallenged.', 'info'); } catch(e) {}
      }
      try { Game.renderCourt && Game.renderCourt(); } catch(e) {}
    };
  }

  // Inject smarter opponent logic into opponentTurn
  const _origOppTurnSmart = Game.opponentTurn && Game.opponentTurn.bind(Game);
  if (_origOppTurnSmart) {
    Game.opponentTurn = function () {
      const c = S.court;
      if (c && !c.ended && shouldOppCallWitness(c)) {
        triggerOpponentWitness(c);
        // Delay the normal opponent turn slightly
        setTimeout(() => { try { _origOppTurnSmart(); } catch(e) {} }, 300);
        return;
      }
      _origOppTurnSmart();

      // After original opp turn, add strategic commentary
      if (c && !c.ended) {
        const oppPersonality = (S.caseData && S.caseData.opponent && S.caseData.opponent.personality) || 'charming';
        const isAr = typeof I18N !== 'undefined' && I18N.ar();
        addSmartOppCommentary(c, oppPersonality, isAr);
      }
    };
  }

  const SMART_OPP_LINES = {
    winning: {
      en: [
        '"You\'re running out of credibility, counselor. I can see it in the jury\'s eyes."',
        '"Every move you make, I\'ve already prepared for. This case is over."',
        '"The evidence speaks louder than your objections ever could."',
        '"I\'ve tried 200 cases. I know a losing position when I see one."',
        '"The jury isn\'t watching you anymore. That\'s not a good sign."',
      ],
      ar: [
        '"أنت تنفد من المصداقية، مستشاراً. أرى ذلك في عيون المحلفين."',
        '"كل خطوة تتخذها، كنت مستعداً لها. هذه القضية انتهت."',
        '"الأدلة تتكلم بصوت أعلى من اعتراضاتك."',
        '"ناقشت 200 قضية. أعرف الموقف الخاسر حين أراه."',
      ],
    },
    losing: {
      en: [
        '"You\'re good. I\'ll give you that. But good isn\'t enough today."',
        '"I\'ve seen better lawyers lose on less. Don\'t celebrate yet."',
        '"One piece of evidence doesn\'t win a case, counselor."',
        '"The jury is emotional. Emotions change."',
        '"Impressive. But the night is young."',
      ],
      ar: [
        '"أنت جيد. سأعترف بذلك. لكن الجيد لا يكفي اليوم."',
        '"رأيت محامين أفضل يخسرون بأقل من هذا. لا تحتفل بعد."',
        '"دليل واحد لا يربح القضية."',
        '"المحلفون عاطفيون. والعواطف تتغير."',
      ],
    },
    technical: {
      en: [
        '"Counsel, I direct the court\'s attention to precedent in Wells v. Montgomery."',
        '"The chain of custody is documented on pages 14 through 31 of the record."',
        '"Objection, Your Honor. The foundation for this has not been established."',
      ],
      ar: [
        '"مستشاراً، أوجّه انتباه المحكمة إلى سابقة في ويلز ضد مونتغومري."',
        '"سلسلة الحضانة موثقة في الصفحات 14 إلى 31 من السجل."',
      ],
    },
    intimidating: {
      en: [
        '"Let me be direct: I have never lost a case to someone who objected this much."',
        '"Your tactics are transparent, counselor. The jury sees through them."',
        '"I\'ve destroyed more experienced lawyers than you in half the time."',
      ],
      ar: [
        '"دعني أكون صريحاً: لم أخسر قضية أمام شخص يعترض بهذا القدر."',
        '"تكتيكاتك شفافة، مستشاراً. المحلفون يرونها."',
      ],
    },
  };

  function addSmartOppCommentary(c, personality, isAr) {
    if (Math.random() > 0.4) return; // 40% chance per turn
    let pool;
    if ((c.opp.cred || 0) < (c.player.cred || 0) - 20) {
      pool = isAr ? SMART_OPP_LINES.losing.ar : SMART_OPP_LINES.losing.en;
    } else if ((c.opp.cred || 0) > (c.player.cred || 0) + 20) {
      pool = isAr ? SMART_OPP_LINES.winning.ar : SMART_OPP_LINES.winning.en;
    } else if (personality === 'technical') {
      pool = isAr ? SMART_OPP_LINES.technical.ar : SMART_OPP_LINES.technical.en;
    } else if (personality === 'intimidating') {
      pool = isAr ? SMART_OPP_LINES.intimidating.ar : SMART_OPP_LINES.intimidating.en;
    }
    if (!pool || !pool.length) return;
    const line = pool[Math.floor(Math.random() * pool.length)];
    const oppName = (S.caseData && S.caseData.opponent && S.caseData.opponent.name) || 'Opposing Counsel';
    setTimeout(() => {
      try { Game.courtLog(`${oppName}: ${line}`, 'ai'); } catch(e) {}
      try { Snd.speak && Snd.speak(line.replace(/^"|"$/g, ''), 'opponent', false); } catch(e) {}
      try { Canvas.showBubble && Canvas.showBubble(line.replace(/^"|"$/g, ''), 'opponent'); } catch(e) {}
    }, 600);
  }

  /* ============================================================
   * 31) SETTLEMENT UI UPGRADE — 80+ NEW LINES + CONTEXT LOGIC
   * Never-repeat tracking, escalation system, personality combos,
   * context-aware replies that reference evidence and state.
   * ============================================================ */
  const NEGOT_LINES_EXT = {
    charming: {
      calm: [
        '"I appreciate the measured tone. We\'re both professionals, after all."',
        '"Reasonable. You know, I almost like you. Almost."',
        '"You handle pressure well. Let\'s see if that\'s reflected in the offer."',
        '"Measured. Controlled. I respect that. Here\'s something back."',
        '"You\'re making this easier than I expected."',
      ],
      press: [
        '"Easy there. Charm works better on me than aggression. But fine."',
        '"You\'re confusing pressure with persuasion. Let me show you the difference."',
        '"Try that with someone who hasn\'t been sued 47 times."',
        '"I like the fire. I\'ll match it with a slightly better offer."',
      ],
      bluff_success: [
        '"If that\'s really what you have… fine. Take a little more."',
        '"You\'re either brilliant or reckless. Fifty-fifty says brilliant today."',
        '"I don\'t call bluffs when it costs me more than the bluff is worth."',
      ],
      bluff_fail: [
        '"That\'s a bluff and we both know it. Points for presentation, though."',
        '"I\'ve seen better bluffs from first-year associates. Nice try."',
        '"The tell? You paused before the evidence name. Classic."',
      ],
      charm: [
        '"Oh, now you\'re being charming. That\'s playing dirty."',
        '"I told you charm works on me. You\'re proving me right."',
        '"God help me, I actually like you. Fine — a little more."',
      ],
      threat: [
        '"Legal threats. My favorite. I have three full shelves of responses to this."',
        '"You\'re citing precedent at a negotiation table. I love ambition."',
        '"Good case. I\'ve read it. I have a counter. But I\'ll budge slightly."',
      ],
      final: [
        '"That\'s my final number. You know it\'s fair. Take it."',
        '"We\'re done negotiating. Accept it or I\'ll see you in my home — the courtroom."',
        '"Last offer. After this, I stop being charming."',
      ],
    },
    technical: {
      calm: [
        '"Your logic is sound. I\'ll adjust per Rule 68 standards."',
        '"Methodical. I respect methodology. Numbers move slightly."',
        '"Noted. Cross-referencing with three applicable precedents. Offer adjusts."',
        '"That argument is technically valid. I concede the point. Marginally."',
      ],
      press: [
        '"Aggressive tactics are inadmissible at this table, counselor."',
        '"I have documentation for this exact response pattern. Page 7."',
        '"Pressure doesn\'t change the statute. The offer stays."',
        '"You\'re applying courtroom tactics to a negotiation. Interesting. Ineffective."',
      ],
      bluff_success: [
        '"If exhibit C exists, the calculation shifts. I\'ll factor that in."',
        '"I cannot verify your claim, and uncertainty has a price. Fine."',
      ],
      bluff_fail: [
        '"That exhibit doesn\'t exist in the discovery record. I checked."',
        '"Counsel, I cross-referenced every filing. That evidence is not there."',
        '"A bluff. My spreadsheet flagged a 91% probability of exactly this."',
      ],
      charm: [
        '"Charm is a variable I don\'t factor into financial calculations."',
        '"Noted. Not applicable. But your delivery was above average."',
        '"I appreciate the effort. Technically charming. Barely moves the offer."',
      ],
      threat: [
        '"I see your precedent. I have twelve counter-precedents tabbed and ready."',
        '"That\'s a valid statutory argument. I\'ll adjust by the percentage it applies."',
        '"You\'ve done your research. So have I. Offer adjusts accordingly."',
      ],
      final: [
        '"Final figure. Based on risk-adjusted case value, costs, and precedent."',
        '"This number is defensible in front of any judge. Take it or litigate."',
        '"Calculations complete. This is the equilibrium offer."',
      ],
    },
    intimidating: {
      calm: [
        '"Calm. Fine. I respect calm. It won\'t get you more money."',
        '"You\'re trying not to show me you\'re nervous. You\'re showing me anyway."',
        '"I\'ve beaten calmer lawyers than you. It\'s not a virtue I respect in court."',
      ],
      press: [
        '"Now we\'re speaking the same language."',
        '"Aggressive. Good. I was getting bored of the diplomacy."',
        '"You want a fight? You\'ve picked the right opponent for one."',
        '"I like this version of you better. Here\'s a marginal adjustment."',
      ],
      bluff_success: [
        '"You surprise me. That bluff was better than I expected."',
        '"I don\'t scare easy. But you\'ve made me consider this offer."',
      ],
      bluff_fail: [
        '"I\'ve broken witness testimony stronger than that bluff."',
        '"You think I haven\'t seen every play in this book?"',
        '"Weak. Let\'s stop pretending and talk real numbers."',
      ],
      charm: [
        '"Charm. In front of me. That\'s either courage or ignorance."',
        '"Save it for the jury. I don\'t do charm at a negotiating table."',
        '"You\'re wasting a good smile. Numbers don\'t smile back."',
      ],
      threat: [
        '"A legal threat? From YOU? That\'s almost funny."',
        '"I\'ve had that brief for three years. I can cite it backward."',
        '"Interesting. I didn\'t think you had the spine for a legal threat. Noted."',
      ],
      final: [
        '"Final offer. Don\'t test me. I mean that literally."',
        '"That\'s the number. I don\'t repeat myself after the last round."',
        '"Walk or fight. Those are your two options. Choose fast."',
      ],
    },
    slippery: {
      calm: [
        '"Calm. I respect that. But calm people miss things. What are you missing?"',
        '"Very measured. I\'m almost impressed. What\'s the angle here?"',
        '"You sound reasonable. I\'m suspicious of reasonable people."',
      ],
      press: [
        '"You think pressure works on me? I invented this play."',
        '"Every time someone presses me, I find a new exit. Let me show you."',
        '"Aggression without information is just noise. What do you actually have?"',
      ],
      bluff_success: [
        '"If that\'s real — and I\'m not saying it is — here\'s a bit more."',
        '"I don\'t know if you\'re bluffing. That uncertainty costs me something."',
      ],
      bluff_fail: [
        '"You know what I notice about bluffers? They make eye contact too long."',
        '"That evidence doesn\'t exist. But I admire the confidence."',
        '"Nice attempt. Zero percent working. Ten out of ten for style."',
      ],
      charm: [
        '"You\'re charming. I\'m charming. Let\'s negotiate before we like each other too much."',
        '"Good energy. I\'ll match it with a small bump, purely for the vibes."',
        '"You remind me of my best opponent. He lost too. But charming."',
      ],
      threat: [
        '"Legal threat. Interesting position for someone who hasn\'t seen my counter-filing."',
        '"I\'ve already read that case. There are three holes in it. But I\'ll adjust anyway."',
        '"You think the statute applies. I think the judge will disagree. We\'ll see."',
      ],
      final: [
        '"Last round. Let\'s stop the theater and talk settlement."',
        '"This is my final number and there are four conditions attached you haven\'t read yet."',
        '"Take the offer. You won\'t like what I have prepared for trial."',
      ],
    },
  };

  const _usedNegotLines = {};

  function getUniqueNegotLine(personality, context) {
    const pack = NEGOT_LINES_EXT[personality] || NEGOT_LINES_EXT.charming;
    const pool = pack[context] || pack.calm;
    const key = personality + '_' + context;
    if (!_usedNegotLines[key]) _usedNegotLines[key] = [];
    const used = _usedNegotLines[key];
    const available = pool.filter((_, i) => !used.includes(i));
    if (!available.length) { _usedNegotLines[key] = []; return pool[Math.floor(Math.random() * pool.length)]; }
    const idx = pool.indexOf(available[Math.floor(Math.random() * available.length)]);
    used.push(idx);
    return pool[idx];
  }

  // Wrap negotMove to inject richer lines
  const _origNegotMove = Game.negotMove && Game.negotMove.bind(Game);
  if (_origNegotMove) {
    Game.negotMove = function (t) {
      const n = S.negot;
      const personality = n.personality || 'charming';
      const isAr = typeof I18N !== 'undefined' && I18N.ar();

      // Call original (which runs the logic and logs a line)
      _origNegotMove(t);

      // After a brief delay, inject our richer line into the log
      if (!isAr) { // English only for now — Arabic handled by existing AR patch
        const contextMap = {
          calm: 'calm', press: 'press', charm: 'charm', threat: 'threat',
          bluff: (n.lastBluffSuccess ? 'bluff_success' : 'bluff_fail'),
        };
        const ctx = contextMap[t.id] || 'calm';
        // Only replace if rounds > 0 still
        if (n && n.rounds >= 0) {
          setTimeout(() => {
            const richLine = n.done
              ? getUniqueNegotLine(personality, 'final')
              : getUniqueNegotLine(personality, ctx);
            const oppName = (S.caseData && S.caseData.opponent && S.caseData.opponent.name) || 'Opposing Counsel';
            try { UI.log('negotLog', `${oppName}: ${richLine}`, 'ai'); } catch(e) {}
            try { Snd.speak && Snd.speak(richLine.replace(/^"|"$/g, ''), 'opponent', false); } catch(e) {}
          }, 120);
        }
      }
    };
  }

  console.log('[Suits Improvements v3] loaded — Firebase online mode enabled; old PeerJS/WebRTC section removed.');
})();


/* ============================================================
 * DUEL MODE OVERHAUL
 * Replaces the abstract "attack each other" duel with a real
 * case-based courtroom experience. Both players examine the
 * same witness statements, present case evidence, and use
 * the full set of court actions. A "Pass Controller" overlay
 * prevents each player from seeing the other's hand.
 * ============================================================ */
(function duelModeOverhaul() {
  if (typeof Game === 'undefined' || typeof CASES === 'undefined') return;

  Game.startDuel = function () {
    const p1Name = (document.getElementById('d1Name') && document.getElementById('d1Name').value.trim()) || 'P1';
    const p2Name = (document.getElementById('d2Name') && document.getElementById('d2Name').value.trim()) || 'P2';
    const p1StyleId = S.duelSel && S.duelSel.p1;
    const p2StyleId = S.duelSel && S.duelSel.p2;
    if (!p1StyleId || !p2StyleId) return;
    const p1Style = STYLES[p1StyleId];
    const p2Style = STYLES[p2StyleId];

    const caseList = CASES.filter(function (c) { return c.statements && c.statements.length >= 3; });
    const randCase = caseList[Math.floor(Math.random() * caseList.length)] || CASES[0];
    S.caseData = randCase;

    const pool = (randCase.evidencePool || []).slice().sort(function () { return Math.random() - 0.5; });
    const HAND_SIZE = 4;
    const makeHand = function (ids) {
      return ids.map(function (id) {
        return Object.assign({ id: id, used: false }, EVIDENCE[id] || { name: id, desc: '', strength: 5, risk: 2, cost: 1 });
      });
    };
    const p1Hand = makeHand(pool.slice(0, Math.min(HAND_SIZE, pool.length)));
    const p2Hand = makeHand(pool.length >= HAND_SIZE * 2
      ? pool.slice(HAND_SIZE, HAND_SIZE * 2)
      : pool.slice().sort(function () { return Math.random() - 0.5; }).slice(0, HAND_SIZE));

    S.player = { name: p1Name, style: p1StyleId, stats: p1Style.stats, money: 0, reputation: 0, wins: 0, perks: [] };

    Snd.stopMurmur && Snd.stopMurmur();
    Snd.gavel && Snd.gavel();
    Snd.murmur && Snd.murmur();

    const p1Data = {
      name: p1Name, style: p1StyleId, tieColor: p1Style.tieColor, hairColor: p1Style.hairColor,
      cred: 100, hand: p1Hand, specialUses: p1Style.special.uses, stats: p1Style.stats,
    };
    const p2Data = {
      name: p2Name, style: p2StyleId, tieColor: p2Style.tieColor, hairColor: p2Style.hairColor,
      cred: 100, hand: p2Hand, specialUses: p2Style.special.uses, stats: p2Style.stats,
    };

    S.duel = {
      active: true, turn: 1, ended: false,
      p1: p1Data, p2: p2Data,
      jury: 0, judge: 100, witnessConfidence: 100,
      round: 1, maxRounds: 30,
      recess: { 1: 2, 2: 2 },
      focus: { 1: 25, 2: 25 },
      combo: { 1: 0, 2: 0 },
      statementIdx: 0, revealedWeak: [], statementsResolved: 0, lastSpokenStatement: -1,
      lastResult: null, lastSide: null,
    };

    S.court = {
      mode: 'duel', player: p1Data,
      opp: { name: p2Name, tieColor: p2Style.tieColor, hairColor: p2Style.hairColor, personality: 'neutral' },
      ended: false, witnessConfidence: 100, jury: 0, judge: 100,
      lastResult: null, lastSide: null, statementIdx: 0,
    };

    UI.$('caseLabel').textContent = randCase.title;
    UI.$('playerLabel').textContent = p1Name + ' vs ' + p2Name;
    UI.$('moneyLabel').textContent = '⚖';
    UI.show('topbar');
    UI.switchTo('court');
    UI.log('courtLog', 'CASE: ' + randCase.title + ' — ' + randCase.intro, 'drama');
    UI.log('courtLog', p1Name + ' (Defense) vs ' + p2Name + ' (Prosecution). Present matching evidence against witness statements to win!', 'good');
    this.renderDuelCourt();
  };

  Game.renderDuelCourt = function () {
    const d = S.duel;
    if (!d || d.ended) return;
    const cur = d.turn === 1 ? d.p1 : d.p2;
    const oth = d.turn === 1 ? d.p2 : d.p1;

    S.player = { name: cur.name, style: cur.style, stats: cur.stats, money: 0, reputation: 0, wins: 0, perks: [] };
    S.court.player = cur;
    S.court.opp = { name: oth.name, tieColor: oth.tieColor, hairColor: oth.hairColor, personality: 'neutral' };
    S.court.witnessConfidence = d.witnessConfidence;
    S.court.jury = d.jury; S.court.judge = d.judge;
    S.court.ended = false; S.court.lastResult = d.lastResult; S.court.lastSide = d.lastSide;
    S.court.statementIdx = d.statementIdx;

    UI.$('pName').textContent = cur.name + ' ◄ TURN';
    UI.$('oppName').textContent = oth.name;
    UI.$('barPlayer').style.width = Math.max(0, Math.min(100, cur.cred)) + '%';
    UI.$('numPlayer').textContent = Math.round(cur.cred);
    UI.$('barOpp').style.width = Math.max(0, Math.min(100, oth.cred)) + '%';
    UI.$('numOpp').textContent = Math.round(oth.cred);
    const juryPct = 50 + d.jury;
    const jb = UI.$('barJury');
    jb.style.left = juryPct + '%'; jb.style.width = '3px';
    UI.$('numJury').textContent = (d.jury > 0 ? '+' : '') + d.jury;
    UI.$('barJudge').style.width = Math.max(0, Math.min(100, d.judge)) + '%';
    UI.$('numJudge').textContent = Math.round(d.judge);
    UI.$('barWit').style.width = Math.max(0, Math.min(100, d.witnessConfidence)) + '%';
    UI.$('numWit').textContent = Math.round(d.witnessConfidence);
    if (UI.$('trialClock')) {
      UI.$('trialClock').textContent = d.round + '/' + d.maxRounds;
      UI.$('barClock').style.width = Math.max(0, Math.min(100, ((d.maxRounds - d.round + 1) / d.maxRounds) * 100)) + '%';
    }
    if (UI.$('numFocus')) {
      const f = d.focus[d.turn];
      UI.$('barFocus').style.width = Math.max(0, Math.min(100, f)) + '%';
      UI.$('numFocus').textContent = Math.round(f);
      UI.$('comboBadge').textContent = 'Combo x' + d.combo[d.turn] + ' — ' + (d.turn === 1 ? 'Defense' : 'Prosecution');
      const jLead = d.jury > 3 ? d.p1.name + ' leads' : d.jury < -3 ? d.p2.name + ' leads' : 'Jury: Even';
      UI.$('trapBadge').textContent = jLead;
      UI.$('tacticTip').textContent = cur.name + '\'s turn. Match evidence to witness statements for devastating hits!';
    }

    const stmt = S.caseData && d.statementIdx < S.caseData.statements.length ? S.caseData.statements[d.statementIdx] : null;
    if (stmt) {
      UI.$('whoTalking').textContent = (S.caseData.witness ? S.caseData.witness.name + ' (' + S.caseData.witness.role + ')' : 'Witness') + ':';
      UI.$('statementText').textContent = '"' + stmt.text + '"';
      if (d.lastSpokenStatement !== d.statementIdx) {
        d.lastSpokenStatement = d.statementIdx;
        setTimeout(function () { Snd.witnessMumble && Snd.witnessMumble(); }, 220);
      }
      const hintEl = UI.$('hintLine');
      if (d.revealedWeak.includes(d.statementIdx) || d.witnessConfidence < 35) {
        hintEl.classList.remove('hidden');
        hintEl.textContent = '⚡ Insight: ' + (stmt.hint || 'Find the weakness.');
      } else {
        hintEl.classList.add('hidden');
      }
    } else {
      UI.$('whoTalking').textContent = 'The Court:';
      UI.$('statementText').textContent = '"All statements examined. Deliver your closing argument."';
      UI.$('hintLine').classList.add('hidden');
    }

    const stmtCount = S.caseData ? S.caseData.statements.length : 1;
    const closingAvail = d.statementsResolved >= Math.ceil(stmtCount * 0.5) || oth.cred < 45 || d.round >= Math.max(8, d.maxRounds - 4);
    const f = d.focus[d.turn];
    const hasMatch = !!stmt && cur.hand.some(function (c) { return !c.used && c.id === stmt.weakness; });

    const row = UI.$('courtActions');
    row.innerHTML = '';
    const pStyleDuel = STYLES[cur.style];
    const self = this;
    const acts = [
      { id: 'd_object',   label: 'Object',                  enabled: !!stmt },
      { id: 'd_cross',    label: 'Cross-Examine',           enabled: !!stmt && d.witnessConfidence > 0 },
      { id: 'd_pressure', label: 'Pressure',                enabled: !!stmt && d.witnessConfidence > 0 },
      { id: 'd_read',     label: 'Read the Room',           enabled: true },
      { id: 'd_consult',  label: 'Consult Notes (10F)',     enabled: f >= 10 && cur.hand.some(function (c) { return !c.used; }) },
      { id: 'd_pin',      label: 'Pin Down (15F)',          enabled: !!stmt && d.witnessConfidence <= 70 && f >= 15 },
      { id: 'd_expose',   label: 'Expose (20F)',            enabled: !!stmt && d.revealedWeak.includes(d.statementIdx) && f >= 20 },
      { id: 'd_reveal',   label: 'Dramatic Reveal (25F)',   enabled: hasMatch && f >= 25 },
      { id: 'd_calm',     label: 'Calm Clarification',      enabled: true },
      { id: 'd_recess',   label: 'Recess (' + d.recess[d.turn] + ')', enabled: d.recess[d.turn] > 0 },
      { id: 'd_special',  label: pStyleDuel.special.name + ' (' + cur.specialUses + ')', enabled: cur.specialUses > 0 },
      { id: 'd_closing',  label: 'Closing Argument',        enabled: closingAvail },
    ];
    acts.forEach(function (a) {
      const b = document.createElement('button');
      b.className = 'big';
      b.textContent = a.label;
      b.disabled = !a.enabled || d.ended;
      b.onclick = function () { self.duelCourtAction(a.id); };
      if (a.id === 'd_closing' && a.enabled) b.classList.add('primary');
      row.appendChild(b);
    });
    UI.hide('objectionRow');
    UI.show('courtActions');

    const hand = UI.$('evidenceRow');
    hand.innerHTML = '';
    cur.hand.forEach(function (card, i) {
      const el = document.createElement('div');
      el.className = 'ev-card' + (card.used ? ' used' : '');
      if (stmt && card.id === stmt.weakness && !card.used) el.classList.add('match-hint');
      el.innerHTML = '<div class="ev-name">' + card.name + '</div>' +
        '<div class="ev-desc">' + card.desc + '</div>' +
        '<div class="ev-stats"><span>STR ' + card.strength + '</span><span>RISK ' + card.risk + '</span></div>';
      if (!card.used && !d.ended) {
        el.onclick = (function (idx) { return function () { self.duelCourtPresent(idx); }; })(i);
      }
      hand.appendChild(el);
    });
  };

  Game.duelCourtAction = function (id) {
    const d = S.duel;
    if (!d || d.ended) return;
    const cur = d.turn === 1 ? d.p1 : d.p2;
    const oth = d.turn === 1 ? d.p2 : d.p1;
    const jDir = d.turn === 1 ? 1 : -1;
    const stmt = S.caseData && d.statementIdx < S.caseData.statements.length ? S.caseData.statements[d.statementIdx] : null;
    let f = d.focus[d.turn];
    const self = this;

    const endTurn = function () {
      d.round++;
      if (oth.cred <= 0) { d.ended = true; self.duelLog(oth.name + ' collapses. ' + cur.name + ' WINS!', 'drama'); setTimeout(function () { self.endDuelMatch(cur.name); }, 800); return; }
      if (cur.cred <= 0) { d.ended = true; self.duelLog(cur.name + ' collapses. ' + oth.name + ' WINS!', 'drama'); setTimeout(function () { self.endDuelMatch(oth.name); }, 800); return; }
      if (d.judge <= 0) { d.ended = true; self.duelLog('Judge declares a mistrial.', 'drama'); setTimeout(function () { self.endDuelMatch('hung'); }, 800); return; }
      if (d.round > d.maxRounds) {
        d.ended = true;
        const w = d.jury > 5 ? d.p1.name : d.jury < -5 ? d.p2.name : 'hung';
        self.duelLog('Time runs out. Jury decides.', 'drama');
        setTimeout(function () { self.endDuelMatch(w); }, 800);
        return;
      }
      self.duelPassTurn();
    };

    switch (id) {
      case 'd_object': {
        const objRow = UI.$('objectionRow');
        UI.hide('courtActions'); UI.show('objectionRow');
        const handleObj = function (type) {
          UI.hide('objectionRow'); UI.show('courtActions');
          objRow.querySelectorAll('[data-obj]').forEach(function (b) { b.onclick = null; });
          const correct = stmt && stmt.obj === type;
          if (correct) {
            Snd.objection && Snd.objection(); Canvas.flashIt && Canvas.flashIt();
            UI.bigCue && UI.bigCue('OBJECTION!', 900);
            const hit = 10 + Math.round(Math.random() * 8);
            oth.cred = Math.max(0, oth.cred - hit);
            d.jury = Math.max(-50, Math.min(50, d.jury + jDir * 6));
            d.judge = Math.max(0, d.judge - 2);
            d.combo[d.turn]++; d.focus[d.turn] = Math.min(100, f + 8);
            Canvas.addFloater && Canvas.addFloater('-' + hit, d.turn === 1 ? 590 : 230, 180, '#d44a3a');
            self.duelLog(cur.name + ': OBJECTION SUSTAINED! ' + oth.name + ' -' + hit + ' cred.', 'drama');
            d.lastResult = 'good'; d.lastSide = d.turn === 1 ? 'player' : 'opp';
          } else {
            Snd.objectionFail && Snd.objectionFail();
            const pen = 6; cur.cred = Math.max(0, cur.cred - pen);
            d.judge = Math.max(0, d.judge - 8); d.combo[d.turn] = 0;
            self.duelLog(cur.name + ': Objection OVERRULED. -' + pen + ' cred, judge -8.', 'bad');
            d.lastResult = 'bad'; d.lastSide = d.turn === 1 ? 'player' : 'opp';
          }
          endTurn();
        };
        objRow.querySelectorAll('[data-obj]').forEach(function (b) { b.onclick = function () { handleObj(b.dataset.obj); }; });
        const cancelBtn = objRow.querySelector('[data-act="cancel-obj"]');
        if (cancelBtn) cancelBtn.onclick = function () { UI.hide('objectionRow'); UI.show('courtActions'); self.renderDuelCourt(); };
        return;
      }
      case 'd_cross': {
        if (!stmt) { endTurn(); break; }
        Snd.paper && Snd.paper();
        const stat = cur.stats ? (cur.stats.legalSkill + cur.stats.charm) / 2 : 6;
        const hit = Math.round(8 + stat * 0.5 + Math.random() * 6);
        d.witnessConfidence = Math.max(0, d.witnessConfidence - hit);
        d.focus[d.turn] = Math.min(100, f + 5); d.combo[d.turn]++;
        Canvas.addFloater && Canvas.addFloater('-' + hit + ' conf', d.turn === 1 ? 640 : 165, 200, '#9a5ad4');
        this.duelLog(cur.name + ': Cross-examines! Witness confidence -' + hit + '.', 'good');
        d.lastResult = 'good'; d.lastSide = d.turn === 1 ? 'player' : 'opp';
        if (d.witnessConfidence <= 0) {
          this.duelLog('Witness breaks! Statement exposed!', 'drama');
          if (!d.revealedWeak.includes(d.statementIdx)) d.revealedWeak.push(d.statementIdx);
          this.duelAdvanceStatement();
        }
        endTurn(); break;
      }
      case 'd_pressure': {
        if (!stmt) { endTurn(); break; }
        const pStat = cur.stats ? cur.stats.intimidation : 5;
        if (Math.random() > 0.35 - pStat * 0.02) {
          const hit = Math.round(10 + pStat * 0.8 + Math.random() * 6);
          oth.cred = Math.max(0, oth.cred - hit);
          d.jury = Math.max(-50, Math.min(50, d.jury + jDir * 4));
          d.combo[d.turn]++;
          Canvas.addFloater && Canvas.addFloater('-' + hit, d.turn === 1 ? 590 : 230, 200, '#d44a3a');
          this.duelLog(cur.name + ': Pressure lands! ' + oth.name + ' -' + hit + '.', 'good');
          d.lastResult = 'good'; d.lastSide = d.turn === 1 ? 'player' : 'opp';
        } else {
          const pen = 8; cur.cred = Math.max(0, cur.cred - pen); d.combo[d.turn] = 0;
          this.duelLog(cur.name + ': Pressure BACKFIRES. -' + pen + ' cred.', 'bad');
          d.lastResult = 'bad'; d.lastSide = d.turn === 1 ? 'player' : 'opp';
        }
        endTurn(); break;
      }
      case 'd_read': {
        const gain = 6 + Math.round(Math.random() * 4);
        d.focus[d.turn] = Math.min(100, f + gain);
        if (stmt && !d.revealedWeak.includes(d.statementIdx)) {
          d.revealedWeak.push(d.statementIdx);
          this.duelLog(cur.name + ': Reads the room — weakness revealed! Focus +' + gain + '.', 'drama');
          Canvas.addFloater && Canvas.addFloater('INSIGHT', d.turn === 1 ? 230 : 590, 180, '#d4a82c');
        } else {
          this.duelLog(cur.name + ': Steadies themselves. Focus +' + gain + '.', 'good');
        }
        d.lastResult = 'good'; d.lastSide = d.turn === 1 ? 'player' : 'opp';
        endTurn(); break;
      }
      case 'd_consult': {
        if (f < 10) { endTurn(); break; }
        d.focus[d.turn] = f - 10;
        if (stmt && !d.revealedWeak.includes(d.statementIdx)) d.revealedWeak.push(d.statementIdx);
        const boost = 6; cur.cred = Math.min(130, cur.cred + boost);
        Canvas.addFloater && Canvas.addFloater('+' + boost, d.turn === 1 ? 230 : 590, 180, '#5aaa4a');
        this.duelLog(cur.name + ': Consults notes. +' + boost + ' cred, weakness revealed.', 'good');
        d.lastResult = 'good'; d.lastSide = d.turn === 1 ? 'player' : 'opp';
        endTurn(); break;
      }
      case 'd_pin': {
        if (f < 15 || !stmt) { endTurn(); break; }
        d.focus[d.turn] = f - 15;
        const hitPin = Math.round(12 + Math.random() * 8);
        d.witnessConfidence = Math.max(0, d.witnessConfidence - hitPin);
        oth.cred = Math.max(0, oth.cred - 6);
        Canvas.addFloater && Canvas.addFloater('PIN -' + hitPin, d.turn === 1 ? 640 : 165, 200, '#9a5ad4');
        this.duelLog(cur.name + ': PINS DOWN the witness! Conf -' + hitPin + ', ' + oth.name + ' -6.', 'drama');
        d.lastResult = 'good'; d.lastSide = d.turn === 1 ? 'player' : 'opp';
        if (d.witnessConfidence <= 0) { this.duelLog('Witness collapses!', 'drama'); this.duelAdvanceStatement(); }
        endTurn(); break;
      }
      case 'd_expose': {
        if (f < 20 || !stmt) { endTurn(); break; }
        d.focus[d.turn] = f - 20;
        const hitEx = Math.round(14 + Math.random() * 10);
        oth.cred = Math.max(0, oth.cred - hitEx);
        d.jury = Math.max(-50, Math.min(50, d.jury + jDir * 8));
        Canvas.addFloater && Canvas.addFloater('⚡ -' + hitEx, d.turn === 1 ? 590 : 230, 170, '#d4a82c');
        Snd.drama && Snd.drama();
        this.duelLog(cur.name + ': EXPOSES the contradiction! ' + oth.name + ' -' + hitEx + '. Jury shifts.', 'drama');
        d.lastResult = 'good'; d.lastSide = d.turn === 1 ? 'player' : 'opp';
        endTurn(); break;
      }
      case 'd_reveal': {
        if (f < 25 || !stmt) { endTurn(); break; }
        const matchCard = cur.hand.find(function (c) { return !c.used && c.id === stmt.weakness; });
        if (!matchCard) { endTurn(); break; }
        matchCard.used = true;
        d.focus[d.turn] = f - 25;
        Snd.evidence && Snd.evidence(); Snd.drama && Snd.drama(); Canvas.flashIt && Canvas.flashIt();
        UI.bigCue && UI.bigCue('DRAMATIC REVEAL', 1200);
        const hitRev = Math.round(22 + matchCard.strength * 1.5 + Math.random() * 10);
        oth.cred = Math.max(0, oth.cred - hitRev);
        d.jury = Math.max(-50, Math.min(50, d.jury + jDir * 15));
        d.witnessConfidence = Math.max(0, d.witnessConfidence - 30);
        Canvas.addFloater && Canvas.addFloater('💥 -' + hitRev, d.turn === 1 ? 590 : 230, 160, '#ffdc5c');
        this.duelLog(cur.name + ': DRAMATIC REVEAL — ' + matchCard.name + '! ' + oth.name + ' -' + hitRev + '. Jury massively shifts!', 'drama');
        d.lastResult = 'good'; d.lastSide = d.turn === 1 ? 'player' : 'opp';
        d.statementsResolved++; this.duelAdvanceStatement();
        endTurn(); break;
      }
      case 'd_calm': {
        const cStat = cur.stats ? cur.stats.charm : 5;
        const heal = Math.round(8 + cStat * 0.6 + Math.random() * 5);
        cur.cred = Math.min(130, cur.cred + heal);
        d.judge = Math.min(100, d.judge + 3);
        Canvas.addFloater && Canvas.addFloater('+' + heal, d.turn === 1 ? 230 : 590, 200, '#5aaa4a');
        this.duelLog(cur.name + ': Calm clarification. +' + heal + ' cred.', 'good');
        d.lastResult = 'good'; d.lastSide = d.turn === 1 ? 'player' : 'opp';
        endTurn(); break;
      }
      case 'd_recess': {
        if (d.recess[d.turn] <= 0) { endTurn(); break; }
        d.recess[d.turn]--;
        cur.cred = Math.min(130, cur.cred + 14);
        d.witnessConfidence = Math.min(100, d.witnessConfidence + 15);
        d.judge = Math.min(100, d.judge + 5);
        Snd.recess && Snd.recess();
        this.duelLog(cur.name + ' calls recess. +14 cred. Witness recovers.', 'good');
        endTurn(); break;
      }
      case 'd_special': {
        if (cur.specialUses <= 0) { endTurn(); break; }
        cur.specialUses--;
        Snd.drama && Snd.drama(); Canvas.flashIt && Canvas.flashIt();
        const spName = STYLES[cur.style].special.name;
        UI.bigCue && UI.bigCue(spName.toUpperCase(), 900);
        if (cur.style === 'closer') {
          cur.cred = Math.min(130, cur.cred + 20);
          d.jury = Math.max(-50, Math.min(50, d.jury + jDir * 8));
          this.duelLog(cur.name + ': POWER SUIT! +20 cred, jury sways.', 'drama');
        } else if (cur.style === 'shark') {
          const hitSp = 24; oth.cred = Math.max(0, oth.cred - hitSp); cur.cred = Math.max(0, cur.cred - 4);
          Canvas.addFloater && Canvas.addFloater('-' + hitSp, d.turn === 1 ? 590 : 230, 180, '#d44a3a');
          this.duelLog(cur.name + ': CORPORATE PRESSURE! ' + oth.name + ' -' + hitSp + '.', 'drama');
        } else if (cur.style === 'strategist') {
          const hitSt = 15; oth.cred = Math.max(0, oth.cred - hitSt);
          d.jury = Math.max(-50, Math.min(50, d.jury + jDir * 10));
          if (stmt && !d.revealedWeak.includes(d.statementIdx)) d.revealedWeak.push(d.statementIdx);
          Canvas.addFloater && Canvas.addFloater('-' + hitSt, d.turn === 1 ? 590 : 230, 180, '#d44a3a');
          this.duelLog(cur.name + ': PAPER TRAIL! ' + oth.name + ' -' + hitSt + '. Weakness revealed. Jury sways.', 'drama');
        } else if (cur.style === 'charmer') {
          d.jury = Math.max(-50, Math.min(50, d.jury + jDir * 18));
          d.witnessConfidence = Math.max(0, d.witnessConfidence - 20);
          this.duelLog(cur.name + ': COLD READ! Jury massively swayed. Witness shaken.', 'drama');
        }
        d.lastResult = 'good'; d.lastSide = d.turn === 1 ? 'player' : 'opp';
        endTurn(); break;
      }
      case 'd_closing': {
        const stmtCount2 = S.caseData ? S.caseData.statements.length : 1;
        const closingOk = d.statementsResolved >= Math.ceil(stmtCount2 * 0.5) || oth.cred < 45 || d.round >= Math.max(8, d.maxRounds - 4);
        if (!closingOk) { endTurn(); break; }
        Snd.drama && Snd.drama(); Snd.gavel && Snd.gavel(); Canvas.flashIt && Canvas.flashIt();
        UI.bigCue && UI.bigCue('CLOSING ARGUMENT', 1200);
        const charm = cur.style === 'closer' ? 20 : cur.style === 'charmer' ? 12 : 0;
        const jBonus = d.turn === 1 ? d.jury : -d.jury;
        const score = (cur.cred - oth.cred) + jBonus * 1.5 + charm;
        d.ended = true;
        const winner = score > 20 ? cur.name : score < -15 ? oth.name : 'hung';
        this.duelLog(cur.name + ': CLOSING ARGUMENT. Score ' + Math.round(score) + '. ' +
          (winner === 'hung' ? 'Hung jury.' : winner + ' WINS!'), 'drama');
        const selfClos = this;
        setTimeout(function () { selfClos.endDuelMatch(winner); }, 1400);
        return;
      }
    }
  };

  Game.duelCourtPresent = function (idx) {
    const d = S.duel;
    if (!d || d.ended) return;
    const cur = d.turn === 1 ? d.p1 : d.p2;
    const oth = d.turn === 1 ? d.p2 : d.p1;
    const jDir = d.turn === 1 ? 1 : -1;
    const card = cur.hand[idx];
    if (!card || card.used) return;
    card.used = true;
    const stmt = S.caseData && d.statementIdx < S.caseData.statements.length ? S.caseData.statements[d.statementIdx] : null;
    const isMatch = stmt && card.id === stmt.weakness;
    Snd.evidence && Snd.evidence(); Canvas.flashIt && Canvas.flashIt();
    const self = this;

    if (isMatch) {
      Snd.drama && Snd.drama();
      UI.bigCue && UI.bigCue('EVIDENCE MATCH!', 900);
      const hit = Math.round(12 + card.strength * 1.2 + Math.random() * 8);
      oth.cred = Math.max(0, oth.cred - hit);
      d.jury = Math.max(-50, Math.min(50, d.jury + jDir * 8));
      d.witnessConfidence = Math.max(0, d.witnessConfidence - 20);
      d.combo[d.turn]++; d.focus[d.turn] = Math.min(100, d.focus[d.turn] + 8);
      Canvas.addFloater && Canvas.addFloater('💥 -' + hit, d.turn === 1 ? 590 : 230, 170, '#ffdc5c');
      this.duelLog(cur.name + ': ' + card.name + ' — PERFECT MATCH! ' + oth.name + ' -' + hit + '. Jury shifts!', 'drama');
      d.lastResult = 'good'; d.lastSide = d.turn === 1 ? 'player' : 'opp';
      d.statementsResolved++; this.duelAdvanceStatement();
    } else {
      if (Math.random() > card.risk * 0.12) {
        const hit = Math.round(6 + card.strength * 0.7 + Math.random() * 5);
        oth.cred = Math.max(0, oth.cred - hit);
        d.jury = Math.max(-50, Math.min(50, d.jury + jDir * 4));
        Canvas.addFloater && Canvas.addFloater('-' + hit, d.turn === 1 ? 590 : 230, 190, '#d44a3a');
        this.duelLog(cur.name + ': Presents ' + card.name + '. ' + oth.name + ' -' + hit + '.', 'good');
        d.lastResult = 'good'; d.lastSide = d.turn === 1 ? 'player' : 'opp';
      } else {
        const pen = Math.round(4 + card.risk * 2);
        cur.cred = Math.max(0, cur.cred - pen);
        d.judge = Math.max(0, d.judge - 5); d.combo[d.turn] = 0;
        Canvas.addFloater && Canvas.addFloater('-' + pen, d.turn === 1 ? 230 : 590, 190, '#d44a3a');
        this.duelLog(cur.name + ': ' + card.name + ' challenged. -' + pen + ' cred.', 'bad');
        d.lastResult = 'bad'; d.lastSide = d.turn === 1 ? 'player' : 'opp';
      }
    }

    d.round++;
    if (oth.cred <= 0) { d.ended = true; this.duelLog(oth.name + ' collapses. ' + cur.name + ' WINS!', 'drama'); setTimeout(function () { self.endDuelMatch(cur.name); }, 800); return; }
    if (cur.cred <= 0) { d.ended = true; this.duelLog(cur.name + ' collapses. ' + oth.name + ' WINS!', 'drama'); setTimeout(function () { self.endDuelMatch(oth.name); }, 800); return; }
    if (d.round > d.maxRounds) {
      d.ended = true;
      const w = d.jury > 5 ? d.p1.name : d.jury < -5 ? d.p2.name : 'hung';
      setTimeout(function () { self.endDuelMatch(w); }, 800);
      return;
    }
    this.duelPassTurn();
  };

  Game.duelAdvanceStatement = function () {
    const d = S.duel;
    if (!d) return;
    d.witnessConfidence = 100;
    d.statementIdx++;
    const stmtCount = S.caseData ? S.caseData.statements.length : 0;
    if (d.statementIdx < stmtCount) {
      this.duelLog('━━ Next statement ━━', 'drama');
      Snd.gavel && Snd.gavel();
    } else {
      this.duelLog('All statements examined. Closing argument now available!', 'drama');
    }
  };

  Game.duelPassTurn = function () {
    const d = S.duel;
    if (!d || d.ended) return;
    const nextTurn = d.turn === 1 ? 2 : 1;
    const nextPlayer = nextTurn === 1 ? d.p1 : d.p2;
    const role = nextTurn === 1 ? 'Defense' : 'Prosecution';
    const overlay = document.getElementById('passControllerOverlay');
    const self = this;
    if (overlay) {
      const nameEl = document.getElementById('passPlayerName');
      const roleEl = document.getElementById('passRoleLabel');
      if (nameEl) nameEl.textContent = nextPlayer.name;
      if (roleEl) roleEl.textContent = role;
      overlay.classList.remove('hidden');
      const btn = document.getElementById('passReadyBtn');
      if (btn) btn.onclick = function () {
        overlay.classList.add('hidden');
        d.turn = nextTurn;
        S.player = { name: nextPlayer.name, style: nextPlayer.style, stats: nextPlayer.stats, money: 0, reputation: 0, wins: 0, perks: [] };
        self.renderDuelCourt();
      };
    } else {
      d.turn = nextTurn;
      S.player = { name: nextPlayer.name, style: nextPlayer.style, stats: nextPlayer.stats, money: 0, reputation: 0, wins: 0, perks: [] };
      this.renderDuelCourt();
    }
  };

  Game.duelLog = function (text, kind) {
    UI.log('courtLog', text, kind || '');
  };

  Game.endDuelMatch = function (winnerName) {
    const caseTitle = S.caseData ? S.caseData.title : 'The Duel';
    S.duel = null; S.court = null;
    Snd.stopMurmur && Snd.stopMurmur();
    if (winnerName === 'hung') {
      Snd.loss && Snd.loss();
      UI.$('verdictTitle').textContent = 'HUNG JURY';
      UI.$('verdictArt').textContent = '⚖️';
      UI.$('verdictText').textContent = 'Neither side could claim a decisive victory. The court is dismissed.';
    } else {
      Snd.victory && Snd.victory();
      UI.$('verdictTitle').textContent = winnerName.toUpperCase() + ' WINS';
      UI.$('verdictArt').textContent = '⚖️ ★';
      UI.$('verdictText').textContent = winnerName + ' walks out of court vindicated. A masterclass in courtroom combat.';
    }
    UI.$('rewardBox').innerHTML = '<div><b>Case:</b> ' + caseTitle + '</div><div style="color:var(--ink-dim);font-size:12px;margin-top:4px">Duel Mode — no campaign rewards.</div>';
    UI.$('nextCaseBtn').textContent = 'Another Duel →';
    const self = this;
    UI.$('nextCaseBtn').onclick = function () { self.startDuelSetup(); };
    S.caseData = null;
    UI.switchTo('verdict');
  };

  const _origEndDuel = Game.endDuel && Game.endDuel.bind(Game);
  if (_origEndDuel) {
    Game.endDuel = function (winnerName) {
      if (S.duel && S.duel.active) { this.endDuelMatch(winnerName); }
      else if (_origEndDuel) { _origEndDuel(winnerName); }
    };
  }

  const _origRenderDuel = Game.renderDuel && Game.renderDuel.bind(Game);
  Game.renderDuel = function () {
    if (S.duel && S.duel.active && S.caseData) { this.renderDuelCourt(); }
    else if (_origRenderDuel) { _origRenderDuel(); }
  };

  console.log('[Duel Overhaul] Real case-based duel mode with pass-controller loaded.');
})();


/* ============================================================
 * VISUAL & UI ENHANCEMENTS v2
 * Draws a richly detailed courtroom BEFORE the original call
 * (gallery, columns, seal, ceiling) then draws foreground FX
 * AFTER the original (lighting shafts, dust, mood effects,
 * vignette, papers, nameplate, speech bubble, duel glow).
 * ============================================================ */
(function visualEnhancements() {
  if (typeof Canvas === 'undefined') return;

  const _origDrawCourtroom = Canvas.drawCourtroom.bind(Canvas);

  /* ── Background helpers (drawn BEFORE original so characters appear on top) ── */

  function drawCeilingAndRailing(ctx) {
    // Deep ceiling strip
    ctx.fillStyle = '#100820';
    ctx.fillRect(0, 0, 800, 32);
    // Ceiling light panels (recessed rectangular lights)
    var panelPositions = [70, 210, 350, 450, 590, 730];
    panelPositions.forEach(function(px) {
      // Outer frame
      ctx.strokeStyle = 'rgba(180,140,60,0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, 4, 90, 22);
      // Inner glow fill
      var lg = ctx.createLinearGradient(px, 4, px, 26);
      lg.addColorStop(0, 'rgba(255,240,190,0.13)');
      lg.addColorStop(1, 'rgba(255,220,140,0.04)');
      ctx.fillStyle = lg;
      ctx.fillRect(px + 1, 5, 88, 20);
      // Warm glow pool below
      ctx.globalAlpha = 0.07;
      var gg = ctx.createRadialGradient(px + 45, 26, 0, px + 45, 26, 60);
      gg.addColorStop(0, '#fff4c0'); gg.addColorStop(1, 'transparent');
      ctx.fillStyle = gg;
      ctx.fillRect(px - 20, 10, 130, 70);
      ctx.globalAlpha = 1;
    });
    // Crown moulding strip
    ctx.fillStyle = '#2c1f0d';
    ctx.fillRect(0, 30, 800, 7);
    ctx.fillStyle = '#3d2a10';
    ctx.fillRect(0, 36, 800, 3);
    // Gallery railing (horizontal rail across the back wall)
    ctx.fillStyle = '#5c3d1a';
    ctx.fillRect(130, 64, 540, 5);
    ctx.fillStyle = '#7a5428';
    ctx.fillRect(130, 64, 540, 2);
    // Railing balusters
    for (var bx = 140; bx < 670; bx += 22) {
      ctx.fillStyle = 'rgba(80,52,22,0.7)';
      ctx.fillRect(bx, 42, 4, 22);
    }
  }

  function drawGalleryCrowd(ctx, frame) {
    // Second row (far back, smaller, partially hidden by railing)
    var row2 = [155, 195, 240, 290, 340, 400, 460, 510, 560, 605, 650];
    row2.forEach(function(hx, i) {
      var bob = Math.sin(frame * 0.038 + i * 1.4 + 0.5) * 0.7;
      ctx.fillStyle = 'rgba(8, 4, 18, 0.55)';
      ctx.beginPath(); ctx.ellipse(hx, 42 + bob, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
    });
    // Main gallery row (larger silhouettes just above railing)
    var row1 = [148, 192, 240, 286, 336, 380, 430, 476, 522, 568, 614, 658];
    row1.forEach(function(hx, i) {
      var bob = Math.sin(frame * 0.045 + i * 1.1) * 1.1;
      var shade = 12 + ((i * 17) % 14);
      ctx.fillStyle = 'rgba(' + shade + ',' + (shade / 2 | 0) + ',' + (shade * 2 | 0) + ',0.78)';
      // Head
      ctx.beginPath(); ctx.ellipse(hx, 55 + bob, 9, 12, 0, 0, Math.PI * 2); ctx.fill();
      // Shoulders
      ctx.beginPath(); ctx.ellipse(hx, 70 + bob, 14, 7, 0, Math.PI, 0); ctx.fill();
      // Occasional person leaning / whispering animation
      if (i % 3 === 1 && Math.sin(frame * 0.02 + i) > 0.7) {
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.ellipse(hx + 9, 54 + bob, 6, 8, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
  }

  function drawCourtSeal(ctx, cx, cy) {
    // Background disc
    ctx.fillStyle = 'rgba(20,10,40,0.6)';
    ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill();
    // Outer ring
    ctx.strokeStyle = 'rgba(212,168,44,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(212,168,44,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.stroke();
    // Sun rays
    for (var r = 0; r < 16; r++) {
      var a = r * Math.PI / 8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16);
      ctx.lineTo(cx + Math.cos(a) * 23, cy + Math.sin(a) * 23);
      ctx.strokeStyle = 'rgba(212,168,44,' + (r % 2 === 0 ? '0.4' : '0.2') + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Scale icon
    ctx.fillStyle = 'rgba(212,168,44,0.7)';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚖', cx, cy + 4);
    ctx.font = '5px Courier New';
    ctx.fillStyle = 'rgba(212,168,44,0.5)';
    ctx.fillText('COURT OF LAW', cx, cy + 17);
    ctx.textAlign = 'left';
  }

  function drawColumns(ctx) {
    function oneColumn(x) {
      // Shadow behind column
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(x + 4, 42, 10, 190);
      // Main shaft
      var cg = ctx.createLinearGradient(x, 0, x + 18, 0);
      cg.addColorStop(0, 'rgba(55,36,14,0.65)');
      cg.addColorStop(0.4, 'rgba(95,65,28,0.75)');
      cg.addColorStop(1, 'rgba(40,26,10,0.55)');
      ctx.fillStyle = cg;
      ctx.fillRect(x, 42, 18, 192);
      // Capital (top) and base
      ctx.fillStyle = 'rgba(110,76,34,0.75)';
      ctx.fillRect(x - 3, 39, 24, 8);
      ctx.fillRect(x - 3, 230, 24, 8);
      ctx.fillStyle = 'rgba(130,90,40,0.55)';
      ctx.fillRect(x - 1, 40, 20, 3);
      // Fluting shadows
      for (var fl = 0; fl < 3; fl++) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 3 + fl * 4, 50, 2, 178);
      }
    }
    oneColumn(108);
    oneColumn(674);
  }

  function drawWallDetails(ctx) {
    // Wainscoting panels on the side walls
    // Left wall panel
    ctx.strokeStyle = 'rgba(80,55,22,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 75, 106, 165);
    ctx.strokeRect(8, 80, 98, 155);
    // Right wall panel
    ctx.strokeRect(690, 75, 106, 165);
    ctx.strokeRect(694, 80, 98, 155);
    // Decorative horizontal rails
    ctx.fillStyle = 'rgba(90,62,24,0.3)';
    ctx.fillRect(4, 128, 104, 3);
    ctx.fillRect(690, 128, 106, 3);
    ctx.fillRect(4, 188, 104, 3);
    ctx.fillRect(690, 188, 106, 3);
  }

  /* ── Foreground helpers (drawn AFTER original, on top) ── */

  function drawWindowLightShafts(ctx, frame) {
    var t = frame * 0.014;
    // Left shaft (angled down-right from top-left window)
    ctx.globalAlpha = 0.055 + 0.018 * Math.sin(t);
    var g1 = ctx.createLinearGradient(0, 35, 200, 290);
    g1.addColorStop(0, '#ffe898'); g1.addColorStop(0.6, 'rgba(255,232,152,0.3)'); g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.moveTo(2, 35); ctx.lineTo(200, 290); ctx.lineTo(120, 290); ctx.lineTo(2, 75);
    ctx.closePath(); ctx.fill();
    // Right shaft
    ctx.globalAlpha = 0.048 + 0.016 * Math.sin(t + 2.1);
    var g2 = ctx.createLinearGradient(800, 35, 600, 290);
    g2.addColorStop(0, '#ffe898'); g2.addColorStop(0.6, 'rgba(255,232,152,0.3)'); g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.moveTo(798, 35); ctx.lineTo(600, 290); ctx.lineTo(680, 290); ctx.lineTo(798, 75);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawDustMotes(ctx, frame) {
    for (var d = 0; d < 12; d++) {
      var dx = ((frame * 0.22 + d * 71) % 680) + 60;
      var dy = ((frame * 0.07 + d * 43) % 230) + 25;
      ctx.globalAlpha = 0.12 + 0.28 * Math.abs(Math.sin(frame * 0.025 + d * 0.8));
      ctx.fillStyle = '#fff6d0';
      ctx.fillRect(dx | 0, dy | 0, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  function drawPodiumPapers(ctx) {
    // Stack of papers at left podium (190-260 x, 287-320 y)
    [[192, 285, 26, '#f5e8c8'], [189, 281, 22, '#f0e2be'], [193, 277, 17, '#ead8b0']].forEach(function(p) {
      ctx.fillStyle = p[3];
      ctx.globalAlpha = 0.88;
      ctx.fillRect(p[0], p[1], p[2], 3);
    });
    // Brief/notepad at right podium (552-624 x)
    [[553, 285, 26, '#f5e8c8'], [550, 281, 22, '#f0e2be'], [554, 277, 17, '#ead8b0']].forEach(function(p) {
      ctx.fillStyle = p[3];
      ctx.globalAlpha = 0.88;
      ctx.fillRect(p[0], p[1], p[2], 3);
    });
    // Tiny pen at right podium
    ctx.fillStyle = '#2a1a0a';
    ctx.globalAlpha = 0.75;
    ctx.fillRect(576, 283, 1, 8);
    ctx.globalAlpha = 1;
  }

  function drawWitnessNameplate(ctx) {
    var wname = S.caseData && S.caseData.witness && S.caseData.witness.name;
    if (!wname) return;
    // Wooden nameplate bar on witness stand
    ctx.fillStyle = 'rgba(80,52,18,0.85)';
    ctx.fillRect(340, 291, 76, 12);
    ctx.fillStyle = 'rgba(212,168,44,0.9)';
    ctx.fillRect(341, 292, 74, 10);
    ctx.fillStyle = '#1a0a2a';
    ctx.font = 'bold 6px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(wname.toUpperCase().substring(0, 13), 378, 299);
    ctx.textAlign = 'left';
  }

  function drawCourtReporter(ctx) {
    // Tiny court reporter figure at bottom-center between podiums
    var rx = 388, ry = 305;
    // Chair
    ctx.fillStyle = '#3a2808';
    ctx.fillRect(rx - 6, ry + 6, 12, 4);
    // Body
    ctx.fillStyle = '#1a1228';
    ctx.fillRect(rx - 4, ry - 2, 8, 10);
    // Head
    ctx.fillStyle = '#c8a070';
    ctx.beginPath(); ctx.arc(rx, ry - 5, 4, 0, Math.PI * 2); ctx.fill();
    // Laptop/stenograph
    ctx.fillStyle = '#888';
    ctx.fillRect(rx - 8, ry + 2, 16, 2);
    ctx.fillStyle = '#555';
    ctx.fillRect(rx - 7, ry - 1, 14, 3);
  }

  function drawVignette(ctx) {
    var vig = ctx.createRadialGradient(400, 180, 100, 400, 180, 450);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(0.7, 'rgba(0,0,0,0.08)');
    vig.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, 800, 360);
  }

  function drawCharMoodFx(ctx, cs, frame) {
    if (!cs) return;
    _moodFx(ctx, cs.player,  228, 208, frame, 0);
    _moodFx(ctx, cs.opp,     572, 208, frame, 1);
    _moodFx(ctx, cs.witness, 390, 178, frame, 2);
  }

  function _moodFx(ctx, state, x, y, f, seed) {
    if (!state || state === 'neutral') return;
    if (state === 'triumphant') {
      for (var i = 0; i < 6; i++) {
        var a = (f * 0.042 + i * 1.047) % (Math.PI * 2);
        var r = 17 + 4 * Math.sin(f * 0.055 + i);
        ctx.globalAlpha = 0.5 + 0.4 * Math.sin(f * 0.065 + i);
        ctx.fillStyle = i % 2 === 0 ? '#ffdc5c' : '#fff4a0';
        ctx.fillRect((x + Math.cos(a) * r) | 0, (y + Math.sin(a) * r * 0.55) | 0, 3, 3);
      }
    } else if (state === 'rattled') {
      ctx.fillStyle = '#88d8f8';
      for (var j = 0; j < 3; j++) {
        var sy = ((f * 1.6 + j * 26) % 40);
        ctx.globalAlpha = 0.75 - sy / 55;
        ctx.beginPath(); ctx.arc(x - 5 + j * 5, y + sy, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    } else if (state === 'panicking') {
      ctx.strokeStyle = '#f06060'; ctx.lineWidth = 1.5;
      for (var k = 0; k < 5; k++) {
        var lx = x - 14 + k * 7;
        var jitter = Math.sin(f * 0.45 + k) * 2.5;
        ctx.globalAlpha = 0.5 + 0.35 * Math.sin(f * 0.35 + k);
        ctx.beginPath();
        ctx.moveTo(lx + jitter, y - 12);
        ctx.lineTo(lx - jitter + 2, y + 10);
        ctx.stroke();
      }
    } else if (state === 'smug') {
      for (var m = 0; m < 4; m++) {
        var ma = (f * 0.033 + m * 1.571) % (Math.PI * 2);
        var mr = 14 + 3 * Math.sin(f * 0.05 + m);
        ctx.globalAlpha = 0.38 + 0.3 * Math.sin(f * 0.06 + m);
        ctx.fillStyle = '#3af4c0';
        ctx.fillRect((x + Math.cos(ma) * mr) | 0, (y + Math.sin(ma) * mr * 0.5) | 0, 3, 3);
      }
    } else if (state === 'broken') {
      ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
      for (var n = 0; n < 7; n++) {
        var ba = n * (Math.PI / 3.5);
        var bl = 10 + Math.sin(f * 0.02 + n) * 4;
        ctx.globalAlpha = 0.3 + 0.18 * Math.sin(f * 0.015 + n);
        ctx.strokeStyle = '#707070';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ba) * bl, y + Math.sin(ba) * bl);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
  }

  /* ── Main wrapper ── */
  Canvas.drawCourtroom = function () {
    var ctx = this.ctx;
    var frame = this.frame || 0;

    /* PHASE 1 — Background (drawn first, characters appear on top) */
    drawCeilingAndRailing(ctx);
    drawGalleryCrowd(ctx, frame);
    drawColumns(ctx);
    drawWallDetails(ctx);
    drawCourtSeal(ctx, 395, 50);

    /* PHASE 2 — Original scene (judge, lawyers, witness, jurors, floor, podiums) */
    _origDrawCourtroom();

    /* PHASE 3 — Foreground effects */
    drawWindowLightShafts(ctx, frame);
    drawPodiumPapers(ctx);
    drawWitnessNameplate(ctx);
    drawCourtReporter(ctx);
    drawDustMotes(ctx, frame);
    drawVignette(ctx);

    /* Character mood effects */
    var cs = S.court && S.court._characterState;
    if (cs) drawCharMoodFx(ctx, cs, frame);

    /* PHASE 4 — Game state overlays */

    /* Duel turn indicator — gold glow on active podium */
    if (S.duel && S.duel.active) {
      var p1Active = S.duel.turn === 1;
      var gx = p1Active ? 178 : 538;
      ctx.globalAlpha = 0.3 + 0.14 * Math.sin(frame * 0.12);
      ctx.strokeStyle = '#ffdc5c';
      ctx.lineWidth = 3;
      ctx.strokeRect(gx - 2, 287, 86, 36);
      ctx.globalAlpha = 1;
      ctx.font = 'bold 8px Courier New';
      ctx.fillStyle = '#ffdc5c';
      ctx.textAlign = 'center';
      ctx.fillText('◄ YOUR TURN', p1Active ? 220 : 580, 346);
      ctx.textAlign = 'left';
    }

    /* Excited jury highlight */
    var juryVal = (S.court && S.court.jury) || (S.duel && S.duel.jury) || 0;
    if (Math.abs(juryVal) > 20) {
      ctx.globalAlpha = 0.10 + 0.07 * Math.sin(frame * 0.18);
      ctx.fillStyle = juryVal > 0 ? '#4488ff' : '#ff4444';
      ctx.fillRect(45, 196, 130, 54);
      ctx.globalAlpha = 1;
      // Jury reaction floater text
      if (Math.abs(juryVal) > 45 && frame % 80 < 40) {
        ctx.fillStyle = juryVal > 0 ? '#88aaff' : '#ff8888';
        ctx.font = '6px Courier New';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.6 + 0.3 * Math.sin(frame * 0.1);
        ctx.fillText(juryVal > 0 ? 'JURY SWAYED' : 'JURY HOSTILE', 110, 192);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
      }
    }

    /* Speech bubble with tail */
    if (this.bubble && this.bubble.timer > 0) {
      var side = this.bubble.side;
      var bx = side === 'player' ? 182 : 540;
      var by = 216;
      var bw = 128, bh = 28;
      ctx.fillStyle = 'rgba(255,255,242,0.96)';
      ctx.strokeStyle = '#1a0a2a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 4);
      else ctx.rect(bx, by, bw, bh);
      ctx.fill(); ctx.stroke();
      // Bubble tail pointing down toward speaker
      ctx.beginPath();
      ctx.moveTo(bx + 16, by + bh);
      ctx.lineTo(bx + 8, by + bh + 12);
      ctx.lineTo(bx + 28, by + bh);
      ctx.fillStyle = 'rgba(255,255,242,0.96)';
      ctx.fill();
      ctx.fillStyle = '#1a0a2a';
      ctx.font = 'bold 9px Courier New';
      ctx.textAlign = 'left';
      ctx.fillText(this.bubble.text.substring(0, 19), bx + 5, by + 17);
      this.bubble.timer--;
    }
  };

  Canvas.bubble = null;
  Canvas.showBubble = function (text, side) { this.bubble = { text: text, side: side, timer: 90 }; };

  /* Homepage shimmer particles */
  (function () {
    var menu = document.getElementById('menu');
    if (!menu) return;
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.35';
    menu.style.position = 'relative';
    menu.insertBefore(canvas, menu.firstChild);
    var particles = Array.from({ length: 36 }, function () {
      return { x: Math.random(), y: Math.random(), vy: 0.0002 + Math.random() * 0.0005, vx: (Math.random() - 0.5) * 0.0002, size: 1 + Math.random() * 2.5, alpha: Math.random() };
    });
    function tick() {
      canvas.width = menu.offsetWidth; canvas.height = menu.offsetHeight;
      var ctx2 = canvas.getContext('2d');
      ctx2.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.y -= p.vy; p.x += p.vx;
        if (p.y < 0) { p.y = 1; p.x = Math.random(); }
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        ctx2.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(p.alpha + Date.now() / 1600));
        ctx2.fillStyle = Math.random() > 0.85 ? '#fff' : '#d4a82c';
        ctx2.fillRect(Math.round(p.x * canvas.width), Math.round(p.y * canvas.height), p.size, p.size);
      });
      ctx2.globalAlpha = 1;
      requestAnimationFrame(tick);
    }
    tick();
  })();

  console.log('[Visual Enhancements v2] Rich courtroom: gallery crowd, columns, seal, ceiling lights, light shafts, dust motes, mood FX, vignette loaded.');
})();


/* ============================================================
 * GAME IMPROVEMENTS v4
 * 1. Case-specific evidence descriptions
 * 2. Case Dossier on prep screen
 * 3. Investigation action choices
 * 4. Closing argument minigame
 * 5. Witness profile intel strip
 * 6. Style bonuses across case phases
 * 7. Better court action grouping
 * ============================================================ */
(function gameImprovements_v4() {
  'use strict';
  if (typeof Game === 'undefined' || typeof EVIDENCE === 'undefined') return;

  /* ----------------------------------------------------------
   * 1. CONTEXTUAL EVIDENCE DESCRIPTIONS
   * ---------------------------------------------------------- */
  const EV_CTX = {
    email_thread:           function(c) { return c && c.opponent ? c.opponent.name + ' asks legal to conceal a key clause before signing — found in discovery.' : 'Email chain revealing damaging internal communications.'; },
    phone_record:           function(c) { return c && c.witness  ? 'Three calls between ' + c.witness.name + ' and opposing counsel before testimony changed — timestamps logged.' : 'Call logs show undisclosed contact with key parties.'; },
    internal_memo:          function(c) { return c && c.opponent ? 'Internal memo from ' + c.opponent.name + '\'s firm directly contradicts their filed position.' : 'Internal document showing deliberate concealment.'; },
    timeline_contradiction: function(c) { return c && c.witness  ? c.witness.name + '\'s account places them elsewhere — the timeline is physically impossible.' : 'Timeline analysis reveals a factual impossibility in the testimony.'; },
    financial_ledger:       function(c) { return c && c.opponent ? 'Payments from ' + c.opponent.name + '\'s accounts on the exact contested dates, cross-referenced with the ledger.' : 'Ledger entries directly contradict the financial claims.'; },
    expert_report:          function()  { return 'Independent expert analysis contradicts the defense conclusions and cites specific technical failures.'; },
    signed_contract:        function(c) { return c && c.opponent ? c.opponent.name + '\'s own signature commits to the disputed clause — no ambiguity remains.' : 'Original signed agreement establishing the obligation in writing.'; },
    nda_clause:             function(c) { return c && c.opponent ? 'The NDA contains a carve-out that voids ' + c.opponent.name + '\'s central confidentiality argument.' : 'A specific NDA clause that entirely undermines the defense position.'; },
    witness_statement:      function(c) { return c && c.witness  ? 'Earlier sworn statement by ' + c.witness.name + ' directly contradicts their testimony today, word for word.' : 'Prior sworn statement in direct conflict with current testimony.'; },
    security_footage:       function(c) { return c && c.witness  ? 'Building footage timestamps place ' + c.witness.name + ' at the location they denied visiting.' : 'Security footage placing a key figure at the disputed location and time.'; },
    board_minutes:          function(c) { return c && c.opponent ? 'Board meeting minutes record the decision ' + c.opponent.name + ' claims was never formally made.' : 'Official meeting record of a decision that was subsequently denied.'; },
    redline_draft:          function()  { return 'Marked-up contract draft shows deliberate deletion of language that proves original intent.'; },
    access_badge_log:       function(c) { return c && c.opponent ? 'Electronic badge records show access to ' + c.opponent.name + '\'s office on the exact disputed dates.' : 'Access log placing a key person at the scene on the relevant date.'; },
    whistle_file:           function(c) { return c && c.opponent ? 'A whistleblower document details the scheme from inside ' + c.opponent.name + '\'s own organization.' : 'Insider disclosure document detailing the scheme step by step.'; },
    calendar_invite:        function(c) { return c && c.opponent ? 'A calendar invite proves ' + c.opponent.name + ' attended the exact meeting they deny being in.' : 'Digital calendar proving attendance at the disputed meeting.'; },
    settlement_draft:       function(c) { return c && c.opponent ? 'An earlier draft settlement offer reveals ' + c.opponent.name + ' privately acknowledged the claim was valid.' : 'Draft settlement showing the defendant knew the claim was credible.'; },
  };
  window._getCtxDesc = function(card, caseData) {
    var fn = EV_CTX[card.id];
    return fn ? fn(caseData) : (card.desc || '');
  };

  function applyCtxDescs(containerEl, handArr, caseData) {
    if (!containerEl || !handArr || !caseData) return;
    containerEl.querySelectorAll('.ev-card').forEach(function(el, i) {
      var card = handArr[i];
      if (!card) return;
      var descEl = el.querySelector('.ev-desc');
      if (descEl && !card._ctxApplied) {
        descEl.textContent = window._getCtxDesc(card, caseData);
        card._ctxApplied = true;
      }
    });
  }

  /* ----------------------------------------------------------
   * 2. CASE DOSSIER
   * ---------------------------------------------------------- */
  function buildDossierHTML(cd, playerStyle) {
    if (!cd) return '';
    var risk     = cd.diff >= 4 ? '🔴 High' : cd.diff >= 2 ? '🟡 Moderate' : '🟢 Low';
    var strats   = { closer: 'Build momentum and land a decisive Closing Argument. Accumulate jury points steadily.', shark: 'Pressure the witness hard — high risk but devastating if it lands. Watch the judge patience.', strategist: 'Investigate fully and expose contradictions methodically. Your hints are sharper than anyone\'s.', charmer: 'Work the jury and recover after hits. The witness will crack with enough patience and charm.' };
    var strategy = strats[playerStyle] || 'Read the witness carefully and match your evidence to their weaknesses.';
    var opp      = cd.opponent || {};
    var wit      = cd.witness  || {};
    var leads    = cd.statements.filter(function(s) { return s.hint; }).slice(0, 2).map(function(s) { return '• ' + s.hint; }).join('<br>');
    var _rwd = cd.reward;
    var _rwdMoney = _rwd && (typeof _rwd === 'object' ? (_rwd.money || 0) : _rwd);
    var _rwdRep   = _rwd && typeof _rwd === 'object' ? (_rwd.reputation || _rwd.rep || 0) : 0;
    var reward    = _rwdMoney ? '$' + Number(_rwdMoney).toLocaleString() + (_rwdRep ? ' + ' + _rwdRep + ' Rep' : '') : 'Justice and compensation.';

    return '<div class="dossier-panel" id="caseDossierPanel">' +
      '<div class="dossier-header">' +
        '<span class="dossier-badge">📋 CASE DOSSIER</span>' +
        '<button class="ghost dossier-toggle-btn" id="dossierToggleBtn">▼ Hide</button>' +
      '</div>' +
      '<div class="dossier-body" id="dossierBody">' +
        '<div class="dossier-grid">' +
          '<div class="dossier-block"><span class="dossier-lbl">CASE</span><span class="dossier-val">' + cd.title + '</span></div>' +
          '<div class="dossier-block"><span class="dossier-lbl">RISK</span><span class="dossier-val">' + risk + '</span></div>' +
          '<div class="dossier-block dossier-wide"><span class="dossier-lbl">SUMMARY</span><span class="dossier-val">' + (cd.intro || '') + '</span></div>' +
          '<div class="dossier-block"><span class="dossier-lbl">OPPONENT</span><span class="dossier-val">' + opp.name + '<br><em class="dossier-dim">' + opp.personality + '</em></span></div>' +
          '<div class="dossier-block"><span class="dossier-lbl">KEY WITNESS</span><span class="dossier-val">' + wit.name + '<br><em class="dossier-dim">' + wit.role + '</em></span></div>' +
          '<div class="dossier-block dossier-wide"><span class="dossier-lbl">STRATEGY (' + (playerStyle || '').toUpperCase() + ')</span><span class="dossier-val">' + strategy + '</span></div>' +
          (leads ? '<div class="dossier-block dossier-wide"><span class="dossier-lbl">KNOWN LEADS</span><span class="dossier-val">' + leads + '</span></div>' : '') +
          '<div class="dossier-block dossier-wide"><span class="dossier-lbl">CLIENT GOAL</span><span class="dossier-val">' + reward + '</span></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function injectDossier() {
    var existing = document.getElementById('caseDossierPanel');
    if (existing) existing.remove();
    if (!S.caseData || !S.player) return;
    var prepPool = UI.$('prepPool');
    if (!prepPool || !prepPool.parentNode) return;
    var div = document.createElement('div');
    div.innerHTML = buildDossierHTML(S.caseData, S.player.style);
    var panel = div.firstElementChild;
    if (!panel) return;
    prepPool.parentNode.insertBefore(panel, prepPool);
    var btn  = document.getElementById('dossierToggleBtn');
    var body = document.getElementById('dossierBody');
    if (btn && body) {
      btn.onclick = function() {
        var hidden = body.style.display === 'none';
        body.style.display = hidden ? '' : 'none';
        btn.textContent = hidden ? '▼ Hide' : '▶ Show';
      };
    }
  }

  /* ----------------------------------------------------------
   * 3. INVESTIGATION ACTION CHOICES
   * ---------------------------------------------------------- */
  var INVEST_ACTIONS = {
    office:  [
      { id: 'interview',    label: '👥 Interview Client',          desc: 'Sit with your client and dig for inconsistencies in their account — may surface a witness weakness.' },
      { id: 'review_docs',  label: '📄 Review Case Files',         desc: 'Hours in the files. Good chance of a lead; always sharpens your legal argument.' },
      { id: 'prep_theory',  label: '🧠 Build Case Theory',         desc: 'Map the narrative from scratch. Low lead chance but +Logic that pays off in cross-exam.' },
    ],
    corp: [
      { id: 'pressure_asst', label: '🗣️ Pressure the Assistant',  desc: 'High risk, high reward. They may crack and reveal something — or warn opposing counsel you\'re coming.' },
      { id: 'follow_money',  label: '💰 Follow the Money',         desc: 'Trace financial records for hard evidence. Best chance of a concrete weakness if the case has a money angle.' },
      { id: 'read_opp',      label: '🔍 Study Opposing Counsel',   desc: 'Learn how they fight. +Logic; know if they\'re a charmer, a shark, or a methodical machine.' },
    ],
    records: [
      { id: 'search_records',   label: '📜 Search Filed Records',  desc: 'Dig through public filings and prior testimony. Moderate chance of surfacing a precedent or weakness.' },
      { id: 'analyze_docs',     label: '🔬 Analyze Documents',     desc: 'Forensic document review. Good chance of finding a contradiction hidden in the paperwork.' },
      { id: 'recheck_timeline', label: '⏱️ Recheck Timeline',     desc: 'Rebuild the sequence of events minute by minute. +Legal Skill; exposes alibi gaps.' },
    ],
    courthouse: [
      { id: 'interview',    label: '👥 Speak to Court Staff',       desc: 'Clerks and bailiffs sometimes know more than the record shows.' },
      { id: 'search_records',   label: '📜 Pull Case History',     desc: 'Prior rulings, filings, procedural notes — anything the prosecution may have buried.' },
      { id: 'read_opp',      label: '🔍 Watch Opposing Counsel',   desc: 'See how they prepared. +Logic; gives you a read on their opening strategy.' },
    ],
    firm: [
      { id: 'review_docs',  label: '📄 Review Internal Files',     desc: 'Your firm\'s own files on the client. High chance of a relevant lead.' },
      { id: 'prep_theory',  label: '🧠 War-Room Session',          desc: 'Brief the whole team. Strong +Logic and a decent chance of a key insight.' },
      { id: 'follow_money',  label: '💰 Check Client Financials',  desc: 'Run a background financial check on your own client — sometimes the lead is there.' },
    ],
    lab: [
      { id: 'analyze_docs',     label: '🔬 Request Lab Analysis',  desc: 'Submit physical evidence for independent analysis. High chance of technical contradiction.' },
      { id: 'recheck_timeline', label: '⏱️ Review Forensic Report',desc: 'Challenge the prosecution\'s forensic timeline. +Legal Skill; often surfaces a timing weakness.' },
      { id: 'interview',    label: '👥 Interview the Technician',   desc: 'Question the analyst before trial — you may reveal a procedural gap.' },
    ],
  };

  /* Default picker actions for any location not explicitly listed */
  var DEFAULT_INVEST_ACTIONS = [
    { id: 'interview',    label: '👥 Talk to Contacts',          desc: 'Ask around. Someone here may know something useful.' },
    { id: 'search_records', label: '📜 Search for Records',      desc: 'Look for anything filed, written, or logged at this location.' },
    { id: 'read_opp',     label: '🔍 Scout the Opposition',      desc: 'Understand what the prosecution already knows about this place.' },
  ];

  function showInvestPicker(loc) {
    var existing = document.getElementById('investActionPicker');
    if (existing) existing.remove();
    var actions = INVEST_ACTIONS[loc.id] || DEFAULT_INVEST_ACTIONS || [{ id: 'search', label: '🔍 Investigate', desc: 'Standard investigation approach' }];
    var picker = document.createElement('div');
    picker.id = 'investActionPicker';
    picker.className = 'invest-picker';
    picker.innerHTML =
      '<div class="invest-picker-title">📍 ' + loc.name + '</div>' +
      '<div class="invest-picker-sub">' + loc.desc + ' — Choose your approach:</div>' +
      '<div class="invest-picker-btns" id="ipBtns"></div>' +
      '<button class="big invest-picker-cancel" id="ipCancel">← Back</button>';
    var btnsDiv = picker.querySelector('#ipBtns');
    actions.forEach(function(a) {
      var b = document.createElement('button');
      b.className = 'big invest-action-btn';
      b.innerHTML = '<span class="ia-label">' + a.label + '</span><span class="ia-desc">' + a.desc + '</span>';
      b.onclick = function() { picker.remove(); applyInvestAction(loc, a.id); };
      btnsDiv.appendChild(b);
    });
    picker.querySelector('#ipCancel').onclick = function() { picker.remove(); };
    var locList = UI.$('locList');
    if (locList) locList.parentNode.insertBefore(picker, locList.nextSibling);
  }

  function applyInvestAction(loc, actionId) {
    var c = S.caseData;
    S.invest.visited[loc.id] = true;
    S.invest.left--;
    Snd.paper && Snd.paper();
    var r = Math.random();
    var clue = '';

    function revealWeak() {
      var unrev = c.statements.filter(function(_, i) { return !S.invest.revealed.includes(i); });
      if (!unrev.length) return null;
      var idx = c.statements.indexOf(unrev[Math.floor(Math.random() * unrev.length)]);
      S.invest.revealed.push(idx);
      return c.statements[idx].hint;
    }

    var oppName = c.opponent ? c.opponent.name : 'opposing counsel';
    var witName = c.witness  ? c.witness.name  : 'the witness';
    var caseTitle = c.title || 'this case';

    /* Flavour intros vary per action for less repetition */
    var interviewIntros = [
      'After an hour with your client, a critical detail surfaces:',
      'Your client is reluctant at first — but eventually confirms:',
      'Pressing for specifics, you uncover a statement weakness:',
      'Buried in the back-and-forth, your client lets slip:',
    ];
    var docIntros = [
      'Deep in the filing stack, a document contradicts the prosecution\'s narrative:',
      'Cross-referencing dates and signatures, you find a discrepancy:',
      'A buried exhibit reveals what the prosecution hoped to hide:',
      'The paper trail doesn\'t lie — an overlooked record shows:',
    ];
    var theoryIntros = [
      'Mapping the full timeline reveals a logical impossibility:',
      'Your case theory, tested against the known facts, exposes:',
      'Whiteboard session — the narrative breaks down at one critical point:',
      'The more you examine the theory, the clearer the weakness becomes:',
    ];
    var pressIntros = [
      'Under sustained pressure, they finally give something up:',
      'You push hard and they fold — a single sentence that changes everything:',
      'It takes longer than expected, but they crack:',
    ];
    var moneyIntros = [
      'Following the transfers three levels deep, you find the anomaly:',
      'The accounts tell a story the prosecution hasn\'t read yet:',
      'One transaction, buried between legitimate entries, stands out:',
    ];

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    if (actionId === 'interview') {
      var h = revealWeak();
      if (h) {
        clue = '👥 ' + loc.name + ' — ' + pick(interviewIntros) + '\n"' + h + '"\nFile this. It\'s your opening gambit against ' + witName + '.';
      } else {
        S.player.stats.confidence = Math.min(10, (S.player.stats.confidence || 5) + 1);
        var noLeadLines = [
          'No new angles surfaced — but the session sharpened your delivery. Your client trusts you more. +1 Confidence.',
          'Nothing concrete yet. But you know your client better now. That matters in the room. +1 Confidence.',
          'The session was dry, but you caught how your client holds under pressure. Useful. +1 Confidence.',
        ];
        clue = '👥 ' + loc.name + ' — ' + pick(noLeadLines);
      }
    } else if (actionId === 'search_records') {
      var h1 = revealWeak();
      if (h1) {
        clue = '📜 ' + loc.name + ' — ' + pick(docIntros) + '\n"' + h1 + '"\nThis is on record. The prosecution can\'t walk it back.';
      } else {
        S.player.stats.legalSkill = Math.min(10, (S.player.stats.legalSkill || 5) + 1);
        clue = '📜 ' + loc.name + ' — The filings are clean on the surface. No smoking gun — but the procedural map you built will sharpen your cross. +1 Legal Skill.';
      }
    } else if (actionId === 'review_docs' || actionId === 'analyze_docs') {
      if (r < 0.58) {
        var h2 = revealWeak();
        if (h2) {
          clue = '📄 ' + loc.name + ' — ' + pick(docIntros) + '\n"' + h2 + '"\nMark this page. You\'ll need it in cross-examination.';
        } else {
          S.player.stats.legalSkill = Math.min(10, (S.player.stats.legalSkill || 5) + 1);
          clue = '📄 ' + loc.name + ' — Thorough document review. No single breakthrough, but your legal argument is now watertight. +1 Legal Skill.';
        }
      } else {
        S.player.stats.legalSkill = Math.min(10, (S.player.stats.legalSkill || 5) + 1);
        clue = '📄 ' + loc.name + ' — Three hours in the files. Nothing jumps out — but you understand the documentary foundation better than anyone in that courtroom will. +1 Legal Skill.';
      }
    } else if (actionId === 'prep_theory' || actionId === 'recheck_timeline') {
      S.player.stats.logic = Math.min(10, (S.player.stats.logic || 5) + 1);
      var h3 = r < 0.48 ? revealWeak() : null;
      if (h3) {
        clue = '🧠 ' + loc.name + ' — ' + pick(theoryIntros) + '\n"' + h3 + '"\nThis is the seam in their narrative. Pull it in court.';
      } else {
        clue = '🧠 ' + loc.name + ' — The theory holds. The timeline is mapped, the logic is airtight, and your argument has a clean through-line from opening to closing. +1 Logic.';
      }
    } else if (actionId === 'pressure_asst') {
      if (r < 0.52) {
        var h4 = revealWeak();
        if (h4) {
          clue = '🗣️ ' + loc.name + ' — ' + pick(pressIntros) + '\n"' + h4 + '"\nThis never makes it into any official record. Use it carefully.';
        } else {
          S.player.stats.intimidation = Math.min(10, (S.player.stats.intimidation || 5) + 1);
          clue = '🗣️ ' + loc.name + ' — They held their ground, but you rattled them. They\'ll think twice before volunteering anything for the prosecution now. +1 Intimidation.';
        }
      } else {
        S.invest.coldOpp = true;
        clue = '🗣️ ' + loc.name + ' — ⚠️ They didn\'t crack — they made a call. ' + oppName + ' now knows you were fishing here. Expect a prepared counter. Opponent forewarned.';
      }
    } else if (actionId === 'follow_money') {
      if (r < 0.65) {
        var h5 = revealWeak();
        if (h5) {
          clue = '💰 ' + loc.name + ' — ' + pick(moneyIntros) + '\n"' + h5 + '"\nThis isn\'t in the prosecution\'s exhibit list. Yet.';
        } else {
          S.player.stats.legalSkill = Math.min(10, (S.player.stats.legalSkill || 5) + 1);
          clue = '💰 ' + loc.name + ' — The trail goes three levels deep before it goes cold. Nothing definitive — but you understand the financial architecture now. +1 Legal Skill.';
        }
      } else {
        clue = '💰 ' + loc.name + ' — The accounts are clean. Either they\'re genuinely clean, or someone scrubbed them very recently. Either way, the money trail ends here.';
      }
    } else if (actionId === 'read_opp') {
      S.player.stats.logic = Math.min(10, (S.player.stats.logic || 5) + 1);
      var oppStyle = c.opponent ? c.opponent.personality : 'methodical';
      var oppReads = {
        relentless:  'They don\'t negotiate. They build a wall of evidence and walk toward you. Don\'t flinch — make them overcommit.',
        charming:    'They\'ll try to make the jury like them more than they trust you. Counter with precision. Facts beat warmth.',
        aggressive:  'They lead with pressure, hoping you fold early. Stand firm. Their aggression is a tell — they\'re not confident in their evidence.',
        methodical:  'Slow, deliberate, surgical. They\'ll dismantle your case piece by piece unless you find the thread that unravels theirs first.',
        smooth:      'Dangerous. They make everything sound reasonable. Your job is to make the unreasonable visible.',
      };
      clue = '🔍 ' + loc.name + ' — Profiling ' + oppName + ' (style: ' + oppStyle + '):\n' +
             (oppReads[oppStyle] || 'Experienced and well-prepared. Expect no obvious openings — you\'ll need to create your own.') + '\n+1 Logic.';
    } else {
      var h6 = revealWeak();
      if (h6) {
        clue = '🔍 ' + loc.name + ' — A contact points you toward something you hadn\'t considered:\n"' + h6 + '"\nCould be the angle you\'ve been looking for.';
      } else {
        clue = '🔍 ' + loc.name + ' — You came, you looked, you listened. Nothing concrete — but the time wasn\'t wasted. You understand the terrain better.';
      }
    }

    S.invest.clues.push(clue);
    if (Game.renderInvestigation) Game.renderInvestigation();
  }

  /* ----------------------------------------------------------
   * 4. CLOSING ARGUMENT MINIGAME
   * ---------------------------------------------------------- */
  var CONTRADICTIONS = [
    { id: 'timeline',   label: 'The timeline is physically impossible',           v: 9 },
    { id: 'motive',     label: 'A hidden financial motive explains everything',    v: 7 },
    { id: 'testimony',  label: 'Witness testimony is internally inconsistent',     v: 8 },
    { id: 'physical',   label: 'Physical evidence contradicts the account',        v: 8 },
    { id: 'prior_stmt', label: 'Prior sworn statement directly conflicts',         v: 10 },
  ];
  var THEORIES = [
    { id: 'negligence',   label: 'Negligent disregard for a duty of care',         v: 6 },
    { id: 'deception',    label: 'Deliberate concealment of material facts',        v: 9 },
    { id: 'breach',       label: 'Clear and documented breach of agreed terms',     v: 8 },
    { id: 'conspiracy',   label: 'Coordinated misrepresentation by multiple parties', v: 10 },
    { id: 'incompetence', label: 'Professional incompetence directly caused harm',  v: 5 },
  ];
  var GOOD_PAIRS = { deception: ['prior_stmt', 'testimony'], conspiracy: ['timeline', 'prior_stmt'], breach: ['timeline', 'physical', 'motive'] };

  function showClosingMinigame() {
    var c = S.court;
    if (!c || !S.caseData) { if (Game._origResolveClosing) Game._origResolveClosing(); return; }
    var existing = document.getElementById('closingMinigame');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'closingMinigame';
    overlay.className = 'closing-mg-overlay';
    var selEv = null, selContra = null, selTheory = null;

    function render() {
      var evOpts = (S.court.hand || []).map(function(card) {
        return '<button class="closing-choice-btn' + (selEv === card.id ? ' selected' : '') + '" data-ev="' + card.id + '">' + card.name + (card.used ? ' ✓' : '') + '</button>';
      }).join('');
      var conOpts = CONTRADICTIONS.map(function(con) {
        return '<button class="closing-choice-btn' + (selContra === con.id ? ' selected' : '') + '" data-con="' + con.id + '">' + con.label + '</button>';
      }).join('');
      var thOpts = THEORIES.map(function(th) {
        return '<button class="closing-choice-btn' + (selTheory === th.id ? ' selected' : '') + '" data-th="' + th.id + '">' + th.label + '</button>';
      }).join('');
      var ready = selEv && selContra && selTheory;
      overlay.innerHTML =
        '<div class="closing-mg-card">' +
          '<div class="closing-mg-title">⚖ CLOSING ARGUMENT</div>' +
          '<p class="closing-mg-intro">Build your final case. Choose wisely — the jury is watching.</p>' +
          '<div class="closing-section"><div class="closing-sec-lbl">1. Your strongest evidence:</div><div class="closing-choices">' + evOpts + '</div></div>' +
          '<div class="closing-section"><div class="closing-sec-lbl">2. Key contradiction to highlight:</div><div class="closing-choices">' + conOpts + '</div></div>' +
          '<div class="closing-section"><div class="closing-sec-lbl">3. Your theory of the case:</div><div class="closing-choices">' + thOpts + '</div></div>' +
          '<div class="closing-mg-footer">' +
            '<button class="big primary" id="closingDeliverBtn"' + (ready ? '' : ' disabled') + '>Deliver Closing →</button>' +
            '<button class="big" id="closingCancelBtn">← Back</button>' +
          '</div>' +
        '</div>';
      overlay.querySelectorAll('[data-ev]').forEach(function(b)  { b.onclick = function() { selEv     = b.dataset.ev;  render(); }; });
      overlay.querySelectorAll('[data-con]').forEach(function(b) { b.onclick = function() { selContra  = b.dataset.con; render(); }; });
      overlay.querySelectorAll('[data-th]').forEach(function(b)  { b.onclick = function() { selTheory  = b.dataset.th;  render(); }; });
      var deliverBtn = overlay.querySelector('#closingDeliverBtn');
      if (deliverBtn) deliverBtn.onclick = function() { overlay.remove(); deliverClosing(selEv, selContra, selTheory); };
      overlay.querySelector('#closingCancelBtn').onclick = function() { overlay.remove(); };
    }
    render();
    document.body.appendChild(overlay);
  }

  function deliverClosing(evId, contraId, theoryId) {
    var c = S.court;
    if (!c) return;
    c.ended = true;
    Snd.drama && Snd.drama(); Snd.gavel && Snd.gavel();
    Canvas.flashIt && Canvas.flashIt(); Canvas.shakeIt && Canvas.shakeIt();
    UI.bigCue && UI.bigCue('CLOSING ARGUMENT', 1200);

    var bonus = 0, quality = 'standard';
    // Reward picking evidence that matched a case weakness
    if (S.caseData.statements.some(function(s) { return s.weakness === evId; })) { bonus += 18; quality = 'strong'; }
    // Reward strong theory+contradiction pair
    var goodPair = GOOD_PAIRS[theoryId];
    if (goodPair && goodPair.includes(contraId)) { bonus += 12; quality = quality === 'strong' ? 'perfect' : 'strong'; }

    var credDiff  = c.player.cred - c.opp.cred;
    var closerB   = S.player && S.player.style === 'closer' ? 15 : (S.player && S.player.style === 'charmer' ? 8 : 0);
    var closerExtra = (c._closerBonus || 0);
    var stats     = S.player ? S.player.stats : { charm: 5, legalSkill: 5 };
    var score     = credDiff + c.jury * 1.5 + closerB + closerExtra + bonus +
                    (stats.charm + stats.legalSkill) * 1.2 +
                    (c.focus || 0) * 0.25 + (c.combo || 0) * 5 + (c.statementsResolved || 0) * 4;

    var qualMsgs  = { perfect: '💥 PERFECT ARGUMENT — the jury is yours.', strong: '✓ Strong closing — the evidence speaks clearly.', standard: 'Competent closing. The jury deliberates carefully.' };
    var outcome   = score > 35 ? 'won' : score > 0 ? 'won' : score > -30 ? 'hung' : 'lost';
    if (Game.courtLog) Game.courtLog(qualMsgs[quality] + ' Score: ' + Math.round(score) + '.', 'drama');
    setTimeout(function() { Game.endCase && Game.endCase(outcome); }, 1500);
  }

  /* ----------------------------------------------------------
   * 5. WITNESS PROFILE INTEL STRIP
   * ---------------------------------------------------------- */
  function updateWitnessStrip() {
    var c  = S.court;
    var cd = S.caseData;
    if (!c || !cd || c.mode === 'duel') { var s = document.getElementById('witnessIntelStrip'); if (s) s.remove(); return; }
    var conf = c.witnessConfidence;
    var mood = conf > 80 ? 'Composed' : conf > 55 ? 'Uneasy' : conf > 30 ? 'Nervous' : '⚠ Cracking';
    var approach = conf > 72 ? 'Cross-examine to drain confidence first'
                 : conf > 40 ? 'Pin Down or match evidence for big impact'
                 : 'Witness ready to break — expose or present now';
    var weakTxt  = '';
    var stmtIdx  = c.statementIdx || 0;
    var stmt     = cd.statements[stmtIdx];
    if ((c.revealedWeak || []).includes(stmtIdx) && stmt) {
      weakTxt = '<span class="wit-intel-weak">⚡ Weakness: <b>' + stmt.hint + '</b></span>';
    }
    var strip = document.getElementById('witnessIntelStrip');
    if (!strip) {
      strip = document.createElement('div');
      strip.id = 'witnessIntelStrip';
      strip.className = 'witness-intel-strip';
      var stmtBox = UI.$('statementBox');
      if (stmtBox) stmtBox.parentNode.insertBefore(strip, stmtBox.nextSibling);
    }
    strip.innerHTML =
      '<span class="wit-intel-item">Witness: <b>' + mood + '</b></span>' +
      '<span class="wit-intel-item">Conf: <b>' + Math.round(conf) + '%</b></span>' +
      '<span class="wit-intel-item wit-intel-tip">→ ' + approach + '</span>' +
      weakTxt;
  }

  /* ----------------------------------------------------------
   * 6. STYLE BONUSES ACROSS CASE PHASES
   * ---------------------------------------------------------- */
  var _origEnterCourtroom = Game.enterCourtroom && Game.enterCourtroom.bind(Game);
  if (_origEnterCourtroom) {
    Game.enterCourtroom = function() {
      _origEnterCourtroom();
      if (!S.court || !S.player) return;
      var style = S.player.style;
      if (style === 'strategist') {
        S.court.focus = Math.min(100, (S.court.focus || 0) + 15);
        if (S.caseData && S.court.revealedWeak && S.caseData.statements.length > 0 && !S.court.revealedWeak.includes(0)) S.court.revealedWeak.push(0);
        if (Game.courtLog) Game.courtLog('STRATEGIST: Your prep pays off — first weakness revealed, +15 Focus.', 'drama');
      } else if (style === 'shark') {
        S.court.player.cred = Math.min(145, (S.court.player.cred || 100) + 8);
        if (Game.courtLog) Game.courtLog('SHARK: Your reputation enters before you do. +8 Cred. The judge is watching.', 'drama');
      } else if (style === 'charmer') {
        S.court.jury  = Math.min(50,  (S.court.jury  || 0)   + 6);
        S.court.judge = Math.min(100, (S.court.judge || 100) + 5);
        if (Game.courtLog) Game.courtLog('CHARMER: Your presence immediately warms the room. Jury +6, Judge +5.', 'drama');
      } else if (style === 'closer') {
        S.court._closerBonus = 20;
        if (Game.courtLog) Game.courtLog('CLOSER: You\'ve planned every word of your closing. Closing argument will hit harder.', 'drama');
      }
    };
  }

  /* ----------------------------------------------------------
   * 7. ACTION GROUPING
   * ---------------------------------------------------------- */
  var TEXT_TO_ID = {
    'Cross-Examine': 'cross', 'Pressure': 'pressure', 'Pin Down': 'pin', 'Read the Room': 'read',
    'Expose Contradiction': 'expose', 'Dramatic Reveal': 'reveal', 'Consult Notes': 'consult',
    'Object': 'object', 'Grandstand': 'grandstand', 'Calm Clarification': 'calm', 'Second Chair Save': 'secondchair',
    'Recess': 'recess', 'Closing Argument': 'closing',
  };
  // Dynamic special button is labelled with style name, skip grouping those
  var ACT_GROUPS = [
    { label: '⚖ Questioning',   ids: ['cross', 'pressure', 'pin', 'read'] },
    { label: '📂 Evidence',      ids: ['expose', 'reveal', 'consult'] },
    { label: '🎭 Courtroom',     ids: ['object', 'grandstand', 'calm', 'secondchair'] },
    { label: '⚡ Recovery',      ids: ['recess'] },
    { label: '🏆 Finisher',      ids: ['closing'] },
  ];

  function applyGrouping(row) {
    if (!row) return;
    var btns = Array.from(row.querySelectorAll('button'));
    if (btns.length < 5) return;
    btns.forEach(function(b) {
      var raw = b.textContent.split('(')[0].trim();
      var id = TEXT_TO_ID[raw];
      if (id) b.dataset.gid = id;
    });
    var frag = document.createDocumentFragment();
    var placed = new Set();
    ACT_GROUPS.forEach(function(grp) {
      var grpBtns = btns.filter(function(b) { return grp.ids.includes(b.dataset.gid); });
      if (!grpBtns.length) return;
      var hdr = document.createElement('span');
      hdr.className = 'act-group-lbl';
      hdr.textContent = grp.label;
      frag.appendChild(hdr);
      grpBtns.forEach(function(b) { placed.add(b); frag.appendChild(b); });
    });
    btns.forEach(function(b) { if (!placed.has(b)) frag.appendChild(b); });
    row.innerHTML = '';
    row.appendChild(frag);
  }

  /* ----------------------------------------------------------
   * HOOKS: Wire everything into existing render cycle
   * ---------------------------------------------------------- */

  /* Patch renderCourt */
  var _origRC = Game.renderCourt && Game.renderCourt.bind(Game);
  if (_origRC) {
    Game.renderCourt = function() {
      _origRC.apply(this, arguments);
      // 1. Contextual descriptions on court hand
      if (S.caseData && S.court) applyCtxDescs(UI.$('evidenceRow'), S.court.hand, S.caseData);
      // 5. Witness intel strip
      updateWitnessStrip();
      // 7. Action grouping (campaign only to avoid breaking duel)
      if (S.court && S.court.mode === 'campaign') applyGrouping(UI.$('courtActions'));
    };
  }

  /* Patch renderPrepPool: inject dossier + contextual descriptions */
  var _origRPP = Game.renderPrepPool && Game.renderPrepPool.bind(Game);
  if (_origRPP) {
    Game.renderPrepPool = function() {
      _origRPP.apply(this, arguments);
      injectDossier();
      if (S.caseData && S.prep && S.prep.pool) {
        var pool = UI.$('prepPool');
        if (pool) {
          pool.querySelectorAll('.ev-card').forEach(function(el, i) {
            var id = S.prep.pool[i];
            var ev = id && EVIDENCE[id];
            if (!ev) return;
            var descEl = el.querySelector('.ev-desc');
            if (descEl) descEl.textContent = window._getCtxDesc(ev, S.caseData);
          });
        }
      }
    };
  }

  /* Patch renderInvestigation: rebind location clicks to show action picker */
  var _origRI = Game.renderInvestigation && Game.renderInvestigation.bind(Game);
  if (_origRI) {
    Game.renderInvestigation = function() {
      _origRI.apply(this, arguments);
      var grid = UI.$('locList');
      if (!grid || typeof LOCATIONS === 'undefined') return;
      var locCards = Array.from(grid.querySelectorAll('.loc-card:not(.used)'));
      locCards.forEach(function(card, i) {
        var loc = LOCATIONS[i];
        if (!loc || S.invest.visited[loc.id] || S.invest.left <= 0) return;
        card.onclick = function() {
          var ex = document.getElementById('investActionPicker');
          if (ex) ex.remove();
          showInvestPicker(loc);
        };
      });
    };
  }

  /* Intercept closing action to show minigame */
  var _origCourtAction = Game.courtAction && Game.courtAction.bind(Game);
  if (_origCourtAction) {
    Game.courtAction = function(id) {
      if (id === 'closing' && S.court && S.court.closingAvailable && !S.court.ended) {
        showClosingMinigame();
        return;
      }
      _origCourtAction.apply(this, arguments);
    };
  }

  console.log('[Game Improvements v4] Dossier, investigation choices, closing minigame, witness intel, style bonuses, action grouping loaded.');
})();

/* ============================================================
   NEW CASE PACK v2  — 12 additional cases
   ============================================================ */
(function newCasePack_v2() {
  if (typeof CASES === 'undefined') { console.warn('[newCasePack_v2] CASES not found'); return; }

  var newCases = [

    /* 1 — THE MISSING LEDGER */
    {
      title: 'The Missing Ledger',
      intro: "Your client, CFO Dana Reeves, is accused of destroying the company's financial records to conceal a $4M embezzlement. The prosecution's star witness: her own assistant.",
      category: 'financial',
      pattern: 'evidenceSuppression',
      diff: 2,
      reward: 1800,
      opponent: { name: 'Prosecutor Holt', personality: 'relentless', tieColor: '#555', hairColor: '#222' },
      witness: { name: 'Marcus Laine', role: 'Executive Assistant' },
      evidencePool: ['financial_ledger','internal_memo','email_thread','phone_record','access_badge_log','calendar_invite'],
      statements: [
        { text: 'I personally watched Ms. Reeves shred documents on the night of the audit.', weakness: 'access_badge_log', obj: 'speculation', hint: 'The badge log shows she was off-site that evening.', type: 'fact' },
        { text: 'She told me, and I quote, "make sure none of this ever surfaces."', weakness: 'email_thread', obj: 'hearsay', hint: 'That phrasing appears nowhere in any written record.', type: 'misleading' },
        { text: 'The ledger files were last accessed under her login at 11:47 PM.', weakness: 'access_badge_log', obj: null, hint: 'Someone else used her credentials.', type: 'technical' },
        { text: 'I have never been pressured to alter any record in my time here.', weakness: 'internal_memo', obj: null, hint: 'A memo proves he was explicitly asked to revise a Q3 summary.', type: 'partial_lie' },
        { text: 'I found a shredded document in her recycling bin with the ledger header.', weakness: 'financial_ledger', obj: 'relevance', hint: 'The ledger was digitally backed up — shredding one copy proves nothing.', type: 'trap' },
        { text: 'Ms. Reeves was the only person with authority to delete those files permanently.', weakness: 'access_badge_log', obj: 'speculation', hint: 'IT records show two other admins had identical delete permissions.', type: 'final_contradiction' }
      ]
    },

    /* 2 — STOLEN SKETCH */
    {
      title: 'Stolen Sketch',
      intro: 'Rising fashion designer Celeste Mura claims rival house Darevka stole her concept sketches for their headline collection. Darevka says they developed the designs independently.',
      category: 'intellectual_property',
      pattern: 'contradictionChain',
      diff: 2,
      reward: 1600,
      opponent: { name: 'Counsel Varga', personality: 'charming', tieColor: '#8b1a1a', hairColor: '#c8a060' },
      witness: { name: 'Pierre Adoux', role: 'Lead Designer, Darevka' },
      evidencePool: ['email_thread','timeline_contradiction','witness_statement','security_footage','redline_draft','calendar_invite'],
      statements: [
        { text: 'Our collection concept was finalized internally three months before Ms. Mura went public.', weakness: 'timeline_contradiction', obj: null, hint: 'Her sketchbook timestamps predate their internal deadline.', type: 'alibi' },
        { text: 'We have never had any contact with Ms. Mura or anyone in her studio.', weakness: 'email_thread', obj: 'hearsay', hint: 'An email chain references a private design summit where both parties attended.', type: 'partial_lie' },
        { text: 'The similarities are coincidental — silhouette trends cycle naturally in fashion.', weakness: 'redline_draft', obj: 'speculation', hint: "The redline draft contains a unique asymmetric pleat that appears verbatim in Darevka's show.", type: 'misleading' },
        { text: 'Our design process is entirely in-house and never relies on outside sources.', weakness: 'witness_statement', obj: null, hint: 'A freelance consultant who worked for Celeste also consulted for Darevka that season.', type: 'technical' },
        { text: 'Security footage shows no unauthorized access to our studio archive.', weakness: 'security_footage', obj: null, hint: 'The footage has a six-hour gap on the disputed night.', type: 'trap' },
        { text: 'I designed every stitch of that collection myself — I am the sole creative mind here.', weakness: 'redline_draft', obj: null, hint: "The redline shows a different designer's initials on the pivotal jacket sketch.", type: 'final_contradiction' }
      ]
    },

    /* 3 — FORGED AT THE SUMMIT */
    {
      title: 'Forged at the Summit',
      intro: 'A landmark merger contract bears the signature of CEO Eliot Marsh — but Marsh claims he was thousands of miles away at a conference when it was signed.',
      category: 'fraud',
      pattern: 'trapCase',
      diff: 3,
      reward: 2200,
      opponent: { name: 'Attorney Crane', personality: 'aggressive', tieColor: '#1a3a5c', hairColor: '#e8d0a0' },
      witness: { name: 'Sandra Quill', role: 'Notary Public' },
      evidencePool: ['signed_contract','phone_record','timeline_contradiction','calendar_invite','security_footage','witness_statement'],
      statements: [
        { text: 'I witnessed Mr. Marsh sign this contract in my office on the fourteenth.', weakness: 'timeline_contradiction', obj: null, hint: 'Flight records place Marsh in Geneva that morning.', type: 'alibi' },
        { text: 'He presented valid photo identification before I notarized the document.', weakness: 'security_footage', obj: null, hint: 'Office security footage shows a different build than Marsh.', type: 'fact' },
        { text: 'I have notarized hundreds of documents for this firm without incident.', weakness: 'witness_statement', obj: 'relevance', hint: 'A prior complaint about a notarized forgery was filed against her two years ago.', type: 'misleading' },
        { text: 'The signature is identical to samples I compared before notarizing.', weakness: 'signed_contract', obj: 'speculation', hint: 'A forensic handwriting expert finds three structural deviations.', type: 'technical' },
        { text: 'Mr. Marsh called me the following day to confirm receipt — I recognize his voice.', weakness: 'phone_record', obj: 'hearsay', hint: "Phone records show no call from Marsh's number that day.", type: 'trap' },
        { text: 'I am absolutely certain it was him. I looked him in the eye.', weakness: 'timeline_contradiction', obj: null, hint: 'He was on a panel in Geneva at that exact hour — live-streamed.', type: 'final_contradiction' }
      ]
    },

    /* 4 — GALA AFTER DARK */
    {
      title: 'Gala After Dark',
      intro: "Socialite Vera Ashton claims philanthropist Edmund Frey made blackmail threats at a charity gala. Frey's camp says it never happened and is suing for defamation.",
      category: 'defamation',
      pattern: 'emotionalAppeal',
      diff: 2,
      reward: 1700,
      opponent: { name: 'Mr. Solis', personality: 'smooth', tieColor: '#2d5a2d', hairColor: '#4a4a4a' },
      witness: { name: 'Diana Cross', role: 'Event Coordinator' },
      evidencePool: ['witness_statement','phone_record','security_footage','email_thread','calendar_invite','settlement_draft'],
      statements: [
        { text: 'I was stationed near the east wing all evening. Mr. Frey and Ms. Ashton never spoke alone.', weakness: 'security_footage', obj: null, hint: 'Footage shows both in the garden corridor — away from staff — for eleven minutes.', type: 'alibi' },
        { text: 'Ms. Ashton seemed perfectly at ease throughout the night. No distress at all.', weakness: 'witness_statement', obj: 'speculation', hint: 'Another guest recalls her visibly shaken just before midnight.', type: 'misleading' },
        { text: 'Mr. Frey is a trusted patron of this organization. He would never behave that way.', weakness: 'email_thread', obj: 'relevance', hint: 'An internal email shows the org received a prior complaint about Frey at a 2022 event.', type: 'emotional' },
        { text: 'I reviewed the guest log and no private room was reserved or accessed that night.', weakness: 'security_footage', obj: null, hint: "The garden corridor has no log — it's an open-air space not covered in the guest register.", type: 'technical' },
        { text: 'Ms. Ashton left the event early without saying goodbye to anyone — very odd behavior.', weakness: 'phone_record', obj: 'speculation', hint: 'Her phone shows a call to her attorney placed from the parking lot at 11:58 PM.', type: 'trap' },
        { text: 'There were always at least two staff members within earshot of both of them.', weakness: 'security_footage', obj: null, hint: 'The garden footage contradicts this — they were alone for over ten minutes.', type: 'final_contradiction' }
      ]
    },

    /* 5 — SABOTAGE AT NEXCORE */
    {
      title: 'Sabotage at Nexcore',
      intro: "A deliberate malware deployment crippled Nexcore's server farm hours before their IPO. Your client, IT director Kenji Hara, is charged with corporate sabotage.",
      category: 'cyber',
      pattern: 'proceduralBattle',
      diff: 3,
      reward: 2400,
      opponent: { name: 'DA Powell', personality: 'relentless', tieColor: '#2a2a6a', hairColor: '#d0c8b8' },
      witness: { name: 'Tasha Irwin', role: 'Cybersecurity Analyst' },
      evidencePool: ['access_badge_log','expert_report','internal_memo','email_thread','timeline_contradiction','phone_record'],
      statements: [
        { text: 'The malware was deployed using admin credentials assigned exclusively to Mr. Hara.', weakness: 'access_badge_log', obj: null, hint: 'Badge logs show Hara badged out two hours before deployment.', type: 'technical' },
        { text: 'The attack signature matches tools found on a USB drive from his desk.', weakness: 'expert_report', obj: 'speculation', hint: 'The expert report notes those tools are freely available online and were on multiple machines.', type: 'misleading' },
        { text: 'No other employee had the level of access required to execute this attack.', weakness: 'internal_memo', obj: null, hint: 'An internal memo from last quarter lists three other admins with equivalent permissions.', type: 'partial_lie' },
        { text: 'Hara had motive: he was passed over for promotion the week before.', weakness: 'email_thread', obj: 'relevance', hint: 'Email records show he actually accepted the decision professionally in writing.', type: 'emotional' },
        { text: 'The malware called back to an IP address registered to a VPN he subscribed to.', weakness: 'phone_record', obj: 'hearsay', hint: 'That VPN had 40,000 subscribers — and another Nexcore employee also used it.', type: 'trap' },
        { text: 'I traced the lateral movement through the network directly to his workstation.', weakness: 'timeline_contradiction', obj: null, hint: 'Network timestamps show the lateral movement began while he was verified off-campus.', type: 'final_contradiction' }
      ]
    },

    /* 6 — THE GHOST CLAIM */
    {
      title: 'The Ghost Claim',
      intro: 'Insurance adjuster Rex Doyle is accused of filing $900K in fraudulent claims for a fire that may have been deliberately set. Your client swears the fire was accidental.',
      category: 'insurance',
      pattern: 'standardTrial',
      diff: 2,
      reward: 1900,
      opponent: { name: 'Investigator Moss', personality: 'methodical', tieColor: '#3d3d3d', hairColor: '#888' },
      witness: { name: 'Len Hatch', role: 'Fire Investigator' },
      evidencePool: ['expert_report','financial_ledger','phone_record','timeline_contradiction','internal_memo','witness_statement'],
      statements: [
        { text: 'The origin point of the fire was inconsistent with an accidental electrical fault.', weakness: 'expert_report', obj: 'speculation', hint: 'A second independent report finds the wiring in that room was badly degraded.', type: 'technical' },
        { text: 'Mr. Doyle increased his policy coverage to maximum just forty days prior.', weakness: 'timeline_contradiction', obj: 'relevance', hint: 'His mortgage lender required him to raise coverage as a loan condition.', type: 'misleading' },
        { text: "Accelerant traces were found at two separate points — fire doesn't just travel that way.", weakness: 'witness_statement', obj: null, hint: 'A neighbor confirms cleaning solvents were stored in both locations.', type: 'fact' },
        { text: 'He stood to gain nearly a million dollars from this claim.', weakness: 'financial_ledger', obj: 'relevance', hint: 'The ledger shows the rebuild cost estimate actually exceeds the payout.', type: 'emotional' },
        { text: 'He was unreachable for three hours before the fire was reported — no alibi.', weakness: 'phone_record', obj: null, hint: 'Phone records show he was on a call with his daughter for 90 minutes of that window.', type: 'trap' },
        { text: 'In twenty years I have never seen an accidental fire with this pattern. Never.', weakness: 'expert_report', obj: 'speculation', hint: 'The defense expert presents three documented cases with nearly identical patterns ruled accidental.', type: 'final_contradiction' }
      ]
    },

    /* 7 — THE LAST SIGNATURE */
    {
      title: 'The Last Signature',
      intro: 'The Holloway family claims their ailing patriarch was manipulated into changing his will two days before his death. Your client, nurse Bea Stanton, is accused of undue influence.',
      category: 'estate',
      pattern: 'hostileWitness',
      diff: 3,
      reward: 2100,
      opponent: { name: 'Counsel Fairfax', personality: 'smooth', tieColor: '#5a1f5a', hairColor: '#f0e0c0' },
      witness: { name: 'Dr. Roland Venn', role: 'Attending Physician' },
      evidencePool: ['witness_statement','signed_contract','internal_memo','email_thread','phone_record','calendar_invite'],
      statements: [
        { text: 'Mr. Holloway had moderate cognitive impairment. He was not of full testamentary capacity.', weakness: 'signed_contract', obj: 'speculation', hint: 'The will itself includes a capacity assessment signed by two witnesses that same morning.', type: 'technical' },
        { text: 'Nurse Stanton was alone with him for extended periods, contrary to protocol.', weakness: 'internal_memo', obj: null, hint: "The care home's own duty roster shows her standard supervised rotations.", type: 'misleading' },
        { text: 'He never mentioned changing his will in any of our prior conversations.', weakness: 'email_thread', obj: 'hearsay', hint: 'An email from Holloway to his attorney three weeks prior explicitly mentions updating his estate plan.', type: 'partial_lie' },
        { text: 'The signature on the amended will shows tremor inconsistent with his normal hand.', weakness: 'witness_statement', obj: 'speculation', hint: 'A handwriting expert testifies that tremor variation is normal in late-stage illness and matches his other documents.', type: 'technical' },
        { text: "She was the sole beneficiary added in the amendment — that's a clear red flag.", weakness: 'signed_contract', obj: 'relevance', hint: 'The amendment also removed a prior beneficiary who had been estranged for a decade.', type: 'emotional' },
        { text: 'In my medical opinion, he could not have made that decision independently.', weakness: 'calendar_invite', obj: 'speculation', hint: 'His own attorney noted he was "sharp and deliberate" at their final meeting — the same afternoon.', type: 'final_contradiction' }
      ]
    },

    /* 8 — THE HATCHER COLLECTION */
    {
      title: 'The Hatcher Collection',
      intro: 'Three Impressionist paintings vanished from the Hatcher Gallery the night of its gala. Your client, gallery director Nora Feld, is accused of orchestrating the theft for insurance payout.',
      category: 'theft',
      pattern: 'surpriseWitness',
      diff: 3,
      reward: 2300,
      opponent: { name: 'Prosecutor Amado', personality: 'aggressive', tieColor: '#8b4a00', hairColor: '#1a1a1a' },
      witness: { name: 'Conrad Bast', role: 'Security Consultant' },
      evidencePool: ['security_footage','access_badge_log','financial_ledger','settlement_draft','expert_report','witness_statement'],
      statements: [
        { text: 'The alarm was disabled from inside using an override code only Ms. Feld possessed.', weakness: 'access_badge_log', obj: null, hint: 'Badge records show the alarm tech who serviced the system also knew the code.', type: 'technical' },
        { text: 'Security footage shows a deliberate blind spot left uncovered during the gala.', weakness: 'security_footage', obj: 'speculation', hint: 'The camera positioning was unchanged from the previous six events.', type: 'misleading' },
        { text: 'She had heavily insured the collection just weeks before — classic pre-theft behavior.', weakness: 'financial_ledger', obj: 'relevance', hint: "The gallery's insurers required updated coverage as a renewal condition.", type: 'emotional' },
        { text: 'A delivery van parked outside for forty minutes during the gala was never identified.', weakness: 'expert_report', obj: 'hearsay', hint: 'Neighboring business CCTV shows it belonged to a catering supplier with a documented booking.', type: 'trap' },
        { text: 'Ms. Feld was unusually calm when she reported the theft the next morning.', weakness: 'witness_statement', obj: 'speculation', hint: 'Her assistant confirms she broke down immediately after calling police and had to be sedated.', type: 'misleading' },
        { text: 'I have secured dozens of high-value collections. This theft required inside knowledge. Absolute certainty.', weakness: 'security_footage', obj: 'speculation', hint: 'The footage shows the thieves spent nine minutes fumbling with the wrong cabinet before finding the right one — not inside knowledge.', type: 'final_contradiction' }
      ]
    },

    /* 9 — THE CRESTFALL NDA */
    {
      title: 'The Crestfall NDA',
      intro: "Whistleblower Anya Sorel spoke to the press about safety violations at Crestfall Pharma. The company is suing for breach of her NDA. You're defending the right to speak.",
      category: 'whistleblower',
      pattern: 'mediaTrial',
      diff: 3,
      reward: 2000,
      opponent: { name: 'Partner Hollis', personality: 'methodical', tieColor: '#003366', hairColor: '#c8c0b0' },
      witness: { name: 'Gregg Ness', role: 'Head of Compliance, Crestfall' },
      evidencePool: ['nda_clause','internal_memo','expert_report','email_thread','whistle_file','settlement_draft'],
      statements: [
        { text: 'Ms. Sorel signed a comprehensive NDA covering all internal communications without exception.', weakness: 'nda_clause', obj: null, hint: 'The NDA contains a statutory carve-out for disclosures made to regulators or in the public interest.', type: 'fact' },
        { text: 'The safety concerns she raised had already been addressed internally before she went public.', weakness: 'internal_memo', obj: null, hint: 'Internal memos from that period show the issues were flagged but not acted upon for six months.', type: 'partial_lie' },
        { text: 'Her disclosures were motivated by a personal grievance, not genuine safety concerns.', weakness: 'whistle_file', obj: 'speculation', hint: 'The whistleblower file contains independent safety data predating any personnel dispute.', type: 'emotional' },
        { text: 'We have a spotless regulatory compliance record over the past five years.', weakness: 'expert_report', obj: 'relevance', hint: 'An FDA expert report from last year cites three unresolved corrective action plans at Crestfall.', type: 'misleading' },
        { text: 'Other employees reviewed the same data and concluded there was no safety risk.', weakness: 'email_thread', obj: 'hearsay', hint: 'One of those employees emailed HR privately expressing concern — their name is redacted but the email exists.', type: 'trap' },
        { text: 'No actual harm came from these alleged violations. This is theoretical at best.', weakness: 'whistle_file', obj: null, hint: 'The file includes two patient adverse event reports tied directly to the flagged process.', type: 'final_contradiction' }
      ]
    },

    /* 10 — THE PRECINCT PROBLEM */
    {
      title: 'The Precinct Problem',
      intro: 'Officer Davan Reid is accused of planting evidence in the arrest of Theo Canin. Your client, Canin, spent eight months in pre-trial detention. Reid denies everything.',
      category: 'misconduct',
      pattern: 'judgePressure',
      diff: 3,
      reward: 2500,
      opponent: { name: 'State Counsel Breck', personality: 'aggressive', tieColor: '#4a0000', hairColor: '#3a3a3a' },
      witness: { name: 'Sgt. Dana Reid', role: 'Arresting Officer' },
      evidencePool: ['security_footage','access_badge_log','phone_record','witness_statement','timeline_contradiction','expert_report'],
      statements: [
        { text: 'I found the firearm under the passenger seat during a routine stop. Standard procedure.', weakness: 'timeline_contradiction', obj: null, hint: 'Dispatch records show the stop was called in twelve minutes before Reid radioed finding the weapon — and the search should take thirty seconds.', type: 'alibi' },
        { text: 'Mr. Canin was acting suspiciously and matching the description of a suspect in the area.', weakness: 'phone_record', obj: 'speculation', hint: 'The suspect description broadcast was issued twenty minutes after the stop began.', type: 'misleading' },
        { text: 'My body camera malfunctioned. It happens — equipment fails.', weakness: 'expert_report', obj: null, hint: 'A forensic tech report shows the camera was manually powered off, not malfunctioned.', type: 'partial_lie' },
        { text: 'The weapon matched caliber to an open case — I was doing my job connecting the dots.', weakness: 'security_footage', obj: 'relevance', hint: 'Nearby ATM footage shows Canin at a gas station two miles away at the time of the original incident.', type: 'technical' },
        { text: 'No one at the scene disputed my account at the time.', weakness: 'witness_statement', obj: null, hint: 'A passenger in the next lane filed a complaint that evening describing the officer reaching into his own jacket before approaching the car.', type: 'trap' },
        { text: 'I have served this precinct with distinction for eleven years. My record speaks for itself.', weakness: 'access_badge_log', obj: 'relevance', hint: 'Precinct records include two prior misconduct complaints against Reid, both quietly settled.', type: 'final_contradiction' }
      ]
    },

    /* 11 — THE ALDGATE AFFAIR */
    {
      title: 'The Aldgate Affair',
      intro: 'Property developer Hugo Aldgate is accused of bribing a city councilman to rezone a waterfront lot. Your client, his business partner Pria Mehta, is charged as co-conspirator.',
      category: 'corruption',
      pattern: 'contradictionChain',
      diff: 4,
      reward: 3000,
      opponent: { name: 'Prosecutor Yuen', personality: 'relentless', tieColor: '#003333', hairColor: '#ccb888' },
      witness: { name: 'Cllr. Frank Dowe', role: 'City Councilman' },
      evidencePool: ['financial_ledger','email_thread','phone_record','calendar_invite','settlement_draft','board_minutes'],
      statements: [
        { text: 'Ms. Mehta personally delivered an envelope to my office containing twenty thousand dollars.', weakness: 'calendar_invite', obj: null, hint: 'Her calendar shows she was presenting at an out-of-city conference that day.', type: 'alibi' },
        { text: 'The payment was in exchange for my support on the rezoning application.', weakness: 'financial_ledger', obj: 'hearsay', hint: 'The financial ledger shows the payment Dowe received came from a PAC fund, not from Mehta or Aldgate.', type: 'misleading' },
        { text: 'I was pressured into supporting the rezoning against my better judgment.', weakness: 'board_minutes', obj: 'speculation', hint: 'Board minutes from that session show him championing the rezoning unprompted before any contact was made.', type: 'emotional' },
        { text: 'Aldgate and Mehta met with me privately to discuss what they called "mutual benefits."', weakness: 'phone_record', obj: null, hint: 'Phone records show no direct calls between Dowe and Mehta in the six months prior.', type: 'partial_lie' },
        { text: 'I documented the bribe and reported it internally. I was a victim of their scheme.', weakness: 'email_thread', obj: null, hint: 'His own emails from that period never mention the bribe — only enthusiasm for the development.', type: 'trap' },
        { text: 'I want full immunity in exchange for this testimony. I deserve protection for coming forward.', weakness: 'settlement_draft', obj: 'relevance', hint: 'The immunity deal reveals Dowe faces his own corruption charges — his testimony is self-serving.', type: 'final_contradiction' }
      ]
    },

    /* 12 — THE PARTNER PROBLEM */
    {
      title: 'The Partner Problem',
      intro: 'Senior partner Oliver Nash is pushed out of his own firm and sues for wrongful dissolution. His former partner, Grace Ellery, claims he breached fiduciary duty by secret dealings.',
      category: 'partnership',
      pattern: 'surpriseWitness',
      diff: 4,
      reward: 2800,
      opponent: { name: 'Ms. Cheng', personality: 'charming', tieColor: '#1a1a4a', hairColor: '#e8e0d0' },
      witness: { name: 'Oliver Nash', role: 'Plaintiff / Former Partner' },
      evidencePool: ['signed_contract','board_minutes','email_thread','financial_ledger','redline_draft','nda_clause'],
      statements: [
        { text: 'I never solicited clients away from the firm while still a partner. That would be a clear breach.', weakness: 'email_thread', obj: null, hint: "An email thread shows him cc'd on pitches sent from a new LLC registered in his wife's name.", type: 'partial_lie' },
        { text: 'The partnership agreement grants me guaranteed equity regardless of removal circumstances.', weakness: 'signed_contract', obj: null, hint: 'The agreement contains a misconduct forfeiture clause — and the redline shows Nash himself drafted it.', type: 'fact' },
        { text: 'Grace never raised any concerns about my conduct at any board meeting.', weakness: 'board_minutes', obj: null, hint: 'Minutes from the March session document her formal objection to his billing practices.', type: 'misleading' },
        { text: 'The financial discrepancies are accounting errors — not intentional misappropriation.', weakness: 'financial_ledger', obj: 'speculation', hint: 'The ledger shows the same line item redirected to his personal account across eleven consecutive months.', type: 'technical' },
        { text: 'My NDA prevents me from disclosing the real reason I was pushed out — it would destroy this firm.', weakness: 'nda_clause', obj: 'relevance', hint: 'The NDA was signed after the dissolution — it cannot retroactively cover the misconduct at issue.', type: 'trap' },
        { text: 'I built this firm from nothing. Everything that office is worth — that is my legacy.', weakness: 'redline_draft', obj: 'relevance', hint: "The founding documents show the firm's core client base came entirely from Ellery's prior relationships.", type: 'final_contradiction' }
      ]
    }

  ];

  /* Push new cases into the global CASES array, avoiding duplicates by title */
  var existingTitles = CASES.map(function(c){ return c.title; });
  newCases.forEach(function(nc){
    if (existingTitles.indexOf(nc.title) === -1) {
      CASES.push(nc);
    }
  });

  console.log('[newCasePack_v2] ' + newCases.length + ' cases added. Total cases: ' + CASES.length);
})();

/* ============================================================
   TRIAL VARIETY v1
   — Patterns, random events, dialogue pools, character states,
     visual stamps, foundation tracking, opponent AI, verdict FX
   ============================================================ */
(function trialVariety_v1() {
  if (typeof Game === 'undefined' || typeof S === 'undefined') {
    console.warn('[trialVariety_v1] Game or S not found'); return;
  }

  /* ── Trial Patterns ── */
  var TRIAL_PATTERNS = {
    standardTrial:        { name: 'Standard Trial',        hint: 'A balanced trial. No gimmicks.',                             opponentBias: 0,    judgeStrictness: 1,    eventRate: 0.12 },
    hostileWitness:       { name: 'Hostile Witness',        hint: 'Witness fights every cross-examination.',                   opponentBias: 0.1,  judgeStrictness: 1.1,  eventRate: 0.18 },
    evidenceSuppression:  { name: 'Evidence Suppression',   hint: 'Key evidence starts hidden. Investigate to reveal.',        opponentBias: 0.15, judgeStrictness: 1.2,  eventRate: 0.15 },
    surpriseWitness:      { name: 'Surprise Witness',       hint: 'A second witness may appear mid-trial.',                    opponentBias: 0.1,  judgeStrictness: 1,    eventRate: 0.25 },
    judgePressure:        { name: 'Judge Pressure',         hint: 'The judge is impatient. Every wasted move costs patience.', opponentBias: 0,    judgeStrictness: 1.5,  eventRate: 0.1  },
    mediaTrial:           { name: 'Media Trial',            hint: 'Jury sympathy swings wildly with dramatic moments.',        opponentBias: 0.05, judgeStrictness: 1,    eventRate: 0.22 },
    trapCase:             { name: 'Trap Case',              hint: 'Several statements are designed to lure wrong answers.',    opponentBias: 0.2,  judgeStrictness: 1.1,  eventRate: 0.1  },
    contradictionChain:   { name: 'Contradiction Chain',    hint: 'Statements must be dismantled in sequence.',                opponentBias: 0.1,  judgeStrictness: 1,    eventRate: 0.14 },
    proceduralBattle:     { name: 'Procedural Battle',      hint: 'Wrong objection types trigger immediate penalties.',        opponentBias: 0.15, judgeStrictness: 1.3,  eventRate: 0.1  },
    emotionalAppeal:      { name: 'Emotional Appeal',       hint: 'Emotional statements sway the jury more than facts.',       opponentBias: 0.05, judgeStrictness: 0.9,  eventRate: 0.2  }
  };

  /* Apply pattern modifiers when a case starts */
  var _origEnterCourtroom = Game.enterCourtroom && Game.enterCourtroom.bind(Game);
  if (_origEnterCourtroom) {
    Game.enterCourtroom = function() {
      _origEnterCourtroom.apply(this, arguments);
      var cd = S.caseData;
      if (!cd) return;
      var pat = TRIAL_PATTERNS[cd.pattern] || TRIAL_PATTERNS.standardTrial;
      S.court._pattern = pat;
      S.court._foundation = {};
      S.court._characterState = { player: 'neutral', opp: 'neutral', witness: 'neutral' };
      S.court._stmtTypeHistory = [];
      /* Show pattern badge in UI */
      var tactics = document.getElementById('tacticTip');
      if (tactics) {
        tactics.innerHTML = pat.hint +
          '<span class="pattern-badge">' + pat.name + '</span>';
      }
      /* Suppress certain evidence items in evidenceSuppression pattern */
      if (cd.pattern === 'evidenceSuppression' && S.court.evidence) {
        var hidden = Math.floor(S.court.evidence.length / 2);
        S.court._hiddenEvidence = S.court.evidence.splice(0, hidden);
      }
      _applyStmtTypeBadge();
    };
  }

  /* ── Statement type badge in statement box ── */
  function _applyStmtTypeBadge() {
    var sc = S.court;
    if (!sc || !sc.statements) return;
    var stmts = sc.statements;
    var idx = sc.stmtIndex || 0;
    if (idx >= stmts.length) return;
    var type = stmts[idx].type || 'fact';
    var whoEl = document.getElementById('whoTalking');
    if (whoEl) {
      var existing = whoEl.querySelector('.stmt-type-badge');
      if (existing) existing.remove();
      var badge = document.createElement('span');
      badge.className = 'stmt-type-badge stmt-type-' + type;
      badge.textContent = type.replace('_', ' ');
      whoEl.appendChild(badge);
    }
  }

  /* ── Random Court Events ── */
  var COURT_EVENTS = [
    {
      id: 'judgeWarning',
      label: '⚖ JUDGE WARNING',
      msg: 'The judge interrupts: "Counsel, I am losing patience with this line of questioning."',
      apply: function(sc){ sc.judgePatience = Math.max(0, (sc.judgePatience||100) - 12); }
    },
    {
      id: 'witnessHesitation',
      label: '😰 WITNESS HESITATION',
      msg: 'The witness hesitates, glancing nervously at the gallery before answering.',
      apply: function(sc){ sc.witnessConf = Math.max(0, (sc.witnessConf||100) - 8); }
    },
    {
      id: 'newEvidenceEmerges',
      label: '📂 NEW EVIDENCE',
      msg: 'A courier arrives with a sealed envelope. New evidence has entered the record.',
      apply: function(sc){
        if (sc._hiddenEvidence && sc._hiddenEvidence.length) {
          var revealed = sc._hiddenEvidence.splice(0, 1)[0];
          if (sc.evidence) sc.evidence.push(revealed);
          _showToast('📂 NEW EVIDENCE: ' + revealed.replace(/_/g,' ').toUpperCase());
        }
      }
    },
    {
      id: 'juryReaction',
      label: '🗣 JURY STIRS',
      msg: 'The jury murmurs audibly. The foreman makes a note.',
      apply: function(sc){ sc.jury = Math.min(100, Math.max(-100, (sc.jury||0) + (Math.random() > 0.5 ? 8 : -6))); }
    },
    {
      id: 'witnessChangesStatement',
      label: '⚡ STATEMENT CHANGE',
      msg: 'The witness abruptly revises their prior answer, catching everyone off guard.',
      apply: function(sc){
        var idx = sc.stmtIndex || 0;
        if (sc.statements && sc.statements[idx]) {
          sc.statements[idx].hint = '(Revised) The witness just contradicted themselves — attack directly.';
        }
      }
    },
    {
      id: 'mediaLeak',
      label: '📰 MEDIA LEAK',
      msg: 'Breaking: the media has obtained leaked documents relating to this case. Jury sympathy surges.',
      apply: function(sc){ sc.jury = Math.min(100, (sc.jury||0) + 15); _flashScreen('gold'); }
    },
    {
      id: 'recess',
      label: '☕ SUDDEN RECESS',
      msg: 'The judge calls a five-minute recess. Both sides reset slightly.',
      apply: function(sc){
        sc.playerCred = Math.min(100, (sc.playerCred||100) + 5);
        sc.judgePatience = Math.min(100, (sc.judgePatience||100) + 10);
      }
    },
    {
      id: 'expertArrives',
      label: '🔬 EXPERT ARRIVES',
      msg: 'An unexpected expert witness requests to take the stand. The judge allows a brief statement.',
      apply: function(sc){ sc.witnessConf = Math.min(100, (sc.witnessConf||100) - 15); }
    }
  ];

  function _maybeFireEvent() {
    var sc = S.court;
    if (!sc || !sc._pattern) return;
    var rate = sc._pattern.eventRate || 0.12;
    if (Math.random() > rate) return;
    var ev = COURT_EVENTS[Math.floor(Math.random() * COURT_EVENTS.length)];
    _showToast(ev.label + ' — ' + ev.msg);
    ev.apply(sc);
    _logLine('📋 ' + ev.msg);
  }

  /* ── Dialogue pools per case category ── */
  var DIALOGUE_POOLS = {
    financial:    ['Follow the money, counsel.', "Numbers don't lie. Witnesses do.", 'The ledger never forgets.'],
    cyber:        ['The digital trail is immutable.', 'Logs timestamp every action.', "You can't undelete intent."],
    theft:        ['Possession is not proof. Presence is.', 'What motive explains the timeline?', 'Opportunity without proof is suspicion.'],
    fraud:        ['Every forgery leaves a seam.', 'The truth is always in the details.', 'Signatures carry the weight of identity.'],
    defamation:   ['Words have consequences, Counsel.', 'Context is everything in a claim.', 'Reputation, once damaged, is hard to restore.'],
    estate:       ['The dead cannot speak for themselves.', 'Intent is written between the lines.', 'A signature at the end of life deserves scrutiny.'],
    misconduct:   ['Power without accountability corrupts procedure.', 'The badge is not a shield from the law.', 'Procedure exists to protect the innocent.'],
    corruption:   ['Public trust is not a bargaining chip.', 'Every deal leaves a paper trail.', 'Where money flows, motive follows.'],
    whistleblower:['Silence can be its own form of harm.', 'The law distinguishes duty from betrayal.', 'Truth told at great cost deserves protection.'],
    intellectual_property: ['Ideas have authors.', 'Creation leaves a traceable history.', 'Inspiration and imitation are not the same thing.'],
    insurance:    ['Coincidence is not causation.', 'The timing tells the real story.', 'Claims require more than paperwork.'],
    partnership:  ['Trust is the foundation of every partnership.', 'Breach of fiduciary duty leaves traces everywhere.', 'Loyalty cuts both ways.']
  };

  function _getDialogueLine(category) {
    var pool = DIALOGUE_POOLS[category] || DIALOGUE_POOLS.financial;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ── Inject dialogue line into log after each statement ── */
  function _logLine(txt) {
    var log = document.getElementById('courtLog');
    if (!log) return;
    var p = document.createElement('p');
    p.textContent = txt;
    log.prepend(p);
  }

  /* ── Toast notification ── */
  function _showToast(msg) {
    var el = document.createElement('div');
    el.className = 'court-event-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 3400);
  }

  /* ── Screen flash ── */
  function _flashScreen(color) {
    var el = document.createElement('div');
    el.className = 'court-cutscene-flash ' + (color || 'white');
    document.body.appendChild(el);
    setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 600);
  }

  /* ── Dramatic stamp (OBJECTION! etc.) ── */
  function _showStamp(word, cls) {
    var el = document.createElement('div');
    el.className = 'court-stamp-text ' + (cls || '');
    el.textContent = word;
    document.body.appendChild(el);
    setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 2000);
  }

  /* ── Spotlight effect ── */
  function _showSpotlight(xPct, yPct) {
    var el = document.createElement('div');
    el.className = 'court-spotlight';
    el.style.setProperty('--sx', xPct + '%');
    el.style.setProperty('--sy', yPct + '%');
    document.body.appendChild(el);
    setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 2700);
  }

  /* ── Character state updater ── */
  function _setCharState(who, state) {
    var sc = S.court;
    if (!sc || !sc._characterState) return;
    sc._characterState[who] = state;
    var wrap = document.getElementById('courtCanvasWrap');
    if (!wrap) return;
    if (who === 'player')  wrap.dataset.pstate = state;
    if (who === 'opp')     wrap.dataset.ostate = state;
    if (who === 'witness') wrap.dataset.wstate = state;
  }

  /* ── Verdict confetti ── */
  function _fireVerdictFanfare(won) {
    var container = document.createElement('div');
    container.className = 'verdict-fanfare';
    var colors = won
      ? ['#f4d058','#d4a82c','#4a7fd4','#5aaa4a','#fff']
      : ['#d44a3a','#555','#888','#333'];
    for (var i = 0; i < 60; i++) {
      var p = document.createElement('div');
      p.className = 'verdict-fanfare-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.setProperty('--dur',  (0.8 + Math.random() * 1.4) + 's');
      p.style.setProperty('--delay',(Math.random() * 0.6) + 's');
      container.appendChild(p);
    }
    document.body.appendChild(container);
    setTimeout(function(){ if (container.parentNode) container.parentNode.removeChild(container); }, 3000);
  }

  /* ── Hook into afterPlayerTurn for events + state updates ── */
  var _origAfterTurn = Game.afterPlayerTurn && Game.afterPlayerTurn.bind(Game);
  if (_origAfterTurn) {
    Game.afterPlayerTurn = function(result) {
      _origAfterTurn.apply(this, arguments);
      var sc = S.court;
      if (!sc) return;

      /* Fire random event */
      _maybeFireEvent();

      /* Update statement type badge for next statement */
      _applyStmtTypeBadge();

      /* Inject category-flavored dialogue line */
      var cat = (S.caseData && S.caseData.category) || 'financial';
      if (Math.random() < 0.35) {
        _logLine('"' + _getDialogueLine(cat) + '"');
      }

      /* Character state driven by score */
      var playerCred = sc.playerCred || 100;
      var oppCred    = sc.oppCred    || 100;
      var witConf    = sc.witnessConf || 100;

      if      (playerCred < 30)  _setCharState('player', 'panicking');
      else if (playerCred < 55)  _setCharState('player', 'rattled');
      else if (playerCred > 85 && oppCred < 40) _setCharState('player', 'triumphant');
      else                       _setCharState('player', 'neutral');

      if      (oppCred < 30)    _setCharState('opp', 'panicking');
      else if (oppCred > 80)    _setCharState('opp', 'smug');
      else                      _setCharState('opp', 'neutral');

      if      (witConf < 25)    _setCharState('witness', 'broken');
      else if (witConf < 50)    _setCharState('witness', 'rattled');
      else                      _setCharState('witness', 'neutral');

      /* Witness breakdown scene */
      if (witConf < 25 && sc._witnessBreakdownFired !== true) {
        sc._witnessBreakdownFired = true;
        var wrap = document.getElementById('courtCanvasWrap');
        if (wrap) wrap.classList.add('court-witness-breakdown');
        setTimeout(function(){
          if (wrap) wrap.classList.remove('court-witness-breakdown');
        }, 950);
        _flashScreen('white');
        _showToast('💥 WITNESS BREAKDOWN — confidence shattered!');
      }

      /* Spotlight on Dramatic Reveal */
      if (result && result.action === 'dramatic_reveal') {
        _showSpotlight(30, 55);
      }
    };
  }

  /* ── Hook presentEvidence for objection stamp + foundation tracking ── */
  var _origPresent = Game.presentEvidence && Game.presentEvidence.bind(Game);
  if (_origPresent) {
    Game.presentEvidence = function(eid) {
      var sc = S.court;
      /* Foundation tracking: some evidence requires prior cross-examination */
      if (sc && sc._pattern && sc._pattern.name === 'Procedural Battle') {
        var stmtIdx = sc.stmtIndex || 0;
        var stmt = sc.statements && sc.statements[stmtIdx];
        if (stmt && stmt.type === 'technical' && !(sc._foundation && sc._foundation[stmtIdx])) {
          _showToast('⚠ FOUNDATION REQUIRED — Cross-examine first to lay the groundwork.');
          _flashScreen('red');
          sc.judgePatience = Math.max(0, (sc.judgePatience || 100) - 8);
          return;
        }
      }
      _origPresent.apply(this, arguments);
      /* Check if it was a hit */
      if (sc && sc.statements) {
        var idx = sc.stmtIndex || 0;
        var s = sc.statements[idx];
        if (s && s.weakness === eid) {
          _flashScreen('gold');
          _showStamp('CONTRADICTED!', 'contradiction');
          _showSpotlight(50, 40);
        }
      }
    };
  }

  /* ── Hook objection for stamp ── */
  var _origObj = Game.doObjection && Game.doObjection.bind(Game);
  if (_origObj) {
    Game.doObjection = function(type) {
      _origObj.apply(this, arguments);
      var sc = S.court;
      if (!sc) return;
      var stmtIdx = sc.stmtIndex || 0;
      var stmt = sc.statements && sc.statements[stmtIdx];
      var correct = stmt && stmt.obj && stmt.obj === type;
      if (correct) {
        _showStamp('OBJECTION!', 'objection');
        _flashScreen('white');
      } else if (sc._pattern && sc._pattern.name === 'Procedural Battle') {
        /* Wrong objection type in procedural battle — double penalty */
        sc.judgePatience = Math.max(0, (sc.judgePatience || 100) - 15);
        sc.playerCred    = Math.max(0, (sc.playerCred    || 100) - 8);
        _flashScreen('red');
        _showToast('⚖ OVERRULED — Wrong objection type. Judge loses patience.');
      }
    };
  }

  /* ── Hook cross-examine to set foundation flag ── */
  var _origCourt = Game.courtAction && Game.courtAction.bind(Game);
  if (_origCourt) {
    Game.courtAction = function(id) {
      if (id === 'cross' && S.court) {
        var idx = S.court.stmtIndex || 0;
        if (!S.court._foundation) S.court._foundation = {};
        S.court._foundation[idx] = true;
      }
      if (id === 'hold_it') {
        _showStamp('HOLD IT!', 'hold-it');
      }
      _origCourt.apply(this, arguments);
    };
  }

  /* ── Enhanced opponent AI: pattern-aware ── */
  var _origOppTurn = Game.opponentTurn && Game.opponentTurn.bind(Game);
  if (_origOppTurn) {
    Game.opponentTurn = function() {
      var sc = S.court;
      if (sc && sc._pattern) {
        var bias = sc._pattern.opponentBias || 0;
        /* Slightly skew opponent effectiveness based on pattern */
        if (Math.random() < bias) {
          /* Opponent gets a bonus action this turn */
          sc.oppCred = Math.min(100, (sc.oppCred || 100) + 5);
          sc.playerCred = Math.max(0, (sc.playerCred || 100) - 6);
          _logLine('⚡ ' + ((S.caseData && S.caseData.opponent && S.caseData.opponent.name) || 'Opponent') + ' seizes the moment aggressively.');
        }
      }
      _origOppTurn.apply(this, arguments);
    };
  }

  /* ── Hook showVerdict for fanfare ── */
  var _origVerdict = Game.showVerdict && Game.showVerdict.bind(Game);
  if (_origVerdict) {
    Game.showVerdict = function(won) {
      _fireVerdictFanfare(won);
      if (won) {
        _showStamp('NOT GUILTY!', 'contradiction');
        _flashScreen('gold');
      } else {
        _flashScreen('red');
      }
      setTimeout(function(){
        _origVerdict.apply(Game, arguments);
      }, 400);
    };
  }

  /* ── hostileWitness: cross-exam costs extra confidence ── */
  var _origRenderCourt = Game.renderCourt && Game.renderCourt.bind(Game);
  if (_origRenderCourt) {
    Game.renderCourt = function() {
      _origRenderCourt.apply(this, arguments);
      _applyStmtTypeBadge();
    };
  }

  console.log('[trialVariety_v1] Patterns, events, dialogue, character states, stamps, spotlights, verdict fanfare loaded.');
})();

/* ============================================================
   COURT VARIETY v2
   — Richer, non-repetitive court log messages
   — Varied witness reactions per testimony type
   — Judge interjections and crowd murmurs
   — Better wrong-answer consequences with context
   ============================================================ */
(function courtVariety_v2() {
  if (typeof Game === 'undefined' || typeof S === 'undefined') return;

  /* Pools of varied log lines keyed by context */
  var LOG_POOLS = {
    objectionCorrect: [
      'The judge nods sharply. "Sustained. Counsel, that objection is well-placed."',
      'The prosecution flinches. Your timing was perfect.',
      '"Sustained." The word lands like a gavel strike.',
      'The witness pauses, recalibrating. The momentum just shifted.',
      'Murmurs from the gallery. You\'ve exposed a crack in their case.',
    ],
    objectionWrong: [
      '"Overruled." The judge doesn\'t even look up.',
      'The prosecution suppresses a smile. You\'ll feel that later.',
      '"Counsel — that objection has no basis here. Overruled."',
      'The jury foreman frowns at their notepad. That one cost you.',
      'Wrong call. The judge\'s patience ticks down another notch.',
    ],
    evidenceHit: [
      'The gallery stirs. The prosecution\'s narrative just fractured.',
      'The witness stares at the exhibit. There is no good answer.',
      'Perfect match. The evidence does the talking — and it\'s devastating.',
      '"I... that\'s..." The witness trails off. Exactly where you want them.',
      'That piece of evidence just closed a door the prosecution needed open.',
    ],
    evidenceMiss: [
      'The witness recovers quickly. Wrong angle.',
      'The prosecution objects — and for once, they\'re right.',
      '"Objection — relevance." The judge agrees. Refocus.',
      'The jury\'s attention drifts. That one didn\'t land.',
      'Not the right evidence for this moment. The witness is unfazed.',
    ],
    crossExamine: [
      'The witness shifts in their seat. You can see them choosing words more carefully now.',
      'Every question tightens the net around their story.',
      '"Could you repeat your earlier statement about..." — the witness hesitates.',
      'Confidence draining. The witness is on the back foot.',
      'Each answer opens another question. You\'re building toward the break.',
    ],
    pressWitness: [
      'Tension spikes in the room. The witness grips the stand.',
      'The judge watches. The jury watches harder.',
      '"Answer the question." Your voice leaves no room.',
      'The prosecution is on their feet — but you got the reaction you needed.',
      'Sweat. Pause. A glance at opposing counsel. The pressure is working.',
    ],
    judgeAngry: [
      '"Counsel. I will not warn you again. Proceed — carefully."',
      'The gavel comes down hard. The room goes still.',
      '"One more outburst and I will hold you in contempt."',
      'The judge leans forward. That expression does not bode well.',
      'Dead silence. The judge is staring directly at you.',
    ],
    jurySwayed: [
      'The foreman shifts. The jury has heard something they can\'t unhear.',
      'A juror in the back row makes a note. That note matters.',
      'Sympathy is moving — you can feel it.',
      'The jury\'s body language has changed. They\'re leaning toward you now.',
      'The foreman\'s expression tells you everything. This testimony is working.',
    ],
    strongMove: [
      'The courtroom holds its breath.',
      'Opposing counsel\'s pen stops moving.',
      'This is what the whole case has been building to.',
      'You can hear the jury processing what just happened.',
      'The judge sets down their pen. Even they\'re paying attention now.',
    ],
    stmtTypeEmotional: [
      'The witness is playing to the gallery. Don\'t let sentiment override the facts.',
      'Emotional testimony. Powerful — but check if it aligns with the documented record.',
      'The jury is moved. Your job is to ground them in evidence, not feeling.',
    ],
    stmtTypeTrap: [
      'Something about this statement feels engineered. Read it carefully before responding.',
      'The prosecution wants you to bite on this one. Don\'t.',
      'Trap testimony. The obvious response is wrong. Think.',
    ],
    stmtTypeTechnical: [
      'Technical testimony. Precision matters here — match evidence that directly contradicts the specific claim.',
      'This is where preparation pays off. The weakness is in the data, not the narrative.',
      'Numbers and procedures. Challenge the methodology, not the conclusion.',
    ],
    stmtTypeAlibi: [
      'An alibi claim. The contradiction is in the timeline — find the gap.',
      'They\'re building a location defence. Documentation beats assertion here.',
      'Alibi testimony. It holds or it doesn\'t — find the evidence that proves which.',
    ],
  };

  var _usedLines = {};
  function pickLine(key) {
    var pool = LOG_POOLS[key];
    if (!pool) return null;
    if (!_usedLines[key]) _usedLines[key] = [];
    var used = _usedLines[key];
    var avail = pool.filter(function(_, i) { return !used.includes(i); });
    if (!avail.length) { _usedLines[key] = []; avail = pool.slice(); }
    var idx = pool.indexOf(avail[Math.floor(Math.random() * avail.length)]);
    used.push(idx);
    return pool[idx];
  }

  /* Statement-type tip shown at start of each new statement */
  var _lastStmtIdx = -1;
  function _injectStmtTip() {
    var sc = S.court;
    if (!sc || !sc.statements || !S.caseData) return;
    var idx = sc.stmtIndex || sc.statementIdx || 0;
    if (idx === _lastStmtIdx) return;
    _lastStmtIdx = idx;
    var stmt = sc.statements[idx];
    if (!stmt) return;
    var typeKey = 'stmtType' + (stmt.type || 'fact').replace(/_./g, function(m) { return m[1].toUpperCase(); });
    typeKey = typeKey.charAt(0).toUpperCase() + typeKey.slice(1);
    typeKey = 'stmtType' + (stmt.type || 'fact').split('_').map(function(w, i) { return i ? w[0].toUpperCase() + w.slice(1) : w; }).join('');
    var line = pickLine(typeKey);
    if (line && Game.courtLog) {
      setTimeout(function() {
        try { Game.courtLog('💡 ' + line, 'hint'); } catch(e) {}
      }, 180);
    }
  }

  /* Hook renderCourt to inject statement tips */
  var _origRC2 = Game.renderCourt && Game.renderCourt.bind(Game);
  if (_origRC2) {
    Game.renderCourt = function() {
      _origRC2.apply(this, arguments);
      _injectStmtTip();
    };
  }

  /* Richer wrong-answer log (hook afterPlayerTurn for bad results) */
  var _origAPT2 = Game.afterPlayerTurn && Game.afterPlayerTurn.bind(Game);
  if (_origAPT2) {
    Game.afterPlayerTurn = function(result) {
      _origAPT2.apply(this, arguments);
      if (!result) return;
      var sc = S.court;
      if (!sc) return;

      /* Correct evidence hit */
      if (result.evidenceHit) {
        var line = pickLine('evidenceHit');
        if (line) setTimeout(function() { try { Game.courtLog('⚡ ' + line, 'drama'); } catch(e) {} }, 250);
        /* Judge approval on a clean hit */
        if (sc.judgePatience > 70 && Math.random() < 0.4) {
          var jline = pickLine('jurySwayed');
          if (jline) setTimeout(function() { try { Game.courtLog(jline, 'judge'); } catch(e) {} }, 650);
        }
      }
      /* Wrong evidence */
      else if (result.evidenceMiss) {
        var mline = pickLine('evidenceMiss');
        if (mline) setTimeout(function() { try { Game.courtLog(mline, 'bad'); } catch(e) {} }, 250);
      }
      /* Correct objection */
      if (result.objectionCorrect) {
        var ocline = pickLine('objectionCorrect');
        if (ocline) setTimeout(function() { try { Game.courtLog('✅ ' + ocline, 'good'); } catch(e) {} }, 300);
      }
      /* Wrong objection */
      else if (result.objectionWrong) {
        var owline = pickLine('objectionWrong');
        if (owline) setTimeout(function() { try { Game.courtLog('❌ ' + owline, 'bad'); } catch(e) {} }, 300);
        /* Bigger patience penalty in procedural battle pattern */
        if (sc._pattern && sc._pattern.name === 'Procedural Battle') {
          sc.judgePatience = Math.max(0, (sc.judgePatience || 100) - 8);
        }
      }
      /* Cross-examine action */
      if (result.action === 'cross') {
        var cline = pickLine('crossExamine');
        if (cline) setTimeout(function() { try { Game.courtLog(cline, 'info'); } catch(e) {} }, 400);
      }
      /* Pressure action */
      if (result.action === 'pressure') {
        var pline = pickLine('pressWitness');
        if (pline) setTimeout(function() { try { Game.courtLog(pline, 'drama'); } catch(e) {} }, 350);
      }
      /* Judge anger when patience drops low */
      if ((sc.judgePatience || 100) < 30 && Math.random() < 0.45) {
        var jangry = pickLine('judgeAngry');
        if (jangry) setTimeout(function() { try { Game.courtLog('⚖ ' + jangry, 'judge'); } catch(e) {} }, 700);
      }
      /* Strong move indicator (focus spend, dramatic reveal, etc.) */
      if (['reveal', 'expose', 'secondchair'].includes(result.action)) {
        var sline = pickLine('strongMove');
        if (sline) setTimeout(function() { try { Game.courtLog('🎯 ' + sline, 'drama'); } catch(e) {} }, 500);
      }
    };
  }

  console.log('[courtVariety_v2] Richer log messages, statement tips, and judge reactions loaded.');
})();
