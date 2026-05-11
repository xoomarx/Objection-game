/* ============================================================
 * Objection! Power Suit - Firebase Online Duel Panel
 * Fix: after Join Room/Create Room, players stay in the Online Duel panel.
 * The game no longer kicks players out of the popup immediately.
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

  const OnlineFirebase = {
    db: null,
    roomCode: '',
    roomRef: null,
    role: '',
    playerId: '',
    started: false,

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
          <p class="intro">Create a Firebase room, send your friend the code, then wait here until both players are connected.</p>

          <div class="firebase-online-actions" id="firebaseMainActions">
            <button class="big primary" id="firebaseCreateRoomBtn" type="button">Create Room</button>
            <button class="big" id="firebaseShowJoinBtn" type="button">Join Room</button>
            <button class="big" id="firebaseCloseBtn" type="button">Back</button>
          </div>

          <div id="firebaseRoomBox" class="hidden center">
            <p>Room Code:</p>
            <div class="firebase-room-code" id="firebaseRoomCode">-----</div><br>
            <button class="big" id="firebaseCopyBtn" type="button">Copy Code</button>
          </div>

          <div id="firebaseJoinBox" class="hidden center">
            <input id="firebaseRoomInput" maxlength="8" placeholder="Enter room code" autocomplete="off" spellcheck="false">
            <button class="big primary" id="firebaseJoinBtn" type="button">Join</button>
          </div>

          <div id="firebaseLobbyBox" class="hidden center" style="margin-top:14px;">
            <h3>Lobby</h3>
            <p id="firebaseLobbyInfo">Waiting...</p>
            <button class="big primary hidden" id="firebaseStartDuelBtn" type="button">Start Duel</button>
            <button class="big" id="firebaseLeaveBtn" type="button">Leave Room</button>
          </div>

          <div id="firebaseOnlineStatus" class="firebase-online-status">Ready.</div>
          <p class="firebase-online-note">Do not close this panel until both players show as connected.</p>
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
      panel.addEventListener('click', (e) => { if (e.target === panel) this.hidePanel(); });

      return panel;
    },

    showPanel() {
      const panel = this.ensurePanel();
      panel.classList.remove('hidden');
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
    },

    async createRoom() {
      this.showPanel();
      if (!this.initFirebase()) return;

      this.roomCode = this.makeCode();
      this.playerId = 'host_' + Math.random().toString(36).slice(2);
      this.role = 'host';
      this.started = false;
      this.roomRef = this.db.ref('rooms/' + this.roomCode);

      try {
        await this.roomRef.set({
          createdAt: Date.now(),
          status: 'waiting',
          host: this.playerId,
          guest: null,
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

      try {
        const snap = await this.roomRef.get();
        if (!snap.exists()) { this.status('Room not found. Check the code and try again.'); return; }
        await this.roomRef.update({ guest: this.playerId, status: 'connected' });
        $('firebaseRoomCode').textContent = this.roomCode;
        $('firebaseRoomBox').classList.remove('hidden');
        $('firebaseJoinBox').classList.add('hidden');
        this.showLobby('Connected. Waiting for host to start the duel...', false);
        this.status('Joined room ' + this.roomCode + '. Stay on this screen.');
        this.listen();
      } catch (err) {
        this.status('Could not join room: ' + (err && err.message ? err.message : err));
      }
    },

    listen() {
      if (!this.roomRef) return;
      this.roomRef.off();
      this.roomRef.on('value', (snap) => {
        const room = snap.val();
        if (!room) return;

        if (room.status === 'connected') {
          if (this.role === 'host') {
            this.showLobby('Friend connected. Click Start Duel when ready.', true);
            this.status('Both players are connected in room ' + this.roomCode + '.');
          } else {
            this.showLobby('Connected. Waiting for host to start the duel...', false);
            this.status('Both players are connected in room ' + this.roomCode + '.');
          }
        } else if (room.status === 'waiting') {
          this.showLobby('Waiting for your friend to join...', false);
        }

        if (room.started && !this.started) {
          this.started = true;
          this.status('Starting duel...');
          this.startDuelScreen();
        }
      });
    },

    async requestStartDuel() {
      if (!this.roomRef || this.role !== 'host') return;
      try {
        await this.roomRef.update({ started: true, startedAt: Date.now(), status: 'started' });
        this.started = true;
        this.status('Starting duel...');
        this.startDuelScreen();
      } catch (err) {
        this.status('Could not start duel: ' + (err && err.message ? err.message : err));
      }
    },

    async leaveRoom() {
      try {
        if (this.roomRef) {
          if (this.role === 'host') await this.roomRef.remove();
          else await this.roomRef.update({ guest: null, status: 'waiting', started: false });
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

    startDuelScreen() {
      this.hidePanel();
      try {
        if (window.Game && typeof Game.startDuelSetup === 'function') {
          Game.startDuelSetup();
        } else if (window.UI && typeof UI.switchTo === 'function') {
          UI.switchTo('duel');
        }
      } catch (err) {
        console.warn('Could not start duel setup:', err);
      }
    }
  };

  function install() {
    window.OnlineFirebase = OnlineFirebase;

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

    console.log('[Firebase Online Duel] installed: Online Duel button opens Firebase lobby panel.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
