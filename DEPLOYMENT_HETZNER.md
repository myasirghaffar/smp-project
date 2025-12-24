# 🚀 Hetzner Production Deployment Guide

## Issue: 502 Bad Gateway Error

The 502 error typically means the server cannot reach your application. Here's how to fix it:

---

## ✅ Fixes Applied to Code

1. **Added `cross-env` package** for cross-platform builds
2. **Updated vite.config.ts** with production optimizations:
   - Added `base: "/"` for proper routing
   - Added `preview` server configuration
   - Added code splitting for better performance
   - Added build optimizations

---

## 🔧 Server Configuration for Hetzner

### Option 1: Static File Hosting (Recommended for SPA)

If you're using Nginx or Apache to serve the built files:

#### **Nginx Configuration**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    root /var/www/skillmatch/dist;
    index index.html;
    
    # For SPA routing - redirect all to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

**Reload Nginx:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### **Apache Configuration**

Create/edit `.htaccess` in your dist folder:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/json application/javascript text/xml application/xml
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### Option 2: Node.js Server with Preview

If you want to run the Vite preview server:

```bash
# On your Hetzner server
cd /var/www/skillmatch
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 3000
```

**Create systemd service:**
```bash
sudo nano /etc/systemd/system/skillmatch.service
```

```ini
[Unit]
Description=SkillMatch Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/skillmatch
ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0 --port 3000
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable skillmatch
sudo systemctl start skillmatch
sudo systemctl status skillmatch
```

---

## 📦 Build & Deploy Commands

### Local Build
```bash
npm run build
```
Output: `dist/` folder

### CI Build (for automated deployments)
```bash
npm run build:ci
```

### Test Production Build Locally
```bash
npm run preview
```
Opens at: http://localhost:4173

---

## 🚀 Deployment Steps for Hetzner

### Method 1: Manual Deployment

```bash
# 1. Build locally
npm run build

# 2. Upload to server (replace with your details)
scp -r dist/* user@your-hetzner-ip:/var/www/skillmatch/

# 3. SSH to server and restart web server
ssh user@your-hetzner-ip
sudo systemctl reload nginx  # or apache2
```

### Method 2: Git Deployment

```bash
# On Hetzner server
cd /var/www/skillmatch
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
```

### Method 3: GitHub Actions (Automated)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Hetzner

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build:ci
      
      - name: Deploy to Hetzner
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.HETZNER_HOST }}
          username: ${{ secrets.HETZNER_USER }}
          key: ${{ secrets.HETZNER_SSH_KEY }}
          source: "dist/*"
          target: "/var/www/skillmatch/"
          strip_components: 1
      
      - name: Reload Nginx
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HETZNER_HOST }}
          username: ${{ secrets.HETZNER_USER }}
          key: ${{ secrets.HETZNER_SSH_KEY }}
          script: sudo systemctl reload nginx
```

---

## 🔍 Troubleshooting 502 Error

### Check 1: Application is Running
```bash
# If using Node preview server
ps aux | grep node

# Check if service is running
sudo systemctl status skillmatch
```

### Check 2: Port is Correct
```bash
# Check what's listening on your port
sudo netstat -tulpn | grep :3000  # or your port

# Check Nginx/Apache config points to correct port
sudo nginx -t
```

### Check 3: Firewall Settings
```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

### Check 4: Nginx Error Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check 5: File Permissions
```bash
# Set correct ownership
sudo chown -R www-data:www-data /var/www/skillmatch/dist
sudo chmod -R 755 /var/www/skillmatch/dist
```

### Check 6: Environment Variables
Make sure on your Hetzner server you have a `.env` file:

```bash
cd /var/www/skillmatch
nano .env
```

Add (with your production values):
```env
VITE_SUPABASE_URL=https://qhiqhwmgezkcjmfvptdu.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

**Then rebuild:**
```bash
npm run build
```

---

## ⚡ Performance Optimizations Applied

1. **Code Splitting**: Vendor and UI libraries in separate chunks
2. **Compression**: Gzip enabled in config
3. **Caching**: Static assets cached for 1 year
4. **Minification**: Enabled for production builds
5. **Source Maps**: Disabled in production for security

---

## 🎯 Quick Fix for Current 502 Error

**Most likely cause**: Your web server can't find the built files or SPA routing isn't configured.

**Quick fix:**

1. **Check nginx config has `try_files` directive:**
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

2. **Verify dist folder is in correct location:**
   ```bash
   ls -la /var/www/skillmatch/dist/index.html
   ```

3. **Check nginx error log for specific error:**
   ```bash
   sudo tail -30 /var/log/nginx/error.log
   ```

4. **Restart nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

---

## 📊 Build Output Verification

After running `npm run build`, you should see:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   ├── vendor-[hash].js
│   └── ui-[hash].js
└── [other assets]
```

---

## ✅ Final Checklist

- [ ] Built successfully with `npm run build`
- [ ] Uploaded dist folder to Hetzner
- [ ] Nginx/Apache configured with SPA routing
- [ ] Environment variables set on server
- [ ] Web server restarted
- [ ] Firewall allows HTTP/HTTPS
- [ ] File permissions correct (755 for directories, 644 for files)
- [ ] DNS pointing to Hetzner server

---

**Need more help?** Check the nginx/apache error logs and share the specific error message.
