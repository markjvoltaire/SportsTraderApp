# Fin Onboarding Integration

This app now supports a split auth entry:

- `Log In` -> existing Privy SMS login (`LoginScreen`)
- `Sign Up` -> Fin onboarding flow with phone as the final step

## Frontend flow

1. `WelcomeScreen` asks the user to choose **Log In** or **Sign Up**
2. Sign-up flow screens:
   - `FinOnboardingBasicInfoScreen`
   - `FinOnboardingAddressScreen`
   - `FinOnboardingFinancialScreen`
   - `FinOnboardingDocumentsScreen`
   - `FinOnboardingPhoneScreen` (final step)
3. Final phone step:
   - sends/validates Privy SMS OTP
   - uses the same E.164 phone number for Fin `basic_info.phone`

Onboarding draft state is held in `src/contexts/OnboardingContext.jsx`.

## Backend endpoints

Implemented in `ScoretradeBackend/index.js`:

- `GET /api/fin/catalogue`
- `POST /api/fin/onboarding/individual`
- `POST /api/fin/onboarding/upload`
- `POST /api/fin/onboarding/attach`
- `GET /api/fin/onboarding/status/:customerId`

Fin API token + proxy helper is in `ScoretradeBackend/fin.js`.

## Required backend env vars

Set these in `ScoretradeBackend/.env`:

- `FIN_BASE_URL` (default: `https://sandbox.api.fin.com`)
- `FIN_CLIENT_ID`
- `FIN_CLIENT_SECRET`

## Validation/format notes

- `basic_info.email` is normalized to lowercase before submit.
- `basic_info.phone` is sent as E.164 (`+1XXXXXXXXXX` in current UI).
- Country fields are normalized to ISO alpha-3 uppercase.

## Deposit proof gate behavior

Deposit entry points are now Proof-gated:

- Profile Deposit button
- Wallet Deposit button

If Proof is verified, user continues to deposit flow. Otherwise, user is routed to `ProofVerification`.
