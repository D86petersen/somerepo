# Admin Panel Setup Instructions

## ✅ What's Been Done

1. **Admin Access Control** - Only `d86petersen@gmail.com` can access `/admin`
2. **Pool Rules Editor** - Admin can edit rules that appear in Settings
3. **Simplified UI** - Removed broken week deletion functions
4. **Working Features**:
   - 📋 Pool Rules Editor
   - 🔄 Sync NFL Games from ESPN
   - 🗑️ Delete All Data
   - 🤖 Auto-Cleanup (keep only current week)
   - 📊 Database Stats

## 🚨 REQUIRED: Database Setup

You need to run the SQL script once to enable the Rules functionality:

### Steps:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your WiZiX Pool project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Copy & Run the SQL Script**
   - Open the file: `POOL_SETTINGS_SETUP.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - Go to Table Editor → `pool_settings` → should see 1 row with default rules

### What the SQL Creates:

- `pool_settings` table (stores the editable pool rules)
- RLS policies (admin can edit, all users can read)
- Default rules text as a starting point

## 🎯 Testing the Admin Panel

1. **Login** as `d86petersen@gmail.com`
2. **Navigate** to `/admin` (or click Admin link)
3. **Verify Access** - You should see the admin panel
4. **Test Rules Editor**:
   - Edit the rules text
   - Click "💾 Save Rules"
   - Go to Settings page
   - Verify rules appear for all users

## 🔒 Security Features

- **Email Check**: Only `d86petersen@gmail.com` can access
- **Redirect**: Non-admin users see "Access Denied" message
- **Auth Check**: Unauthenticated users redirected to login

## 📋 Admin Panel Sections

1. **Pool Rules Editor** - Edit markdown/text rules for the pool
2. **Sync NFL Games** - Fetch games from ESPN by week/year
3. **Data Management**:
   - Delete All Data (nuclear option - clear everything)
   - Auto-Cleanup (keep only current week - recommended)
4. **Database Stats** - View counts and weeks in database

## 🚀 Deployment Status

- ✅ Code pushed to GitHub: `main` branch
- ✅ Netlify auto-deployment triggered
- ✅ Live at: https://wizix-degenerates.netlify.app
- ⏳ May take 2-3 minutes to deploy

## 📝 Notes

- Admin panel is at: `/admin` (no link in nav, direct URL only)
- Only admin can edit rules, but all users can view them in Settings
- Settings page will show "Loading rules..." until SQL is run
- After SQL setup, you can edit default rules to match your pool rules
