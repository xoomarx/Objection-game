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

/* ============================================================
   COURT EXPERIENCE DIRECTOR v3
   - Normalizes sceneTheme/trialPattern data across all cases
   - Adds visible case-specific courtroom scenery
   - Adds controlled trial events, evidence timing, and live reactions
   - Reorganizes court UI without removing existing systems
   ============================================================ */
(function courtExperienceDirector_v3() {
  if (typeof Game === 'undefined' || typeof S === 'undefined' || typeof Canvas === 'undefined') return;

  var SCENE_THEMES = {
    classicCourtroom: {
      name: 'Classic Courtroom',
      tone: 'formal wood-paneled court',
      wallTop: '#2b1b38', wallMid: '#5a3418', floor: '#21150d', carpet: '#571a2a',
      accent: '#d4a82c', light: '#f4d058', bench: '#6b3e1f', desk: '#553018',
      audience: 'jury', props: 'law books and flags'
    },
    smallCityCourt: {
      name: 'Small City Court',
      tone: 'tight local courtroom',
      wallTop: '#22334a', wallMid: '#775b34', floor: '#2c2418', carpet: '#345d67',
      accent: '#e0b85a', light: '#ffe08a', bench: '#6a4724', desk: '#49351e',
      audience: 'small jury', props: 'fluorescent lights and filing boxes'
    },
    corporateTribunal: {
      name: 'Corporate Tribunal',
      tone: 'glass and steel hearing room',
      wallTop: '#162838', wallMid: '#263f4b', floor: '#111820', carpet: '#1f4250',
      accent: '#87d9ff', light: '#d8fbff', bench: '#23313a', desk: '#1d2a32',
      audience: 'executives', props: 'screens, charts, glass panels'
    },
    mediaCourtroom: {
      name: 'Media Courtroom',
      tone: 'press-heavy public trial',
      wallTop: '#251a2d', wallMid: '#3c3044', floor: '#171019', carpet: '#4d2441',
      accent: '#ffffff', light: '#ffec9a', bench: '#51311f', desk: '#3a2630',
      audience: 'press', props: 'cameras, microphones, flash bulbs'
    },
    emergencyNightHearing: {
      name: 'Emergency Night Hearing',
      tone: 'after-hours emergency session',
      wallTop: '#07172e', wallMid: '#152948', floor: '#080a12', carpet: '#19365b',
      accent: '#73a6ff', light: '#c6dcff', bench: '#2a2c3c', desk: '#181c2c',
      audience: 'thin gallery', props: 'moonlit windows and desk lamps'
    },
    fashionTribunal: {
      name: 'Fashion Tribunal',
      tone: 'style-industry arbitration hall',
      wallTop: '#35153d', wallMid: '#5a2b56', floor: '#1c1020', carpet: '#9b326e',
      accent: '#ff7bd6', light: '#ffe4fb', bench: '#59304d', desk: '#3b1f35',
      audience: 'design press', props: 'mannequins, sketch boards, runway lights'
    },
    grandAppealsCourt: {
      name: 'Grand Appeals Court',
      tone: 'marble appellate chamber',
      wallTop: '#2d3142', wallMid: '#6c6876', floor: '#1d1b22', carpet: '#4b1535',
      accent: '#e6d39a', light: '#fff0bc', bench: '#4a3326', desk: '#33261e',
      audience: 'clerks', props: 'columns, seals, high bench'
    },
    privateArbitrationRoom: {
      name: 'Private Arbitration',
      tone: 'closed-door conference hearing',
      wallTop: '#1f2c2f', wallMid: '#52645f', floor: '#182320', carpet: '#33453d',
      accent: '#a7d6b8', light: '#e2ffe8', bench: '#35463e', desk: '#263a32',
      audience: 'observers', props: 'conference table, plants, water glasses'
    },
    corruptionFinalCourt: {
      name: 'Final Corruption Court',
      tone: 'high-security corruption trial',
      wallTop: '#170713', wallMid: '#47151d', floor: '#10060a', carpet: '#741622',
      accent: '#ff5656', light: '#ffd3a0', bench: '#402018', desk: '#2c1212',
      audience: 'security and media', props: 'storm windows, file crates, guards'
    }
  };

  var PATTERN_RULES = {
    standardTrial: {
      name: 'Standard Trial',
      hint: 'Balanced record. Evidence, pressure, and closing all matter.',
      winPath: 'Evidence or closing',
      eventRate: 0.11,
      eventGap: 4
    },
    hostileWitness: {
      name: 'Hostile Witness',
      hint: 'The witness resists pressure. Build foundation before big attacks.',
      winPath: 'Pressure or foundation',
      eventRate: 0.16,
      eventGap: 3,
      witnessBoost: 18
    },
    evidenceSuppression: {
      name: 'Evidence Suppression',
      hint: 'Key proof may be challenged. Lay foundation and watch for late documents.',
      winPath: 'Evidence timing',
      eventRate: 0.14,
      eventGap: 4,
      requireFoundation: true
    },
    trapCase: {
      name: 'Trap Case',
      hint: 'Some obvious moves are bait. Reveal the weakness before striking.',
      winPath: 'Trap avoidance',
      eventRate: 0.13,
      eventGap: 4,
      trapSensitive: true
    },
    contradictionChain: {
      name: 'Contradiction Chain',
      hint: 'Break statements in sequence to make the final contradiction land.',
      winPath: 'Chain contradictions',
      eventRate: 0.12,
      eventGap: 4,
      sequenceSensitive: true
    },
    mediaPressure: {
      name: 'Media Pressure',
      hint: 'The gallery reacts loudly. Dramatic wins sway the jury; mistakes echo.',
      winPath: 'Jury trust',
      eventRate: 0.2,
      eventGap: 3,
      jurySwing: 1.25
    },
    mediaTrial: {
      name: 'Media Trial',
      hint: 'The gallery reacts loudly. Dramatic wins sway the jury; mistakes echo.',
      winPath: 'Jury trust',
      eventRate: 0.2,
      eventGap: 3,
      jurySwing: 1.25
    },
    judgePressure: {
      name: 'Judge Pressure',
      hint: 'The judge is impatient. Procedural mistakes are expensive.',
      winPath: 'Clean procedure',
      eventRate: 0.12,
      eventGap: 3,
      judgeStrictness: 1.35
    },
    surpriseWitness: {
      name: 'Surprise Witness',
      hint: 'Expect an interruption or a new statement mid-trial.',
      winPath: 'Adaptation',
      eventRate: 0.2,
      eventGap: 3,
      surprise: true
    },
    proceduralBattle: {
      name: 'Procedural Battle',
      hint: 'Technical proof needs foundation. Wrong objections cost patience.',
      winPath: 'Foundation and objections',
      eventRate: 0.11,
      eventGap: 3,
      requireFoundation: true,
      judgeStrictness: 1.45
    },
    emotionalAppeal: {
      name: 'Emotional Appeal',
      hint: 'Emotional testimony moves the jury. Ground the room in proof.',
      winPath: 'Jury trust',
      eventRate: 0.18,
      eventGap: 3,
      jurySwing: 1.2
    }
  };

  var CATEGORY_SCENES = {
    financial: 'corporateTribunal',
    corporate: 'corporateTribunal',
    cyber: 'corporateTribunal',
    intellectual_property: 'fashionTribunal',
    fashion: 'fashionTribunal',
    defamation: 'mediaCourtroom',
    scandal: 'mediaCourtroom',
    whistleblower: 'mediaCourtroom',
    misconduct: 'smallCityCourt',
    insurance: 'smallCityCourt',
    estate: 'privateArbitrationRoom',
    partnership: 'privateArbitrationRoom',
    theft: 'grandAppealsCourt',
    fraud: 'grandAppealsCourt',
    corruption: 'corruptionFinalCourt',
    political: 'corruptionFinalCourt',
    witness_intimidation: 'emergencyNightHearing',
    emergency: 'emergencyNightHearing'
  };

  var CATEGORY_DIALOGUE = {
    financial: {
      correct: [
        'The audit trail does not match the timestamp on that transfer.',
        'The ledger creates a paper trail the witness cannot outrun.'
      ],
      wrong: [
        'That document may matter later, but it does not prove this point yet.',
        'The court needs a cleaner link between the entry and the testimony.'
      ]
    },
    fashion: {
      correct: [
        'The sketch registration predates the contract by six days.',
        'The pattern board and the redline draft tell the same story.'
      ],
      wrong: [
        'Style is not proof by itself. Anchor it to a dated record.',
        'The judge wants authorship, not atmosphere.'
      ]
    },
    intellectual_property: {
      correct: [
        'The sketch registration predates the contract by six days.',
        'The creative timeline finally has a timestamp.'
      ],
      wrong: [
        'Similarity alone is not enough. Establish access or timing first.',
        'The court needs more than resemblance.'
      ]
    },
    misconduct: {
      correct: [
        'The badge log breaks the officer timeline cleanly.',
        'Procedure is the story, and the procedure does not support the witness.'
      ],
      wrong: [
        'The court will not infer misconduct from a loose exhibit.',
        'Tie the record to the stop before pressing this point.'
      ]
    },
    corruption: {
      correct: [
        'The money trail and the calendar finally meet.',
        'That filing turns influence into a transaction.'
      ],
      wrong: [
        'Suspicion is not corruption. The court needs the exchange.',
        'That point is dramatic, but the foundation is thin.'
      ]
    },
    default: {
      correct: [
        'The record contradicts the testimony in plain language.',
        'That exhibit gives the court a clearer truth than the witness did.'
      ],
      wrong: [
        'The judge needs a clearer link before that exhibit can land.',
        'The witness dodges because the foundation is not tight enough.'
      ]
    }
  };

  var EXTRA_CASES_V3 = [
    {
      id: 'disappearing_witness',
      title: 'The Disappearing Witness',
      category: 'witness_intimidation',
      summary: 'A witness vanished after signing a statement and reappears with a different story.',
      intro: 'A warehouse employee who once cleared your client has returned to court terrified and contradictory.',
      motive: 'A logistics contractor needed the original statement buried.',
      sceneTheme: 'emergencyNightHearing',
      trialPattern: 'surpriseWitness',
      twist: 'A second statement arrives during trial.',
      opponent: { name: 'Kara Mott', personality: 'intimidating', tieColor: '#50161b', hairColor: '#2a1810' },
      witness: { name: 'N. Ivers', role: 'Missing Eyewitness', mood: 'scared' },
      evidencePool: ['witness_statement','phone_record','security_footage','access_badge_log','email_thread','timeline_contradiction'],
      statements: [
        { text: 'I never signed the earlier statement clearing the defendant.', weakness: 'witness_statement', obj: null, hint: 'The signature and notary seal match the original statement.', type: 'partial_lie' },
        { text: 'Nobody contacted me after I left the warehouse.', weakness: 'phone_record', obj: null, hint: 'Phone records show six calls from a blocked contractor line.', type: 'fact' },
        { text: 'I left before the loading bay incident happened.', weakness: 'access_badge_log', obj: null, hint: 'The badge log places the witness inside during the incident.', type: 'alibi' },
        { text: 'There was no camera angle showing the bay door that night.', weakness: 'security_footage', obj: null, hint: 'Recovered footage shows the witness watching the exchange.', type: 'technical' },
        { text: 'My memory changed after I reviewed my notes alone.', weakness: 'email_thread', obj: 'hearsay', hint: 'An email instructs the witness to use that exact phrase.', type: 'trap' },
        { text: 'I am certain now: your client was the person I saw.', weakness: 'timeline_contradiction', obj: null, hint: 'The timeline makes that identification impossible.', type: 'final_contradiction' }
      ],
      caseDialogue: {
        correct: ['That earlier statement did not disappear. It was buried.', 'The timeline puts fear in the witness box, not truth.'],
        wrong: ['The witness is scared, but fear is not yet a contradiction.']
      },
      reward: { money: 6200, reputation: 24 }
    },
    {
      id: 'bribed_juror',
      title: 'The Bribed Juror Suspicion',
      category: 'corruption',
      summary: 'A juror is accused of taking money before deliberations even begin.',
      intro: 'The court is investigating whether a civil verdict was poisoned before the first witness took the stand.',
      motive: 'A shell donor needed one vote steered.',
      sceneTheme: 'corruptionFinalCourt',
      trialPattern: 'judgePressure',
      twist: 'The judge will not tolerate speculation about the jury.',
      opponent: { name: 'Special Counsel Rane', personality: 'technical', tieColor: '#202020', hairColor: '#c8b890' },
      witness: { name: 'M. Bell', role: 'Court Clerk', mood: 'guarded' },
      evidencePool: ['financial_ledger','phone_record','access_badge_log','calendar_invite','settlement_draft','witness_statement'],
      statements: [
        { text: 'No juror had private contact with either party.', weakness: 'phone_record', obj: null, hint: 'A juror phone pinged the claimant consultant twice.', type: 'technical' },
        { text: 'The envelope was routine court mail.', weakness: 'financial_ledger', obj: null, hint: 'The ledger shows a matching cash withdrawal that morning.', type: 'fact' },
        { text: 'The consultant never entered the restricted corridor.', weakness: 'access_badge_log', obj: null, hint: 'Badge logs show a guest pass in the corridor.', type: 'alibi' },
        { text: 'The clerk calendar had no unusual meetings.', weakness: 'calendar_invite', obj: null, hint: 'A sealed calendar invite names the consultant.', type: 'misleading' },
        { text: 'The settlement draft was created after deliberations.', weakness: 'settlement_draft', obj: null, hint: 'Metadata places the draft before jury selection.', type: 'technical' },
        { text: 'Any claim of jury contact is reckless speculation.', weakness: 'witness_statement', obj: 'speculation', hint: 'A sworn hallway witness saw the exchange.', type: 'final_contradiction' }
      ],
      reward: { money: 9000, reputation: 34 }
    },
    {
      id: 'luxury_suit_hidden_evidence',
      title: 'The Lining of the Luxury Suit',
      category: 'fashion',
      summary: 'A custom suit hides the missing document that can clear your client.',
      intro: 'A luxury tailor is accused of helping smuggle a contract amendment inside a jacket lining.',
      motive: 'A rival wanted the original amendment lost in plain sight.',
      sceneTheme: 'fashionTribunal',
      trialPattern: 'trapCase',
      twist: 'The cuff and lining matter more than the witness wants to admit.',
      opponent: { name: 'Counsel Mirelle', personality: 'charming', tieColor: '#9b326e', hairColor: '#e0c090' },
      witness: { name: 'O. Sato', role: 'Master Tailor', mood: 'defensive' },
      evidencePool: ['redline_draft','signed_contract','security_footage','witness_statement','calendar_invite','phone_record'],
      statements: [
        { text: 'The suit was delivered sealed and untouched.', weakness: 'security_footage', obj: null, hint: 'Footage shows the lining opened in the fitting room.', type: 'technical' },
        { text: 'There was no hidden compartment in that garment.', weakness: 'witness_statement', obj: null, hint: 'The apprentice described the secret pocket in detail.', type: 'partial_lie' },
        { text: 'The contract amendment was never in my shop.', weakness: 'redline_draft', obj: null, hint: 'The redline draft has tailor chalk residue on the fold.', type: 'fact' },
        { text: 'The final signed contract contains every agreed term.', weakness: 'signed_contract', obj: null, hint: 'The signed version lacks the amendment hidden in the lining.', type: 'misleading' },
        { text: 'The client never returned after the first fitting.', weakness: 'calendar_invite', obj: null, hint: 'A second fitting invite exists the night before filing.', type: 'trap' },
        { text: 'A cufflink proves nothing about who handled the contract.', weakness: 'phone_record', obj: 'relevance', hint: 'The call log places the witness with the rival moments after the cufflink was found.', type: 'final_contradiction' }
      ],
      reward: { money: 6800, reputation: 26 }
    },
    {
      id: 'tailor_shop_alibi',
      title: 'The Tailor Shop Alibi',
      category: 'fashion',
      summary: 'A precise fitting appointment may clear a client accused of sabotage.',
      intro: 'Your client claims a tailor shop appointment proves they could not have entered a rival studio.',
      motive: 'A rival designer needed the alibi discredited.',
      sceneTheme: 'fashionTribunal',
      trialPattern: 'contradictionChain',
      twist: 'The alibi depends on a cufflink, a receipt, and a camera reflection.',
      opponent: { name: 'Vera Koll', personality: 'slippery', tieColor: '#6a3aaa', hairColor: '#2a1810' },
      witness: { name: 'L. Armand', role: 'Tailor', mood: 'nervous' },
      evidencePool: ['calendar_invite','security_footage','phone_record','witness_statement','financial_ledger','redline_draft'],
      statements: [
        { text: 'The fitting ended before eight, leaving plenty of time to reach the studio.', weakness: 'calendar_invite', obj: null, hint: 'The appointment ran until 8:42 PM.', type: 'alibi' },
        { text: 'The hallway camera never captured your client in the shop.', weakness: 'security_footage', obj: null, hint: 'The mirror reflection captures the client in frame.', type: 'technical' },
        { text: 'I cannot identify the owner of the cufflink found near the studio.', weakness: 'witness_statement', obj: null, hint: 'The tailor statement identifies the cufflink as a rival sample.', type: 'partial_lie' },
        { text: 'No payment was recorded for a late fitting.', weakness: 'financial_ledger', obj: null, hint: 'The ledger lists a rush alteration fee.', type: 'misleading' },
        { text: 'There were no calls from the shop after closing.', weakness: 'phone_record', obj: null, hint: 'The shop called the client at 8:51 PM.', type: 'trap' },
        { text: 'The redline sketch proves the design was already public.', weakness: 'redline_draft', obj: 'relevance', hint: 'The redline was created after the alleged theft.', type: 'final_contradiction' }
      ],
      reward: { money: 5600, reputation: 22 }
    },
    {
      id: 'hacked_security_footage',
      title: 'The Hacked Security Footage',
      category: 'cyber',
      summary: 'A security video was altered before the company handed it to police.',
      intro: 'Your client is visible on footage that may have been generated from corrupted security logs.',
      motive: 'An internal saboteur needed a perfect digital scapegoat.',
      sceneTheme: 'corporateTribunal',
      trialPattern: 'proceduralBattle',
      twist: 'Technical statements require foundation before evidence can land.',
      opponent: { name: 'Nadia Pike', personality: 'technical', tieColor: '#1a4a66', hairColor: '#d0c8b8' },
      witness: { name: 'R. Lin', role: 'Security Engineer', mood: 'overconfident' },
      evidencePool: ['security_footage','expert_report','access_badge_log','internal_memo','phone_record','timeline_contradiction'],
      statements: [
        { text: 'The timestamp is generated by hardware and cannot be altered.', weakness: 'expert_report', obj: null, hint: 'The expert report shows a firmware-level timestamp flaw.', type: 'technical' },
        { text: 'The badge log confirms the person in the video entered legally.', weakness: 'access_badge_log', obj: null, hint: 'The badge log was imported six hours after the footage.', type: 'technical' },
        { text: 'No internal memo flagged security problems before the incident.', weakness: 'internal_memo', obj: null, hint: 'The memo warned that camera exports could be spoofed.', type: 'partial_lie' },
        { text: 'The phone record is irrelevant to video authenticity.', weakness: 'phone_record', obj: 'relevance', hint: 'The phone was miles away while the video shows the client onsite.', type: 'trap' },
        { text: 'The clip sequence is continuous from entry to exit.', weakness: 'security_footage', obj: null, hint: 'The footage jumps exactly three frames at the door.', type: 'misleading' },
        { text: 'The timeline is consistent with every digital record we have.', weakness: 'timeline_contradiction', obj: null, hint: 'The exported timeline contradicts the server backup.', type: 'final_contradiction' }
      ],
      reward: { money: 8200, reputation: 32 }
    },
    {
      id: 'political_scandal',
      title: 'The Waterfront Scandal',
      category: 'political',
      summary: 'A mayoral campaign donor appears inside a rezoning deal.',
      intro: 'A waterfront rezoning vote becomes a public scandal when donor records and private calendars collide.',
      motive: 'A campaign needed a legal cover story for a favor.',
      sceneTheme: 'mediaCourtroom',
      trialPattern: 'mediaPressure',
      twist: 'Media leaks swing the jury hard.',
      opponent: { name: 'Atty. Halden', personality: 'charming', tieColor: '#0a3f5f', hairColor: '#c8a060' },
      witness: { name: 'J. Vale', role: 'Campaign Treasurer', mood: 'guarded' },
      evidencePool: ['financial_ledger','calendar_invite','email_thread','phone_record','board_minutes','settlement_draft'],
      statements: [
        { text: 'The donor meeting was unrelated to the rezoning vote.', weakness: 'calendar_invite', obj: null, hint: 'The invite title names the waterfront vote.', type: 'misleading' },
        { text: 'Campaign funds never touched the project committee.', weakness: 'financial_ledger', obj: null, hint: 'The ledger records a pass-through payment.', type: 'technical' },
        { text: 'No one discussed favorable treatment in writing.', weakness: 'email_thread', obj: 'hearsay', hint: 'The email thread says "deliver the vote by Friday."', type: 'partial_lie' },
        { text: 'The board minutes show unanimous independent support.', weakness: 'board_minutes', obj: null, hint: 'The minutes were revised after the donor meeting.', type: 'fact' },
        { text: 'The settlement draft was only a campaign compliance document.', weakness: 'settlement_draft', obj: 'relevance', hint: 'The draft contains a confidentiality clause for zoning discussions.', type: 'trap' },
        { text: 'There were no calls between the donor and campaign staff.', weakness: 'phone_record', obj: null, hint: 'Phone records show calls before and after the vote.', type: 'final_contradiction' }
      ],
      reward: { money: 10500, reputation: 40 }
    },
    {
      id: 'rival_law_firm_conspiracy',
      title: 'The Rival Firm Conspiracy',
      category: 'partnership',
      summary: 'A competing law firm may have manufactured a conflict to steal a client.',
      intro: 'Your firm is accused of conflict violations, but the record points to a rival firm engineering the crisis.',
      motive: 'A rival partner wanted a lucrative client book.',
      sceneTheme: 'privateArbitrationRoom',
      trialPattern: 'contradictionChain',
      twist: 'The conspiracy emerges only after multiple contradictions are chained.',
      opponent: { name: 'Grace Thorne', personality: 'slippery', tieColor: '#1a1a4a', hairColor: '#e8e0d0' },
      witness: { name: 'C. Morrow', role: 'Ethics Consultant', mood: 'defensive' },
      evidencePool: ['email_thread','board_minutes','nda_clause','phone_record','settlement_draft','calendar_invite'],
      statements: [
        { text: 'The conflict memo came from an independent ethics review.', weakness: 'email_thread', obj: null, hint: 'The email thread shows the rival firm drafted it.', type: 'partial_lie' },
        { text: 'No board member discussed moving the client before the memo.', weakness: 'board_minutes', obj: null, hint: 'Board minutes show a client transfer strategy.', type: 'misleading' },
        { text: 'The NDA prevents disclosure of the consultant source.', weakness: 'nda_clause', obj: 'relevance', hint: 'The NDA excludes misconduct and fraud.', type: 'trap' },
        { text: 'No phone calls connected me to the rival partner.', weakness: 'phone_record', obj: null, hint: 'Phone logs show five calls in two days.', type: 'technical' },
        { text: 'The settlement draft was a routine risk-control document.', weakness: 'settlement_draft', obj: null, hint: 'The draft offers payment for silence about the client transfer.', type: 'fact' },
        { text: 'The calendar proves I was not present at the strategy meeting.', weakness: 'calendar_invite', obj: null, hint: 'The invite lists the witness as remote attendee.', type: 'final_contradiction' }
      ],
      reward: { money: 11500, reputation: 38 }
    },
    {
      id: 'poisoned_contract',
      title: 'The Poisoned Contract Negotiation',
      category: 'fraud',
      summary: 'A settlement contract contains a clause designed to destroy the client later.',
      intro: 'A negotiation that looked generous concealed a clause that would trigger automatic default.',
      motive: 'Opposing counsel needed a settlement that looked fair and failed later.',
      sceneTheme: 'privateArbitrationRoom',
      trialPattern: 'trapCase',
      twist: 'The wrong exhibit gives the opponent exactly the opening they want.',
      opponent: { name: 'M. Sable', personality: 'technical', tieColor: '#32233f', hairColor: '#c8c0b0' },
      witness: { name: 'E. Rowan', role: 'Deal Counsel', mood: 'composed' },
      evidencePool: ['signed_contract','redline_draft','email_thread','settlement_draft','phone_record','internal_memo'],
      statements: [
        { text: 'The default clause was standard boilerplate.', weakness: 'redline_draft', obj: null, hint: 'The redline shows the clause added after business approval.', type: 'technical' },
        { text: 'Your client accepted every term voluntarily.', weakness: 'email_thread', obj: null, hint: 'Emails show pressure to sign before counsel reviewed the draft.', type: 'misleading' },
        { text: 'The signed contract reflects the final negotiated position.', weakness: 'signed_contract', obj: null, hint: 'The signed page references an exhibit that was swapped.', type: 'fact' },
        { text: 'The settlement draft was more favorable than litigation.', weakness: 'settlement_draft', obj: 'relevance', hint: 'The draft contained a hidden acceleration trigger.', type: 'trap' },
        { text: 'No one called your client after business hours.', weakness: 'phone_record', obj: null, hint: 'Phone records show a midnight pressure call.', type: 'partial_lie' },
        { text: 'The internal memo proves we disclosed all risks.', weakness: 'internal_memo', obj: null, hint: 'The memo says the default clause was intentionally buried.', type: 'final_contradiction' }
      ],
      reward: { money: 9700, reputation: 36 }
    },
    {
      id: 'witness_intimidation',
      title: 'The Quiet Hallway Threat',
      category: 'witness_intimidation',
      summary: 'A witness changed testimony after a hallway meeting no one wants to discuss.',
      intro: 'A hallway camera, a phone call, and a sudden memory lapse point toward witness intimidation.',
      motive: 'The prosecution witness was pressured to protect a superior.',
      sceneTheme: 'emergencyNightHearing',
      trialPattern: 'hostileWitness',
      twist: 'Pressure can work, but only after the contradiction is visible.',
      opponent: { name: 'D. Crowe', personality: 'intimidating', tieColor: '#4a0000', hairColor: '#3a3a3a' },
      witness: { name: 'P. Ren', role: 'Former Assistant', mood: 'scared' },
      evidencePool: ['security_footage','phone_record','witness_statement','email_thread','access_badge_log','timeline_contradiction'],
      statements: [
        { text: 'No one spoke to me in the hallway before testimony.', weakness: 'security_footage', obj: null, hint: 'The footage shows a hallway confrontation.', type: 'partial_lie' },
        { text: 'I changed my statement because I remembered new details.', weakness: 'witness_statement', obj: null, hint: 'The prior statement was clear and sworn.', type: 'misleading' },
        { text: 'The phone call after the meeting was personal.', weakness: 'phone_record', obj: null, hint: 'The call was to opposing counsel.', type: 'technical' },
        { text: 'No badge record places me near the restricted wing.', weakness: 'access_badge_log', obj: null, hint: 'The badge log places the witness outside counsel rooms.', type: 'alibi' },
        { text: 'There was no written pressure from my employer.', weakness: 'email_thread', obj: 'hearsay', hint: 'The email says "correct the story before court."', type: 'trap' },
        { text: 'My revised timeline is the accurate one.', weakness: 'timeline_contradiction', obj: null, hint: 'The revised timeline contradicts the security footage.', type: 'final_contradiction' }
      ],
      reward: { money: 7300, reputation: 30 }
    },
    {
      id: 'corrupted_judge_final',
      title: 'The Corrupted Judge',
      category: 'corruption',
      summary: 'A final case alleges the presiding judge in a prior matter was compromised.',
      intro: 'A sealed disciplinary file suggests a judge, a donor, and a verdict were connected before trial began.',
      motive: 'A political machine needed a guaranteed verdict.',
      sceneTheme: 'corruptionFinalCourt',
      trialPattern: 'proceduralBattle',
      twist: 'Every accusation must be perfectly founded or the court will shut it down.',
      opponent: { name: 'Chief Counsel Voss', personality: 'technical', tieColor: '#0b0b0b', hairColor: '#c8b888' },
      witness: { name: 'Clerk Edda Vale', role: 'Judicial Clerk', mood: 'guarded' },
      evidencePool: ['financial_ledger','calendar_invite','phone_record','internal_memo','board_minutes','settlement_draft','whistle_file'],
      statements: [
        { text: 'The judge had no financial contact with any party.', weakness: 'financial_ledger', obj: null, hint: 'The ledger shows a donor-advised payment routed to a family trust.', type: 'technical' },
        { text: 'The calendar meeting was a routine bar association event.', weakness: 'calendar_invite', obj: null, hint: 'The invite lists the donor and case number.', type: 'technical' },
        { text: 'No calls occurred between chambers and campaign staff.', weakness: 'phone_record', obj: null, hint: 'Phone records show calls the night before ruling.', type: 'partial_lie' },
        { text: 'The internal memo cleared the judge of any conflict.', weakness: 'internal_memo', obj: null, hint: 'The memo recommended recusal before it was edited.', type: 'misleading' },
        { text: 'Board minutes from the donor group are irrelevant.', weakness: 'board_minutes', obj: 'relevance', hint: 'The minutes discuss expected court timing.', type: 'trap' },
        { text: 'There was never a settlement offer tied to the ruling.', weakness: 'settlement_draft', obj: null, hint: 'The draft references ruling language before it was issued.', type: 'fact' },
        { text: 'The whistleblower file is rumor, not evidence.', weakness: 'whistle_file', obj: null, hint: 'The file contains documents only chambers could possess.', type: 'final_contradiction' }
      ],
      reward: { money: 18000, reputation: 70 }
    }
  ];

  function cloneData(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function normalizePatternName(value, category, title) {
    var v = value || '';
    if (v === 'mediaTrial') return 'mediaPressure';
    if (v && PATTERN_RULES[v]) return v;
    if (/judge|procedural/i.test(v)) return 'proceduralBattle';
    if (/trap/i.test(v)) return 'trapCase';
    if (/chain/i.test(v)) return 'contradictionChain';
    if (/witness/i.test(v)) return 'hostileWitness';
    if (/media|scandal|whistle/i.test(category || title || '')) return 'mediaPressure';
    if (/corruption|political/i.test(category || title || '')) return 'judgePressure';
    if (/estate|partnership/i.test(category || '')) return 'contradictionChain';
    return 'standardTrial';
  }

  function inferCategory(c) {
    if (c.category) return c.category;
    var text = ((c.title || '') + ' ' + (c.intro || '')).toLowerCase();
    if (/ledger|finance|account|audit|money|transfer/.test(text)) return 'financial';
    if (/fashion|sketch|tailor|design|suit/.test(text)) return 'fashion';
    if (/security|server|hacked|malware|cyber/.test(text)) return 'cyber';
    if (/mayor|judge|bribe|corrupt|donor|juror/.test(text)) return 'corruption';
    if (/witness|threat|intimidat/.test(text)) return 'witness_intimidation';
    if (/estate|will|inheritance/.test(text)) return 'estate';
    if (/theft|gallery|painting|art/.test(text)) return 'theft';
    if (/insurance|claim|fire/.test(text)) return 'insurance';
    if (/arrest|officer|precinct|misconduct/.test(text)) return 'misconduct';
    return 'fraud';
  }

  function inferScene(c) {
    if (c.sceneTheme && SCENE_THEMES[c.sceneTheme]) return c.sceneTheme;
    if (c.courtScene && SCENE_THEMES[c.courtScene]) return c.courtScene;
    if (c.venueType && SCENE_THEMES[c.venueType]) return c.venueType;
    var category = inferCategory(c);
    var title = (c.title || '').toLowerCase();
    if (/final|judge|corrupt|mayor|bribed/.test(title)) return 'corruptionFinalCourt';
    if (/midnight|night|missing witness|threat/.test(title)) return 'emergencyNightHearing';
    if (/fashion|tailor|sketch|suit/.test(title)) return 'fashionTribunal';
    return CATEGORY_SCENES[category] || (c.diff >= 5 ? 'grandAppealsCourt' : 'smallCityCourt');
  }

  function normalizeStatement(stmt, idx, total) {
    if (!stmt.type) {
      if (idx === total - 1) stmt.type = 'final_contradiction';
      else if (stmt.obj) stmt.type = stmt.obj === 'relevance' ? 'emotional' : 'trap';
      else if (/timeline|alibi|away|present|entered|left/i.test(stmt.text || '')) stmt.type = 'alibi';
      else if (/expert|data|record|log|timestamp|metadata|ledger|technical/i.test(stmt.text || '')) stmt.type = 'technical';
      else stmt.type = 'fact';
    }
    stmt.statementType = stmt.type;
    return stmt;
  }

  function normalizeCase(c) {
    if (!c) return c;
    c.category = inferCategory(c);
    c.diff = Math.max(1, Math.min(6, Number(c.diff) || (
      /corruption|political/.test(c.category) ? 4 :
      /cyber|partnership|witness_intimidation/.test(c.category) ? 3 : 2
    )));
    c.summary = c.summary || c.intro || c.title || 'A courtroom dispute.';
    c.sceneTheme = inferScene(c);
    c.courtScene = c.sceneTheme;
    c.venueType = c.sceneTheme;
    c.trialPattern = normalizePatternName(c.trialPattern || c.courtPattern || c.sequenceType || c.pattern, c.category, c.title);
    c.courtPattern = c.trialPattern;
    c.sequenceType = c.trialPattern;
    c.pattern = c.trialPattern;
    if (typeof c.reward === 'number') {
      c.reward = { money: c.reward, reputation: Math.max(8, Math.round((c.diff || 1) * 8)) };
    } else if (c.reward) {
      c.reward.money = c.reward.money || c.reward.cash || 2500 + (c.diff || 1) * 900;
      c.reward.reputation = c.reward.reputation || c.reward.rep || Math.max(8, Math.round((c.diff || 1) * 8));
    } else {
      c.reward = { money: 2500 + (c.diff || 1) * 900, reputation: Math.max(8, Math.round((c.diff || 1) * 8)) };
    }
    if (Array.isArray(c.statements)) {
      c.statements.forEach(function(stmt, idx) { normalizeStatement(stmt, idx, c.statements.length); });
    }
    if (!c.caseDialogue) {
      var pool = CATEGORY_DIALOGUE[c.category] || CATEGORY_DIALOGUE.default;
      c.caseDialogue = { correct: pool.correct.slice(), wrong: pool.wrong.slice() };
    }
    return c;
  }

  function installCaseData() {
    if (typeof CASES === 'undefined') return;
    var existing = {};
    CASES.forEach(function(c) { existing[(c.title || '').toLowerCase()] = true; normalizeCase(c); });
    EXTRA_CASES_V3.forEach(function(c) {
      if (!existing[(c.title || '').toLowerCase()]) {
        CASES.push(normalizeCase(cloneData(c)));
      }
    });
    CASES.forEach(normalizeCase);
  }

  installCaseData();

  var CAMPAIGN_BASE_V3 = (typeof CASES !== 'undefined') ? CASES.map(function(c) { return normalizeCase(c); }) : [];

  function refreshMenuCaseCount() {
    if (typeof CASES === 'undefined') return;
    var dossier = document.querySelector('.menu-dossier');
    if (!dossier) return;
    var nodes = Array.prototype.slice.call(dossier.querySelectorAll('div'));
    var stat = nodes.find(function(n) { return /cases on the docket/i.test(n.textContent || ''); });
    if (!stat) {
      stat = document.createElement('div');
      stat.style.cssText = 'margin-top:10px;font-size:11px;color:var(--ink-dim);letter-spacing:1.5px;text-transform:uppercase;';
      dossier.appendChild(stat);
    }
    stat.textContent = 'CASE FILES: ' + CASES.length + ' cases on the docket - ' +
      new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  setTimeout(refreshMenuCaseCount, 0);

  function shuffleV3(arr) {
    var out = arr.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function rebuildFullCampaignDeck() {
    if (typeof CASES === 'undefined' || !CAMPAIGN_BASE_V3.length) return;
    var deck = shuffleV3(CAMPAIGN_BASE_V3.map(function(c) { return normalizeCase(cloneData(c)); }));
    var bonusCount = 2 + Math.floor(Math.random() * 3);
    for (var i = 0; i < bonusCount; i++) deck.push(Game.makeRandomCase());
    CASES.length = 0;
    deck.forEach(function(c) { CASES.push(normalizeCase(c)); });
    try { if (typeof I18N !== 'undefined' && I18N.translateData) I18N.translateData(); } catch(e) {}
  }

  Game.startCampaign = function() {
    var hasSave = false;
    try { hasSave = !!localStorage.getItem('ops_save'); } catch(e) {}
    if (hasSave && !window.__opsConfirmedNew) {
      var msg = (typeof I18N !== 'undefined' && I18N.ar && I18N.ar())
        ? 'لديك مسيرة محفوظة. هل تريد بدء مسيرة جديدة؟'
        : 'You have a saved career. Start a NEW career?';
      if (!window.confirm(msg)) return;
    }
    window.__opsConfirmedNew = true;
    setTimeout(function() { window.__opsConfirmedNew = false; }, 100);
    rebuildFullCampaignDeck();
    S.campaignIndex = 0;
    S.randomMode = false;
    S.styleSelection = { current: null, name: '' };
    this.buildStyleSelect();
    UI.switchTo('style');
  };

  var _origStartCaseV3 = Game.startCase && Game.startCase.bind(Game);
  if (_origStartCaseV3) {
    Game.startCase = function(idx) {
      if (typeof CASES !== 'undefined' && CASES[idx]) normalizeCase(CASES[idx]);
      return _origStartCaseV3.apply(this, arguments);
    };
  }

  var _origMakeRandomV3 = Game.makeRandomCase && Game.makeRandomCase.bind(Game);
  Game.makeRandomCase = function() {
    var pool = (typeof CASES !== 'undefined' && CASES.length ? CASES : EXTRA_CASES_V3).filter(function(c) {
      return c && c.statements && c.evidencePool;
    });
    var base = cloneData(pool[Math.floor(Math.random() * pool.length)] || (_origMakeRandomV3 ? _origMakeRandomV3() : EXTRA_CASES_V3[0]));
    base.id = 'random_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
    base.title = 'Random Docket: ' + base.title;
    base.randomMode = true;
    base.diff = Math.max(1, Math.min(6, (base.diff || 2) + Math.floor(Math.random() * 3) - 1));
    base.reward = { money: 3600 + base.diff * 2100, reputation: 12 + base.diff * 8 };
    base.opponent = cloneData(base.opponent || { name: 'A. Vale', personality: 'technical', tieColor: '#333', hairColor: '#bbb' });
    base.witness = cloneData(base.witness || { name: 'S. Arden', role: 'Key Witness', mood: 'nervous' });
    base.statements = base.statements.slice().sort(function(a, b) {
      if (a.type === 'final_contradiction') return 1;
      if (b.type === 'final_contradiction') return -1;
      return Math.random() - 0.5;
    }).slice(0, Math.min(6, base.statements.length));
    return normalizeCase(base);
  };

  Game.startDailyCase = function() {
    if (!S.player) {
      alert('Please start or continue a career before playing the daily case.');
      return;
    }
    var now = new Date();
    var seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    var pool = (typeof CASES !== 'undefined' && CASES.length ? CASES : EXTRA_CASES_V3).filter(function(c) { return c && c.statements; });
    var base = cloneData(pool[seed % pool.length]);
    base.id = 'daily_' + seed;
    base.title = 'Daily Docket: ' + base.title;
    base.daily = true;
    base.reward = { money: 4200 + (base.diff || 2) * 1800, reputation: 14 + (base.diff || 2) * 7 };
    normalizeCase(base);
    S.randomMode = true;
    S.campaignIndex = 0;
    S.caseData = base;
    S.invest = { visited: {}, clues: [], left: 2, revealed: [] };
    S.negot = null;
    this.buildPrep();
    UI.switchTo('office');
    UI.refreshTopBar();
  };

  function patternRule(c) {
    var name = normalizePatternName(c && (c.trialPattern || c.pattern), c && c.category, c && c.title);
    return PATTERN_RULES[name] || PATTERN_RULES.standardTrial;
  }

  function applyTrialSequence(court, cd) {
    var rule = patternRule(cd);
    court.trialPattern = cd.trialPattern;
    court._director = {
      pattern: cd.trialPattern,
      sceneTheme: cd.sceneTheme,
      foundation: {},
      eventBudget: 4 + Math.min(3, cd.diff || 1),
      lastEventRound: 0,
      firstObjection: false,
      witnessBreak: false,
      judgeWarning: false,
      openingPlayed: false,
      winPath: rule.winPath
    };
    court._pattern = {
      name: rule.name,
      hint: rule.hint,
      eventRate: 0,
      opponentBias: 0,
      judgeStrictness: rule.judgeStrictness || 1
    };
    court._characterState = {
      player: 'focused',
      opp: 'confident',
      witness: 'composed',
      judge: 'neutral'
    };
    if (rule.witnessBoost) court.witnessConfidence = Math.min(130, court.witnessConfidence + rule.witnessBoost);
    if (rule.judgeStrictness) court.judge = Math.max(55, Math.round(court.judge - (rule.judgeStrictness - 1) * 12));
    if (rule.jurySwing && cd.trialPattern === 'emotionalAppeal') court.jury = Math.max(-50, court.jury - 5);
    if (cd.trialPattern === 'contradictionChain') {
      cd.statements.sort(function(a, b) {
        var order = { fact: 0, alibi: 1, misleading: 2, partial_lie: 3, technical: 4, trap: 5, emotional: 5, final_contradiction: 9 };
        return (order[a.type] || 4) - (order[b.type] || 4);
      });
    } else if (cd.trialPattern === 'trapCase') {
      cd.statements.sort(function(a, b) {
        if (a.type === 'final_contradiction') return 1;
        if (b.type === 'final_contradiction') return -1;
        if (a.type === 'trap' && b.type !== 'trap') return -1;
        if (b.type === 'trap' && a.type !== 'trap') return 1;
        return 0;
      });
    } else if (cd.trialPattern === 'emotionalAppeal' || cd.trialPattern === 'mediaPressure') {
      cd.statements.sort(function(a, b) {
        if (a.type === 'final_contradiction') return 1;
        if (b.type === 'final_contradiction') return -1;
        if (a.type === 'emotional' && b.type !== 'emotional') return -1;
        if (b.type === 'emotional' && a.type !== 'emotional') return 1;
        return 0;
      });
    }
    court.statementsTotal = cd.statements.length;
  }

  var _origEnterCourtroomV3 = Game.enterCourtroom && Game.enterCourtroom.bind(Game);
  if (_origEnterCourtroomV3) {
    Game.enterCourtroom = function() {
      if (S.caseData) normalizeCase(S.caseData);
      var out = _origEnterCourtroomV3.apply(this, arguments);
      if (S.court && S.caseData && S.court.mode === 'campaign') {
        applyTrialSequence(S.court, S.caseData);
        updateCourtChrome();
        directorCutscene('Court Opens', sceneTitle(S.caseData.sceneTheme) + ' - ' + patternRule(S.caseData).name, 'drama', 1150);
        try { this.renderCourt(); } catch(e) {}
      }
      return out;
    };
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function sceneTitle(themeId) {
    return (SCENE_THEMES[themeId] || SCENE_THEMES.classicCourtroom).name;
  }

  function directorCutscene(title, subtitle, type, duration) {
    var overlay = document.getElementById('cutsceneOverlay');
    if (!overlay) return;
    var icon = document.getElementById('cutsceneIcon');
    var ttl = document.getElementById('cutsceneTitle');
    var sub = document.getElementById('cutsceneSubtitle');
    if (icon) icon.textContent = type === 'lost' ? '!' : (type === 'witness' ? '...' : '*');
    if (ttl) ttl.textContent = title;
    if (sub) sub.textContent = subtitle || '';
    overlay.className = overlay.className.replace(/type-\w+/g, '');
    overlay.classList.remove('hidden');
    overlay.classList.add('type-' + (type || 'drama'));
    requestAnimationFrame(function() { overlay.classList.add('active'); });
    setTimeout(function() {
      overlay.classList.remove('active');
      setTimeout(function() { overlay.classList.add('hidden'); }, 260);
    }, duration || 1050);
  }

  function caseLine(kind, card, stmt) {
    var cd = S.caseData || {};
    var pool = cd.caseDialogue && cd.caseDialogue[kind === 'correct' ? 'correct' : 'wrong'];
    if (!pool || !pool.length) {
      var catPool = CATEGORY_DIALOGUE[cd.category] || CATEGORY_DIALOGUE.default;
      pool = kind === 'correct' ? catPool.correct : catPool.wrong;
    }
    var line = pick(pool);
    if (card && stmt && kind === 'correct' && /default|record/i.test(line)) {
      line += ' ' + card.name + ' answers this testimony directly.';
    }
    return line;
  }

  function showEvidenceMoment(card, stmt, success, line) {
    if (!card) return;
    var old = document.querySelector('.evidence-moment');
    if (old) old.remove();
    var div = document.createElement('div');
    div.className = 'evidence-moment ' + (success ? 'good' : 'bad');
    div.innerHTML =
      '<div class="evidence-moment-card">' +
        '<div class="evidence-moment-title">' + escapeHTML(card.name || 'Evidence') + '</div>' +
        '<div class="evidence-moment-desc">' + escapeHTML(card.desc || '') + '</div>' +
        '<div class="evidence-moment-line">' + escapeHTML(line || caseLine(success ? 'correct' : 'wrong', card, stmt)) + '</div>' +
      '</div>';
    document.body.appendChild(div);
    setTimeout(function() { if (div.parentNode) div.parentNode.removeChild(div); }, 1500);
  }

  function markFoundation(action) {
    var c = S.court;
    if (!c || !c._director) return;
    var idx = c.statementIdx || 0;
    c._director.foundation[idx] = Math.max(c._director.foundation[idx] || 0, action === 'cross' ? 2 : 1);
  }

  ['resolveCross', 'resolveReadRoom', 'resolvePinDown', 'resolveConsultNotes'].forEach(function(fn) {
    if (!Game[fn]) return;
    var orig = Game[fn].bind(Game);
    Game[fn] = function() {
      markFoundation(fn === 'resolveCross' ? 'cross' : 'support');
      return orig.apply(this, arguments);
    };
  });

  if (Game.pressWitness) {
    var _origPressWitnessV3 = Game.pressWitness.bind(Game);
    Game.pressWitness = function() {
      markFoundation('cross');
      return _origPressWitnessV3.apply(this, arguments);
    };
  }

  function evidenceGate(c, stmt, card) {
    if (!c || !c._director || !stmt || !card) return null;
    var rule = PATTERN_RULES[c._director.pattern] || PATTERN_RULES.standardTrial;
    var idx = c.statementIdx || 0;
    var foundation = c._director.foundation[idx] || 0;
    var isMatch = stmt.weakness === card.id;
    if (isMatch && (rule.requireFoundation || stmt.type === 'technical') && stmt.type === 'technical' && foundation < 1) {
      return {
        reason: 'Foundation required',
        message: 'Foundation not established. Cross-examine or consult notes before using technical proof.',
        judge: 5,
        cred: 4
      };
    }
    if (isMatch && stmt.type === 'trap' && foundation < 1 && rule.trapSensitive) {
      return {
        reason: 'Trap not disarmed',
        message: 'The opponent blocks the exhibit. Reveal the trap first, then use the evidence.',
        judge: 7,
        cred: 6
      };
    }
    if (isMatch && stmt.type === 'final_contradiction' && c.statementsResolved < Math.max(1, Math.floor((S.caseData.statements.length || 5) * 0.45))) {
      return {
        reason: 'Too early',
        message: 'The judge needs a clearer chain before the final contradiction can land.',
        judge: 6,
        cred: 5
      };
    }
    return null;
  }

  var _origPresentEvidenceV3 = Game.presentEvidence && Game.presentEvidence.bind(Game);
  if (_origPresentEvidenceV3) {
    Game.presentEvidence = function(idx) {
      var c = S.court;
      var stmt = this.currentStatement && this.currentStatement();
      var card = c && c.hand ? c.hand[idx] : null;
      if (!c || !stmt || !card || card.used) return _origPresentEvidenceV3.apply(this, arguments);
      var gate = evidenceGate(c, stmt, card);
      if (gate) {
        c.player.cred = Math.max(0, c.player.cred - gate.cred);
        c.judge = Math.max(0, c.judge - gate.judge);
        c.lastResult = 'bad';
        c.lastSide = 'player';
        setLiveState('player', 'pressured');
        setLiveState('opp', 'smug');
        setLiveState('judge', c.judge < 40 ? 'angry' : 'annoyed');
        showEvidenceMoment(card, stmt, false, gate.message);
        try { this.courtLog(gate.message + ' You keep the exhibit for later. Judge -' + gate.judge + ', cred -' + gate.cred + '.', 'bad'); } catch(e) {}
        try { Snd.warning && Snd.warning(); } catch(e) {}
        this.afterPlayerTurn(false);
        return;
      }
      var success = stmt.weakness === card.id;
      var boost = success && c._director && (c._director.foundation[c.statementIdx || 0] || 0) > 0;
      var oldStrength = card.strength;
      if (boost) card.strength = (card.strength || 0) + 3;
      showEvidenceMoment(card, stmt, success, caseLine(success ? 'correct' : 'wrong', card, stmt));
      setLiveState('player', success ? 'triumphant' : 'shocked');
      setLiveState('opp', success ? 'rattled' : 'smug');
      setLiveState('witness', success ? ((c.witnessConfidence || 100) < 35 ? 'panicking' : 'nervous') : 'defensive');
      var out;
      try {
        out = _origPresentEvidenceV3.apply(this, arguments);
      } finally {
        card.strength = oldStrength;
      }
      if (success && boost) {
        try { this.courtLog('Foundation paid off. The exhibit hits harder because the witness was already boxed in.', 'drama'); } catch(e) {}
      }
      return out;
    };
  }

  var _origResolveObjectionV3 = Game.resolveObjection && Game.resolveObjection.bind(Game);
  if (_origResolveObjectionV3) {
    Game.resolveObjection = function(type) {
      var c = S.court;
      var stmt = this.currentStatement && this.currentStatement();
      var correct = stmt && stmt.obj === type;
      if (c && c._director && !c._director.firstObjection) {
        c._director.firstObjection = true;
        directorCutscene('First Objection', correct ? 'The court leans in.' : 'The room tightens around the mistake.', correct ? 'objection' : 'lost', 950);
      }
      setLiveState('player', 'objecting');
      setLiveState('opp', correct ? 'annoyed' : 'confident');
      setLiveState('judge', correct ? 'impressed' : 'annoyed');
      return _origResolveObjectionV3.apply(this, arguments);
    };
  }

  var _origRevealV3 = Game.resolveDramaticReveal && Game.resolveDramaticReveal.bind(Game);
  if (_origRevealV3) {
    Game.resolveDramaticReveal = function() {
      var c = S.court;
      var stmt = this.currentStatement && this.currentStatement();
      var card = c && stmt ? c.hand.find(function(x) { return !x.used && x.id === stmt.weakness; }) : null;
      if (card) showEvidenceMoment(card, stmt, true, 'The room narrows to one exhibit. This is the break.');
      directorCutscene('Dramatic Reveal', card ? card.name : 'The record turns.', 'evidence', 1100);
      setLiveState('player', 'triumphant');
      setLiveState('opp', 'rattled');
      setLiveState('witness', 'panicking');
      return _origRevealV3.apply(this, arguments);
    };
  }

  function setLiveState(who, state) {
    var c = S.court;
    if (!c) return;
    if (!c._characterState) c._characterState = {};
    c._characterState[who] = state;
    var wrap = document.getElementById('courtCanvasWrap');
    if (!wrap) return;
    if (who === 'player') wrap.dataset.pstate = state;
    if (who === 'opp') wrap.dataset.ostate = state;
    if (who === 'witness') wrap.dataset.wstate = state;
    if (who === 'judge') wrap.dataset.jstate = state;
  }

  function refreshLiveStatesFromMeters() {
    var c = S.court;
    if (!c || !c._characterState) return;
    if (!c._stateHoldUntil || Date.now() > c._stateHoldUntil) {
      setLiveState('player', c.player.cred < 45 ? 'pressured' : ((c.combo || 0) >= 3 ? 'focused' : 'calm'));
      setLiveState('opp', c.opp.cred < 30 ? 'defeated' : (c.opp.cred > 105 ? 'confident' : (c.jury > 18 ? 'annoyed' : 'smug')));
      setLiveState('witness', c.witnessConfidence < 18 ? 'broken' : (c.witnessConfidence < 38 ? 'panicking' : (c.witnessConfidence < 62 ? 'sweating' : 'composed')));
      setLiveState('judge', c.judge < 28 ? 'angry' : (c.judge < 55 ? 'annoyed' : 'neutral'));
    }
    if ((c.witnessConfidence || 100) < 20 && c._director && !c._director.witnessBreak) {
      c._director.witnessBreak = true;
      directorCutscene('Witness Breaks', 'The story changes shape under pressure.', 'witness', 1050);
    }
  }

  var DIRECTOR_EVENTS = [
    {
      id: 'judgeWarning',
      patterns: ['judgePressure','proceduralBattle','trapCase'],
      label: 'Judge warning',
      run: function(c) {
        c.judge = Math.max(0, c.judge - 7);
        setLiveState('judge', 'angry');
        Game.courtLog('The judge cuts in: "Foundation first, counsel. I will not let this drift." Judge -7.', 'bad');
        directorCutscene('Judge Warning', 'The bench is losing patience.', 'lost', 900);
      }
    },
    {
      id: 'witnessHesitation',
      patterns: ['hostileWitness','contradictionChain','standardTrial'],
      label: 'Witness hesitation',
      run: function(c) {
        c.witnessConfidence = Math.max(0, c.witnessConfidence - 9);
        c.focus = Math.min(100, (c.focus || 0) + 5);
        setLiveState('witness', 'nervous');
        Game.courtLog('The witness hesitates before answering. Witness -9, Focus +5.', 'good');
      }
    },
    {
      id: 'opponentInterrupts',
      patterns: ['mediaPressure','emotionalAppeal','trapCase'],
      label: 'Opponent interruption',
      run: function(c) {
        c.jury = Math.max(-50, c.jury - 4);
        c.trapActive = Math.max(c.trapActive || 0, 1);
        setLiveState('opp', 'confident');
        Game.courtLog(c.opp.name + ' interrupts with a polished objection. Jury -4, legal trap armed.', 'ai');
      }
    },
    {
      id: 'assistantNote',
      patterns: ['evidenceSuppression','proceduralBattle','contradictionChain'],
      label: 'Assistant note',
      run: function(c) {
        var stmt = Game.currentStatement && Game.currentStatement();
        if (stmt && !c.revealedWeak.includes(c.statementIdx)) c.revealedWeak.push(c.statementIdx);
        c.focus = Math.min(100, (c.focus || 0) + 8);
        Game.courtLog('Second chair slides over a note: "This is the hinge." Weakness revealed, Focus +8.', 'drama');
      }
    },
    {
      id: 'mediaLeak',
      patterns: ['mediaPressure','emotionalAppeal','corruptionFinalCourt'],
      label: 'Media leak',
      run: function(c) {
        var swing = c.lastResult === 'good' && c.lastSide === 'player' ? 8 : -6;
        c.jury = Math.max(-50, Math.min(50, c.jury + swing));
        Game.courtLog('A media alert ripples through the gallery. Jury ' + (swing > 0 ? '+' : '') + swing + '.', swing > 0 ? 'drama' : 'bad');
      }
    },
    {
      id: 'surpriseDocument',
      patterns: ['surpriseWitness','evidenceSuppression','corruptionFinalCourt'],
      label: 'Surprise document',
      run: function(c) {
        var stmt = Game.currentStatement && Game.currentStatement();
        if (stmt && !c.revealedWeak.includes(c.statementIdx)) c.revealedWeak.push(c.statementIdx);
        c.judge = Math.min(100, c.judge + 4);
        Game.courtLog('A sealed document enters the record. The current weakness is now visible. Judge +4.', 'drama');
        directorCutscene('Surprise Evidence', 'A new page changes the shape of the testimony.', 'evidence', 950);
      }
    }
  ];

  function maybeDirectorEvent() {
    var c = S.court;
    if (!c || !c._director || c.ended || c.mode !== 'campaign') return;
    var rule = PATTERN_RULES[c._director.pattern] || PATTERN_RULES.standardTrial;
    if (c.round < 3) return;
    if (c._director.eventBudget <= 0) return;
    if ((c.round - c._director.lastEventRound) < (rule.eventGap || 4)) return;
    var pressure = 0;
    if (c.judge < 45) pressure += 0.05;
    if (Math.abs(c.jury) > 22) pressure += 0.04;
    if (c.witnessConfidence < 42) pressure += 0.04;
    if (Math.random() > (rule.eventRate || 0.12) + pressure) return;
    var candidates = DIRECTOR_EVENTS.filter(function(ev) {
      return !ev.patterns || ev.patterns.indexOf(c._director.pattern) >= 0 || ev.patterns.indexOf(S.caseData.sceneTheme) >= 0;
    });
    var ev = candidates.length ? pick(candidates) : pick(DIRECTOR_EVENTS);
    c._director.eventBudget--;
    c._director.lastEventRound = c.round;
    ev.run(c);
  }

  var _origAfterTurnV3 = Game.afterPlayerTurn && Game.afterPlayerTurn.bind(Game);
  if (_origAfterTurnV3) {
    Game.afterPlayerTurn = function(skipOpp) {
      var out = _origAfterTurnV3.apply(this, arguments);
      if (S.court && !S.court.ended) {
        maybeDirectorEvent();
        refreshLiveStatesFromMeters();
        updateCourtChrome();
      }
      return out;
    };
  }

  var _origOpponentTurnV3 = Game.opponentTurn && Game.opponentTurn.bind(Game);
  if (_origOpponentTurnV3) {
    Game.opponentTurn = function() {
      var c = S.court;
      if (c && c._director) {
        var p = c._director.pattern;
        if (p === 'hostileWitness') c.witnessConfidence = Math.min(130, c.witnessConfidence + 4);
        if (p === 'mediaPressure' && Math.random() < 0.22) c.jury = Math.max(-50, c.jury - 3);
        if (p === 'proceduralBattle' && c.judge < 45 && Math.random() < 0.3) c.trapActive = Math.max(c.trapActive || 0, 1);
      }
      return _origOpponentTurnV3.apply(this, arguments);
    };
  }

  var _origRenderCourtV3 = Game.renderCourt && Game.renderCourt.bind(Game);
  if (_origRenderCourtV3) {
    Game.renderCourt = function() {
      var out = _origRenderCourtV3.apply(this, arguments);
      refreshLiveStatesFromMeters();
      updateCourtChrome();
      enhanceActionButtons();
      return out;
    };
  }

  var _origSwitchToV3 = UI.switchTo && UI.switchTo.bind(UI);
  if (_origSwitchToV3) {
    UI.switchTo = function(phase) {
      var out = _origSwitchToV3.apply(this, arguments);
      document.body.classList.toggle('court-mode', phase === 'court');
      if (phase === 'court') setTimeout(function() { updateCourtChrome(); enhanceActionButtons(); }, 0);
      return out;
    };
  }

  function updateCourtChrome() {
    var court = document.getElementById('court');
    var wrap = document.getElementById('courtCanvasWrap');
    var right = document.getElementById('courtRightPanel');
    if (!court || !wrap || !right) return;
    var bodyPanel = document.getElementById('bodyLangPanel');
    var leftCol = document.querySelector('.court-left-col');
    var statementBox = document.getElementById('statementBox');
    if (bodyPanel && leftCol && !leftCol.contains(bodyPanel)) {
      if (statementBox && statementBox.parentNode === leftCol) leftCol.insertBefore(bodyPanel, statementBox);
      else leftCol.appendChild(bodyPanel);
      bodyPanel.classList.remove('hidden');
    }
    var cd = S.caseData || {};
    normalizeCase(cd);
    Object.keys(SCENE_THEMES).forEach(function(k) { court.classList.remove('scene-theme-' + k); document.body.classList.remove('scene-theme-' + k); });
    court.classList.add('scene-theme-' + (cd.sceneTheme || 'classicCourtroom'));
    document.body.classList.add('scene-theme-' + (cd.sceneTheme || 'classicCourtroom'));
    if (!document.getElementById('courtSceneBanner')) {
      var banner = document.createElement('div');
      banner.id = 'courtSceneBanner';
      banner.className = 'court-scene-banner';
      wrap.appendChild(banner);
    }
    var theme = SCENE_THEMES[cd.sceneTheme] || SCENE_THEMES.classicCourtroom;
    var bannerEl = document.getElementById('courtSceneBanner');
    if (bannerEl) {
      bannerEl.innerHTML =
        '<span class="court-scene-pill">' + escapeHTML(theme.name) + '</span>' +
        '<span class="court-scene-pill muted">' + escapeHTML((patternRule(cd).name || 'Trial')) + '</span>';
    }
    if (!document.getElementById('courtDirectorStrip')) {
      var strip = document.createElement('div');
      strip.id = 'courtDirectorStrip';
      strip.className = 'court-director-strip';
      right.insertBefore(strip, right.firstChild);
    }
    var c = S.court;
    var director = document.getElementById('courtDirectorStrip');
    if (director) {
      var rule = patternRule(cd);
      var path = (c && c._director && c._director.winPath) || rule.winPath;
      director.innerHTML =
        '<div class="court-director-main">' +
          '<span class="court-director-name">' + escapeHTML(rule.name) + '</span>' +
          '<span class="court-director-win">' + escapeHTML(path) + '</span>' +
        '</div>' +
        '<div class="court-director-hint">' + escapeHTML(rule.hint) + '</div>';
    }
  }

  function enhanceActionButtons() {
    var row = document.getElementById('courtActions');
    if (!row) return;
    Array.prototype.forEach.call(row.querySelectorAll('button'), function(btn) {
      var t = (btn.textContent || '').toLowerCase();
      var family = 'core';
      if (/recess|calm|consult|second chair|save/.test(t)) family = 'recovery';
      else if (/closing|reveal|expose|snap|power|paper trail|cold read|corporate pressure/.test(t)) family = 'finisher';
      else if (/summon|press witness/.test(t)) family = 'witness';
      btn.dataset.actionFamily = family;
    });
  }

  function drawRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function strokeRect(ctx, x, y, w, h, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 1;
    ctx.strokeRect(x, y, w, h);
  }

  function drawText(ctx, text, x, y, color, size, align) {
    ctx.fillStyle = color;
    ctx.font = (size || 8) + 'px Courier New';
    ctx.textAlign = align || 'left';
    ctx.fillText(text, x, y);
    ctx.textAlign = 'left';
  }

  function drawCameras(ctx, x, y) {
    for (var i = 0; i < 4; i++) {
      var cx = x + i * 28;
      drawRect(ctx, cx, y, 15, 9, '#111');
      drawRect(ctx, cx + 12, y + 2, 10, 5, '#333');
      drawRect(ctx, cx + 4, y + 9, 2, 22, '#222');
      drawRect(ctx, cx - 2, y + 28, 14, 3, '#222');
      ctx.globalAlpha = 0.16;
      drawRect(ctx, cx + 22, y - 3, 34, 14, '#fff');
      ctx.globalAlpha = 1;
    }
  }

  function drawObservers(ctx, x, y, count, accent) {
    for (var i = 0; i < count; i++) {
      var ox = x + i * 22;
      drawRect(ctx, ox, y + 12, 12, 18, '#19101f');
      ctx.fillStyle = i % 2 ? '#c89b72' : '#e0c0a0';
      ctx.beginPath();
      ctx.arc(ox + 6, y + 7, 6, 0, Math.PI * 2);
      ctx.fill();
      drawRect(ctx, ox + 3, y + 15, 6, 13, accent || '#333');
    }
  }

  function drawThemeScene(ctx, themeId, frame) {
    var t = SCENE_THEMES[themeId] || SCENE_THEMES.classicCourtroom;
    var grad = ctx.createLinearGradient(0, 0, 0, 360);
    grad.addColorStop(0, t.wallTop);
    grad.addColorStop(0.56, t.wallMid);
    grad.addColorStop(1, t.floor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 360);

    drawRect(ctx, 0, 250, 800, 110, t.floor);
    drawRect(ctx, 260, 250, 280, 110, t.carpet);
    for (var fx = 0; fx < 800; fx += themeId === 'corporateTribunal' ? 64 : 42) {
      drawRect(ctx, fx, 250, 1, 110, 'rgba(0,0,0,0.24)');
    }

    if (themeId === 'corporateTribunal') {
      for (var gx = 24; gx < 780; gx += 110) {
        strokeRect(ctx, gx, 46, 86, 96, 'rgba(135,217,255,0.35)', 1);
        drawRect(ctx, gx + 4, 50, 78, 88, 'rgba(15,36,50,0.7)');
        drawText(ctx, 'Q' + ((gx / 110 + 2) | 0), gx + 16, 82, '#87d9ff', 8);
        drawRect(ctx, gx + 12, 100, 54, 3, '#87d9ff');
        drawRect(ctx, gx + 12, 112, 38, 3, '#87d9ff');
      }
      drawObservers(ctx, 52, 186, 5, '#22313d');
      drawObservers(ctx, 622, 186, 5, '#22313d');
    } else if (themeId === 'mediaCourtroom') {
      drawCameras(ctx, 42, 150);
      drawCameras(ctx, 620, 150);
      for (var fl = 0; fl < 5; fl++) {
        if ((frame + fl * 17) % 110 < 7) {
          ctx.globalAlpha = 0.38;
          drawRect(ctx, 70 + fl * 135, 48, 54, 28, '#fff');
          ctx.globalAlpha = 1;
        }
      }
      drawObservers(ctx, 250, 58, 10, '#2a1f3d');
    } else if (themeId === 'emergencyNightHearing') {
      drawRect(ctx, 42, 48, 126, 78, '#040a16');
      strokeRect(ctx, 42, 48, 126, 78, '#73a6ff', 2);
      ctx.fillStyle = '#d8e8ff';
      ctx.beginPath();
      ctx.arc(136, 70, 16, 0, Math.PI * 2);
      ctx.fill();
      drawRect(ctx, 640, 42, 96, 72, '#07111f');
      strokeRect(ctx, 640, 42, 96, 72, '#73a6ff', 1);
      ctx.globalAlpha = 0.18 + 0.05 * Math.sin(frame * 0.04);
      drawRect(ctx, 300, 0, 200, 360, '#73a6ff');
      ctx.globalAlpha = 1;
    } else if (themeId === 'fashionTribunal') {
      drawRect(ctx, 55, 54, 94, 150, '#2c1431');
      drawText(ctx, 'DESIGN BOARD', 66, 72, '#ff7bd6', 7);
      for (var s = 0; s < 5; s++) {
        strokeRect(ctx, 72 + s * 13, 88 + (s % 2) * 18, 22, 34, '#ff7bd6', 1);
      }
      drawRect(ctx, 642, 62, 88, 148, '#2c1431');
      drawText(ctx, 'RUNWAY', 666, 82, '#ff7bd6', 8);
      for (var m = 0; m < 3; m++) {
        drawRect(ctx, 668 + m * 18, 108, 6, 52, '#e8d8c8');
        ctx.beginPath();
        ctx.arc(671 + m * 18, 99, 7, 0, Math.PI * 2);
        ctx.fill();
        drawRect(ctx, 662 + m * 18, 125, 18, 28, m % 2 ? '#ff7bd6' : '#9b326e');
      }
    } else if (themeId === 'grandAppealsCourt') {
      for (var col = 0; col < 5; col++) {
        var px = 70 + col * 165;
        drawRect(ctx, px, 34, 24, 205, '#7d7788');
        drawRect(ctx, px - 6, 28, 36, 10, '#e6d39a');
        drawRect(ctx, px - 5, 236, 34, 8, '#e6d39a');
        for (var flt = 0; flt < 3; flt++) drawRect(ctx, px + 5 + flt * 6, 48, 2, 180, 'rgba(0,0,0,0.18)');
      }
      ctx.strokeStyle = '#e6d39a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(400, 92, 42, 0, Math.PI * 2);
      ctx.stroke();
      drawText(ctx, 'APPEALS', 378, 95, '#e6d39a', 7);
    } else if (themeId === 'privateArbitrationRoom') {
      drawRect(ctx, 170, 112, 460, 74, '#263a32');
      strokeRect(ctx, 170, 112, 460, 74, '#a7d6b8', 2);
      for (var glass = 0; glass < 6; glass++) {
        drawRect(ctx, 205 + glass * 65, 128, 16, 26, 'rgba(226,255,232,0.35)');
      }
      drawRect(ctx, 40, 92, 46, 120, '#1e322b');
      drawRect(ctx, 710, 92, 46, 120, '#1e322b');
      ctx.fillStyle = '#a7d6b8';
      ctx.beginPath(); ctx.arc(63, 82, 22, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(733, 82, 22, 0, Math.PI * 2); ctx.fill();
    } else if (themeId === 'corruptionFinalCourt') {
      for (var bx = 38; bx < 780; bx += 82) {
        drawRect(ctx, bx, 52, 58, 74, '#16080b');
        strokeRect(ctx, bx, 52, 58, 74, '#ff5656', 1);
        drawRect(ctx, bx + 5, 57, 48, 64, 'rgba(255,86,86,0.08)');
      }
      drawCameras(ctx, 48, 160);
      drawObservers(ctx, 606, 168, 6, '#2c1212');
      drawRect(ctx, 70, 286, 90, 40, '#301010');
      drawText(ctx, 'SEALED FILES', 78, 309, '#ff5656', 7);
      if (frame % 90 < 8) {
        ctx.globalAlpha = 0.22;
        drawRect(ctx, 0, 0, 800, 360, '#ffd3a0');
        ctx.globalAlpha = 1;
      }
    } else {
      drawRect(ctx, 38, 70, 88, 52, '#2b3955');
      strokeRect(ctx, 38, 70, 88, 52, '#1d1328', 6);
      drawRect(ctx, 626, 70, 88, 52, '#2b3955');
      strokeRect(ctx, 626, 70, 88, 52, '#1d1328', 6);
      drawObservers(ctx, 54, 178, 4, '#1d1328');
    }

    for (var lx = 80; lx < 760; lx += 170) {
      drawRect(ctx, lx, 30, 52, 7, t.light);
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = t.light;
      ctx.beginPath();
      ctx.moveTo(lx - 20, 37);
      ctx.lineTo(lx + 72, 37);
      ctx.lineTo(lx + 120, 250);
      ctx.lineTo(lx - 70, 250);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    drawRect(ctx, 280, 132, 240, 98, t.bench);
    drawRect(ctx, 280, 132, 240, 7, t.accent);
    drawRect(ctx, 300, 152, 38, 56, 'rgba(0,0,0,0.18)');
    drawRect(ctx, 358, 152, 38, 56, 'rgba(0,0,0,0.18)');
    drawRect(ctx, 416, 152, 38, 56, 'rgba(0,0,0,0.18)');
    drawRect(ctx, 474, 152, 30, 56, 'rgba(0,0,0,0.18)');

    drawRect(ctx, 600, 196, 90, 60, t.desk);
    drawRect(ctx, 600, 196, 90, 5, t.accent);
    drawRect(ctx, 180, 290, 82, 31, t.desk);
    drawRect(ctx, 180, 290, 82, 4, t.accent);
    drawRect(ctx, 540, 290, 82, 31, t.desk);
    drawRect(ctx, 540, 290, 82, 4, t.accent);

    drawRect(ctx, 45, 204, 130, 48, t.desk);
    drawRect(ctx, 45, 204, 130, 4, t.accent);

    drawText(ctx, t.name.toUpperCase().substring(0, 26), 18, 348, t.accent, 8);
  }

  function drawStateFx(ctx, c, frame) {
    if (!c || !c._characterState) return;
    var states = c._characterState;
    function ring(x, y, color, pulse) {
      ctx.globalAlpha = 0.28 + 0.12 * Math.sin(frame * 0.08 + (pulse || 0));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y, 38, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (states.player === 'triumphant' || states.player === 'focused') ring(230, 254, states.player === 'triumphant' ? '#f4d058' : '#64a6ff', 0);
    if (states.player === 'pressured' || states.player === 'shocked') ring(230, 254, '#d44a3a', 1);
    if (states.opp === 'smug' || states.opp === 'confident') ring(590, 254, '#3af4c0', 2);
    if (states.opp === 'rattled' || states.opp === 'annoyed' || states.opp === 'defeated') ring(590, 254, '#ff7b6b', 3);
    if (states.witness === 'sweating' || states.witness === 'nervous' || states.witness === 'panicking' || states.witness === 'broken') {
      for (var i = 0; i < 4; i++) {
        ctx.globalAlpha = 0.65 - i * 0.1;
        ctx.fillStyle = '#8bd8ff';
        ctx.beginPath();
        ctx.arc(650 + i * 5, 172 + ((frame + i * 13) % 30), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (states.judge === 'angry' || states.judge === 'annoyed') {
      ctx.strokeStyle = states.judge === 'angry' ? '#ff5656' : '#f4d058';
      ctx.lineWidth = 2;
      for (var j = 0; j < 4; j++) {
        ctx.beginPath();
        ctx.moveTo(374 + j * 15, 60);
        ctx.lineTo(370 + j * 15, 46);
        ctx.stroke();
      }
    }
  }

  function drawFlashAndFloaters(ctx, canvas) {
    if (canvas.flash > 0) {
      ctx.fillStyle = 'rgba(244, 208, 88, ' + (canvas.flash / 14 * 0.5) + ')';
      ctx.fillRect(0, 0, canvas.w, canvas.h);
    }
    for (var i = 0; i < canvas.floaters.length; i++) {
      var f = canvas.floaters[i];
      var alpha = f.t > 60 ? (90 - f.t) / 30 : 1;
      ctx.font = 'bold 18px Courier New';
      ctx.fillStyle = f.color;
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
  }

  Canvas.drawCourtroom = function() {
    var ctx = this.ctx;
    var c = S.court;
    var cd = S.caseData || {};
    var themeId = (c && c.mode === 'duel') ? 'classicCourtroom' : (cd.sceneTheme || inferScene(cd || {}));
    var frame = this.frame || 0;
    drawThemeScene(ctx, themeId, frame);

    var jb = Math.floor(Math.sin(frame * 0.04) * 1);
    this.drawJudge(360, 72, jb);
    drawRect(ctx, 310, 216, 16, 8, (SCENE_THEMES[themeId] || SCENE_THEMES.classicCourtroom).desk);
    drawRect(ctx, 470, 216, 18, 5, (SCENE_THEMES[themeId] || SCENE_THEMES.classicCourtroom).accent);

    var juryColors = [PAL.hair, PAL.hair2, PAL.hair3, PAL.skinDark];
    for (var i = 0; i < 4; i++) this.drawJuror(55 + i * 30, 178, juryColors[i % 4], i);

    var wb = Math.floor(Math.sin(frame * 0.06) * 1);
    var wState = c && c._characterState ? c._characterState.witness : '';
    this.drawWitness(615, 151, wb, /nervous|sweating|panicking|broken/.test(wState) ? 'scared' : 'normal');

    if (c) {
      var pBob = Math.floor(Math.sin(frame * 0.08) * 1);
      var oBob = Math.floor(Math.sin(frame * 0.08 + 2) * 1);
      var pState = c._characterState && c._characterState.player;
      var oState = c._characterState && c._characterState.opp;
      var pMood = pState === 'objecting' || pState === 'triumphant' || pState === 'focused' ? 'smirk' :
                  pState === 'shocked' || pState === 'pressured' ? 'shocked' : 'normal';
      var oMood = oState === 'angry' || oState === 'annoyed' ? 'angry' :
                  oState === 'rattled' || oState === 'defeated' ? 'shocked' :
                  oState === 'smug' || oState === 'confident' ? 'smirk' : 'normal';
      this.drawLawyer(195, 240, c.player, true, pBob, pMood);
      this.drawLawyer(555, 240, c.opp, false, oBob, oMood);
      ctx.font = '10px Courier New';
      ctx.fillStyle = (SCENE_THEMES[themeId] || SCENE_THEMES.classicCourtroom).accent;
      ctx.textAlign = 'center';
      ctx.fillText((c.player.name || 'You').substring(0, 15), 230, 333);
      ctx.fillText((c.opp.name || 'Opp.').substring(0, 15), 590, 333);
      ctx.textAlign = 'left';
      drawStateFx(ctx, c, frame);
    }

    drawFlashAndFloaters(ctx, this);
  };

  Canvas.bubble = Canvas.bubble && typeof Canvas.bubble === 'object' ? Canvas.bubble : {
    text: '',
    line2: '',
    role: 'player',
    side: 'player',
    timer: 0,
    maxTimer: 90,
    bx: 230,
    by: 215
  };

  Canvas.showBubble = function(rawText, role) {
    if (!this.bubble || typeof this.bubble !== 'object') {
      this.bubble = { text: '', line2: '', role: 'player', side: 'player', timer: 0, maxTimer: 90, bx: 230, by: 215 };
    }
    var cleaned = String(rawText || '').replace(/^[^:]{1,28}:\s*/, '').replace(/["""]/g, '').trim();
    var words = cleaned.split(/\s+/).filter(Boolean).slice(0, 8);
    if (!words.length) return;
    var normalizedRole = role === 'ai' ? 'opponent' : (role || 'player');
    var half = Math.ceil(words.length / 2);
    this.bubble.text = words.slice(0, half).join(' ');
    this.bubble.line2 = words.slice(half).join(' ');
    this.bubble.role = normalizedRole;
    this.bubble.side = normalizedRole;
    this.bubble.maxTimer = this.bubble.maxTimer || 90;
    this.bubble.timer = this.bubble.maxTimer;
    this.bubble.bx = normalizedRole === 'opponent' ? 590 : normalizedRole === 'judge' ? 400 : normalizedRole === 'witness' ? 650 : 230;
    this.bubble.by = normalizedRole === 'judge' ? 135 : normalizedRole === 'witness' ? 185 : 215;
  };

  console.log('[courtExperienceDirector_v3] Scene themes, trial director, evidence timing, live reactions, and court UI cleanup loaded.');
})();

/* ============================================================
 * FINAL POLISH LAYER
 * Small, non-destructive UI/gameplay glue for the newer duel
 * engine and Firebase online flow.
 * ============================================================ */
(function finalPolishLayer() {
  if (typeof Game === 'undefined') return;

  var shownIntros = {};

  function text(el, value) {
    if (el) el.textContent = value == null ? '' : String(value);
  }

  function currentDuelPlayer() {
    if (!S || !S.duel) return null;
    return S.duel.turn === 1 ? S.duel.p1 : S.duel.p2;
  }

  function currentDuelOpponent() {
    if (!S || !S.duel) return null;
    return S.duel.turn === 1 ? S.duel.p2 : S.duel.p1;
  }

  function classifyCourtActions() {
    var row = document.getElementById('courtActions');
    if (!row) return;
    Array.prototype.forEach.call(row.querySelectorAll('button'), function(btn) {
      var t = (btn.textContent || '').toLowerCase();
      var family = 'core';
      if (/pressure|object|cross|argument/.test(t)) family = 'attack';
      if (/calm|recess|consult|read the room|composure|notes/.test(t)) family = 'recovery';
      if (/closing|reveal|expose|pin|power suit|paper trail|cold read|corporate/.test(t)) family = 'finisher';
      if (/witness|summon/.test(t)) family = 'witness';
      btn.dataset.actionFamily = family;
    });
  }

  function ensureDuelTurnPanel() {
    var tactics = document.querySelector('.court-tactics');
    if (!tactics || !S || !S.duel) return null;
    var panel = document.getElementById('duelTurnPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'duelTurnPanel';
      panel.className = 'duel-turn-panel';
      tactics.parentNode.insertBefore(panel, tactics);
    }
    return panel;
  }

  function decorateCourtUI() {
    classifyCourtActions();
    var panel = ensureDuelTurnPanel();
    if (!panel || !S || !S.duel) return;
    var cur = currentDuelPlayer();
    var opp = currentDuelOpponent();
    var total = S.caseData && S.caseData.statements ? S.caseData.statements.length : 0;
    var idx = S.duel.statementIdx != null ? S.duel.statementIdx : (S.duel.stmtIdx || 0);
    var resolved = S.duel.statementsResolved != null ? S.duel.statementsResolved : (S.duel.stmtsResolved || 0);
    var focus = S.duel.focus && S.duel.focus[S.duel.turn] != null ? S.duel.focus[S.duel.turn] : null;
    var online = !!S.duel.online;
    panel.className = 'duel-turn-panel ' + (S.duel.turn === 1 ? 'defense' : 'prosecution') + (online ? ' online' : '');
    panel.innerHTML = '';

    var left = document.createElement('div');
    left.className = 'duel-turn-main';
    var title = document.createElement('span');
    title.className = 'duel-turn-title';
    text(title, (online ? 'Online Duel' : 'Local Duel') + ' - ' + (S.duel.turn === 1 ? 'Defense' : 'Prosecution'));
    var names = document.createElement('span');
    names.className = 'duel-turn-names';
    text(names, (cur ? cur.name : 'Player') + ' vs ' + (opp ? opp.name : 'Opponent'));
    left.appendChild(title);
    left.appendChild(names);

    var right = document.createElement('div');
    right.className = 'duel-turn-stats';
    var caseLine = document.createElement('span');
    text(caseLine, S.caseData ? S.caseData.title : 'Case file loading');
    var stmtLine = document.createElement('span');
    text(stmtLine, total ? ('Statement ' + Math.min(idx + 1, total) + '/' + total + ' - Broken ' + resolved) : 'Statements ready');
    var focusLine = document.createElement('span');
    text(focusLine, focus == null ? ('Round ' + (S.duel.round || 1)) : ('Focus ' + Math.round(focus) + ' - Round ' + (S.duel.round || 1)));
    right.appendChild(caseLine);
    right.appendChild(stmtLine);
    right.appendChild(focusLine);

    panel.appendChild(left);
    panel.appendChild(right);
  }

  function showCaseIntro(label, force) {
    var cd = S && S.caseData;
    if (!cd) return;
    var key = (label || 'case') + ':' + (cd.id || cd.title || 'unknown');
    if (!force && shownIntros[key]) return;
    shownIntros[key] = true;

    var overlay = document.getElementById('cutsceneOverlay');
    var icon = document.getElementById('cutsceneIcon');
    var title = document.getElementById('cutsceneTitle');
    var subtitle = document.getElementById('cutsceneSubtitle');
    if (!overlay || !title || !subtitle) return;
    text(icon, 'CASE');
    text(title, cd.title || 'Case File');
    var witness = cd.witness ? 'Witness: ' + cd.witness.name + ' - ' + cd.witness.role : 'Witness file sealed';
    text(subtitle, witness + '. ' + (cd.intro || 'The court is now in session.'));
    overlay.classList.remove('hidden');
    overlay.classList.add('case-intro-active');
    setTimeout(function() {
      overlay.classList.remove('case-intro-active');
      overlay.classList.add('hidden');
    }, 1450);
  }

  function verdictFanfare(kind) {
    var verdict = document.getElementById('verdict');
    if (!verdict) return;
    var old = document.querySelector('.verdict-fanfare');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var fanfare = document.createElement('div');
    fanfare.className = 'verdict-fanfare ' + (kind || 'neutral');
    for (var i = 0; i < 18; i++) {
      var p = document.createElement('i');
      p.style.setProperty('--x', (Math.cos(i / 18 * Math.PI * 2) * (70 + (i % 4) * 18)).toFixed(1) + 'px');
      p.style.setProperty('--y', (Math.sin(i / 18 * Math.PI * 2) * (50 + (i % 5) * 14)).toFixed(1) + 'px');
      p.style.animationDelay = (i * 18) + 'ms';
      fanfare.appendChild(p);
    }
    verdict.appendChild(fanfare);
    verdict.classList.remove('verdict-won', 'verdict-lost', 'verdict-neutral');
    verdict.classList.add(kind === 'won' ? 'verdict-won' : kind === 'lost' ? 'verdict-lost' : 'verdict-neutral');
    setTimeout(function() { if (fanfare.parentNode) fanfare.parentNode.removeChild(fanfare); }, 1200);
  }

  var origStartDuel = Game.startDuel && Game.startDuel.bind(Game);
  if (origStartDuel) {
    Game.startDuel = function() {
      var out = origStartDuel.apply(this, arguments);
      setTimeout(function() {
        showCaseIntro('local-duel', true);
        decorateCourtUI();
      }, 80);
      return out;
    };
  }

  var origRenderDuelCourt = Game.renderDuelCourt && Game.renderDuelCourt.bind(Game);
  if (origRenderDuelCourt) {
    Game.renderDuelCourt = function() {
      var out = origRenderDuelCourt.apply(this, arguments);
      decorateCourtUI();
      return out;
    };
  }

  var origEndDuelMatch = Game.endDuelMatch && Game.endDuelMatch.bind(Game);
  if (origEndDuelMatch) {
    Game.endDuelMatch = function(winnerName) {
      var out = origEndDuelMatch.apply(this, arguments);
      verdictFanfare(winnerName === 'hung' ? 'neutral' : 'won');
      return out;
    };
  }

  var origEndCasePolish = Game.endCase && Game.endCase.bind(Game);
  if (origEndCasePolish) {
    Game.endCase = function(outcome, settlementAmt) {
      var out = origEndCasePolish.apply(this, arguments);
      verdictFanfare(outcome === 'won' || outcome === 'settle' ? 'won' : outcome === 'lost' ? 'lost' : 'neutral');
      return out;
    };
  }

  window.ObjectionPolish = {
    decorateCourtUI: decorateCourtUI,
    showCaseIntro: showCaseIntro,
    verdictFanfare: verdictFanfare
  };

  console.log('[finalPolishLayer] Duel HUD, case intros, action colors, and verdict fanfare loaded.');
})();
