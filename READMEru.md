# Steam Chat Backend

📡 WebSocket сервер для управления Steam аккаунтами, автологина с 2FA и отправки сообщений между друзьями.

## 🔧 Возможности

- Авторизация через Steam с двухфакторной защитой
- Автовход аккаунтов из `accounts.json`
- Отправка сообщений между друзьями
- Переподключение при разрыве соединения
- Вебсокет события и логгирование

## 📂 Структура проекта

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
├── READMEru.md
├── README.md
```

## 🚀 Установка и запуск

1. Установи зависимости:

```bash
npm install
```

2. Создай `.env`:

```
PORT=3000
```

3. Добавь аккаунты в `accounts.json`:

```json
[
  {
    "login": "steam_login",
    "password": "steam_password",
    "shared_secret": "base64_shared_secret"
  }
]
```

4. Запусти сервер:

```bash
npm run dev
```

## 🔌 WebSocket события

### `login`

```json
{
  "login": "логин",
  "password": "пароль",
  "shared_secret": "секрет"
}
```

### `send-message`

```json
{
  "login": "sender",
  "friendSteamId64": "7656119...",
  "message": "Привет!"
}
```

### `incoming-message`

```json
{
  "fromLogin": "...",
  "toLogin": "...",
  "fromSteamId64": "...",
  "toSteamId64": "...",
  "message": "Hello!"
}
```

## 🧪 Тесты WebSocket (Jest)

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

test("Проверка: пропущены поля логина", (done) => {
  socket.emit("login", {});
  socket.once("login-result", (data) => {
    expect(data.success).toBe(false);
    done();
  });
});
```

## 📝 Лицензия

[License](./LICENSE)
