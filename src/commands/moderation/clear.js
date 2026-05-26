/**
 * commands/moderation/clear.js
 */

const { PermissionFlagsBits } = require('discord.js');
const { checkPermissions } = require('../../utils/permissions');
const { successEmbed, errorEmbed, confirmEmbed } = require('../../utils/embedBuilder');
const { awaitConfirmation } = require('../../utils/confirmation');
const logger = require('../../services/LoggerService');
const config = require('../../../config.json');

module.exports = {
  name: 'clear',
  aliases: ['purge'],
  description: 'Supprime des messages en masse',
  usage: 'clear <1-100>',
  permissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 10,

  async execute(message, args) {
    const { ok, missing } = checkPermissions(message.member, this.permissions);
    if (!ok) {
      return message.reply({ embeds: [errorEmbed('Permission refusée', `Permissions manquantes: \`${missing.join(', ')}\``)] });
    }

    const botCheck = checkPermissions(message.guild.members.me, [PermissionFlagsBits.ManageMessages]);
    if (!botCheck.ok) {
      return message.reply({ embeds: [errorEmbed('Bot sans permission', 'Le bot ne peut pas supprimer les messages.')] });
    }

    const amount = parseInt(args[0]);
    const max = config.moderation.maxClearMessages;

    if (isNaN(amount) || amount < 1 || amount > max) {
      return message.reply({ embeds: [errorEmbed('Quantité invalide', `Veuillez spécifier un nombre entre 1 et ${max}.`)] });
    }

    // Confirmation si > 50 messages
    if (amount > config.moderation.clearConfirmThreshold) {
      const confirmed = await awaitConfirmation(
        message,
        confirmEmbed('Suppression massive', `Vous êtes sur le point de supprimer **${amount} messages** dans ce channel.\nCette action est **irréversible**.`)
      );
      if (!confirmed) return;
    }

    // Suppression du message de commande
    await message.delete().catch(() => {});

    try {
      // Discord limite à 14 jours pour bulkDelete
      const deleted = await message.channel.bulkDelete(amount, true);

      const feedback = await message.channel.send({
        embeds: [successEmbed('Messages supprimés', `**${deleted.size}** message(s) supprimé(s).${deleted.size < amount ? `\n⚠️ ${amount - deleted.size} message(s) ignoré(s) (trop anciens > 14 jours).` : ''}`)],
      });

      // Auto-suppression du feedback après 5 secondes
      setTimeout(() => feedback.delete().catch(() => {}), 5000);

      logger.sendLog(message.guild, {
        action: '🗑️ Clear',
        executor: message.author,
        extra: {
          Channel: `#${message.channel.name}`,
          'Messages supprimés': deleted.size,
          'Demandés': amount,
        },
      });
    } catch (err) {
      message.channel.send({ embeds: [errorEmbed('Erreur', `Impossible de supprimer les messages: ${err.message}`)] });
    }
  },
};
