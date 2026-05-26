/**
 * commands/admin/unban.js
 */

const { PermissionFlagsBits } = require('discord.js');
const { checkPermissions } = require('../../utils/permissions');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const logger = require('../../services/LoggerService');

module.exports = {
  name: 'unban',
  description: 'Débannit un utilisateur',
  usage: 'unban <userId> [raison]',
  permissions: [PermissionFlagsBits.BanMembers],
  cooldown: 5,

  async execute(message, args) {
    const { ok, missing } = checkPermissions(message.member, this.permissions);
    if (!ok) {
      return message.reply({ embeds: [errorEmbed('Permission refusée', `Permissions manquantes: \`${missing.join(', ')}\``)] });
    }

    const userId = args[0];
    if (!userId || !/^\d{17,20}$/.test(userId)) {
      return message.reply({ embeds: [errorEmbed('ID invalide', 'Veuillez fournir un ID utilisateur valide (17-20 chiffres).')] });
    }

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';

    try {
      const ban = await message.guild.bans.fetch(userId).catch(() => null);
      if (!ban) {
        return message.reply({ embeds: [errorEmbed('Non banni', 'Cet utilisateur n\'est pas banni sur ce serveur.')] });
      }

      await message.guild.members.unban(userId, reason);

      await message.reply({ embeds: [successEmbed('Utilisateur débanni', `L'utilisateur \`${userId}\` a été débanni.`, [
        { name: 'Raison', value: reason, inline: false },
        { name: 'Modérateur', value: message.author.tag, inline: true },
      ])] });

      logger.sendLog(message.guild, {
        action: '✅ Unban',
        executor: message.author,
        target: { id: userId, tag: ban.user.tag },
        reason,
      });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Erreur', `Impossible de débannir: ${err.message}`)] });
    }
  },
};
