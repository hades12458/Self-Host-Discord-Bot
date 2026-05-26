# Railway Deployment Guide

This guide explains how to deploy the X73o Bot's Discord bot to Railway.

## Prerequisites

- Railway account: https://railway.app
- GitHub account with this repository
- Discord bot token

## Setup Instructions

### 1. Create a Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign in with your GitHub account
3. Create a new project
4. Select "Deploy from GitHub repo"
5. Select `hades12458/Self-Host-Discord-Bot`

### 2. Configure Environment Variables

In your Railway project dashboard, add the following environment variables:

```
DISCORD_TOKEN=your_discord_bot_token_here
PREFIX=!
BOT_OWNERS=your_user_id
GLOBAL_LOG_CHANNEL_ID=optional_channel_id
NODE_ENV=production
```

### 3. Set Up GitHub Actions Deployment Token

1. In Railway, go to **Account Settings** → **Tokens**
2. Create a new token (copy it)
3. Go to your GitHub repository
4. Navigate to **Settings** → **Secrets and variables** → **Actions**
5. Create a new secret named `RAILWAY_TOKEN` and paste the token

### 4. Deploy

The bot will automatically deploy when you:
- Push to the `main` branch
- Or manually trigger via GitHub Actions → "Deploy to Railway"

## Verifying Deployment

1. Check the Railway dashboard for deployment status
2. View logs in Railway: **Project** → **Deployments** → **View Logs**
3. Check GitHub Actions: **Actions** tab for workflow status

## Monitoring & Logs

### Railway Logs
- Dashboard → Deployments → View Logs
- Real-time output from your bot

### GitHub Actions Logs
- Repository → Actions tab
- View workflow run details

## Troubleshooting

### Deployment Fails with "npm install" error
- Check `package.json` for syntax errors
- Verify Node.js version compatibility (≥18.0.0)

### Bot doesn't start
- Check environment variables are set correctly
- View Railway logs for error messages
- Verify `DISCORD_TOKEN` is valid

### GitHub Actions workflow not running
- Verify `RAILWAY_TOKEN` secret is set
- Check workflow file syntax in `.github/workflows/railway-deploy.yml`
- Check branch protection rules aren't blocking deployments

## Auto-Deploy Configuration

The workflow in `.github/workflows/railway-deploy.yml` automatically:
- Deploys on every push to `main` branch
- Can be manually triggered via GitHub Actions UI
- Notifies of deployment status

## Rolling Back a Deployment

1. Go to Railway dashboard
2. Navigate to **Deployments**
3. Select a previous deployment
4. Click **Redeploy**

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Your Discord bot token |
| `PREFIX` | No | Command prefix (default: `!`) |
| `BOT_OWNERS` | Yes | Discord user ID of bot owner |
| `GLOBAL_LOG_CHANNEL_ID` | No | Channel ID for logs |
| `NODE_ENV` | No | Set to `production` |

## Stopping the Bot

In Railway:
1. Go to your project
2. Select the bot service
3. Click **Pause** or delete the deployment

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord Support](https://discord.gg/railway)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Note**: Ensure your Discord bot has the necessary permissions configured in the Discord Developer Portal.
