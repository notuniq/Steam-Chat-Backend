# Steam Chat Backend

A simple WebSocket-based backend to manage multiple Steam accounts, handle 2FA logins, and send messages between friends.

## 🔧 Features

- Steam login with 2FA (via shared_secret)
- Auto-login from saved `accounts.json`
- Send messages to Steam friends
- Reconnect on disconnect
- Emit events via WebSocket
- Logging with Winston

## 📂 Project Structure

```
steam-chat-backend/
├── src/
│   ├── middlewares/
│   │   └── errorHandler.js
│   ├── logger.js
│   ├── server.js
│   └── steamManager.js
├── .env
├── accounts.json
├── package.json
├── README.md
```

## 🚀 Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file:

```
PORT=3000
```

3. (Optional) Add accounts to `accounts.json`:

```json
[
  {
    "login": "steam_login",
    "password": "steam_password",
    "shared_secret": "base64_shared_secret"
  }
]
```

4. Start the server:

```bash
npm run dev
```

## 🔌 WebSocket Events

### `login`

```json
{
  "login": "username",
  "password": "password",
  "shared_secret": "..."
}
```

**Response:**

```json
{ "success": true, "message": "Logged in successfully" }
```

### `send-message`

```json
{
  "login": "sender",
  "friendSteamId64": "7656119...",
  "message": "Hi!"
}
```

### `incoming-message` (broadcasted)

```json
{
  "fromLogin": "...",
  "toLogin": "...",
  "fromSteamId64": "...",
  "toSteamId64": "...",
  "message": "Hello!"
}
```

## 🧪 WebSocket Tests (Jest)

```js
const { io } = require("socket.io-client");
let socket;

beforeAll((done) => {
  socket = io("http://localhost:3000");
  socket.on("connect", done);
});

afterAll(() => {
  socket.disconnect();
});

test("Missing login fields", (done) => {
  socket.emit("login", {});
  socket.once("login-result", (data) => {
    expect(data.success).toBe(false);
    done();
  });
});
```

## 📄 License

[License](./LICENSE)
