# 🚀 DateAI Events Platform - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Supabase CLI installed (`npm install -g supabase`)
- Git repository access
- Supabase project created

## 📋 Step-by-Step Deployment

### **1. Environment Setup**

Create `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# API Keys (Optional but recommended)
TICKETMASTER_API_KEY=your_ticketmaster_api_key
RAPIDAPI_KEY=your_rapidapi_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=false
```

### **2. Install Dependencies**

```bash
# Install all dependencies
npm install

# Verify installation
npm run build
```

### **3. Database Setup**

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run database migrations
supabase db push

# Verify tables are created
supabase db diff
```

### **4. Deploy Edge Functions**

```bash
# Deploy events search function
supabase functions deploy events-search

# Deploy analytics function
supabase functions deploy event-analytics

# Verify deployment
supabase functions list
```

### **5. Configure Supabase Settings**

#### **A. Enable PostGIS Extension**
In Supabase Dashboard → SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

#### **B. Set up Row Level Security**
```sql
-- Enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies (already in migrations)
-- Policies are automatically created by the migration
```

#### **C. Configure Realtime**
In Supabase Dashboard → Settings → API:
- Enable Realtime for `events` table
- Enable Realtime for `event_stats` table

### **6. Vercel Deployment**

#### **A. Connect Repository**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Configure build settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

#### **B. Environment Variables**
Add all environment variables from `.env.local` to Vercel:
1. Go to Project Settings → Environment Variables
2. Add each variable from your `.env.local`
3. Set appropriate environments (Production, Preview, Development)

#### **C. Deploy**
```bash
# Deploy to Vercel
vercel --prod

# Or use Vercel CLI
npm install -g vercel
vercel login
vercel
```

### **7. Alternative Deployment Options**

#### **A. Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
netlify deploy --prod --dir=.next
```

#### **B. Docker Deployment**
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Deploy:
```bash
# Build image
docker build -t dateai-events .

# Run container
docker run -p 3000:3000 --env-file .env.local dateai-events
```

## 🔧 Post-Deployment Configuration

### **1. Verify Deployment**

Check these endpoints:
- `https://your-domain.com/` - Main app
- `https://your-domain.com/events` - Events page
- `https://your-domain.com/api/events/enhanced` - API endpoint

### **2. Performance Monitoring**

#### **A. Enable Analytics**
```typescript
// In production, analytics are automatically enabled
// Check the performance dashboard in development mode
```

#### **B. Monitor Edge Functions**
```bash
# Check function logs
supabase functions logs events-search
supabase functions logs event-analytics
```

### **3. Database Optimization**

#### **A. Create Indexes**
```sql
-- Verify indexes are created
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename = 'events';
```

#### **B. Monitor Performance**
```sql
-- Check query performance
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE query LIKE '%events%'
ORDER BY mean_exec_time DESC;
```

## 📊 Monitoring & Maintenance

### **1. Performance Monitoring**

#### **A. Web Vitals**
- Monitor Core Web Vitals in production
- Set up alerts for performance degradation
- Use Vercel Analytics or Google PageSpeed Insights

#### **B. Database Monitoring**
```bash
# Monitor database performance
supabase db logs

# Check connection pool
supabase db status
```

### **2. Cache Management**

#### **A. Cache Warming**
```typescript
// Warm cache for popular locations
const popularLocations = [
  { lat: 40.7128, lng: -74.0060 }, // NYC
  { lat: 34.0522, lng: -118.2437 }, // LA
  // Add more locations
]

// Pre-populate cache
popularLocations.forEach(location => {
  prefetchEventsForLocation(queryClient, location.lat, location.lng)
})
```

#### **B. Cache Invalidation**
```typescript
// Clear cache when needed
advancedCache.clearByTags([cacheTags.EVENTS])
queryClient.invalidateQueries({ queryKey: ['events'] })
```

### **3. Error Monitoring**

#### **A. Set up Error Tracking**
```bash
# Install Sentry (optional)
npm install @sentry/nextjs

# Configure in next.config.js
```

#### **B. Monitor API Errors**
```typescript
// Check API error rates
const errorRate = apiErrors.current[endpoint] / totalRequests
if (errorRate > 0.05) {
  // Alert or fallback
}
```

## 🔒 Security Checklist

### **1. Environment Variables**
- ✅ All sensitive keys in environment variables
- ✅ No hardcoded secrets in code
- ✅ Service role key only on server-side

### **2. Database Security**
- ✅ Row Level Security enabled
- ✅ Proper policies configured
- ✅ API keys secured

### **3. API Security**
- ✅ Rate limiting implemented
- ✅ Input validation
- ✅ Error handling

## 🚨 Troubleshooting

### **Common Issues**

#### **1. Edge Functions Not Working**
```bash
# Check function status
supabase functions list

# Redeploy if needed
supabase functions deploy events-search --no-verify-jwt
```

#### **2. Database Connection Issues**
```bash
# Check database status
supabase db status

# Reset connection pool
supabase db reset
```

#### **3. Cache Issues**
```typescript
// Clear all caches
advancedCache.clear()
queryClient.clear()
localStorage.clear()
```

#### **4. Performance Issues**
- Check Web Vitals in browser dev tools
- Monitor network requests
- Check cache hit rates
- Verify database indexes

### **Support**

For deployment issues:
1. Check the deployment logs
2. Verify environment variables
3. Test API endpoints manually
4. Check Supabase dashboard for errors

## 🎯 Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] RLS policies enabled
- [ ] Performance monitoring set up
- [ ] Error tracking configured
- [ ] Cache warming implemented
- [ ] Security audit completed
- [ ] Load testing performed
- [ ] Backup strategy in place

## 📈 Scaling Considerations

### **For High Traffic:**
1. **Database**: Consider read replicas
2. **Caching**: Implement Redis for distributed caching
3. **CDN**: Use Vercel Edge Network or Cloudflare
4. **Monitoring**: Set up comprehensive monitoring
5. **Rate Limiting**: Implement API rate limiting

### **Performance Targets:**
- Page load time: < 2 seconds
- API response time: < 500ms
- Cache hit rate: > 80%
- Error rate: < 1%

Your DateAI Events Platform is now ready for production! 🚀
