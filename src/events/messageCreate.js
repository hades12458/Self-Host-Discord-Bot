/**
 * events/messageCreate.js
 * Point d'entrée des commandes prefix + vérification blacklist
 */

const CommandHandler = require('../services/CommandHandler');
const BlacklistService = require('../services/BlacklistService');
const logger = require('../services/LoggerService');

module.exports = {
  name: 'messageCreate',

  async execute(message) {
    if (message.author.bot || !message.guild) return;

    // --- Vérification blacklist globale ---
    const isBlocked = await BlacklistService.enforceBlacklist(
      message.author.id,
      message.guild,
      message.member
    );

    if (isBlocked) {
      // Message d'erreur discret (anti-spam)
      message.reply('🚫 Vous êtes blacklisté de ce bot.').then(m => {
        setTimeout(() => m.delete().catch(() => {}), 4000);
      }).catch(() => {});
      message.delete().catch(() => {});
      return;
    }

    // --- Dispatch commande ---
    await CommandHandler.handleMessage(message);
  },
};
