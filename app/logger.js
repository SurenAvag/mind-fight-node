var winston = require('winston');
winston.add(winston.transports.File, { filename: 'logger.log' });
module.exports = winston;