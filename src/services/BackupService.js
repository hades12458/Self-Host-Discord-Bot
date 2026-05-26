/**
 * services/BackupService.js
 * Sauvegarde et restauration de serveur Discord
 */

const { ChannelType, PermissionOverwrites } = require('discord.js');
const db = require('../database/DatabaseManager');
const logger = require('./LoggerService');

class BackupService {
  /**
   * Crée une sauvegarde complète du serveur
   */
  async create(guild, executor) {
    const backup = {
      name: guild.name,
      icon: guild.iconURL(),
      createdAt: Date.now(),
      roles: [],
      channels: [],
    };

    // --- Rôles ---
    guild.roles.cache
      .filter(r => !r.managed && r.name !== '@everyone')
      .sort((a, b) => a.position - b.position)
      .forEach(role => {
        backup.roles.push({
          name: role.name,
          color: role.hexColor,
          hoist: role.hoist,
          mentionable: role.mentionable,
          permissions: role.permissions.bitfield.toString(),
          position: role.position,
        });
      });

    // --- Channels ---
    guild.channels.cache
      .filter(c => [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildCategory].includes(c.type))
      .sort((a, b) => (a.rawPosition || 0) - (b.rawPosition || 0))
      .forEach(channel => {
        const channelData = {
          name: channel.name,
          type: channel.type,
          topic: channel.topic || null,
          nsfw: channel.nsfw || false,
          bitrate: channel.bitrate || null,
          userLimit: channel.userLimit || null,
          position: channel.rawPosition,
          parentName: channel.parent?.name || null,
          permissionOverwrites: [],
        };

        channel.permissionOverwrites.cache.forEach(overwrite => {
          channelData.permissionOverwrites.push({
            id: overwrite.id,
            type: overwrite.type,
            allow: overwrite.allow.bitfield.toString(),
            deny: overwrite.deny.bitfield.toString(),
          });
        });

        backup.channels.push(channelData);
      });

    const result = db.saveBackup(guild.id, executor.id, backup);

    logger.sendLog(guild, {
      action: '💾 Backup — Création',
      executor,
      extra: {
        'Rôles sauvegardés': backup.roles.length,
        'Channels sauvegardés': backup.channels.length,
        'ID Backup': result.lastInsertRowid,
      },
    });

    return { success: true, backup, id: result.lastInsertRowid };
  }

  /**
   * Restaure une sauvegarde (partielle - ne détruit pas le serveur)
   * Recrée les rôles et channels manquants
   */
  async load(guild, executor) {
    const backupRow = db.getLatestBackup(guild.id);
    if (!backupRow) return { success: false, reason: 'Aucune sauvegarde trouvée pour ce serveur.' };

    const { data } = backupRow;
    const report = { rolesCreated: 0, channelsCreated: 0, errors: [] };

    // --- Restauration des rôles ---
    for (const roleData of data.roles) {
      const exists = guild.roles.cache.find(r => r.name === roleData.name);
      if (!exists) {
        try {
          await guild.roles.create({
            name: roleData.name,
            color: roleData.color,
            hoist: roleData.hoist,
            mentionable: roleData.mentionable,
            permissions: BigInt(roleData.permissions),
            reason: '[Backup] Restauration de rôle',
          });
          report.rolesCreated++;
        } catch (err) {
          report.errors.push(`Rôle "${roleData.name}": ${err.message}`);
        }
      }
    }

    // --- Restauration des catégories d'abord ---
    for (const channelData of data.channels.filter(c => c.type === ChannelType.GuildCategory)) {
      const exists = guild.channels.cache.find(c => c.name === channelData.name && c.type === ChannelType.GuildCategory);
      if (!exists) {
        try {
          await guild.channels.create({
            name: channelData.name,
            type: ChannelType.GuildCategory,
            reason: '[Backup] Restauration de catégorie',
          });
          report.channelsCreated++;
        } catch (err) {
          report.errors.push(`Catégorie "${channelData.name}": ${err.message}`);
        }
      }
    }

    // --- Restauration des channels ---
    for (const channelData of data.channels.filter(c => c.type !== ChannelType.GuildCategory)) {
      const exists = guild.channels.cache.find(c => c.name === channelData.name && c.type === channelData.type);
      if (!exists) {
        try {
          const parent = channelData.parentName
            ? guild.channels.cache.find(c => c.name === channelData.parentName && c.type === ChannelType.GuildCategory)
            : null;

          await guild.channels.create({
            name: channelData.name,
            type: channelData.type,
            topic: channelData.topic,
            nsfw: channelData.nsfw,
            bitrate: channelData.bitrate,
            userLimit: channelData.userLimit,
            parent: parent || undefined,
            reason: '[Backup] Restauration de channel',
          });
          report.channelsCreated++;
        } catch (err) {
          report.errors.push(`Channel "${channelData.name}": ${err.message}`);
        }
      }
    }

    logger.sendLog(guild, {
      action: '📂 Backup — Chargement',
      executor,
      extra: {
        'Rôles créés': report.rolesCreated,
        'Channels créés': report.channelsCreated,
        'Erreurs': report.errors.length,
      },
    });

    return { success: true, report };
  }
}

module.exports = new BackupService();
