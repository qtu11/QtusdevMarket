# CHECKLIST TRIỂN KHAI WEBSITE - QtusDev Market

## ✅ CÁC FIX ĐÃ HOÀN THÀNH

### 1. Database
- ✅ Schema MySQL đã được chuẩn hóa
- ✅ Đồng bộ tất cả tables (users, products, deposits, withdrawals, purchases)
- ✅ Thêm device_info column
- ✅ Fix foreign keys và cascade deletes
- ✅ Type safety cho insertId

### 2. API Endpoints
- ✅ `/api/deposits` - Get/Post deposits
- ✅ `/api/withdrawals` - Get/Post withdrawals  
- ✅ `/api/purchases` - Get/Post purchases
- ✅ `/api/admin/approve-deposit` - Approve/reject deposits
- ✅ `/api/admin/approve-withdrawal` - Approve/reject withdrawals

### 3. User Tracking
- ✅ IP address tracking
- ✅ Device info tracking
- ✅ Browser & OS detection
- ✅ Last activity tracking
- ✅ Login count tracking

### 4. UI/UX
- ✅ Dashboard hiển thị full user info
- ✅ Admin panel hiển thị user activity
- ✅ Real-time data updates

## 🔧 CẦN THIẾT LẬP TRƯỚC KHI DEPLOY

### 1. Environment Variables (.env)

Tạo file `.env` trong root directory:

```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=qtusdevmarket

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Social Auth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_secret
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
NEXT_PUBLIC_FACEBOOK_CLIENT_ID=your_facebook_client_id

# Telegram
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_TELEGRAM_CHAT_ID=your_chat_id

# Twilio (Optional)
NEXT_PUBLIC_TWILIO_ACCOUNT_SID=your_account_sid
NEXT_PUBLIC_TWILIO_AUTH_TOKEN=your_auth_token
NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER=your_whatsapp_number
```

### 2. Database Setup

**Bước 1: Tạo database**
```bash
mysql -u root -p
CREATE DATABASE qtusdevmarket;
exit
```

**Bước 2: Chạy schema**
```bash
mysql -u root -p qtusdevmarket < scripts/setup-database.sql
```

**Bước 3: Verify tables**
```bash
mysql -u root -p qtusdevmarket -e "SHOW TABLES;"
```

Expected output:
- users
- products
- deposits
- withdrawals
- purchases
- notifications

### 3. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 4. Build Check

```bash
npm run build
```

Expected: No errors, successful build

### 5. Test Locally

```bash
npm run dev
```

Navigate to:
- http://localhost:3000
- http://localhost:3000/auth/login
- http://localhost:3000/admin
- http://localhost:3000/dashboard

## 🚀 DEPLOYMENT STEPS

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Docker

```bash
# Build image
docker build -t qtusdev-market .

# Run container
docker run -p 3000:3000 --env-file .env qtusdev-market
```

### Option 3: Traditional Server

```bash
# Build
npm run build

# Start production
npm start
```

## ⚠️ CRITICAL ISSUES TO FIX

### 1. Environment Variables

**Issue:** Code references `process.env.REGISTERED_USERS` in `lib/auth.ts:320`

**Fix:** Remove this line or add to .env:
```
REGISTERED_USERS=[]
```

### 2. Database Connection

**Issue:** No connection pooling error handling

**Recommendation:** Add connection retry logic

### 3. Security

**Critical:** 
- [ ] Change default admin password
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Add CSRF protection
- [ ] Sanitize all inputs

## 📊 CHECKLIST TRƯỚC KHI GO LIVE

### Database
- [ ] Database created
- [ ] Tables created
- [ ] Admin user seeded
- [ ] Connection tested

### Environment
- [ ] All env vars set
- [ ] No sensitive data in code
- [ ] .env file exists
- [ ] .env in .gitignore

### Build
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No console errors

### Testing
- [ ] User registration works
- [ ] User login works
- [ ] Deposit works
- [ ] Withdrawal works
- [ ] Admin approval works
- [ ] Purchase flow works
- [ ] Telegeram notifications work

### Production
- [ ] HTTPS enabled
- [ ] Domain configured
- [ ] SSL certificate valid
- [ ] CDN configured (if used)
- [ ] Monitoring setup

## 🐛 KNOWN ISSUES

1. **localStorage usage**: Still using localStorage for some data
   - **Impact:** Data lost on refresh
   - **Fix:** Migrate to database

2. **No error boundaries**: Some errors can crash entire app
   - **Fix:** Add React Error Boundaries

3. **No loading states**: Some API calls don't show loading
   - **Fix:** Add loading indicators

## 📞 SUPPORT CONTACTS

- Database issues: Check MySQL logs
- Build issues: Check Node version (18+)
- Deployment: Check Vercel/Docker logs

## ✅ FINAL SIGN-OFF

- [ ] All tests pass
- [ ] Database connected
- [ ] Environment configured
- [ ] Build successful
- [ ] Deployed to production
- [ ] Monitoring active

---

**Chúc boss deploy thành công! 🚀**
