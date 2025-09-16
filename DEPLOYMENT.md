# GitHub Pages Deployment Guide

## Quick Setup

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `MedicationWebapp` (or your preferred name)
3. Make it public (required for free GitHub Pages)
4. Don't initialize with README (we already have one)

### 2. Push Your Code

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit: MedicationWebapp with GitHub Pages support"

# Add your GitHub repository as remote
git remote add origin https://github.com/[your-username]/[repository-name].git

# Push to GitHub
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **GitHub Actions**
5. The deployment will start automatically

### 4. Access Your App

Your app will be available at:
```
https://[your-username].github.io/[repository-name]
```

## Automatic Deployment

- **Trigger**: Every push to `main` branch
- **Build**: Automatic build and deployment via GitHub Actions
- **Update**: Just push changes to `main` branch

## Manual Deployment

If you need to deploy manually:

```bash
# Build the app
npm run build

# The build output will be in the /out directory
# GitHub Actions will automatically deploy this
```

## Troubleshooting

### Build Fails
- Check GitHub Actions logs in your repository
- Ensure all dependencies are in package.json
- Verify Next.js configuration

### App Not Loading
- Check the URL format: `https://[username].github.io/[repo-name]`
- Ensure repository is public
- Wait a few minutes after deployment

### API Issues
- All APIs used are free and don't require keys
- Check browser console for CORS errors
- Some APIs may have rate limits

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to the repository root with your domain
2. Configure DNS settings to point to GitHub Pages
3. Enable custom domain in repository settings

## Environment Variables

No environment variables are required for this deployment. All APIs used are free and public.

## Performance

- Static export for fast loading
- Optimized for GitHub Pages
- Automatic caching via GitHub CDN

