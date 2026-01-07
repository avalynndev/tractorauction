# Complete GitHub Deployment Guide - Tractor Auction Website

## VPS Details
- **IPv4**: 72.61.238.69
- **IPv6**: 2a02:4780:12:5f3::1
- **Domain**: tractorauction.in

---

## PART 1: Prepare Project for GitHub (On Your Windows Machine)

### Step 1.1: Check if Git is Installed

Open **PowerShell** or **Command Prompt** and run:

```powershell
git --version
```

**If Git is NOT installed:**
1. Download Git from: https://git-scm.com/download/win
2. Install with default settings
3. Restart PowerShell/Command Prompt

### Step 1.2: Create .gitignore File

Make sure you have a `.gitignore` file in your project root (`D:\www.tractorauction.in`).

Create or check `.gitignore` file should contain:

```
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/
/build
.next

# Production
/dist

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env*.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Logs
logs/
*.log
npm-debug.log*

# PM2
.pm2/

# OS
Thumbs.db
.DS_Store

# Prisma
prisma/migrations/
```

### Step 1.3: Initialize Git Repository

Open **PowerShell** in your project directory:

```powershell
# Navigate to your project
cd D:\www.tractorauction.in

# Initialize Git repository
git init

# Check status
git status
```

### Step 1.4: Add All Files to Git

```powershell
# Add all files (except those in .gitignore)
git add .

# Check what will be committed
git status
```

You should see files listed, but **NOT**:
- `node_modules/`
- `.next/`
- `.env`
- `*.log`

### Step 1.5: Create First Commit

```powershell
# Create initial commit
git commit -m "Initial commit - Production ready version"
```

---

## PART 2: Create GitHub Repository

### Step 2.1: Create GitHub Account (if you don't have one)

1. Go to: https://github.com
2. Click **Sign up**
3. Create your account

### Step 2.2: Create New Repository

1. Log in to GitHub
2. Click the **+** icon (top right) → **New repository**
3. Repository settings:
   - **Repository name**: `tractorauction` (or any name you prefer)
   - **Description**: `Tractor Auction Website - Next.js Application`
   - **Visibility**: 
     - Choose **Private** (recommended for production code)
     - Or **Public** (if you want it open)
   - **DO NOT** check:
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
   - Click **Create repository**

### Step 2.3: Get Repository URL

After creating the repository, GitHub will show you the repository URL. It will look like:

```
https://github.com/YOUR_USERNAME/tractorauction.git
```

**Copy this URL** - you'll need it in the next step.

---

## PART 3: Push Code to GitHub

### Step 3.1: Connect Local Repository to GitHub

Back in **PowerShell** (in your project directory):

```powershell
# Make sure you're in the project directory
cd D:\www.tractorauction.in

# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/tractorauction.git

# Verify remote was added
git remote -v
```

### Step 3.2: Push Code to GitHub

```powershell
# Push to GitHub (first time)
git branch -M main
git push -u origin main
```

**If prompted for credentials:**
- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your GitHub password)

### Step 3.3: Create Personal Access Token (if needed)

If GitHub asks for a password:

1. Go to: https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Settings:
   - **Note**: `VPS Deployment`
   - **Expiration**: Choose duration (90 days or custom)
   - **Scopes**: Check **repo** (all repo permissions)
