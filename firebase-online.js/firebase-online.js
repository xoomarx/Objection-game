/* Firebase Online Duel for Objection! Power Suit
   Replaces PeerJS/WebRTC with Firebase Realtime Database rooms.
*/

(function () {
  "use strict";

  // 1) Replace this with your Firebase web app config
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

  if (!window.firebase) {
    alert("Firebase SDK did not load. Check your index.html script tags.");
    return;
  }

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  const OnlineFirebase = {
    roomCode: null,
    playerId: null,
    role: null,
    roomRef: null,
    connected: false,
    lastSeenTurn: null,

    makeCode() {
      return Math.random().toString(36).slice(2, 7).toUpperCase();
    },

    showPanel(mode) {
      let panel = document.getElementById("firebaseOnlinePanel");
      if (!panel) {
        panel = document.createElement("section");
        panel.id = "firebaseOnlinePanel";
        panel.className = "screen";
        panel.innerHTML = `
          <h2>Online Duel</h2>
          <p class="intro" id="onlineStatus">Create a room or join your friend.</p>

          <div class="row gap center">
            <button class="big primary" id="fbCreateRoom">Create Room</button>
            <button class="big" id="fbJoinRoom">Join Room</button>
            <button class="big" id="fbBackMenu">Back</button>
          </div>

          <div id="fbRoomBox" class="center hidden" style="margin-top:16px;">
            <p>Room Code:</p>
            <h1 id="fbRoomCode" style="letter-spacing:8px;"></h1>
            <button class="big" id="fbCopyCode">Copy Code</button>
          </div>

          <div id="fbJoinBox" class="center hidden" style="margin-top:16px;">
            <input id="fbJoinInput" maxlength="8" placeholder="Enter room code" />
            <button class="big primary" id="fbJoinConfirm">Join</button>
          </div>
        `;
        document.getElementById("app").appendChild(panel);

        document.getElementById("fbCreateRoom").onclick = () => this.createRoom();
        document.getElementById("fbJoinRoom").onclick = () => {
          document.getElementById("fbJoinBox").classList.remove("hidden");
        };
        document.getElementById("fbJoinConfirm").onclick = () => {
          const code = document.getElementById("fbJoinInput").value.trim().toUpperCase();
          if (code) this.joinRoom(code);
        };
        document.getElementById("fbCopyCode").onclick = () => {
          navigator.clipboard.writeText(this.roomCode || "");
          this.status("Copied room code.");
        };
        document.getElementById("fbBackMenu").onclick = () => {
          if (typeof Game !== "undefined" && Game.toMenu) Game.toMenu();
          this.hidePanel();
        };
      }

      document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
      panel.classList.remove("hidden");
      this.status(mode || "Create a room or join your friend.");
    },

    hidePanel() {
      const panel = document.getElementById("firebaseOnlinePanel");
      if (panel) panel.classList.add("hidden");
    },

    status(text) {
      const el = document.getElementById("onlineStatus");
      if (el) el.textContent = text;
    },

    async createRoom() {
      this.roomCode = this.makeCode();
      this.playerId = "host_" + Math.random().toString(36).slice(2);
      this.role = "host";
      this.roomRef = db.ref("rooms/" + this.roomCode);

      await this.roomRef.set({
        createdAt: Date.now(),
        status: "waiting",
        host: this.playerId,
        guest: null,
        messages: {}
      });

      document.getElementById("fbRoomCode").textContent = this.roomCode;
      document.getElementById("fbRoomBox").classList.remove("hidden");

      this.status("Room created. Send this code to your friend.");
      this.listen();
    },

    async joinRoom(code) {
      this.roomCode = code;
      this.playerId = "guest_" + Math.random().toString(36).slice(2);
      this.role = "guest";
      this.roomRef = db.ref("rooms/" + this.roomCode);

      const snap = await this.roomRef.get();
      if (!snap.exists()) {
        this.status("Room not found. Check the code.");
        return;
      }

      await this.roomRef.update({
        guest: this.playerId,
        status: "connected"
      });

      this.status("Connected. Starting duel...");
      this.listen();
      this.startDuel();
    },

    listen() {
      if (!this.roomRef) return;

      this.roomRef.child("status").on("value", snap => {
        const status = snap.val();
        if (status === "connected" && this.role === "host") {
          this.status("Friend connected. Starting duel...");
          this.startDuel();
        }
      });

      this.roomRef.child("messages").on("child_added", snap => {
        const msg = snap.val();
        if (!msg || msg.from === this.playerId) return;
        this.receive(msg);
      });
    },

    send(type, payload) {
      if (!this.roomRef) return;
      this.roomRef.child("messages").push({
        from: this.playerId,
        role: this.role,
        type,
        payload,
        time: Date.now()
      });
    },

    receive(msg) {
      if (!msg || !msg.type) return;

      if (msg.type === "state-sync" && msg.payload && typeof S !== "undefined") {
        try {
          Object.assign(S, msg.payload);
          if (typeof Game !== "undefined" && Game.renderCourt) Game.renderCourt();
        } catch (e) {
          console.warn("State sync failed", e);
        }
      }

      if (msg.type === "action" && msg.payload && typeof Game !== "undefined") {
        const action = msg.payload.action;
        if (typeof Game[action] === "function") {
          try {
            Game[action].apply(Game, msg.payload.args || []);
          } catch (e) {
            console.warn("Remote action failed", e);
          }
        }
      }
    },

    startDuel() {
      this.hidePanel();

      if (typeof Game !== "undefined" && Game.startDuelSetup) {
        Game.startDuelSetup();
      }

      setTimeout(() => {
        this.status("Connected through Firebase.");
      }, 300);
    }
  };

  window.OnlineFirebase = OnlineFirebase;

  const oldHandleAct = window.Game && Game.handleAct ? Game.handleAct.bind(Game) : null;

  function patchGame() {
  if (!window.Game || !Game.handleAct || Game.__firebaseOnlinePatched) return;

  Game.__firebaseOnlinePatched = true;

  const originalHandleAct = Game.handleAct.bind(Game);
  Game.handleAct = function (act, btn, e) {
    if (act === "online-duel") {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      }
      OnlineFirebase.showPanel();
      return;
    }
    return originalHandleAct(act, btn, e);
  };

  document.addEventListener("click", function (e) {
    const t = e.target.closest("[data-act]");
    if (!t) return;

    if (t.dataset.act === "online-duel") {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      OnlineFirebase.showPanel();
    }
  }, true);
}