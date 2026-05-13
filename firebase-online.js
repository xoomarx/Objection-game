/* ============================================================
 * Objection! Power Suit - Firebase Online Duel COMPLETE FIX
 * - Replaces the old PeerJS/WebRTC flow.
 * - Keeps both players in a Firebase lobby until the host starts.
 * - Syncs duel state through Firebase so each player can play from their own browser.
 * ============================================================ */
(function () {
  'use strict';

  // PASTE YOUR FIREBASE WEB APP CONFIG HERE.
  // Firebase Console -> Project Overview -> Web app </> -> firebaseConfig
  const firebaseConfig = {
  apiKey: "AIzaSyAtSclNannmL80K8LkenyWgDdvjUuaxhew",
  authDomain: "objection-e892f.firebaseapp.com",
  databaseURL: "https://objection-e892f-default-rtdb.firebaseio.com",
  projectId: "objection-e892f",
  storageBucket: "objection-e892f.firebasestorage.app",
  messagingSenderId: "150068480059",
  appId: "1:150068480059:web:d23cc1167387eb647a741e",
  measurementId: "G-3V0VFDTJ3R"
};

  const $ = (id) => document.getElementById(id);

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function safeText(v, fallback) {
    v = String(v || '').trim();
    return v || fallback;
  }

  function safeNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function makePlayerChoice(role) {
    return {
      name: role === 'host' ? 'P1' : 'P2',
      style: role === 'host' ? 'closer' : 'strategist',
      ready: false
    };
  }

  const OnlineFirebase = {
    db: null,
    roomCode: '',
    roomRef: null,
    role: '',
    playerId: '',
    started: false,
    suppressSync: false,
    lastStateJson: '',
    selectedCaseId: '',
    original: {},

    configured() {
      return firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('PASTE_') &&
             firebaseConfig.appId && !firebaseConfig.appId.includes('PASTE_') &&
             firebaseConfig.messagingSenderId && !firebaseConfig.messagingSenderId.includes('PASTE_') &&
             firebaseConfig.databaseURL;
    },

    initFirebase() {
      if (!this.configured()) {
        this.status('Firebase is not configured yet. Open <b>firebase-online.js</b> and paste your real Firebase web app config at the top.');
        return false;
      }
      if (!window.firebase || !firebase.initializeApp || !firebase.database) {
        this.status('Firebase SDK did not load. Check the script tags at the bottom of index.html.');
        return false;
      }
      try {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        this.db = firebase.database();
        return true;
      } catch (err) {
        this.status('Firebase failed to start: ' + (err && err.message ? err.message : err));
        return false;
      }
    },

    makeCode() {
      return Math.random().toString(36).slice(2, 7).toUpperCase();
    },

    ensurePanel() {
      let panel = $('firebaseOnlinePanel');
      if (panel) return panel;

      panel = document.createElement('div');
      panel.id = 'firebaseOnlinePanel';
      panel.className = 'hidden';
      panel.innerHTML = `
        <div class="firebase-online-card" role="dialog" aria-modal="true" aria-labelledby="firebaseOnlineTitle">
          <h2 id="firebaseOnlineTitle">🌐 Online Duel</h2>
          <p class="intro">Create a room, send your friend the code, choose your lawyers, then the host starts the duel.</p>

          <div class="firebase-online-actions" id="firebaseMainActions">
            <button class="big primary" id="firebaseCreateRoomBtn" type="button">Create Room</button>
            <button class="big" id="firebaseShowJoinBtn" type="button">Join Room</button>
            <button class="big" id="firebaseCloseBtn" type="button">Back</button>
          </div>

          <div id="firebaseJoinBox" class="hidden center firebase-section">
            <input id="firebaseRoomInput" maxlength="8" placeholder="Enter room code" autocomplete="off" spellcheck="false">
            <button class="big primary" id="firebaseJoinBtn" type="button">Join</button>
          </div>

          <div id="firebaseRoomBox" class="hidden center firebase-section">
            <p>Room Code:</p>
            <div class="firebase-room-code" id="firebaseRoomCode">-----</div><br>
            <button class="big" id="firebaseCopyBtn" type="button">Copy Code</button>
          </div>

          <div id="firebaseLobbyBox" class="hidden firebase-section">
            <h3>Lobby</h3>
            <div class="firebase-players">
              <div class="firebase-player-card">
                <h3>Player 1 / Host</h3>
                <input id="firebaseHostName" maxlength="16" placeholder="Host name" value="P1">
                <div id="firebaseHostStyles" class="style-grid small"></div>
                <div id="firebaseHostStatus" class="small">Waiting...</div>
              </div>
              <div class="firebase-player-card">
                <h3>Player 2 / Guest</h3>
                <input id="firebaseGuestName" maxlength="16" placeholder="Guest name" value="P2">
                <div id="firebaseGuestStyles" class="style-grid small"></div>
                <div id="firebaseGuestStatus" class="small">Waiting...</div>
              </div>
            </div>
            <div class="firebase-case-card">
              <div class="firebase-case-head">
                <span>Case File</span>
                <span id="firebaseCaseLock" class="small">Host chooses the docket</span>
              </div>
              <select id="firebaseCaseSelect" class="firebase-case-select"></select>
              <div id="firebaseCasePreview" class="firebase-case-preview">Pick a case before the duel starts.</div>
            </div>
            <p id="firebaseLobbyInfo" class="center">Waiting...</p>
            <div class="center">
              <button class="big primary hidden" id="firebaseStartDuelBtn" type="button">Start Duel</button>
              <button class="big" id="firebaseLeaveBtn" type="button">Leave Room</button>
            </div>
          </div>

          <div id="firebaseOnlineStatus" class="firebase-online-status">Ready.</div>
          <p class="firebase-online-note">During the duel, only the player whose turn it is can click actions.</p>
        </div>
      `;
      document.body.appendChild(panel);

      $('firebaseCreateRoomBtn').addEventListener('click', () => this.createRoom());
      $('firebaseShowJoinBtn').addEventListener('click', () => {
        $('firebaseJoinBox').classList.remove('hidden');
        this.status('Paste the room code from your friend.');
        const input = $('firebaseRoomInput');
        if (input) input.focus();
      });
      $('firebaseJoinBtn').addEventListener('click', () => this.joinRoom(($('firebaseRoomInput') || {}).value || ''));
      $('firebaseCopyBtn').addEventListener('click', () => this.copyCode());
      $('firebaseCloseBtn').addEventListener('click', () => this.hidePanel());
      $('firebaseLeaveBtn').addEventListener('click', () => this.leaveRoom());
      $('firebaseStartDuelBtn').addEventListener('click', () => this.requestStartDuel());
      $('firebaseHostName').addEventListener('input', () => this.updateMyChoice());
      $('firebaseGuestName').addEventListener('input', () => this.updateMyChoice());
      const caseSelect = $('firebaseCaseSelect');
      if (caseSelect) caseSelect.addEventListener('change', () => this.updateSelectedCase(caseSelect.value));
      panel.addEventListener('click', (e) => { if (e.target === panel) this.hidePanel(); });

      this.buildStyleGrid('firebaseHostStyles', 'host');
      this.buildStyleGrid('firebaseGuestStyles', 'guest');
      this.buildCaseSelect();

      return panel;
    },

    buildStyleGrid(targetId, choiceRole) {
      const grid = $(targetId);
      if (!grid || typeof STYLES === 'undefined') return;
      grid.innerHTML = '';
      Object.values(STYLES).forEach((st, index) => {
        const card = document.createElement('div');
        card.className = 'style-card';
        card.dataset.style = st.id;
        card.innerHTML = `<h3>${st.name}</h3><div style="font-size:11px">${st.desc}</div>`;
        card.addEventListener('click', () => {
          if ((choiceRole === 'host' && this.role !== 'host') || (choiceRole === 'guest' && this.role !== 'guest')) return;
          grid.querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          this.updateMyChoice(st.id);
        });
        grid.appendChild(card);
        if ((choiceRole === 'host' && st.id === 'closer') || (choiceRole === 'guest' && st.id === 'strategist') || index === 0) {
          if ((choiceRole === 'host' && st.id === 'closer') || (choiceRole === 'guest' && st.id === 'strategist')) card.classList.add('selected');
        }
      });
    },

    setLobbyEditable() {
      const hostCanEdit = this.role === 'host';
      const guestCanEdit = this.role === 'guest';
      const hostName = $('firebaseHostName');
      const guestName = $('firebaseGuestName');
      const caseSelect = $('firebaseCaseSelect');
      if (hostName) hostName.disabled = !hostCanEdit;
      if (guestName) guestName.disabled = !guestCanEdit;
      if (caseSelect) caseSelect.disabled = !hostCanEdit;
      document.querySelectorAll('#firebaseHostStyles .style-card').forEach(el => el.style.pointerEvents = hostCanEdit ? '' : 'none');
      document.querySelectorAll('#firebaseGuestStyles .style-card').forEach(el => el.style.pointerEvents = guestCanEdit ? '' : 'none');
    },

    caseList() {
      if (typeof CASES === 'undefined' || !Array.isArray(CASES)) return [];
      return CASES.filter(c => c && c.id && c.title && c.statements && c.statements.length);
    },

    caseById(caseId) {
      const list = this.caseList();
      return list.find(c => c.id === caseId) || list[0] || null;
    },

    buildCaseSelect() {
      const select = $('firebaseCaseSelect');
      if (!select) return;
      const cases = this.caseList();
      select.innerHTML = '';
      cases.forEach((c, index) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.title + ' (' + c.statements.length + ' statements)';
        select.appendChild(opt);
        if (!this.selectedCaseId && index === 0) this.selectedCaseId = c.id;
      });
      if (this.selectedCaseId) select.value = this.selectedCaseId;
      this.updateCasePreview();
    },

    updateCasePreview(caseId) {
      if (caseId) this.selectedCaseId = caseId;
      const select = $('firebaseCaseSelect');
      if (select && this.selectedCaseId && select.value !== this.selectedCaseId) select.value = this.selectedCaseId;
      const preview = $('firebaseCasePreview');
      const c = this.caseById(this.selectedCaseId);
      if (!preview || !c) return;
      const diff = c.diff ? 'Difficulty ' + c.diff : 'Duel case';
      const witness = c.witness ? 'Witness: ' + c.witness.name + ' - ' + c.witness.role : 'Witness file sealed';
      preview.textContent = diff + ' | ' + witness + ' | ' + (c.intro || 'No intro available.');
    },

    async updateSelectedCase(caseId) {
      const picked = this.caseById(caseId);
      if (!picked) return;
      this.selectedCaseId = picked.id;
      this.updateCasePreview(picked.id);
      if (!this.roomRef || this.role !== 'host') return;
      try { await this.roomRef.update({ selectedCaseId: picked.id }); } catch (e) {}
    },

    selectedStyle(choiceRole) {
      const grid = choiceRole === 'host' ? $('firebaseHostStyles') : $('firebaseGuestStyles');
      const selected = grid && grid.querySelector('.style-card.selected');
      if (selected) return selected.dataset.style;
      return choiceRole === 'host' ? 'closer' : 'strategist';
    },

    showPanel() {
      const panel = this.ensurePanel();
      panel.classList.remove('hidden');
      this.setLobbyEditable();
      if (!this.roomRef) this.status('Ready. Create a room or join with a code.');
    },

    hidePanel() {
      const panel = $('firebaseOnlinePanel');
      if (panel) panel.classList.add('hidden');
    },

    status(html) {
      const el = $('firebaseOnlineStatus');
      if (el) el.innerHTML = html;
    },

    showLobby(info, canStart) {
      const lobby = $('firebaseLobbyBox');
      const lobbyInfo = $('firebaseLobbyInfo');
      const startBtn = $('firebaseStartDuelBtn');
      if (lobby) lobby.classList.remove('hidden');
      if (lobbyInfo) lobbyInfo.textContent = info || 'Waiting...';
      if (startBtn) startBtn.classList.toggle('hidden', !canStart);
      this.setLobbyEditable();
    },

    async createRoom() {
      this.showPanel();
      if (!this.initFirebase()) return;

      this.roomCode = this.makeCode();
      this.playerId = 'host_' + Math.random().toString(36).slice(2);
      this.role = 'host';
      this.started = false;
      this.roomRef = this.db.ref('rooms/' + this.roomCode);

      const hostChoice = makePlayerChoice('host');
      hostChoice.name = safeText(($('firebaseHostName') || {}).value, 'P1');
      hostChoice.style = this.selectedStyle('host');
      hostChoice.ready = true;
      const pickedCase = this.caseById(this.selectedCaseId);
      if (pickedCase) this.selectedCaseId = pickedCase.id;

      try {
        await this.roomRef.set({
          createdAt: Date.now(),
          status: 'waiting',
          host: this.playerId,
          guest: null,
          choices: { host: hostChoice, guest: makePlayerChoice('guest') },
          selectedCaseId: pickedCase ? pickedCase.id : '',
          duelState: null,
          winner: null,
          started: false,
          startedAt: null
        });
        $('firebaseRoomCode').textContent = this.roomCode;
        $('firebaseRoomBox').classList.remove('hidden');
        $('firebaseJoinBox').classList.add('hidden');
        this.showLobby('Waiting for your friend to join...', false);
        this.status('Room created. Send this code to your friend.');
        this.listen();
      } catch (err) {
        this.status('Could not create room: ' + (err && err.message ? err.message : err));
      }
    },

    async joinRoom(code) {
      this.showPanel();
      code = String(code || '').trim().toUpperCase();
      if (!code) { this.status('Enter a room code first.'); return; }
      if (!this.initFirebase()) return;

      this.roomCode = code;
      this.playerId = 'guest_' + Math.random().toString(36).slice(2);
      this.role = 'guest';
      this.started = false;
      this.roomRef = this.db.ref('rooms/' + this.roomCode);

      const guestChoice = makePlayerChoice('guest');
      guestChoice.name = safeText(($('firebaseGuestName') || {}).value, 'P2');
      guestChoice.style = this.selectedStyle('guest');
      guestChoice.ready = true;

      try {
        const snap = await this.roomRef.get();
        if (!snap.exists()) { this.status('Room not found. Check the code and try again.'); return; }
        await this.roomRef.update({ guest: this.playerId, status: 'connected', 'choices/guest': guestChoice });
        $('firebaseRoomCode').textContent = this.roomCode;
        $('firebaseRoomBox').classList.remove('hidden');
        $('firebaseJoinBox').classList.add('hidden');
        this.showLobby('Connected. Choose your lawyer, then wait for host to start.', false);
        this.status('Joined room ' + this.roomCode + '. Stay on this screen.');
        this.listen();
      } catch (err) {
        this.status('Could not join room: ' + (err && err.message ? err.message : err));
      }
    },

    async updateMyChoice(styleOverride) {
      if (!this.roomRef || !this.role) return;
      const path = this.role === 'host' ? 'choices/host' : 'choices/guest';
      const nameInput = this.role === 'host' ? $('firebaseHostName') : $('firebaseGuestName');
      const choice = {
        name: safeText(nameInput && nameInput.value, this.role === 'host' ? 'P1' : 'P2'),
        style: styleOverride || this.selectedStyle(this.role),
        ready: true
      };
      try { await this.roomRef.child(path).update(choice); } catch (e) {}
    },

    applyChoices(room) {
      const host = (room.choices && room.choices.host) || makePlayerChoice('host');
      const guest = (room.choices && room.choices.guest) || makePlayerChoice('guest');
      if ($('firebaseHostName') && this.role !== 'host') $('firebaseHostName').value = host.name || 'P1';
      if ($('firebaseGuestName') && this.role !== 'guest') $('firebaseGuestName').value = guest.name || 'P2';
      this.markStyle('firebaseHostStyles', host.style || 'closer');
      this.markStyle('firebaseGuestStyles', guest.style || 'strategist');
      if ($('firebaseHostStatus')) $('firebaseHostStatus').textContent = host.ready ? 'Ready' : 'Waiting';
      if ($('firebaseGuestStatus')) $('firebaseGuestStatus').textContent = room.guest ? (guest.ready ? 'Ready' : 'Choosing') : 'Waiting for guest';
      if (room.selectedCaseId) this.updateCasePreview(room.selectedCaseId);
    },

    markStyle(gridId, styleId) {
      const grid = $(gridId);
      if (!grid) return;
      grid.querySelectorAll('.style-card').forEach(el => el.classList.toggle('selected', el.dataset.style === styleId));
    },

    listen() {
      if (!this.roomRef) return;
      this.roomRef.off();
      this.roomRef.on('value', (snap) => {
        const room = snap.val();
        if (!room) return;
        this.applyChoices(room);

        if (room.status === 'connected') {
          if (this.role === 'host') {
            this.showLobby('Friend connected. Click Start Duel when both choices look right.', true);
            this.status('Both players are connected in room ' + this.roomCode + '.');
          } else {
            this.showLobby('Connected. Waiting for host to start the duel...', false);
            this.status('Both players are connected in room ' + this.roomCode + '.');
          }
        } else if (room.status === 'waiting') {
          this.showLobby('Waiting for your friend to join...', false);
        }

        if (room.duelState) {
          this.receiveDuelState(room.duelState);
        }

        if (room.winner && !this.suppressSync && typeof S !== 'undefined' && S.phase !== 'verdict') {
          this.suppressSync = true;
          try { Game.endDuel(room.winner); } catch (e) {}
          this.suppressSync = false;
        }
      });
    },

    makeDuelState(room) {
      const hostChoice = (room.choices && room.choices.host) || makePlayerChoice('host');
      const guestChoice = (room.choices && room.choices.guest) || makePlayerChoice('guest');
      const p1Style = STYLES[hostChoice.style] || STYLES.closer || Object.values(STYLES)[0];
      const p2Style = STYLES[guestChoice.style] || STYLES.strategist || Object.values(STYLES)[1] || Object.values(STYLES)[0];

      // Pick a real case so both players fight over the same witness and statements.
      const pickedCase = this.caseById(room.selectedCaseId || this.selectedCaseId);
      const caseId = pickedCase ? pickedCase.id : null;
      this.selectedCaseId = caseId || this.selectedCaseId;
      const evidencePool = pickedCase && pickedCase.evidencePool && pickedCase.evidencePool.length
        ? pickedCase.evidencePool
        : (typeof EVIDENCE !== 'undefined' ? Object.keys(EVIDENCE || {}) : []);

      const dealHand = () => {
        const shuffled = evidencePool.slice().sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(5, shuffled.length)).map(id => ({
          id, ...(EVIDENCE && EVIDENCE[id] ? EVIDENCE[id] : { name: id, cost: 1, strength: 5, risk: 1, desc: '' }), used: false
        }));
      };

      // Pre-reveal 2 statement hints like local duel does
      const stmtCount = pickedCase ? pickedCase.statements.length : 0;
      const allIdxs = Array.from({ length: stmtCount }, (_, i) => i).sort(() => Math.random() - 0.5);
      const revealedWeak = allIdxs.slice(0, Math.min(2, stmtCount));

      return {
        active: true,
        online: true,
        caseId,
        turn: 1,
        ended: false,
        p1: {
          name: safeText(hostChoice.name, 'P1'), style: p1Style.id, tieColor: p1Style.tieColor, hairColor: p1Style.hairColor,
          cred: 100, hand: dealHand(), specialUses: p1Style.special.uses, stats: p1Style.stats
        },
        p2: {
          name: safeText(guestChoice.name, 'P2'), style: p2Style.id, tieColor: p2Style.tieColor, hairColor: p2Style.hairColor,
          cred: 100, hand: dealHand(), specialUses: p2Style.special.uses, stats: p2Style.stats
        },
        jury: 0, judge: 100, witnessConfidence: 100,
        round: 1, maxRounds: pickedCase ? Math.max(24, 18 + pickedCase.statements.length * 3) : 24,
        recess: { 1: 2, 2: 2 },
        focus: { 1: 25, 2: 25 },
        combo: { 1: 0, 2: 0 },
        statementIdx: 0,
        statementsResolved: 0,
        lastSpokenStatement: -1,
        lastResult: null,
        lastSide: null,
        stmtIdx: 0,
        stmtsResolved: 0,
        revealedWeak,
        p1Resolved: 0,
        p2Resolved: 0,
      };
    },

    async requestStartDuel() {
      if (!this.roomRef || this.role !== 'host') return;
      try {
        const snap = await this.roomRef.get();
        const room = snap.val() || {};
        if (!room.guest) { this.status('Your friend has not joined yet.'); return; }
        const duelState = this.makeDuelState(room);
        // Show case title to host before starting
        if (duelState.caseId && typeof CASES !== 'undefined') {
          const c = CASES.find(x => x.id === duelState.caseId);
          if (c) this.status('Starting duel — Case: <b>' + c.title + '</b>');
        }
        await this.roomRef.update({ duelState, started: true, startedAt: Date.now(), status: 'started', winner: null });
        this.receiveDuelState(duelState);
      } catch (err) {
        this.status('Could not start duel: ' + (err && err.message ? err.message : err));
      }
    },

    async leaveRoom() {
      try {
        if (this.roomRef) {
          if (this.role === 'host') await this.roomRef.remove();
          else await this.roomRef.update({ guest: null, status: 'waiting', started: false, duelState: null, winner: null, 'choices/guest': makePlayerChoice('guest') });
          this.roomRef.off();
        }
      } catch (e) {}
      this.roomRef = null;
      this.roomCode = '';
      this.role = '';
      this.playerId = '';
      this.started = false;
      const lobby = $('firebaseLobbyBox');
      if (lobby) lobby.classList.add('hidden');
      const roomBox = $('firebaseRoomBox');
      if (roomBox) roomBox.classList.add('hidden');
      this.status('Left room. Create a room or join with a code.');
    },

    copyCode() {
      const code = this.roomCode || (($('firebaseRoomCode') || {}).textContent || '');
      if (!code) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => this.status('Copied room code.')).catch(() => this.status('Copy failed. Select the code manually.'));
      } else {
        this.status('Select and copy the room code manually.');
      }
    },

    localPlayerNum() {
      return this.role === 'host' ? 1 : 2;
    },

    isMyTurn() {
      return !!(typeof S !== 'undefined' && S.duel && S.duel.turn === this.localPlayerNum());
    },

    normalizeDuelState(rawState) {
      const state = clone(rawState || {});
      const caseData = this.caseById(state.caseId);
      const p1Style = state.p1 && state.p1.style && STYLES[state.p1.style] ? STYLES[state.p1.style] : STYLES.closer || Object.values(STYLES)[0];
      const p2Style = state.p2 && state.p2.style && STYLES[state.p2.style] ? STYLES[state.p2.style] : STYLES.strategist || Object.values(STYLES)[1] || Object.values(STYLES)[0];
      const stmtIdx = safeNumber(state.statementIdx != null ? state.statementIdx : state.stmtIdx, 0);
      const resolved = safeNumber(state.statementsResolved != null ? state.statementsResolved : state.stmtsResolved, 0);

      state.active = true;
      state.online = true;
      state.caseId = state.caseId || (caseData && caseData.id) || null;
      state.turn = state.turn === 2 ? 2 : 1;
      state.ended = !!state.ended;
      state.p1 = state.p1 || {};
      state.p2 = state.p2 || {};
      state.p1.name = safeText(state.p1.name, 'P1');
      state.p2.name = safeText(state.p2.name, 'P2');
      state.p1.style = state.p1.style || p1Style.id;
      state.p2.style = state.p2.style || p2Style.id;
      state.p1.tieColor = state.p1.tieColor || p1Style.tieColor;
      state.p2.tieColor = state.p2.tieColor || p2Style.tieColor;
      state.p1.hairColor = state.p1.hairColor || p1Style.hairColor;
      state.p2.hairColor = state.p2.hairColor || p2Style.hairColor;
      state.p1.stats = state.p1.stats || p1Style.stats;
      state.p2.stats = state.p2.stats || p2Style.stats;
      state.p1.cred = safeNumber(state.p1.cred, 100);
      state.p2.cred = safeNumber(state.p2.cred, 100);
      state.p1.hand = Array.isArray(state.p1.hand) ? state.p1.hand : [];
      state.p2.hand = Array.isArray(state.p2.hand) ? state.p2.hand : [];
      state.p1.specialUses = safeNumber(state.p1.specialUses, (p1Style.special && p1Style.special.uses) || 0);
      state.p2.specialUses = safeNumber(state.p2.specialUses, (p2Style.special && p2Style.special.uses) || 0);
      state.jury = safeNumber(state.jury, 0);
      state.judge = safeNumber(state.judge, 100);
      state.witnessConfidence = safeNumber(state.witnessConfidence, 100);
      state.round = safeNumber(state.round, 1);
      state.maxRounds = safeNumber(state.maxRounds, caseData ? Math.max(24, 18 + caseData.statements.length * 3) : 24);
      state.recess = state.recess || { 1: 2, 2: 2 };
      state.focus = state.focus || { 1: 25, 2: 25 };
      state.combo = state.combo || { 1: 0, 2: 0 };
      state.statementIdx = stmtIdx;
      state.statementsResolved = resolved;
      state.stmtIdx = stmtIdx;
      state.stmtsResolved = resolved;
      state.revealedWeak = Array.isArray(state.revealedWeak) ? state.revealedWeak : [];
      state.p1Resolved = safeNumber(state.p1Resolved, 0);
      state.p2Resolved = safeNumber(state.p2Resolved, 0);
      state.lastSpokenStatement = safeNumber(state.lastSpokenStatement, -1);
      state.lastResult = state.lastResult || null;
      state.lastSide = state.lastSide || null;
      return { state, caseData };
    },

    receiveDuelState(duelState) {
      const json = JSON.stringify(duelState || {});
      if (!duelState || json === this.lastStateJson) return;
      this.lastStateJson = json;
      this.hidePanel();
      this.suppressSync = true;
      try {
        const firstOnlineRender = !(typeof S !== 'undefined' && S.duel && S.duel.online && S.phase === 'court');
        const normalized = this.normalizeDuelState(duelState);
        const state = normalized.state;
        if (typeof S !== 'undefined') {
          S.player = null;
          S.caseData = normalized.caseData;
          S.duel = state;
          S.duel.localPlayer = this.localPlayerNum();
          S.court = {
            mode: 'duel',
            player: S.duel.turn === 1 ? S.duel.p1 : S.duel.p2,
            opp: S.duel.turn === 1
              ? { name: S.duel.p2.name, tieColor: S.duel.p2.tieColor, hairColor: S.duel.p2.hairColor, personality: 'neutral' }
              : { name: S.duel.p1.name, tieColor: S.duel.p1.tieColor, hairColor: S.duel.p1.hairColor, personality: 'neutral' },
            ended: !!S.duel.ended,
            witnessConfidence: S.duel.witnessConfidence,
            lastResult: null,
            lastSide: null
          };
        }
        const passOverlay = $('passControllerOverlay');
        if (passOverlay) passOverlay.classList.add('hidden');
        // Update topbar labels for online duel
        if (typeof UI !== 'undefined') {
          const cLabel = document.getElementById('caseLabel');
          const pLabel = document.getElementById('playerLabel');
          if (cLabel && S.caseData) cLabel.textContent = '🌐 Online: ' + S.caseData.title;
          if (pLabel) pLabel.textContent = (S.duel.p1.name) + ' vs ' + (S.duel.p2.name);
          const topbar = document.getElementById('topbar');
          if (topbar) topbar.classList.remove('hidden');
        }
        if (firstOnlineRender && typeof Snd !== 'undefined') { try { Snd.stopMurmur(); Snd.gavel(); Snd.murmur(); } catch (e) {} }
        if (typeof UI !== 'undefined' && typeof UI.switchTo === 'function') UI.switchTo('court');
        if (typeof Game !== 'undefined' && typeof Game.renderDuel === 'function') Game.renderDuel();
        if (window.ObjectionPolish && typeof window.ObjectionPolish.decorateCourtUI === 'function') {
          window.ObjectionPolish.decorateCourtUI();
          if (firstOnlineRender && typeof window.ObjectionPolish.showCaseIntro === 'function') {
            window.ObjectionPolish.showCaseIntro('online-duel', true);
          }
        }
      } catch (err) {
        console.warn('Could not receive online duel state:', err);
      }
      this.suppressSync = false;
    },

    async pushDuelState() {
      if (!this.roomRef || this.suppressSync || typeof S === 'undefined' || !S.duel) return;
      const state = clone(S.duel);
      delete state.localPlayer;
      state.online = true;
      state.active = true;
      state.stmtIdx = state.statementIdx != null ? state.statementIdx : state.stmtIdx;
      state.stmtsResolved = state.statementsResolved != null ? state.statementsResolved : state.stmtsResolved;
      const json = JSON.stringify(state);
      this.lastStateJson = json;
      try { await this.roomRef.child('duelState').set(state); } catch (err) { console.warn('Duel sync failed:', err); }
    },

    async pushWinner(winnerName) {
      if (!this.roomRef || this.suppressSync) return;
      try { await this.roomRef.update({ winner: winnerName, 'duelState/ended': true }); } catch (err) { console.warn('Winner sync failed:', err); }
    },

    patchGame() {
      if (typeof Game === 'undefined' || Game.__firebaseOnlineCompletePatch) return;
      Game.__firebaseOnlineCompletePatch = true;

      this.original.renderDuel = Game.renderDuel ? Game.renderDuel.bind(Game) : null;
      this.original.duelAction = Game.duelAction ? Game.duelAction.bind(Game) : null;
      this.original.duelPresent = Game.duelPresent ? Game.duelPresent.bind(Game) : null;
      this.original.duelCourtAction = Game.duelCourtAction ? Game.duelCourtAction.bind(Game) : null;
      this.original.duelCourtPresent = Game.duelCourtPresent ? Game.duelCourtPresent.bind(Game) : null;
      this.original.duelPassTurn = Game.duelPassTurn ? Game.duelPassTurn.bind(Game) : null;
      this.original.endDuel = Game.endDuel ? Game.endDuel.bind(Game) : null;
      this.original.endDuelMatch = Game.endDuelMatch ? Game.endDuelMatch.bind(Game) : null;
      this.original.toMenu = Game.toMenu ? Game.toMenu.bind(Game) : null;

      if (this.original.renderDuel) {
        Game.renderDuel = (...args) => {
          const out = this.original.renderDuel(...args);
          this.applyTurnLock();
          return out;
        };
      }

      if (this.original.duelAction) {
        Game.duelAction = (id) => {
          if (this.roomRef && !this.isMyTurn()) { this.showTurnToast(); return; }
          const out = this.original.duelAction(id);
          this.pushDuelState();
          return out;
        };
      }

      if (this.original.duelPresent) {
        Game.duelPresent = (idx) => {
          if (this.roomRef && !this.isMyTurn()) { this.showTurnToast(); return; }
          const out = this.original.duelPresent(idx);
          this.pushDuelState();
          return out;
        };
      }

      if (this.original.duelCourtAction) {
        Game.duelCourtAction = (id) => {
          if (this.roomRef && !this.isMyTurn()) { this.showTurnToast(); return; }
          const out = this.original.duelCourtAction(id);
          if (this.roomRef && id === 'd_object') this.patchObjectionChoices();
          this.pushDuelState();
          return out;
        };
      }

      if (this.original.duelCourtPresent) {
        Game.duelCourtPresent = (idx) => {
          if (this.roomRef && !this.isMyTurn()) { this.showTurnToast(); return; }
          const out = this.original.duelCourtPresent(idx);
          this.pushDuelState();
          return out;
        };
      }

      if (this.original.duelPassTurn) {
        Game.duelPassTurn = (...args) => {
          if (this.roomRef && typeof S !== 'undefined' && S.duel && S.duel.online) {
            const d = S.duel;
            if (d.ended) return;
            d.turn = d.turn === 1 ? 2 : 1;
            const next = d.turn === 1 ? d.p1 : d.p2;
            S.player = { name: next.name, style: next.style, stats: next.stats || (STYLES[next.style] && STYLES[next.style].stats), money: 0, reputation: 0, wins: 0, perks: [] };
            const passOverlay = $('passControllerOverlay');
            if (passOverlay) passOverlay.classList.add('hidden');
            if (Game.renderDuelCourt) Game.renderDuelCourt();
            else if (Game.renderDuel) Game.renderDuel();
            this.pushDuelState();
            return;
          }
          return this.original.duelPassTurn(...args);
        };
      }

      if (this.original.endDuel) {
        Game.endDuel = (winnerName) => {
          const out = this.original.endDuel(winnerName);
          this.pushWinner(winnerName);
          return out;
        };
      }

      if (this.original.endDuelMatch) {
        Game.endDuelMatch = (winnerName) => {
          const out = this.original.endDuelMatch(winnerName);
          this.pushWinner(winnerName);
          return out;
        };
      }

      if (this.original.toMenu) {
        Game.toMenu = (...args) => {
          if (this.roomRef && !this.suppressSync) {
            // Keep room data, but stop listening if user intentionally returns to menu.
            try { this.roomRef.off(); } catch (e) {}
            this.roomRef = null;
            this.roomCode = '';
            this.role = '';
          }
          return this.original.toMenu(...args);
        };
      }
    },

    applyTurnLock() {
      if (!this.roomRef || typeof S === 'undefined' || !S.duel || S.phase !== 'court') return;
      const myTurn = this.isMyTurn();
      const note = myTurn ? 'Your turn - choose an action.' : 'Waiting for your friend to move...';
      if ($('tacticTip')) $('tacticTip').textContent = note;
      this.updateTurnRibbon(myTurn);
      document.querySelectorAll('#courtActions button').forEach(btn => { btn.disabled = btn.disabled || !myTurn; });
      document.querySelectorAll('#evidenceRow .ev-card').forEach(card => {
        if (!myTurn) {
          card.style.pointerEvents = 'none';
          card.style.opacity = '0.55';
        } else {
          card.style.pointerEvents = '';
          if (!card.classList.contains('used')) card.style.opacity = '';
        }
      });
    },

    updateTurnRibbon(myTurn) {
      const panel = $('courtRightPanel') || $('courtActions');
      if (!panel || typeof S === 'undefined' || !S.duel) return;
      let ribbon = $('onlineTurnRibbon');
      if (!ribbon) {
        ribbon = document.createElement('div');
        ribbon.id = 'onlineTurnRibbon';
        panel.insertBefore(ribbon, panel.firstChild);
      }
      const cur = S.duel.turn === 1 ? S.duel.p1 : S.duel.p2;
      ribbon.className = 'online-turn-ribbon ' + (myTurn ? 'mine' : 'theirs');
      ribbon.textContent = myTurn ? 'ONLINE TURN: YOUR MOVE' : 'ONLINE TURN: WAITING FOR ' + (cur && cur.name ? cur.name : 'OPPONENT');
    },

    patchObjectionChoices() {
      const row = $('objectionRow');
      if (!row) return;
      row.querySelectorAll('[data-obj]').forEach(btn => {
        if (btn.__firebaseOnlineWrapped) return;
        const originalClick = btn.onclick;
        btn.__firebaseOnlineWrapped = true;
        btn.onclick = (event) => {
          if (this.roomRef && !this.isMyTurn()) { this.showTurnToast(); return; }
          const out = originalClick ? originalClick.call(btn, event) : undefined;
          this.pushDuelState();
          return out;
        };
      });
    },

    showTurnToast() {
      if (typeof UI !== 'undefined' && UI.bigCue) UI.bigCue('WAIT YOUR TURN', 700);
      else alert('Wait for your turn.');
    }
  };

  function install() {
    window.OnlineFirebase = OnlineFirebase;
    OnlineFirebase.ensurePanel();
    OnlineFirebase.patchGame();

    const btn = $('onlineDuelBtn');
    if (btn) {
      btn.removeAttribute('data-act');
      btn.removeAttribute('onclick');
      btn.type = 'button';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        OnlineFirebase.showPanel();
      }, true);
    }

    document.addEventListener('click', function (e) {
      const target = e.target && e.target.closest ? e.target.closest('#onlineDuelBtn, [data-act="online-duel"]') : null;
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      OnlineFirebase.showPanel();
    }, true);

    console.log('[Firebase Online Duel] complete fix installed.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