4. Click **Generate token**
5. **Copy the token immediately** (you won't see it again!)
6. Use this token as your password when pushing

### Step 3.4: Verify Code is on GitHub

1. Go to your repository on GitHub
2. You should see all your project files
3. Verify `.env` is **NOT** there (it should be in .gitignore)

---

## PART 4: Prepare VPS (Using PuTTY/WinSCP)

### Step 4.1: Connect to VPS via PuTTY

1. Open **PuTTY**
2. Enter:
   - **Host Name**: `72.61.238.69`
   - **Port**: `22`
   - **Connection type**: SSH
3. Click **Open**
4. Login with:
   - **Username**: `root`
   - **Password**: (your VPS password)

### Step 4.2: Backup Current Project on VPS

```bash
# Navigate to project directory
cd /var/www/html

# Stop PM2
pm2 stop tractorauction

# Create backup of current project
cp -r www.tractorauction.in www.tractorauction.in.backup.$(date +%Y%m%d_%H%M%S)

# Verify backup was created
ls -la | grep backup
```

### Step 4.3: Install Git on VPS (if not installed)

```bash
# Check if Git is installed
git --version

# If not installed, install it
apt update
apt install -y git
```

### Step 4.4: Save .env File (Important!)

```bash
# Copy .env to a safe location
cp /var/www/html/www.tractorauction.in/.env /root/tractorauction.env.backup

# Verify it was copied
cat /root/tractorauction.env.backup | head -5
```

**⚠️ IMPORTANT**: Your `.env` file contains production secrets. Make sure it's backed up!

---

## PART 5: Clone and Deploy from GitHub

### Step 5.1: Remove Old Project (Keep Backup!)

```bash
# Remove old project directory (we have backup)
cd /var/www/html
rm -rf www.tractorauction.in
```

### Step 5.2: Clone Repository from GitHub

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/tractorauction.git www.tractorauction.in

# Navigate to project
cd www.tractorauction.in

# Verify files were cloned
ls -la
```

**If repository is Private:**
- You'll be prompted for GitHub username and password (use Personal Access Token)
- Or set up SSH keys (more advanced)

### Step 5.3: Restore .env File

```bash
# Copy .env from backup
cp /root/tractorauction.env.backup /var/www/html/www.tractorauction.in/.env

# Verify .env exists
ls -la .env

# Check it has the right content (first few lines)
head -5 .env
```

### Step 5.4: Install Dependencies

```bash
# Make sure you're in project directory
cd /var/www/html/www.tractorauction.in

# Install Node.js dependencies
npm install

# Generate Prisma client
npm run db:generate
```

### Step 5.5: Build the Application

```bash
# Build for production
npm run build
```

**If build succeeds**, you're ready to deploy!

### Step 5.6: Start Application with PM2

```bash
# Start with PM2
pm2 start server.js --name tractorauction --env production

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the instructions shown (usually run a sudo command)

# Check status
pm2 status

# View logs
pm2 logs tractorauction --lines 30
```

### Step 5.7: Verify Application is Running

```bash
# Check if app is responding
curl http://localhost:3000

# Check PM2 status
pm2 status

# Check if port 3000 is listening
netstat -tulpn | grep 3000
```

---

## PART 6: Verify Deployment

### Step 6.1: Check Website

1. Open browser
2. Visit: `https://tractorauction.in`
3. You should see your application (not nginx default page)

### Step 6.2: Check Nginx Configuration

```bash
# Test Nginx configuration
nginx -t

# If test passes, reload Nginx
systemctl reload nginx
```

### Step 6.3: Monitor Application

```bash
# View real-time logs
pm2 logs tractorauction

# Monitor resources
pm2 monit
```

---

## PART 7: Future Updates (How to Update from GitHub)

When you make changes to your code:

### On Your Local Machine:

```powershell
# Make your changes
# ... edit files ...

# Commit changes
git add .
git commit -m "Description of changes"
git push origin main
```

### On VPS:

```bash
# Navigate to project
cd /var/www/html/www.tractorauction.in

# Stop PM2
pm2 stop tractorauction

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Regenerate Prisma client (if schema changed)
npm run db:generate

# Rebuild
npm run build

# Restart PM2
pm2 restart tractorauction

# Check logs
pm2 logs tractorauction --lines 20
```

---

## Troubleshooting

### Issue: Git push asks for password repeatedly

**Solution**: Use Personal Access Token instead of password, or set up SSH keys.

### Issue: Build fails on VPS

**Solution**: 
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Issue: Application not starting

**Solution**:
```bash
# Check PM2 logs
pm2 logs tractorauction --lines 50

# Check if .env file exists
ls -la .env

# Check database connection
# Test DATABASE_URL in .env
```

### Issue: Can't access website

**Solution**:
```bash
# Check Nginx is running
systemctl status nginx

# Check PM2 is running
pm2 status

# Check firewall
ufw status
```

---

## Security Checklist

- [ ] `.env` file is in `.gitignore` (not in GitHub)
- [ ] `.env` file is backed up on VPS
- [ ] GitHub repository is Private (if contains sensitive info)
- [ ] Personal Access Token is stored securely
- [ ] PM2 is configured to start on boot
- [ ] Nginx SSL is configured correctly
- [ ] Firewall is configured

---

## Quick Reference Commands

```bash
# On VPS - Update from GitHub
cd /var/www/html/www.tractorauction.in && git pull && npm install && npm run build && pm2 restart tractorauction

# Check application status
pm2 status && pm2 logs tractorauction --lines 20

# Restart application
pm2 restart tractorauction

# View logs
pm2 logs tractorauction

# Check if app is running
curl http://localhost:3000
```

---

## Next Steps After Deployment

1. ✅ Set up automatic backups
2. ✅ Configure monitoring
3. ✅ Set up CI/CD (optional, advanced)
4. ✅ Document your deployment process
5. ✅ Test all features on production

---

**Congratulations!** Your application should now be deployed and running on your VPS! 🎉

