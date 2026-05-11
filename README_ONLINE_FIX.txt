Objection! Power Suit - Firebase online duel fix

Files:
- index.html
- style.css
- game.js
- improvements.js
- firebase-online.js

Important:
1. Open firebase-online.js.
2. Paste your real Firebase Web App config at the top.
3. Upload all files to Vercel.
4. Hard refresh after deploy.

Expected flow:
Host: Online Duel -> Create Room -> choose name/style -> send code.
Guest: Online Duel -> Join Room -> enter code -> choose name/style.
Host clicks Start Duel.
Both players enter the courtroom.
Only the player whose turn it is can click actions.
Moves sync through Firebase Realtime Database.
