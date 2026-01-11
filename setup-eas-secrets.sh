#!/bin/bash

# Script to set up EAS secrets from .env file
# This reads your .env file and sets the secrets in EAS for production builds

echo "🔐 Setting up EAS secrets from .env file..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your environment variables first."
    exit 1
fi

# Check if eas CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ Error: EAS CLI is not installed!"
    echo "Install it with: npm install -g eas-cli"
    exit 1
fi

# Source the .env file
set -a
source .env
set +a

# Required secrets
echo "📝 Setting required secrets..."

if [ -n "$EXPO_PUBLIC_PRIVY_APP_ID" ]; then
    echo "  ✅ Setting EXPO_PUBLIC_PRIVY_APP_ID..."
    eas secret:create --scope project --name EXPO_PUBLIC_PRIVY_APP_ID --value "$EXPO_PUBLIC_PRIVY_APP_ID" --force
else
    echo "  ⚠️  EXPO_PUBLIC_PRIVY_APP_ID not found in .env"
fi

if [ -n "$EXPO_PUBLIC_PRIVY_CLIENT_ID" ]; then
    echo "  ✅ Setting EXPO_PUBLIC_PRIVY_CLIENT_ID..."
    eas secret:create --scope project --name EXPO_PUBLIC_PRIVY_CLIENT_ID --value "$EXPO_PUBLIC_PRIVY_CLIENT_ID" --force
else
    echo "  ⚠️  EXPO_PUBLIC_PRIVY_CLIENT_ID not found in .env"
fi

# Optional secrets
echo ""
echo "📝 Setting optional secrets..."

if [ -n "$EXPO_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY" ]; then
    echo "  ✅ Setting EXPO_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY..."
    eas secret:create --scope project --name EXPO_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY --value "$EXPO_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY" --force
else
    echo "  ℹ️  EXPO_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY not found (optional)"
fi

if [ -n "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo "  ✅ Setting EXPO_PUBLIC_SUPABASE_URL..."
    eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "$EXPO_PUBLIC_SUPABASE_URL" --force
else
    echo "  ℹ️  EXPO_PUBLIC_SUPABASE_URL not found (optional)"
fi

if [ -n "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "  ✅ Setting EXPO_PUBLIC_SUPABASE_ANON_KEY..."
    eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "$EXPO_PUBLIC_SUPABASE_ANON_KEY" --force
else
    echo "  ℹ️  EXPO_PUBLIC_SUPABASE_ANON_KEY not found (optional)"
fi

if [ -n "$EXPO_PUBLIC_PRIVY_POLICY_ID" ]; then
    echo "  ✅ Setting EXPO_PUBLIC_PRIVY_POLICY_ID..."
    eas secret:create --scope project --name EXPO_PUBLIC_PRIVY_POLICY_ID --value "$EXPO_PUBLIC_PRIVY_POLICY_ID" --force
else
    echo "  ℹ️  EXPO_PUBLIC_PRIVY_POLICY_ID not found (optional)"
fi

echo ""
echo "✅ Done! Secrets have been set in EAS."
echo ""
echo "📋 To verify your secrets, run:"
echo "   eas secret:list"
echo ""
echo "🚀 Now you can build for production:"
echo "   eas build --platform ios --profile production"

