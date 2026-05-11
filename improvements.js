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
