const logger = require('../logger');

// Обработчик ошибок (подробный для быстрого фикса)
const errorHandler = (err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: err.message });
};

module.exports = errorHandler;
