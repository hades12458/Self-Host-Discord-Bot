/**
 * commands/utility/setlog.js
 * Configure le channel de logs du serveur
 */

const { PermissionFlagsBits } = require('discord.js');
const { checkPermissions } = require('../../utils/permissions');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const db = require('../../database/DatabaseManager');

module.exports = {
  name: 'setlog',
  description: 'Définit le channel de logs',
  usage: 'setlog <#channel>',
  permissions: [PermissionFlagsBits.Administrator],
  cooldown: 5,

  async execute(message, args) {
    const { ok } = checkPermissions(message.member, this.permissions);
    if (!ok) {
      return message.reply({ embeds: [errorEmbed('Permission refusée', '**Administrateur** requis.')] });
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply({ embeds: [errorEmbed('Channel manquant', `Usage: \`${process.env.PREFIX || '!'}setlog <#channel>\``)] });
    }

    db.setLogChannel(message.guild.id, channel.id);

    message.reply({ embeds: [successEmbed('Logs configurés', `Le channel de logs est maintenant ${channel}.`)] });
  },
};
