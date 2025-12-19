# 🚀 Mientior Deployment Guide

## Prerequisites
- Vercel account (free)
- GitHub/GitLab/Bitbucket repository
- Supabase or PostgreSQL database
- Redis instance (optional for caching)

## Step 1: Push to GitHub

```bash
# Add all changes
git add .

# Commit changes
git commit -m "feat: prepare for deployment with production configuration"

# Push to GitHub
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Click "Deploy"

## Step 3: Configure Environment Variables in Vercel

After deployment, go to your project dashboard:

1. **Settings → Environment Variables**
2. Add the following variables:

### Required Variables:
```
PRISMA_DATABASE_URL=your_supabase_or_postgresql_url
DIRECT_URL=your_supabase_or_postgresql_url
REDIS_URL=your_redis_url
BETTER_AUTH_SECRET=generate_with_openssl_rand_base64_32
BETTER_AUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Payment Variables (Test Mode):
```
PAYSTACK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
```

### Email Service:
```
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@your-app.vercel.app
```

## Step 4: Database Setup

### Using Supabase (Recommended):
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy the connection string (use port 6543)
4. Add to Vercel environment variables
5. Run Prisma migrations:
```bash
vercel env pull .env.production
npx prisma db push
```

### Using PostgreSQL:
1. Set up a PostgreSQL database
2. Add connection string to Vercel
3. Run migrations

## Step 5: Post-Deployment Checklist

- [ ] Test all payment methods in test mode
- [ ] Verify email sending works
- [ ] Check all pages load correctly
- [ ] Test mobile responsiveness
- [ ] Verify African localization works
- [ ] Test search functionality
- [ ] Check performance with Lighthouse

## Environment Variables Reference

### Get Test API Keys:
- **Paystack**: Dashboard → Settings → API Keys → Test
- **Flutterwave**: Dashboard → Settings → API Keys → Test
- **Resend**: Dashboard → API Keys → Create API Key
- **Supabase**: Dashboard → Settings → Database → Connection string

### Generate Auth Secret:
```bash
openssl rand -base64 32
```

## Monitoring & Analytics

Vercel provides:
- Real-time logs
- Performance metrics
- Error tracking
- Usage analytics

Add Sentry for advanced error monitoring:
```bash
npm install @sentry/nextjs
```

## Custom Domain (Optional)

1. Go to Vercel → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update NEXT_PUBLIC_APP_URL in environment variables

## Scaling Considerations

- **Free Tier**: 100GB bandwidth, 1 function, 0.5s cold start
- **Pro ($20/mo)**: 1TB bandwidth, unlimited functions, 0.1s cold start
- **Enterprise**: Custom pricing for high traffic

## Troubleshooting

### Build Errors:
- Check environment variables format
- Verify database connection
- Check for missing dependencies

### Runtime Errors:
- Check Vercel Function Logs
- Verify environment variables
- Check database connection

### Performance Issues:
- Enable Edge Functions for API routes
- Use Vercel KV for Redis caching
- Optimize images with next/image

## Security Checklist

- [ ] All API keys are in environment variables
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Security headers are set

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Next.js Deployment: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- Mientior Documentation: Check `/docs` folder

---

🎉 **Your Mientior marketplace is now live!**

For production deployment, replace test API keys with live keys from your payment providers.
