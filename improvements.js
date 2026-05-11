/* ============================================================
 * SUITS SIMULATOR — IMPROVEMENTS PATCH
 * Hits four batches: lang fix, random campaign, court combat
 * overhaul (rebuttals + witness summon), meta progression hints.
 * Loaded AFTER game.js to monkey-patch existing systems.
 * ============================================================ */
(function suitsImprovements() {
  if (typeof Game === 'undefined' || typeof I18N === 'undefined') return;

  /* --------------------------------------------------------
   * 1) LANGUAGE TOGGLE BUG FIX
   * Problem: dynamically-rendered buttons captured Arabic text
   * as their "english original", so flipping back kept Arabic.
   * Fix: build a reverse AR→EN map and always normalize buttons
   * to their true English source before re-translating.
   * -------------------------------------------------------- */
  const AR2EN = {};
  Object.entries(AR_PACK.ui.buttons || {}).forEach(([en, ar]) => { AR2EN[ar] = en; });
  Object.entries(AR_PACK.actions || {}).forEach(([id, ar]) => { AR2EN[ar] = ar; }); // skip — actions are id-driven
  // Phase labels reverse map
  const PHASE_AR2EN = {};
  Object.entries(AR_PACK.ui.phases || {}).forEach(([en, ar]) => { PHASE_AR2EN[ar] = en; });

  const _origTranslateBtns = I18N.translateButtonTexts.bind(I18N);
  I18N.translateButtonTexts = function () {
    const ar = this.ar();
    document.querySelectorAll('button').forEach(b => {
      const cur = (b.textContent || '').trim();
      // If the cached "english" is actually Arabic from a polluted prior toggle,
      // fix it now using the reverse map.
      if (b.dataset.enText && AR2EN[b.dataset.enText.trim()]) {
        b.dataset.enText = AR2EN[b.dataset.enText.trim()];
      }
      // If we have no cache yet AND current text is Arabic, recover EN from map.
      if (!b.dataset.enText) {
        b.dataset.enText = AR2EN[cur] || cur;
      }
    });
    _origTranslateBtns();
  };

  /* Same protection for static HTML elements */
  const _origApplyStatic = I18N.applyStatic.bind(I18N);
  I18N.applyStatic = function () {
    // Before running, scrub any dataset.enHtml that looks Arabic (contains AR letters)
    document.querySelectorAll('[data-en-html]').forEach(el => {
      const v = el.dataset.enHtml;
      if (v && /[\u0600-\u06FF]/.test(v)) {
        // Cache is corrupted with Arabic — drop it so it gets re-captured next time we are in EN
        if (!this.ar()) {
          // If currently switching to EN we have nothing to restore — leave content alone
          delete el.dataset.enHtml;
        }
      }
    });
    _origApplyStatic();
  };

  /* Make the toggle robust: if going EN, force a full re-render of every screen
   * so dynamic content rebuilds from source data (which is freshly translated). */
  const _origToggle = I18N.toggle.bind(I18N);
  I18N.toggle = function () {
    _origToggle();
    // Force rebuild of menu/shop/rankings if visible — they have lots of dynamic text
    try {
      if (S.phase === 'menu') Game.buildMenu && Game.buildMenu();
      if (Game.buildShop && document.querySelector('#shop:not(.hidden)')) Game.buildShop();
      if (Game.buildRankings && document.querySelector('#rankings:not(.hidden)')) Game.buildRankings();
    } catch (e) {}
    // Bubble re-trigger so any visible bubble redraws in the new language next tick
    if (Canvas && Canvas.bubble) Canvas.bubble.timer = 0;
  };

  /* --------------------------------------------------------
   * 2) MORE CASE CONTENT + 5 NEW THEMES
   * Adds kidnapping, arson, cybercrime, malpractice, and
   * blackmail to the random generator pool.
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
          evidencePool: ['phone_record', 'cctv_timestamp', 'text_messages', 'bank_transfer', 'witness_statement', 'access_badge_log', 'expert_report', 'police_report'],
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
          evidencePool: ['expert_report', 'cctv_timestamp', 'police_report', 'phone_record', 'bank_transfer', 'witness_statement', 'internal_memo', 'text_messages'],
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
          evidencePool: ['access_badge_log', 'bank_transfer', 'email_thread', 'text_messages', 'expert_report', 'internal_memo', 'phone_record', 'whistle_file'],
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
          evidencePool: ['expert_report', 'internal_memo', 'email_thread', 'witness_statement', 'phone_record', 'whistle_file', 'signed_contract', 'settlement_draft'],
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
          evidencePool: ['text_messages', 'bank_transfer', 'email_thread', 'phone_record', 'witness_statement', 'settlement_draft', 'cctv_timestamp', 'internal_memo'],
        },
      ];
      // Append themes — Game.makeRandomCase reads from the same RANDOM_THEMES array
      try { EXTRA_THEMES.forEach(t => RANDOM_THEMES.push(t)); } catch (e) {}
    } catch (e) { console.warn('Theme extension skipped:', e); }
  }

  /* --------------------------------------------------------
   * 3) CAMPAIGN RANDOMIZATION
   * Shuffle the campaign order AND inject 2 procedural cases
   * between the fixed ones so no two playthroughs match.
   * -------------------------------------------------------- */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Snapshot the original fixed cases once
  const FIXED_CASES = (typeof CASES !== 'undefined') ? CASES.slice() : [];

  function rebuildCampaignDeck() {
    if (typeof CASES === 'undefined' || !FIXED_CASES.length) return;
    // Shuffle fixed cases and intersperse 2-3 procedural cases
    const fixedShuffled = shuffle(FIXED_CASES);
    const proceduralCount = 2 + Math.floor(Math.random() * 2); // 2-3
    const procedural = [];
    for (let i = 0; i < proceduralCount; i++) {
      try { procedural.push(Game.makeRandomCase()); } catch (e) {}
    }
    // Sort all by difficulty for a sensible curve
    const deck = fixedShuffled.concat(procedural).sort((a, b) => (a.diff || 1) - (b.diff || 1));
    // Rewrite CASES in place so existing references still work
    CASES.length = 0;
    deck.forEach(c => CASES.push(c));
    // Re-translate so AR labels apply to the fresh deck
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
    // Translations for new locs
    if (AR_PACK && AR_PACK.locations) {
      Object.assign(AR_PACK.locations, {
        crimescene: ['مسرح الجريمة', 'تجوّل في المكان. اقرأ ما فات الشرطة.'],
        speakeasy:  ['الحانة السرية', 'اعثر على الشاهد الذي لن يتقدم أبداً.'],
        archive:    ['أرشيف الصحف', 'العناوين القديمة تخفي أنماطاً دفنها الادعاء.'],
      });
      try { I18N.translateData(); } catch (e) {}
    }
  }

  // Bump investigation visits to 5
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
   * Real back-and-forth: opponent reacts in court log + bubble
   * after objections, evidence presentations, and cross-exams.
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

  // Hook into resolveObjection
  const _origResolveObj = Game.resolveObjection && Game.resolveObjection.bind(Game);
  if (_origResolveObj) {
    Game.resolveObjection = function (type) {
      _origResolveObj(type);
      const c = S.court;
      if (!c || c.ended) return;
      oppRebut(c.lastResult === 'good' ? 'obj_good' : 'obj_bad');
    };
  }

  // Hook into present evidence (find the right name)
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

  // Hook into cross-examine
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

  // Hook into pressure
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
   * Adds a 1-per-trial action that introduces a friendly
   * witness who removes one statement from the testimony.
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

    // Mechanical effect: reveal one weakness, jury swing, opp credibility hit
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

  // Inject the summon button into the court action bar
  const _origRenderActions = Game.renderActions && Game.renderActions.bind(Game);
  if (_origRenderActions) {
    Game.renderActions = function () {
      _origRenderActions();
      // Only in court phase
      if (S.phase !== 'court' || !S.court || S.court.ended) return;
      const bar = document.getElementById('courtActions');
      if (!bar) return;
      if (bar.querySelector('[data-act="summon-witness"]')) return; // already there
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
   * 7) NEW CAREER CONFIRMATION
   * "Start Campaign" while a saved career exists should ask
   * before wiping progress.
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

  console.log('[Suits Improvements] loaded — lang fix, randomized campaign, +5 themes, +3 locations, 5 visits, opposing-lawyer rebuttals, witness summon.');
})();
