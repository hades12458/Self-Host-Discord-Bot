/**
 * commands/admin/timeout.js
 */

const { PermissionFlagsBits } = require('discord.js');
const { checkPermissions, checkHierarchy } = require('../../utils/permissions');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const logger = require('../../services/LoggerService');
const config = require('../../../config.json');

// Parseuses de durée : 10m, 2h, 1d ...
function parseDuration(str) {
  const regex = /^(\d+)(s|m|h|d)$/i;
  const match = str.match(regex);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * multipliers[unit];
}

module.exports = {
  name: 'timeout',
  aliases: ['mute'],
  description: 'Met en timeout un membre',
  usage: 'timeout <@user> <durée: 10m/2h/1d> [raison]',
  permissions: [PermissionFlagsBits.ModerateMembers],
  cooldown: 5,

  async execute(message, args) {
    const { ok, missing } = checkPermissions(message.member, this.permissions);
    if (!ok) {
      return message.reply({ embeds: [errorEmbed('Permission refusée', `Permissions manquantes: \`${missing.join(', ')}\``)] });
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply({ embeds: [errorEmbed('Utilisation incorrecte', `Usage: \`${process.env.PREFIX || '!'}timeout <@user> <10m|2h|1d> [raison]\``)] });
    }

    const durationStr = args[1];
    if (!durationStr) {
      return message.reply({ embeds: [errorEmbed('Durée manquante', 'Spécifiez une durée: `10m`, `2h`, `1d`...')] });
    }

    const durationMs = parseDuration(durationStr);
    const maxMs = config.moderation.timeoutMaxMinutes * 60_000;

    if (!durationMs || durationMs < 5000 || durationMs > maxMs) {
      return message.reply({ embeds: [errorEmbed('Durée invalide', `La durée doit être entre 5s et ${config.moderation.timeoutMaxMinutes / 60 / 24} jours.`)] });
    }

    const hierarchy = checkHierarchy(message.member, target);
    if (!hierarchy.ok) {
      return message.reply({ embeds: [errorEmbed('Hiérarchie invalide', hierarchy.reason)] });
    }

    const reason = args.slice(2).join(' ') || 'Aucune raison fournie';

    try {
      await target.timeout(durationMs, reason);

      await message.reply({ embeds: [successEmbed('Timeout appliqué', `**${target.user.tag}** est en timeout pendant **${durationStr}**.`, [
        { name: 'Raison', value: reason, inline: false },
        { name: 'Modérateur', value: message.author.tag, inline: true },
        { name: 'Durée', value: durationStr, inline: true },
      ])] });

      logger.sendLog(message.guild, {
        action: '🔇 Timeout',
        executor: message.author,
        target: target.user,
        reason,
        extra: { Durée: durationStr },
      });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Erreur', `Impossible d'appliquer le timeout: ${err.message}`)] });
    }
  },
};
