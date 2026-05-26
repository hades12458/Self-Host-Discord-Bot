/**
 * commands/utility/help.js
 */

const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  name: 'help',
  aliases: ['aide', 'h'],
  description: 'Affiche la liste des commandes',
  usage: 'help [commande]',
  cooldown: 3,

  async execute(message, args) {
    const { commands } = require('../../services/CommandHandler');
    const prefix = process.env.PREFIX || config.bot.prefix;

    if (args[0]) {
      const cmd = commands.get(args[0].toLowerCase());
      if (!cmd) {
        return message.reply(`❌ Commande \`${args[0]}\` introuvable.`);
      }

      const embed = new EmbedBuilder()
        .setColor(config.bot.embedColor)
        .setTitle(`📖 Aide — \`${cmd.name}\``)
        .addFields(
          { name: 'Description', value: cmd.description || 'Aucune description', inline: false },
          { name: 'Usage', value: `\`${prefix}${cmd.usage || cmd.name}\``, inline: false },
        )
        .setTimestamp();

      if (cmd.aliases?.length) {
        embed.addFields({ name: 'Alias', value: cmd.aliases.map(a => `\`${a}\``).join(', '), inline: false });
      }

      return message.reply({ embeds: [embed] });
    }

    // Liste complète - dédupliquée
    const seen = new Set();
    const categories = {};

    for (const [, cmd] of commands) {
      if (seen.has(cmd.name)) continue;
      seen.add(cmd.name);

      const category = cmd.category || 'Général';
      if (!categories[category]) categories[category] = [];
      categories[category].push(`\`${prefix}${cmd.name}\``);
    }

    const embed = new EmbedBuilder()
      .setColor(config.bot.embedColor)
      .setTitle('📚 Commandes disponibles')
      .setDescription(`Prefix: \`${prefix}\` • Faites \`${prefix}help <commande>\` pour plus d'infos`)
      .setTimestamp();

    // Catégories auto-détectées depuis le nom du dossier
    const allCmds = [...new Set([...commands.values()].map(c => c.name))].map(n => `\`${prefix}${n}\``);
    embed.addFields({ name: 'Toutes les commandes', value: allCmds.join(' • ') || 'Aucune' });

    message.reply({ embeds: [embed] });
  },
};
