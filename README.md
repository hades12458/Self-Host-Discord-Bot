# 🤖 Discord Bot Pro

Bot Discord professionnel, modulaire et prêt pour la production.

## Stack technique

- **Node.js** ≥ 18 (LTS)
- **discord.js** v14
- **better-sqlite3** (stockage persistant)
- **dotenv**

---

## 📁 Architecture

```
discord-bot/
├── src/
│   ├── commands/
│   │   ├── admin/
│   │   │   ├── ban.js
│   │   │   ├── kick.js
│   │   │   ├── unban.js
│   │   │   ├── timeout.js
│   │   │   ├── blacklist.js
│   │   │   ├── regen.js
│   │   │   └── backup.js
│   │   ├── moderation/
│   │   │   └── clear.js
│   │   └── utility/
│   │       ├── embed.js
│   │       ├── setlog.js
│   │       └── help.js
│   ├── events/
│   │   ├── ready.js
│   │   ├── messageCreate.js
│   │   ├── interactionCreate.js
│   │   └── guildMemberAdd.js
│   ├── services/
│   │   ├── CommandHandler.js
│   │   ├── LoggerService.js
│   │   ├── BlacklistService.js
│   │   └── BackupService.js
│   ├── database/
│   │   └── DatabaseManager.js
│   ├── utils/
│   │   ├── embedBuilder.js
│   │   ├── permissions.js
│   │   └── confirmation.js
│   └── index.js
├── config.json
├── .env
└── package.json
```

---

## ⚙️ Installation

```bash
# 1. Cloner / dézipper le projet
cd discord-bot

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec votre token Discord

# 4. Lancer le bot
npm start

# Développement (auto-restart)
npm run dev
```

---

## 🔧 Configuration

### `.env`

```env
DISCORD_TOKEN=votre_token_ici
PREFIX=!
BOT_OWNERS=votre_user_id
GLOBAL_LOG_CHANNEL_ID=id_channel_logs_optionnel
```

### `config.json`

Ajustez les valeurs par défaut : couleurs d'embeds, durées min/max, seuils de confirmation, rate limits.

---

## 📋 Commandes

### 🛡️ Administration (ADMINISTRATOR requis)

| Commande | Description |
|----------|-------------|
| `!kick @user [raison]` | Expulse un membre |
| `!ban @user [raison]` | Bannit un membre (confirmation requise) |
| `!unban <userId> [raison]` | Débannit un utilisateur |
| `!timeout @user <durée> [raison]` | Timeout : `10m`, `2h`, `1d`... |
| `!regen` | Supprime et recrée le channel (double confirmation) |
| `!backup create` | Sauvegarde complète du serveur |
| `!backup load` | Restaure la dernière sauvegarde |

### 🚫 Blacklist globale (ADMINISTRATOR requis)

| Commande | Description |
|----------|-------------|
| `!blacklist add <userId> <raison>` | Blackliste un utilisateur sur tous les serveurs |
| `!blacklist remove <userId>` | Retire de la blacklist |
| `!blacklist list` | Liste les blacklistés |
| `!blacklist info <userId>` | Détails d'un blacklisté |

### 🔨 Modération (MANAGE_MESSAGES requis)

| Commande | Description |
|----------|-------------|
| `!clear <1-100>` | Supprime des messages (confirmation si > 50) |

### 🛠️ Utilitaires

| Commande | Description |
|----------|-------------|
| `!embed <secondes> <texte>` | Embed temporaire auto-supprimé |
| `!setlog <#channel>` | Configure le channel de logs |
| `!help [commande]` | Aide |

---

## 🔐 Sécurité

- **Vérification des permissions** centralisée avant chaque action
- **Hiérarchie des rôles** vérifiée (ban/kick/timeout)
- **Rate limiting** sur les commandes sensibles (regen, backup)
- **Double confirmation** pour les actions destructives (ban, regen, blacklist)
- **Validation des entrées** (IDs, durées, quantités)
- **Anti-crash global** (unhandledRejection, uncaughtException)
- **Blacklist inter-serveur** vérifiée à chaque message/interaction/join

---

## 🚨 Anti-Raid

Détection automatique si ≥ 10 membres rejoignent en 10 secondes → alerte dans le channel de logs.

---

## 📊 Logging

Toutes les actions modération/admin sont loggées :
- Dans le channel configuré avec `!setlog`
- En base de données SQLite (table `action_logs`)
- En console avec timestamps

---

## 🔌 Ajouter une commande

1. Créer `src/commands/<categorie>/maCommande.js`
2. Exporter : `name`, `description`, `execute(message, args)`
3. Redémarrer le bot → chargement automatique

```js
// Exemple minimal
module.exports = {
  name: 'ping',
  description: 'Répond pong',
  cooldown: 3,
  async execute(message, args) {
    message.reply('Pong !');
  },
};
```

---

## 🚀 Déploiement VPS / Render

```bash
# Avec PM2
npm install -g pm2
pm2 start src/index.js --name discord-bot
pm2 save
pm2 startup
```

---

## 📦 Base de données

SQLite avec WAL mode. Tables :

- `blacklist` — Blacklist globale
- `guild_settings` — Paramètres par serveur (logs, prefix)
- `guild_backups` — Sauvegardes serveur
- `action_logs` — Historique des actions
- `rate_limits` — Contrôle des appels
