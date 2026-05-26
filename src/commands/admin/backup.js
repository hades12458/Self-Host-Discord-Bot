/**
 * commands/admin/backup.js
 */

const { PermissionFlagsBits } = require('discord.js');
const { checkPermissions } = require('../../utils/permissions');
const { successEmbed, errorEmbed, infoEmbed, confirmEmbed, warnEmbed } = require('../../utils/embedBuilder');
const { awaitConfirmation } = require('../../utils/confirmation');
const BackupService = require('../../services/BackupService');
const db = require('../../database/DatabaseManager');

module.exports = {
  name: 'backup',
  description: 'Sauvegarde et restauration du serveur',
  usage: 'backup <create|load>',
  permissions: [PermissionFlagsBits.Administrator],
  cooldown: 30,

  async execute(message, args) {
    const { ok } = checkPermissions(message.member, this.permissions);
    if (!ok) {
      return message.reply({ embeds: [errorEmbed('Permission refusée', '**Administrateur** requis.')] });
    }

    const sub = args[0]?.toLowerCase();

    if (sub === 'create') return this._create(message);
    if (sub === 'load') return this._load(message);

    message.reply({ embeds: [infoEmbed('Backup — Aide', null, [
      { name: 'Commandes', value: '`backup create` — Crée une sauvegarde\n`backup load` — Restaure la dernière sauvegarde' },
    ])] });
  },

  async _create(message) {
    // Rate limit
    const ok = db.checkRateLimit(`${message.guild.id}:backup`, 'backup_create', 300_000, 2);
    if (!ok) {
      return message.reply({ embeds: [errorEmbed('Rate limit', 'Vous ne pouvez créer qu\'une backup toutes les 5 minutes.')] });
    }

    const loading = await message.reply({ embeds: [infoEmbed('Backup en cours...', '⏳ Sauvegarde du serveur en cours, veuillez patienter...')] });

    const result = await BackupService.create(message.guild, message.author);

    if (!result.success) {
      return loading.edit({ embeds: [errorEmbed('Échec', result.reason)] });
    }

    loading.edit({ embeds: [successEmbed('Backup créée', `Sauvegarde complète du serveur **${message.guild.name}**.`, [
      { name: 'Rôles', value: String(result.backup.roles.length), inline: true },
      { name: 'Channels', value: String(result.backup.channels.length), inline: true },
      { name: 'ID Backup', value: String(result.id), inline: true },
    ])] });
  },

  async _load(message) {
    const backupRow = db.getLatestBackup(message.guild.id);
    if (!backupRow) {
      return message.reply({ embeds: [errorEmbed('Aucune backup', 'Aucune sauvegarde trouvée pour ce serveur. Faites `backup create` d\'abord.')] });
    }

    const date = new Date(backupRow.created_at * 1000).toLocaleString('fr-FR');

    const confirmed = await awaitConfirmation(
      message,
      confirmEmbed(
        'Backup — Restauration',
        `Restaurer la sauvegarde du **${date}** ?\n\n⚠️ Seuls les éléments **manquants** seront recréés. Les éléments existants ne seront pas modifiés.`
      )
    );
    if (!confirmed) return;

    const loading = await message.reply({ embeds: [infoEmbed('Restauration en cours...', '⏳ Cela peut prendre quelques secondes...')] });

    const result = await BackupService.load(message.guild, message.author);

    if (!result.success) {
      return loading.edit({ embeds: [errorEmbed('Échec', result.reason)] });
    }

    const { report } = result;
    const fields = [
      { name: 'Rôles créés', value: String(report.rolesCreated), inline: true },
      { name: 'Channels créés', value: String(report.channelsCreated), inline: true },
    ];

    if (report.errors.length) {
      fields.push({ name: `Erreurs (${report.errors.length})`, value: report.errors.slice(0, 5).join('\n'), inline: false });
    }

    loading.edit({ embeds: [successEmbed('Restauration terminée', 'La sauvegarde a été restaurée.', fields)] });
  },
};
