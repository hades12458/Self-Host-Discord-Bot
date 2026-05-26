/**
 * commands/admin/blacklist.js
 * Blacklist globale inter-serveur
 */

const { PermissionFlagsBits } = require('discord.js');
const { checkPermissions, isBotOwner } = require('../../utils/permissions');
const { successEmbed, errorEmbed, infoEmbed, confirmEmbed } = require('../../utils/embedBuilder');
const { awaitConfirmation } = require('../../utils/confirmation');
const BlacklistService = require('../../services/BlacklistService');

module.exports = {
  name: 'blacklist',
  aliases: ['bl'],
  description: 'Gestion de la blacklist globale',
  usage: 'blacklist <add|remove|list|info> [userId] [raison]',
  permissions: [PermissionFlagsBits.Administrator],
  cooldown: 3,

  async execute(message, args) {
    // Nécessite ADMINISTRATOR ou être owner du bot
    const { ok } = checkPermissions(message.member, this.permissions);
    if (!ok && !isBotOwner(message.author.id)) {
      return message.reply({ embeds: [errorEmbed('Permission refusée', 'Vous devez être **Administrateur** pour utiliser cette commande.')] });
    }

    const subCommand = args[0]?.toLowerCase();

    switch (subCommand) {
      case 'add':
        return this._add(message, args.slice(1));
      case 'remove':
      case 'rm':
        return this._remove(message, args.slice(1));
      case 'list':
        return this._list(message);
      case 'info':
        return this._info(message, args.slice(1));
      default:
        return message.reply({ embeds: [infoEmbed('Blacklist — Aide', null, [
          { name: 'Commandes disponibles', value:
            '`blacklist add <userId> <raison>` — Blackliste un utilisateur\n' +
            '`blacklist remove <userId>` — Retire un utilisateur\n' +
            '`blacklist list` — Liste tous les blacklistés\n' +
            '`blacklist info <userId>` — Détails d\'un blacklisté',
          },
        ])] });
    }
  },

  async _add(message, args) {
    const userId = args[0];
    if (!userId || !/^\d{17,20}$/.test(userId)) {
      return message.reply({ embeds: [errorEmbed('ID invalide', 'Fournissez un ID utilisateur Discord valide (17-20 chiffres).')] });
    }

    const reason = args.slice(1).join(' ');
    if (!reason) {
      return message.reply({ embeds: [errorEmbed('Raison manquante', 'Vous devez spécifier une raison pour la blacklist.')] });
    }

    // Confirmation
    const confirmed = await awaitConfirmation(
      message,
      confirmEmbed('Blacklist — Ajout', `Blacklister l'utilisateur \`${userId}\` ?\nRaison: **${reason}**`)
    );
    if (!confirmed) return;

    const result = BlacklistService.add(userId, reason, message.author.id, message.guild);

    if (!result.success) {
      return message.reply({ embeds: [errorEmbed('Échec', result.reason)] });
    }

    message.reply({ embeds: [successEmbed('Blacklisté', `L'utilisateur \`${userId}\` a été ajouté à la blacklist globale.`, [
      { name: 'Raison', value: reason, inline: false },
    ])] });
  },

  async _remove(message, args) {
    const userId = args[0];
    if (!userId || !/^\d{17,20}$/.test(userId)) {
      return message.reply({ embeds: [errorEmbed('ID invalide', 'Fournissez un ID utilisateur Discord valide.')] });
    }

    const confirmed = await awaitConfirmation(
      message,
      confirmEmbed('Blacklist — Retrait', `Retirer \`${userId}\` de la blacklist globale ?`)
    );
    if (!confirmed) return;

    const result = BlacklistService.remove(userId, message.author.id, message.guild);

    if (!result.success) {
      return message.reply({ embeds: [errorEmbed('Échec', result.reason)] });
    }

    message.reply({ embeds: [successEmbed('Retiré', `L'utilisateur \`${userId}\` n'est plus blacklisté.`)] });
  },

  async _list(message) {
    const list = BlacklistService.getAll();

    if (!list.length) {
      return message.reply({ embeds: [infoEmbed('Blacklist vide', 'Aucun utilisateur blacklisté.')] });
    }

    // Pagination simple (max 20 par embed pour lisibilité)
    const chunk = list.slice(0, 20);
    const description = chunk.map((entry, i) =>
      `\`${i + 1}.\` **${entry.user_id}** — ${entry.reason}\n└ Ajouté le <t:${entry.added_at}:d> par \`${entry.added_by}\``
    ).join('\n');

    message.reply({ embeds: [infoEmbed(`Blacklist globale (${list.length} entrée(s))`, description)] });
  },

  async _info(message, args) {
    const userId = args[0];
    if (!userId || !/^\d{17,20}$/.test(userId)) {
      return message.reply({ embeds: [errorEmbed('ID invalide', 'Fournissez un ID utilisateur Discord valide.')] });
    }

    const entry = BlacklistService.getInfo(userId);
    if (!entry) {
      return message.reply({ embeds: [infoEmbed('Utilisateur non blacklisté', `\`${userId}\` n'est pas dans la blacklist.`)] });
    }

    message.reply({ embeds: [infoEmbed(`Blacklist — Infos`, `ID: \`${entry.user_id}\``, [
      { name: 'Raison', value: entry.reason, inline: false },
      { name: 'Ajouté par', value: `\`${entry.added_by}\``, inline: true },
      { name: 'Date d\'ajout', value: `<t:${entry.added_at}:F>`, inline: true },
    ])] });
  },
};
