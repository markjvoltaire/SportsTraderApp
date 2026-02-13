# Proof KYC Backend Integration

The SportsTrader app integrates [Proof KYC](https://pond.dflow.net/build/proof/introduction) for identity verification. Prediction market buying requires Proof verification per Kalshi compliance (deadline: Feb 20, 2026).

## Required Backend Endpoint

The backend must implement one endpoint used to construct the Proof deep link.

### POST `/api/proof/verification-url`

Builds the Proof deep link URL for the user to complete KYC.

**Request:**
```json
{
  "walletAddress": "<solana_wallet_address>",
  "returnUrl": "scoretrade://proof-return",
  "signature": "<base58_signature>",
  "timestamp": 1739491200000,
  "projectId": "<optional_project_id>"
}
```

**Headers:**
- `Authorization: Bearer <privy_jwt>`
- `Content-Type: application/json`

**Response:**
```json
{
  "url": "https://dflow.net/proof?wallet=...&signature=...&timestamp=...&redirect_uri=..."
}
```

**Implementation notes:**
- The mobile app signs the message client-side: `Proof KYC verification: {timestamp}`.
- The backend must preserve the provided `timestamp` when `signature` is present.
- Validate pairing: `signature` and `timestamp` must either both be present or both omitted.
- Build the deep link using [Partner Integration - Constructing a Deep Link](https://pond.dflow.net/build/proof/partner-integration).

## Verification Status Check (Client Direct)

The app checks verification directly against Proof's public API (no backend proxy required):

```http
GET https://proof.dflow.net/verify/{walletAddress}
```

**Response:**
```json
{
  "verified": true
}
```

## Redirect Contract and Callback Handling

- Proof must redirect users back to `scoretrade://proof-return` after completion or cancellation.
- The app listens for this deep link in both warm state (`Linking.addEventListener`) and cold start (`Linking.getInitialURL`).
- After receiving the callback, the app immediately calls:
  - `GET https://proof.dflow.net/verify/{walletAddress}`
- Expected app transitions after callback:
  - `verified: true` -> route user to main app flow.
  - `verified: false` -> keep user on Proof verification flow with retry messaging.
  - network/error -> show retry-safe error and keep user in safe state.

## DFlow Resources

- [Proof Introduction](https://pond.dflow.net/build/proof/introduction)
- [Partner Integration](https://pond.dflow.net/build/proof/partner-integration)
- [Proof API - Verify Address](https://pond.dflow.net/build/proof-api/verify-address)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_PROOF_BASE_URL` | Optional. Proof base URL (default: `https://proof.dflow.net`) |
| `PROOF_DEEP_LINK_BASE` | Optional backend deep-link base (default: `https://dflow.net/proof`) |

No Proof API key is required for the Verify Address endpoint.
