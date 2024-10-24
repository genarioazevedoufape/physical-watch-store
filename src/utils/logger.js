const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json } = format;

// Logas de Informação
const infoLogger = createLogger({
    format: combine(
        timestamp(),
        json()
    ),
    transports: [
        new transports.File({ filename: 'logs/info.json' })
    ]
});

// Logas de Conexão
const loggerConn = createLogger( {
    format: combine(
        timestamp(),
        json()
    ),
    transports: [
        new transports.File({ filename: 'logs/connections.json' })
    ]
})

// Logas de Error
const errorLogger = createLogger({
    format: combine(
        timestamp(),
        json()
    ),
    transports: [
        new transports.File({ filename: 'logs/error.json' })
    ]
});

// Logas de Aviso
const warnLogger = createLogger({
    format: combine(
        timestamp(),
        json()
    ),
    transports: [
        new transports.File({ filename: 'logs/warn.json' })
    ]
});

module.exports = { infoLogger, loggerConn, errorLogger, warnLogger };
