/**
 * events/ready.js
 */

const logger = require('../services/LoggerService');

module.exports = {
  name: 'ready',
  once: true,

  execute(client) {
    logger.info('Ready', `Bot connecté en tant que ${client.user.tag}`);
    logger.info('Ready', `Présent sur ${client.guilds.cache.size} serveur(s)`);

    client.user.setPresence({
      activities: [{ name: `${process.env.PREFIX || '!'}help`, type: 2 }],
      status: 'online',
    });
  },
};
