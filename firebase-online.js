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
    apiKey: 'PASTE_YOUR_API_KEY_HERE',
    authDomain: 'objection-e892f.firebaseapp.com',
    databaseURL: 'https://objection-e892f-default-rtdb.firebaseio.com',
    projectId: 'objection-e892f',
    storageBucket: 'objection-e892f.appspot.com',
    messagingSenderId: 'PASTE_YOUR_MESSAGING_SENDER_ID_HERE',
    appId: 'PASTE_YOUR_APP_ID_HERE'
  };

  const $ = (id) => document.getElementById(id);

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function safeText(v, fallback) {
    v = String(v || '').trim();
    return v || fallback;
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
      panel.addEventListener('click', (e) => { if (e.target === panel) this.hidePanel(); });

      this.buildStyleGrid('firebaseHostStyles', 'host');
      this.buildStyleGrid('firebaseGuestStyles', 'guest');

      return panel;
    },

    buildStyleGrid(targetId, choiceRole) {
      const grid = $(targetId);
      if (!grid || !window.STYLES) return;
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
      if (hostName) hostName.disabled = !hostCanEdit;
      if (guestName) guestName.disabled = !guestCanEdit;
      document.querySelectorAll('#firebaseHostStyles .style-card').forEach(el => el.style.pointerEvents = hostCanEdit ? '' : 'none');
      document.querySelectorAll('#firebaseGuestStyles .style-card').forEach(el => el.style.pointerEvents = guestCanEdit ? '' : 'none');
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

      try {
        await this.roomRef.set({
          createdAt: Date.now(),
          status: 'waiting',
          host: this.playerId,
          guest: null,
          choices: { host: hostChoice, guest: makePlayerChoice('guest') },
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

        if (room.winner && !this.suppressSync && window.S && S.phase !== 'verdict') {
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
      const pool = Object.keys(EVIDENCE || {});
      const dealHand = () => {
        const shuffled = pool.slice().sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 5).map(id => ({ id, ...EVIDENCE[id], used: false }));
      };
      return {
        turn: 1,
        ended: false,
        p1: {
          name: safeText(hostChoice.name, 'P1'), style: p1Style.id, tieColor: p1Style.tieColor, hairColor: p1Style.hairColor,
          cred: 100, hand: dealHand(), specialUses: p1Style.special.uses
        },
        p2: {
          name: safeText(guestChoice.name, 'P2'), style: p2Style.id, tieColor: p2Style.tieColor, hairColor: p2Style.hairColor,
          cred: 100, hand: dealHand(), specialUses: p2Style.special.uses
        },
        jury: 0, judge: 100, witnessConfidence: 100,
        round: 1, maxRounds: 24,
        recess: { 1: 2, 2: 2 }
      };
    },

    async requestStartDuel() {
      if (!this.roomRef || this.role !== 'host') return;
      try {
        const snap = await this.roomRef.get();
        const room = snap.val() || {};
        if (!room.guest) { this.status('Your friend has not joined yet.'); return; }
        const duelState = this.makeDuelState(room);
        await this.roomRef.update({ duelState, started: true, startedAt: Date.now(), status: 'started', winner: null });
        this.status('Starting duel...');
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
      return !!(window.S && S.duel && S.duel.turn === this.localPlayerNum());
    },

    receiveDuelState(duelState) {
      const json = JSON.stringify(duelState || {});
      if (!duelState || json === this.lastStateJson) return;
      this.lastStateJson = json;
      this.hidePanel();
      this.suppressSync = true;
      try {
        if (window.S) {
          S.player = null;
          S.caseData = null;
          S.duel = clone(duelState);
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
        if (window.Snd) { try { Snd.murmur(); } catch (e) {} }
        if (window.UI && typeof UI.switchTo === 'function') UI.switchTo('court');
        if (window.Game && typeof Game.renderDuel === 'function') Game.renderDuel();
      } catch (err) {
        console.warn('Could not receive online duel state:', err);
      }
      this.suppressSync = false;
    },

    async pushDuelState() {
      if (!this.roomRef || this.suppressSync || !window.S || !S.duel) return;
      const state = clone(S.duel);
      const json = JSON.stringify(state);
      this.lastStateJson = json;
      try { await this.roomRef.child('duelState').set(state); } catch (err) { console.warn('Duel sync failed:', err); }
    },

    async pushWinner(winnerName) {
      if (!this.roomRef || this.suppressSync) return;
      try { await this.roomRef.update({ winner: winnerName, 'duelState/ended': true }); } catch (err) { console.warn('Winner sync failed:', err); }
    },

    patchGame() {
      if (!window.Game || Game.__firebaseOnlineCompletePatch) return;
      Game.__firebaseOnlineCompletePatch = true;

      this.original.renderDuel = Game.renderDuel ? Game.renderDuel.bind(Game) : null;
      this.original.duelAction = Game.duelAction ? Game.duelAction.bind(Game) : null;
      this.original.duelPresent = Game.duelPresent ? Game.duelPresent.bind(Game) : null;
      this.original.endDuel = Game.endDuel ? Game.endDuel.bind(Game) : null;
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

      if (this.original.endDuel) {
        Game.endDuel = (winnerName) => {
          const out = this.original.endDuel(winnerName);
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
      if (!this.roomRef || !window.S || !S.duel || S.phase !== 'court') return;
      const myTurn = this.isMyTurn();
      const note = myTurn ? 'Your turn - choose an action.' : 'Waiting for your friend to move...';
      if ($('tacticTip')) $('tacticTip').textContent = note;
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

    showTurnToast() {
      if (window.UI && UI.bigCue) UI.bigCue('WAIT YOUR TURN', 700);
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
