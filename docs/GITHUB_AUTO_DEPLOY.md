# GitHub Auto-Deployment to Vercel

This guide explains how to set up automatic deployment to Vercel when you merge to the `master` branch.

## 🎯 Two Methods

### Method 1: Vercel GitHub Integration (Recommended - Easiest)

Vercel automatically deploys when connected to GitHub. This is the simplest method:

1. **Connect GitHub to Vercel**
   - Go to https://vercel.com/intellegin-ai/audio
   - Click **Settings** → **Git**
   - Click **Connect Git Repository**
   - Select your GitHub repository
   - Choose the branch (usually `master` or `main`)

2. **Configure Auto-Deploy**
   - In **Settings** → **Git**
   - Under **Production Branch**, select `master` (or `main`)
   - Enable **Automatic deployments from Git**
   - ✅ Done! Every push/merge to `master` will auto-deploy

3. **Optional: Preview Deployments**
   - Enable **Preview deployments** for pull requests
   - Each PR gets its own preview URL

### Method 2: GitHub Actions Workflow

If you prefer using GitHub Actions (already configured):

1. **Get Vercel Secrets**
   - Go to https://vercel.com/account/tokens
   - Create a new token (or use existing)
   - Copy the token

2. **Get Project IDs**
   - Go to https://vercel.com/intellegin-ai/audio → **Settings** → **General**
   - Copy:
     - **Project ID**
     - **Team ID** (Organization ID)

3. **Add GitHub Secrets**
   - Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
   - Add these secrets:
     - `VERCEL_TOKEN` - Your Vercel token from step 1
     - `VERCEL_ORG_ID` - Your Team/Org ID from step 2
     - `VERCEL_PROJECT_ID` - Your Project ID from step 2

4. **Workflow is Ready**
   - The workflow file `.github/workflows/deploy.yml` is already configured
   - It will automatically deploy on:
     - Push to `master` or `main` branch
     - Manual trigger via GitHub Actions UI

## ✅ Verification

After setting up:

1. **Make a test change**
   - Create a small commit (e.g., update README)
   - Push to `master` branch

2. **Check Deployment**
   - **Method 1**: Go to Vercel dashboard → **Deployments** tab
   - **Method 2**: Go to GitHub → **Actions** tab → Check workflow run

3. **Verify**
   - You should see a new deployment starting automatically
   - Wait for build to complete
   - Visit your deployment URL

## 🔧 Troubleshooting

### Vercel Integration Not Working

- **Check Git connection**: Settings → Git → Verify repository is connected
- **Check branch**: Ensure `master` is set as production branch
- **Check permissions**: Ensure Vercel has access to your repository

### GitHub Actions Not Deploying

- **Check secrets**: Verify all three secrets are set correctly
- **Check workflow file**: Ensure `.github/workflows/deploy.yml` exists
- **Check branch name**: Workflow triggers on `master` or `main`
- **Check Actions tab**: Look for errors in workflow runs

### Build Fails

- **Check environment variables**: Ensure all required vars are set in Vercel
- **Check build logs**: Vercel dashboard → Deployment → Build logs
- **Check GitHub Actions logs**: Actions tab → Workflow run → View logs

## 📝 Notes

- **Method 1 (Vercel Integration)** is recommended because:
  - Simpler setup
  - Automatic preview deployments for PRs
  - Better integration with Vercel dashboard
  - No need to manage secrets

- **Method 2 (GitHub Actions)** is useful if:
  - You want more control over deployment process
  - You need custom deployment steps
  - You want to integrate with other CI/CD tools

## 🚀 Current Setup

Your repository already has:
- ✅ `.github/workflows/deploy.yml` - GitHub Actions workflow
- ✅ `.github/workflows/ci.yml` - CI workflow for testing

**Recommended**: Use Method 1 (Vercel Integration) for the simplest setup.
