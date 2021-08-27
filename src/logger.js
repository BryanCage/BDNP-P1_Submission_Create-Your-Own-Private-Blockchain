const winston = require("winston");
const config = {
    levels: {
        error: 0,
        debug: 1,
        warn: 2,
        data: 3,
        info: 4,
        verbose: 5,
        silly: 6,
        custom: 7,
        validateChain: 8,
        blockchain: 9,
        block: 10,

    },
    colors: {
        error: 'red',
        debug: 'blue',
        warn: 'yellow',
        data: 'grey',
        info: 'green',
        verbose: 'cyan',
        silly: 'magenta',
        custom: 'yellow',
        validateChain: 'red',
        blockchain: 'yellow',
        block: 'blue',

    }
};
winston.addColors(config.colors);

const logger = module.exports = winston.createLogger({
    levels: config.levels,
    transports: [ new winston.transports.Console()],
    level: 'block',
    format: winston.format.combine(
        winston.format.colorize({all:true}),
        winston.format.simple()
    )
});

module.exports = logger;