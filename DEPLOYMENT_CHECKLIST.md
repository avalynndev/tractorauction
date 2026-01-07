# Quick Deployment Checklist

## Before Starting
- [ ] Git installed on Windows machine
- [ ] GitHub account created
- [ ] PuTTY/WinSCP installed
- [ ] VPS access credentials ready

## Step 1: Local Setup (Windows)
- [ ] Open PowerShell in `D:\www.tractorauction.in`
- [ ] Run `git init`
- [ ] Check `.gitignore` exists and excludes `.env`, `node_modules`, `.next`
- [ ] Run `git add .`
- [ ] Run `git commit -m "Initial commit"`

## Step 2: GitHub Setup
- [ ] Create new repository on GitHub (Private recommended)
- [ ] Copy repository URL
- [ ] Run `git remote add origin <YOUR_REPO_URL>`
- [ ] Run `git push -u origin main`
- [ ] Verify files are on GitHub (check `.env` is NOT there)

## Step 3: VPS Preparation (PuTTY)
- [ ] Connect to VPS: `ssh root@72.61.238.69`
- [ ] Run `pm2 stop tractorauction`
- [ ] Run backup: `cp -r /var/www/html/www.tractorauction.in /var/www/html/www.tractorauction.in.backup`
- [ ] Backup `.env`: `cp /var/www/html/www.tractorauction.in/.env /root/tractorauction.env.backup`
- [ ] Install Git: `apt install -y git` (if needed)

## Step 4: Deploy from GitHub
- [ ] Remove old project: `rm -rf /var/www/html/www.tractorauction.in`
- [ ] Clone: `git clone https://github.com/YOUR_USERNAME/tractorauction.git /var/www/html/www.tractorauction.in`
- [ ] Restore `.env`: `cp /root/tractorauction.env.backup /var/www/html/www.tractorauction.in/.env`
- [ ] Install: `cd /var/www/html/www.tractorauction.in && npm install`
- [ ] Generate Prisma: `npm run db:generate`
- [ ] Build: `npm run build`
- [ ] Start: `pm2 start server.js --name tractorauction`
- [ ] Save: `pm2 save`
- [ ] Setup startup: `pm2 startup` (follow instructions)

## Step 5: Verify
- [ ] Check PM2: `pm2 status`
- [ ] Check logs: `pm2 logs tractorauction`
- [ ] Test locally: `curl http://localhost:3000`
- [ ] Visit website: `https://tractorauction.in`
- [ ] Verify Nginx: `nginx -t && systemctl reload nginx`

## ✅ Done!
Your application is now deployed!

