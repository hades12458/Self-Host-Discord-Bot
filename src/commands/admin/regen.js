/**
 * commands/admin/regen.js
 * Recrée le channel actuel identique (utile contre le spam/raid)
 */

const { PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkPermissions } = require('../../utils/permissions');
const { errorEmbed, warnEmbed, confirmEmbed } = require('../../utils/embedBuilder');
const { awaitConfirmation } = require('../../utils/confirmation');
const logger = require('../../services/LoggerService');
const db = require('../../database/DatabaseManager');
const config = require('../../../config.json');

module.exports = {
  name: 'regen',
  description: 'Supprime et recrée le channel actuel à l\'identique',
  usage: 'regen',
  permissions: [PermissionFlagsBits.ManageChannels],
  cooldown: 60,

  async execute(message, args) {
    const { ok, missing } = checkPermissions(message.member, this.permissions);
    if (!ok) {
      return message.reply({ embeds: [errorEmbed('Permission refusée', `Permissions manquantes: \`${missing.join(', ')}\``)] });
    }

    const botCheck = checkPermissions(message.guild.members.me, [PermissionFlagsBits.ManageChannels]);
    if (!botCheck.ok) {
      return message.reply({ embeds: [errorEmbed('Bot sans permission', 'Le bot ne peut pas gérer les channels.')] });
    }

    // Rate limit renforcé sur regen (action très sensible)
    const rlOk = db.checkRateLimit(
      `${message.guild.id}:regen`,
      'regen',
      config.rateLimit.sensitive.windowMs,
      config.rateLimit.sensitive.maxCalls
    );
    if (!rlOk) {
      return message.reply({ embeds: [errorEmbed('Rate limit', 'La commande regen est limitée. Réessayez dans quelques minutes.')] });
    }

    const channel = message.channel;

    // Double confirmation
    const confirm1 = await awaitConfirmation(
      message,
      confirmEmbed(
        'Regen — Étape 1/2',
        `Vous êtes sur le point de **supprimer et recréer** le channel **#${channel.name}**.\n\n⚠️ **Tous les messages seront perdus.**`
      )
    );
    if (!confirm1) return;

    const confirm2 = await awaitConfirmation(
      message,
      confirmEmbed(
        'Regen — Étape 2/2 (FINALE)',
        `**DERNIÈRE CONFIRMATION** — Cette action est **irréversible**.\nChannel ciblé: **#${channel.name}** (\`${channel.id}\`)`
      )
    );
    if (!confirm2) return;

    // Sauvegarde des propriétés du channel
    const channelData = {
      name: channel.name,
      topic: channel.topic,
      nsfw: channel.nsfw,
      parent: channel.parent,
      position: channel.rawPosition,
      permissionOverwrites: channel.permissionOverwrites.cache.map(o => ({
        id: o.id,
        type: o.type,
        allow: o.allow,
        deny: o.deny,
      })),
    };

    try {
      // Création du nouveau channel avant suppression (évite les accidents)
      const newChannel = await message.guild.channels.create({
        name: channelData.name,
        type: ChannelType.GuildText,
        topic: channelData.topic,
        nsfw: channelData.nsfw,
        parent: channelData.parent,
        permissionOverwrites: channelData.permissionOverwrites,
        reason: `[Regen] par ${message.author.tag}`,
      });

      // Repositionnement
      await newChannel.setPosition(channelData.position).catch(() => {});

      // Suppression de l'ancien channel
      await channel.delete(`[Regen] par ${message.author.tag}`);

      // Message de confirmation dans le nouveau channel
      await newChannel.send({ embeds: [{
        color: 0x57F287,
        title: '♻️ Channel régénéré',
        description: `Ce channel a été recréé par **${message.author.tag}**.`,
        timestamp: new Date().toISOString(),
      }] });

      logger.sendLog(message.guild, {
        action: '♻️ Regen Channel',
        executor: message.author,
        extra: {
          'Channel (ancien)': `#${channelData.name} (${channel.id})`,
          'Channel (nouveau)': `#${newChannel.name} (${newChannel.id})`,
        },
      });
    } catch (err) {
      // Tentative de message d'erreur dans le channel existant (si pas encore supprimé)
      message.channel.send({ embeds: [errorEmbed('Erreur critique', `Regen échoué: ${err.message}\nLe channel original est peut-être toujours présent.`)] }).catch(() => {});
    }
  },
};
