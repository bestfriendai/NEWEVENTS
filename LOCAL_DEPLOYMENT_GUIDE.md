# Local Deployment Guide for DateAI

## 🚀 Quick Start

The app is now running in production mode at: **http://localhost:3000**

## 📱 Testing the App

### 1. **Open the App**
Visit: http://localhost:3000

### 2. **Test Location Features**
- Click the location button in the search bar
- Allow browser location access OR
- Enter a city manually (e.g., "New York", "Los Angeles", "Chicago")

### 3. **Browse Events**
- Featured events will load based on your location
- Click on event categories to filter
- Use the search bar to find specific events

### 4. **Test Authentication**
- Click "Sign Up" to create an account
- Use your email and a password (min 6 characters)
- Check your email for verification (if configured)

### 5. **Test Favorites**
- Sign in first
- Click the heart icon on any event to save it
- Visit the Favorites page to see saved events

## 🛠 Management Commands

### Start the Production Server
```bash
npm run start
```

### Stop the Server
```bash
# Press Ctrl+C in the terminal
# OR
pkill -f "next start"
```

### Restart the Server
```bash
pkill -f "next start"
npm run start
```

### View Logs
The server logs are displayed in the terminal where you started it.

## 🔍 Test URLs

- **Homepage**: http://localhost:3000
- **Events Page**: http://localhost:3000/events
- **Party Events**: http://localhost:3000/party
- **Favorites**: http://localhost:3000/favorites (requires login)
- **Profile**: http://localhost:3000/profile (requires login)

## 📊 API Test Endpoints

Test if APIs are working:
- http://localhost:3000/api/test-all-apis
- http://localhost:3000/api/test-ticketmaster
- http://localhost:3000/api/test-mapbox
- http://localhost:3000/api/test-rapidapi

## ⚙️ Environment Variables

The app uses the `.env.local` file for configuration. Current APIs configured:
- ✅ Ticketmaster API
- ✅ Mapbox API
- ✅ RapidAPI
- ✅ Supabase

## 🐛 Troubleshooting

### If events aren't loading:
1. Check your location is set correctly
2. Try a major city like "New York" or "Los Angeles"
3. Check the browser console for errors (F12)

### If authentication isn't working:
1. Make sure you're using a valid email
2. Password must be at least 6 characters
3. Check your spam folder for verification emails

### If the app won't start:
```bash
# Kill any existing processes
pkill -f "next"

# Clear Next.js cache
rm -rf .next

# Rebuild and start
npm run build
npm run start
```

## 📱 Mobile Testing

To test on your phone:
1. Find your computer's IP address
2. On your phone, visit: http://[YOUR-IP]:3000
3. Make sure your phone is on the same WiFi network

## 🎉 Enjoy DateAI!

The app is fully functional for discovering events in your area. Have fun exploring!