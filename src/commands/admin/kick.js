/**
 * commands/admin/kick.js
 */

const { PermissionFlagsBits } = require('discord.js');
const { checkPermissions, checkHierarchy } = require('../../utils/permissions');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const logger = require('../../services/LoggerService');

module.exports = {
  name: 'kick',
  description: 'Expulse un membre du serveur',
  usage: 'kick <@user> [raison]',
  permissions: [PermissionFlagsBits.KickMembers],
  cooldown: 5,

  async execute(message, args) {
    // Vérification permissions exécuteur
    const { ok, missing } = checkPermissions(message.member, this.permissions);
    if (!ok) {
      return message.reply({ embeds: [errorEmbed('Permission refusée', `Permissions manquantes: \`${missing.join(', ')}\``)] });
    }

    // Vérification permissions bot
    const botCheck = checkPermissions(message.guild.members.me, this.permissions);
    if (!botCheck.ok) {
      return message.reply({ embeds: [errorEmbed('Permission bot manquante', `Le bot ne peut pas expulser (manque: \`${botCheck.missing.join(', ')}\`).`)] });
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply({ embeds: [errorEmbed('Utilisation incorrecte', `Usage: \`${process.env.PREFIX || '!'}kick <@utilisateur> [raison]\``)] });
    }

    // Hiérarchie
    const hierarchy = checkHierarchy(message.member, target);
    if (!hierarchy.ok) {
      return message.reply({ embeds: [errorEmbed('Hiérarchie invalide', hierarchy.reason)] });
    }

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';

    try {
      await target.kick(reason);

      await message.reply({ embeds: [successEmbed('Membre expulsé', `**${target.user.tag}** a été expulsé du serveur.`, [
        { name: 'Raison', value: reason, inline: false },
        { name: 'Modérateur', value: message.author.tag, inline: true },
      ])] });

      logger.sendLog(message.guild, {
        action: '👢 Kick',
        executor: message.author,
        target: target.user,
        reason,
      });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Erreur', `Impossible d'expulser ce membre: ${err.message}`)] });
    }
  },
};
