const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamID = require('steamid');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const accountsFile = path.join(__dirname, '../accounts.json');

// Менеджер для управления всеми Steam аккаунтами
class SteamManager {
    constructor(io) {
        this.accounts = new Map(); // Активные сессии
        this.io = io; // Отправка событий
        this.savedAccounts = this.loadSavedAccounts(); // Загрузка сохраненных аккаунтов из accounts.js при запуске
    }

    loadSavedAccounts() {
        if (fs.existsSync(accountsFile)) {
            const data = fs.readFileSync(accountsFile);
            try {
                return JSON.parse(data);
            } catch (err) {
                logger.error('Failed to parse accounts.json');
            }
        }
        return [];
    }

    saveAccounts() {
        // Сохранению аккаунтов для автологинв
        const data = Array.from(this.accounts.values()).map(({ loginData }) => loginData);
        fs.writeFileSync(accountsFile, JSON.stringify(data, null, 2));
    }

    async autoLoginAll() {
        for (const loginData of this.savedAccounts) {
            logger.info(`Auto logging ${loginData.login}`);
            try {
                await this.login(loginData, false);
            } catch (err) {
                logger.error(`Failed to auto login ${loginData.login}: ${err.message}`);
            }
        }
    }

    async login({ login, password, shared_secret }, save = true) {
        if (this.accounts.has(login)) {
            throw new Error('Already logged in');
        }

        const client = new SteamUser();

        const loginOptions = {
            accountName: login,
            password: password,
            twoFactorCode: SteamTotp.generateAuthCode(shared_secret)
        };

        let reconnectDelay = 5000; // Время между попытками реконнекта

        const connectClient = () => {
            client.logOn(loginOptions);
        };

        connectClient();

        // Событие успешного входа в аккаунт
        client.on('loggedOn', () => {
            logger.info(`[${login} (${client.steamID.getSteamID64()})] Logged in!`);
            this.accounts.set(login, { client, loginData: { login, password, shared_secret } });
            if (save) this.saveAccounts();
            reconnectDelay = 5000; // Обнуляем задержку реконнекта

            // Слушаем входящие сообщения от друзей
            client.on('friendMessage', (steamID, message) => {
                // Проверяем что отправитель авторизован на сервере
                const senderSession = Array.from(this.accounts.values()).find(acc => acc.client.steamID.getSteamID64() === steamID.getSteamID64());
                if (!senderSession) {
                    logger.warn(`Sender not authorized on server: ${steamID.getSteamID64()}`);
                    return;
                }

                const senderLogin = senderSession.loginData.login;

                // Отправляем сообщение через сокеты
                this.io.emit('incoming-message', {
                    fromLogin: senderLogin,
                    toLogin: login,
                    fromSteamId64: steamID.getSteamID64(),
                    toSteamId64: client.steamID.getSteamID64(),
                    message
                });

                logger.info(`Message from ${senderLogin} to ${login}: ${message}`);
            });
        });

        // Если соединение разорвалось - пытаемся переподключиться
        client.on('disconnected', (eresult, msg) => {
            logger.warn(`[${login}] Disconnected: ${eresult} - ${msg}. Reconnecting in ${reconnectDelay / 1000}s...`);
            setTimeout(() => {
                connectClient();
                reconnectDelay = Math.min(reconnectDelay * 2, 60000); // Увеличиваем задержку (на всякий)
            }, reconnectDelay);
        });

        // При ошибках авторизации убираем аккаунт
        client.on('error', (err) => {
            logger.error(`[${login}] Error: ${err.message}`);
            this.accounts.delete(login);
        });

        return new Promise((resolve, reject) => {
            client.once('loggedOn', () => resolve());
            client.once('error', (err) => reject(err));
        });
    }

    async sendMessage({ login, friendSteamId64, message }) {
        const session = this.accounts.get(login);
        if (!session) throw new Error('Sender account not authorized');

        const steamID = new SteamID(friendSteamId64);
        if (!steamID.isValid()) throw new Error('Invalid steamID64');

        const { client } = session;

        const relationship = client.myFriends[steamID.getSteamID64()];
        if (relationship !== SteamUser.EFriendRelationship.Friend) {
            throw new Error('Recipient is not in your friend list');
        }
        
        const friendSession = Array.from(this.accounts.values()).find(acc => acc.client.steamID.getSteamID64() === friendSteamId64);
        if (!friendSession) throw new Error('Recipient account not authorized'); 

        const friends = session.client.myFriends;
        if (!friends || !friends[steamID.getSteamID64()]) {
            throw new Error('Friend not found in friend list');
        }

        session.client.chatMessage(steamID, message);
        logger.info(`[${login}] Sent message to ${friendSteamId64}: ${message}`);
    }
}

module.exports = SteamManager;
