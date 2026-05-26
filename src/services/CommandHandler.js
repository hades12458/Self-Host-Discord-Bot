/**
 * services/CommandHandler.js
 * Chargement automatique et dispatch des commandes prefix
 */

const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const logger = require('./LoggerService');
const db = require('../database/DatabaseManager');
const config = require('../../config.json');

class CommandHandler {
  constructor() {
    this.commands = new Collection();
  }

  /**
   * Charge toutes les commandes depuis /src/commands
   */
  loadCommands(commandsDir) {
    const categories = fs.readdirSync(commandsDir);

    for (const category of categories) {
      const categoryPath = path.join(commandsDir, category);
      if (!fs.statSync(categoryPath).isDirectory()) continue;

      const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

      for (const file of files) {
        try {
          const command = require(path.join(categoryPath, file));

          if (!command.name || !command.execute) {
            logger.warn('CommandHandler', `Commande invalide ignorée: ${file}`);
            continue;
          }

          this.commands.set(command.name, command);

          // Alias support
          if (command.aliases) {
            for (const alias of command.aliases) {
              this.commands.set(alias, command);
            }
          }

          logger.info('CommandHandler', `Commande chargée: ${command.name} [${category}]`);
        } catch (err) {
          logger.error('CommandHandler', `Erreur chargement ${file}:`, err);
        }
      }
    }

    logger.info('CommandHandler', `${this.commands.size} commandes chargées au total.`);
  }

  /**
   * Traite un message entrant et exécute la commande correspondante
   */
  async handleMessage(message) {
    if (message.author.bot || !message.guild) return;

    // Prefix par serveur ou global
    const settings = db.getGuildSettings(message.guild.id);
    const prefix = settings.prefix || process.env.PREFIX || config.bot.prefix;

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command = this.commands.get(commandName);
    if (!command) return;

    // Cooldown simple par commande/user
    const cooldownKey = `${message.author.id}:${command.name}`;
    if (!this._checkCooldown(cooldownKey, command.cooldown || config.bot.cooldown)) {
      return message.reply('⏳ Veuillez attendre avant de réutiliser cette commande.').catch(() => {});
    }

    try {
      await command.execute(message, args);
    } catch (err) {
      logger.error('CommandHandler', `Erreur commande ${command.name}:`, err);
      message.reply('❌ Une erreur interne est survenue. Réessayez plus tard.').catch(() => {});
    }
  }

  // Cooldown en mémoire simple
  _cooldowns = new Map();

  _checkCooldown(key, seconds) {
    const now = Date.now();
    const expiry = this._cooldowns.get(key);
    if (expiry && now < expiry) return false;
    this._cooldowns.set(key, now + seconds * 1000);
    return true;
  }
}

module.exports = new CommandHandler();
