/**
 * utils/embedBuilder.js
 * Constructeur d'embeds standardisés
 */

const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

/**
 * Embed de succès
 */
function successEmbed(title, description, fields = []) {
  const embed = new EmbedBuilder()
    .setColor(config.bot.embedSuccessColor)
    .setTitle(`✅ ${title}`)
    .setTimestamp();

  if (description) embed.setDescription(description);
  if (fields.length) embed.addFields(fields);
  return embed;
}

/**
 * Embed d'erreur
 */
function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(config.bot.embedErrorColor)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Embed d'avertissement
 */
function warnEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(config.bot.embedWarnColor)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Embed d'information
 */
function infoEmbed(title, description, fields = []) {
  const embed = new EmbedBuilder()
    .setColor(config.bot.embedColor)
    .setTitle(`ℹ️ ${title}`)
    .setTimestamp();

  if (description) embed.setDescription(description);
  if (fields.length) embed.addFields(fields);
  return embed;
}

/**
 * Embed de log (pour les channels de logs)
 */
function logEmbed(action, executor, target, reason, extra = {}) {
  const embed = new EmbedBuilder()
    .setColor('#2F3136')
    .setTitle(`📋 ${action}`)
    .setTimestamp();

  const fields = [
    { name: 'Exécuteur', value: executor, inline: true },
  ];

  if (target) fields.push({ name: 'Cible', value: target, inline: true });
  if (reason) fields.push({ name: 'Raison', value: reason, inline: false });

  for (const [key, val] of Object.entries(extra)) {
    fields.push({ name: key, value: String(val), inline: true });
  }

  embed.addFields(fields);
  return embed;
}

/**
 * Embed de confirmation (avec instructions réaction)
 */
function confirmEmbed(action, description) {
  return new EmbedBuilder()
    .setColor(config.bot.embedWarnColor)
    .setTitle(`🔐 Confirmation requise — ${action}`)
    .setDescription(description + '\n\n✅ Répondez **`confirmer`** dans les 30 secondes pour continuer.\n❌ Toute autre réponse annule l\'opération.')
    .setTimestamp();
}

module.exports = { successEmbed, errorEmbed, warnEmbed, infoEmbed, logEmbed, confirmEmbed };
