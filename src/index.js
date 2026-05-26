/**
 * src/index.js
 * Point d'entrée principal — ne contient que l'initialisation
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

const db = require('./database/DatabaseManager');
const CommandHandler = require('./services/CommandHandler');
const logger = require('./services/LoggerService');

// ---- Initialisation Base de données ----
db.init();

// ---- Création du client Discord ----
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// Collection pour les slash commands futures
client.slashCommands = new Collection();

// ---- Chargement des commandes ----
CommandHandler.loadCommands(path.join(__dirname, 'commands'));

// ---- Chargement des événements ----
const eventsDir = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsDir).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  try {
    const event = require(path.join(eventsDir, file));

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }

    logger.info('Events', `Event chargé: ${event.name}`);
  } catch (err) {
    logger.error('Events', `Erreur chargement event ${file}:`, err);
  }
}

// ---- Gestion globale des erreurs (anti-crash) ----
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Process', 'Rejection non gérée:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Process', 'Exception non capturée:', err);
  // On ne plante pas — le bot reste en ligne
});

client.on('error', (err) => {
  logger.error('Client', 'Erreur Discord:', err);
});

client.on('warn', (info) => {
  logger.warn('Client', info);
});

// ---- Connexion ----
const token = process.env.DISCORD_TOKEN;
if (!token) {
  logger.error('Init', 'DISCORD_TOKEN manquant dans .env');
  process.exit(1);
}

client.login(token).catch(err => {
  logger.error('Login', 'Impossible de se connecter:', err);
  process.exit(1);
});
