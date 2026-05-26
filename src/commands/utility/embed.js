/**
 * commands/utility/embed.js
 */

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermissions } = require('../../utils/permissions');
const { errorEmbed } = require('../../utils/embedBuilder');
const config = require('../../../config.json');

module.exports = {
  name: 'embed',
  description: 'Envoie un embed temporaire',
  usage: 'embed <durée_secondes> <texte>',
  permissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 5,

  async execute(message, args) {
    const { ok, missing } = checkPermissions(message.member, this.permissions);
    if (!ok) {
      return message.reply({ embeds: [errorEmbed('Permission refusée', `Permissions manquantes: \`${missing.join(', ')}\``)] });
    }

    const duration = parseInt(args[0]);
    const min = config.moderation.embedMinDuration;
    const max = config.moderation.embedMaxDuration;

    if (isNaN(duration) || duration < min || duration > max) {
      return message.reply({ embeds: [errorEmbed('Durée invalide', `La durée doit être entre **${min}** et **${max}** secondes.`)] });
    }

    const text = args.slice(1).join(' ');
    if (!text) {
      return message.reply({ embeds: [errorEmbed('Texte manquant', `Usage: \`${process.env.PREFIX || '!'}embed <secondes> <message>\``)] });
    }

    // Injection basique bloquée : on strip les balises markdown dangereuses
    const safeText = text.replace(/@(everyone|here)/g, '[@$1]');

    const embed = new EmbedBuilder()
      .setColor(config.bot.embedColor)
      .setTitle('📢 Annonce temporaire')
      .setDescription(safeText)
      .setFooter({ text: `Disparaît dans ${duration} secondes • Posté par ${message.author.tag}` })
      .setTimestamp();

    let sent;
    try {
      sent = await message.channel.send({ embeds: [embed] });
      await message.delete().catch(() => {});
    } catch (err) {
      return message.reply({ embeds: [errorEmbed('Erreur', `Impossible d'envoyer l'embed: ${err.message}`)] });
    }

    // Suppression automatique
    setTimeout(async () => {
      await sent.delete().catch(() => {});
    }, duration * 1000);
  },
};
