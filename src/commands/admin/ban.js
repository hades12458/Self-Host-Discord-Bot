/**
 * commands/admin/ban.js
 */

const { PermissionFlagsBits } = require('discord.js');
const { checkPermissions, checkHierarchy } = require('../../utils/permissions');
const { successEmbed, errorEmbed, confirmEmbed } = require('../../utils/embedBuilder');
const { awaitConfirmation } = require('../../utils/confirmation');
const logger = require('../../services/LoggerService');

module.exports = {
  name: 'ban',
  description: 'Bannit un membre du serveur',
  usage: 'ban <@user> [raison]',
  permissions: [PermissionFlagsBits.BanMembers],
  cooldown: 5,

  async execute(message, args) {
    const { ok, missing } = checkPermissions(message.member, this.permissions);
    if (!ok) {
      return message.reply({ embeds: [errorEmbed('Permission refusée', `Permissions manquantes: \`${missing.join(', ')}\``)] });
    }

    const botCheck = checkPermissions(message.guild.members.me, this.permissions);
    if (!botCheck.ok) {
      return message.reply({ embeds: [errorEmbed('Permission bot manquante', `Le bot ne peut pas bannir (manque: \`${botCheck.missing.join(', ')}\`).`)] });
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply({ embeds: [errorEmbed('Utilisation incorrecte', `Usage: \`${process.env.PREFIX || '!'}ban <@utilisateur> [raison]\``)] });
    }

    const hierarchy = checkHierarchy(message.member, target);
    if (!hierarchy.ok) {
      return message.reply({ embeds: [errorEmbed('Hiérarchie invalide', hierarchy.reason)] });
    }

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';

    // Confirmation obligatoire pour ban
    const confirmed = await awaitConfirmation(
      message,
      confirmEmbed('Ban', `Vous êtes sur le point de bannir **${target.user.tag}**.\nRaison: \`${reason}\``)
    );
    if (!confirmed) return;

    try {
      await target.ban({ reason, deleteMessageSeconds: 86400 });

      await message.reply({ embeds: [successEmbed('Membre banni', `**${target.user.tag}** a été banni du serveur.`, [
        { name: 'Raison', value: reason, inline: false },
        { name: 'Modérateur', value: message.author.tag, inline: true },
      ])] });

      logger.sendLog(message.guild, {
        action: '🔨 Ban',
        executor: message.author,
        target: target.user,
        reason,
      });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Erreur', `Impossible de bannir ce membre: ${err.message}`)] });
    }
  },
};
