# KING & QUEEN — SECURITY ARCHITECTURE & FIRESTORE HARDENING

## 1. Current Architecture Overview
The KING & QUEEN multiplayer chess application utilizes a real-time reactive architecture with **Firebase Authentication**, **Cloud Firestore**, and client-side transaction execution via **chess.js**.

```
                           [Client 1 (Browser)]      [Client 2 (Browser)]
                                    │                         │
                                    ▼                         ▼
                            ┌────────────────────────────────────────┐
                            │      Cloud Firestore Databases         │
                            │                                        │
                            │  • users/{uid}                         │
                            │  • users/{uid}/gameHistory/{gameId}    │
                            │  • rooms/{roomId}                      │
                            │  • games/{gameId}                      │
                            └────────────────────────────────────────┘
```

---

## 2. Collection Structure & Schemas

### `users/{userId}`
- **Purpose**: Authoritative player identity, profile customizations, and accumulated battle statistics.
- **Fields**:
  - `uid`: string (must match path `{userId}`)
  - `displayName`: string (2–30 chars)
  - `identity`: `'KING'` | `'QUEEN'`
  - `photoURL`: string | null
  - `bio`: string | null
  - `wins`: integer (>= 0)
  - `losses`: integer (>= 0)
  - `gamesPlayed`: integer (>= 0)
  - `createdAt`: timestamp
  - `updatedAt`: timestamp

### `users/{userId}/gameHistory/{gameId}`
- **Purpose**: Personal match chronicle subcollection for each player.
- **Fields**:
  - `gameId`: string (`"${roomId}_${rematchNumber}"`)
  - `roomId`: string
  - `opponentUid`: string
  - `opponentName`: string
  - `opponentIdentity`: `'KING'` | `'QUEEN'` | null
  - `opponentPhotoURL`: string | null
  - `playerColor`: `'WHITE'` | `'BLACK'`
  - `result`: `'WIN'` | `'LOSS'` | `'DRAW'`
  - `reason`: `'CHECKMATE'` | `'RESIGNATION'` | `'STALEMATE'` | `'DRAW'` | `'TIMEOUT'` | `'ABANDONED'`
  - `totalMoves`: integer
  - `finalFen`: string
  - `playedAt`: timestamp
  - `createdAt`: timestamp

### `rooms/{roomId}`
- **Purpose**: Live synchronization of match lobby, coin toss, color selection, and real-time moves.
- **Fields**:
  - `roomId`: string
  - `roomCode`: string (e.g. `'KQ-9MQR'`)
  - `createdBy`: string (uid of Host)
  - `players`: Array of 1 or 2 `RoomPlayer` objects
  - `status`: `'WAITING'` | `'COIN_TOSS'` | `'COLOR_SELECTION'` | `'READY'` | `'PLAYING'` | `'FINISHED'` | `'COMPLETED'` | `'CLOSED'` | `'CANCELLED'` | `'ABANDONED'`
  - `coinResult`: `'HEADS'` | `'TAILS'` | null
  - `tossWinnerUid`: string | null
  - `gameState`: `GameStateDocument` (fen, turn, version, moveHistory, etc.)
  - `historySaved`: boolean
  - `exitedPlayers`: string[]
  - `createdAt`: timestamp
  - `updatedAt`: timestamp

### `games/{gameId}`
- **Purpose**: Permanent, immutable global match record for replay and board inspection.
- **Fields**:
  - `id`: string (`"${roomId}_${rematchNumber}"`)
  - `roomId`: string
  - `whitePlayer`: `GameHistoryPlayer`
  - `blackPlayer`: `GameHistoryPlayer`
  - `playerUids`: `[whiteUid, blackUid]`
  - `winnerUid`: string | null
  - `result`: `'CHECKMATE'` | `'RESIGNATION'` | `'DRAW'` | `'STALEMATE'` | `'ABANDONED'`
  - `totalMoves`: integer
  - `finalFen`: string
  - `startedAt`: timestamp
  - `completedAt`: timestamp
  - `rematchNumber`: integer
  - `createdAt`: timestamp

---

## 3. Security Boundaries & Helper Functions

The rules enforce security through five foundational helper functions:

