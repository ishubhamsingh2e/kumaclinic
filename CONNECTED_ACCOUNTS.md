# Connected Accounts Setup

## Required Environment Variables

Add these to your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Apple OAuth (Optional - for future implementation)
APPLE_ID=your_apple_id_here
APPLE_TEAM_ID=your_apple_team_id_here
APPLE_PRIVATE_KEY=your_apple_private_key_here
APPLE_KEY_ID=your_apple_key_id_here
```

## Setup Instructions

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy Client ID and Client Secret to `.env`

### Apple OAuth Setup (Future)

Apple Sign In requires:

- Apple Developer Account ($99/year)
- Configured Service ID
- Private key for authentication

## Features Implemented

✅ Connect Google account
✅ Disconnect Google account
✅ Real-time connection status
✅ Account linking (allows same email across providers)
✅ Safety check (prevents disconnecting last auth method without password)

## Security Notes

- `allowDangerousEmailAccountLinking: true` allows users to link accounts with the same email
- Users cannot disconnect their only authentication method unless they have a password set
- All account operations require authentication

## Database

The `Account` model in Prisma already supports multiple OAuth providers:

- Stores provider name, account ID, tokens
- Links to User model with cascade delete
