# X73o Bot's

**Enterprise-grade Discord automation framework**

Scalable • Secure • Modular • Production-ready

---

## Overview

**X73o Bot's** is an open-source Discord automation framework designed for production environments, large communities, and scalable infrastructures.

It provides a **structured service-oriented architecture**, advanced moderation systems, global enforcement tools, and a hardened security layer.

This is not a “simple bot”.
It is a **foundation framework for building Discord systems at scale**.

---

## Key Principles

* Security-first architecture
* Zero tight coupling between modules
* Service-driven business logic
* Predictable execution flow
* Production-ready by default

---

## Tech Stack

* Node.js ≥ 18 (LTS)
* discord.js v14
* better-sqlite3 (WAL mode)
* dotenv

---

## Architecture

Built around a **clean layered architecture model**:

```text
src/
├── commands/        → Interface layer (user input)
├── events/          → Discord event gateway
├── services/        → Business logic layer
├── database/        → Persistence layer (SQLite abstraction)
├── utils/           → Shared system utilities
└── index.js         → Application bootstrap
```

### Design Philosophy

The system enforces strict separation:

* Commands = orchestration only
* Services = logic ownership
* Database = persistence only
* Utils = stateless helpers

No business logic leakage across layers.

---

## Product Capabilities

### Moderation Engine

A robust moderation system designed for high-volume servers:

* Kick / Ban / Unban workflows
* Timeout engine with duration parsing
* Safe bulk message deletion
* Built-in confirmation layers for destructive actions

---

### Administration Layer

Operational tools for server control:

* Channel regeneration system (`regen`)
* Full server snapshot backups
* Restoration engine with validation steps
* Audit-grade logging pipeline

---

### Global Enforcement System

Cross-server identity enforcement layer:

* Persistent blacklist across all guilds
* Real-time validation on events
* SQLite-backed enforcement state
* Instant denial system on join / interaction

---

### Anti-Raid Protection

Event-driven protection layer:

* Join spike detection engine
* Configurable thresholds
* Automatic alert pipeline
* Extensible reaction system (lockdown-ready)

---

### Observability & Logging

Full system traceability:

* Action audit trail (SQLite)
* Optional Discord log stream
* Timestamped structured logs
* Sensitive operation tracking

---

## Security Architecture

X73o Bot's is designed with a **defense-in-depth model**:

* Permission validation at execution layer
* Role hierarchy enforcement (Discord-native)
* Input validation (strict typing & sanitization)
* Rate limiting on sensitive operations
* Dual confirmation on destructive actions
* Global error isolation (anti-crash layer)
* Persistent blacklist enforcement system

---

## Installation

```bash
git clone <repository-url>
cd x73o-bots

npm install
cp .env.example .env
npm start
```

---

## Environment Configuration

```env
DISCORD_TOKEN=your_token_here
PREFIX=!
BOT_OWNERS=your_user_id
GLOBAL_LOG_CHANNEL_ID=optional_channel_id
```

---

## Configuration Layer

`config.json` acts as the system control plane:

* UI/Embed theming
* Feature toggles
* Rate limiting rules
* Safety thresholds
* Confirmation requirements

---

## Command System

### Admin Layer

* `!kick`
* `!ban`
* `!unban`
* `!timeout`
* `!regen`
* `!backup create`
* `!backup load`

---

### Moderation Layer

* `!clear`

---

### Global Control Layer

* `!blacklist add`
* `!blacklist remove`
* `!blacklist list`
* `!blacklist info`

---

### Utility Layer

* `!embed`
* `!setlog`
* `!help`

---

## Adding a Feature

X73o Bot's follows a strict feature isolation model.

### Command Interface

```js
module.exports = {
  name: "feature",
  description: "Feature description",
  cooldown: 3,

  async execute(message, args) {
    // business logic handled via services
  },
};
```

### Location

```text
src/commands/<domain>/<feature>.js
```

---

## Deployment

Production deployment is designed for VPS / dedicated servers:

### PM2 Runtime

```bash
npm install -g pm2

pm2 start src/index.js --name x73o-bots
pm2 save
pm2 startup
```

---

## Contributing

We welcome contributions that align with system architecture standards.

### Requirements

* Maintain strict modular boundaries
* No logic inside event handlers
* Services must remain isolated
* No breaking architectural changes without discussion
* Follow existing code patterns

### Workflow

1. Fork repository
2. Create feature branch
3. Implement changes
4. Open structured pull request

---

## Code of Conduct

This project follows professional open-source standards:

* Respectful collaboration
* Constructive technical feedback only
* No malicious contributions
* No security bypass attempts

---

## License & Attribution (Mandatory)

X73o Bot's is open-source but governed by **strict attribution requirements**.

### Requirements

Any usage, modification, or redistribution must:

* Retain original attribution
* Link back to source repository
* Preserve license section
* Not claim original authorship

### Attribution Example

> Powered by X73o Bot's — Built on the original framework by [Author]

Failure to comply may result in usage revocation where applicable.

---

## System Status

* Production-grade architecture
* Scalable by design
* Security hardened
* Actively maintained framework
* Enterprise-ready structure

---

## Closing Statement

X73o Bot's is not a bot.

It is a **foundation layer for building Discord infrastructure at scale**.

---