```javascript
// 1. Authenticated check
function isAuthenticated() {
  return request.auth != null;
}

// 2. Identity match check
function isOwnProfile(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}

// 3. Authoritative room retrieval and participant validation
function getRoomData(roomId) {
  return get(/databases/$(database)/documents/rooms/$(roomId)).data;
}

function isRoomParticipant(roomId) {
  let room = getRoomData(roomId);
  return isAuthenticated() && (
    room.players[0].uid == request.auth.uid ||
    (room.players.size() > 1 && room.players[1].uid == request.auth.uid)
  );
}

// 4. Verification that a user is one of the two players in a room
function isUserInRoom(userId, roomId) {
  let room = getRoomData(roomId);
  return room.players[0].uid == userId ||
    (room.players.size() > 1 && room.players[1].uid == userId);
}
```

---

## 4. Cross-User Write Protection

### The Challenge
When a match ends via checkmate, resignation, or draw, a single client executes `processGameStatsAndHistory()` to update both users' records atomically. Without proper rules, opening write permissions allows arbitrary users to inject fake wins or edit opponent statistics.

### The Solution: Cross-Document Validation
1. **Target User Validation**: Player A can only write to `/users/{userId}/gameHistory/{gameId}` if `{userId}` is verified to be a participant inside `rooms/{roomId}`.
2. **Opponent Relationship**: The record must declare `opponentUid == request.auth.uid`.
3. **Stat Increments**: Only the match participants can update stats, restricted strictly to `['wins', 'losses', 'gamesPlayed', 'updatedAt']`.
4. **Immutability**: Once created, historical records can never be updated (`allow update, delete: if false`).

---

## 5. Room Participant Validation & Transition Rules

1. **Room Creation (`allow create`)**:
   - `request.resource.data.createdBy == request.auth.uid`
   - `request.resource.data.players.size() == 1`
   - `request.resource.data.players[0].uid == request.auth.uid`
   - `request.resource.data.status == 'WAITING'`
   - `request.resource.data.maxPlayers == 2`

2. **Room Joining & Playing (`allow update`)**:
   - Only non-participants can update an open room (`status == 'WAITING' && players.size() < 2`) to join.
   - Once 2 players exist, **only verified participants** (`players[0].uid` or `players[1].uid`) can update the room. Third parties are rejected.
   - Closed or cancelled rooms cannot be arbitrarily reopened.

3. **Game Record Creation (`games/{gameId}`)**:
   - `request.auth.uid in request.resource.data.playerUids`
   - `request.resource.data.playerUids.size() == 2`
   - `isRoomParticipant(request.resource.data.roomId)`
   - Permanent & immutable.

---

## 6. Duplicate Prevention & Idempotency Strategy

1. **Deterministic Document IDs**: Both `games/${roomId}_${rematchNumber}` and `users/${uid}/gameHistory/${roomId}_${rematchNumber}` use deterministic keys. Multiple writes to the same key overwrite harmlessly without duplicating.
2. **Atomic Flags**:
   - `gameState.statsProcessed === true`
   - `room.historySaved === true`
   If either flag is present, `processGameStatsAndHistory()` aborts immediately.
3. **Single Transaction Boundary**: All game-over writes (global game record, player 1 history, player 2 history, player 1 stats, player 2 stats, and room status) are committed in a single atomic Firestore transaction.

---

## 7. Known Limitations of Client-Authoritative Architecture

While the hardened rules prevent out-of-band malicious attacks, client-authoritative multiplayer has natural physical boundaries:
1. **FEN Plausibility**: Firestore rules cannot execute a full chess engine (`chess.js`) in CEL (Common Expression Language). A technically sophisticated attacker modifying the frontend bundle could send a syntactically valid FEN that skips a move.
2. **Disconnect Handling**: If a client abruptly closes the tab, Firestore onSnapshot disconnects without server notification unless presence/heartbeat tracking is active.

---

## 8. Future Cloud Functions Migration Roadmap (Server Authority)

When moving to high-stakes tournaments or production scaling:

```
[Client (Move / Resign)]
          ↓
  POST /api/v1/game/move
          ↓
[Firebase Cloud Function (Gen 2)]
  1. Authoritative chess.js execution on Server
  2. Turn verification & clock management
  3. Detect Checkmate / Draw / Timeout
  4. Firebase Admin SDK writes:
     - rooms/{roomId}
     - games/{gameId}
     - users/{uid}/gameHistory/{gameId}
     - users/{uid} statistics
          ↓
[Client receives Real-time Snapshot]
```

### Security Benefit:
- `firestore.rules` for history and user statistics can be completely locked:
  `allow write: if false;` (Only Firebase Admin SDK on Cloud Functions can write).
