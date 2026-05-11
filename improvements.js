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
    const deck = fixedShuffled.concat(procedural).sort((a, b) => (a.diff || 1) - (b.diff || 1));
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
      const themes = (typeof RANDOM_THEMES !== 'undefined') ? RANDOM_THEMES : [];
      if (!themes.length) { alert('Daily case unavailable — no themes loaded.'); return; }
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

  console.log('[Suits Improvements v2] loaded — witness personalities, press action, hidden traits, 11 new themes, last-chance objection, combo chains, atmospheric text, daily case, enhanced verdict, career ranks, time pressure mode.');
})();
