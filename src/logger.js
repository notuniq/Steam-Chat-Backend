const { createLogger, format, transports } = require('winston');
const chalk = require('chalk').default;

// Красивый логгер для консоли (взят на просторах гитхаба)
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => {
            let color;
            switch (level) {
                case 'info': color = chalk.blue; break;
                case 'warn': color = chalk.yellow; break;
                case 'error': color = chalk.red; break;
                default: color = chalk.white;
            }
            return `${chalk.gray(timestamp)} ${color(level.toUpperCase())}: ${message}`;
        })
    ),
    transports: [new transports.Console()]
});

module.exports = logger;
