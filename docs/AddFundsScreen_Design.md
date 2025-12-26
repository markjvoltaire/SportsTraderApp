# Add Funds Screen - Fiat Payment Flow Design

## Overview
A completely fiat-focused payment flow that hides all cryptocurrency terminology, designed to feel like a modern fintech or e-commerce purchase experience.

## Design Principles

### 1. Zero Crypto Terminology
- ❌ No mention of: "crypto", "tokens", "blockchains", "USD-Coin", "wallet", "chain", "address"
- ✅ Use instead: "credits", "balance", "funds", "account", "payment"

### 2. Modern Fintech UX
- Clean, step-by-step form flow
- Clear progress indicators
- Trust-building visual elements
- Responsive design for mobile and desktop

### 3. Conversion-Optimized
- Quick amount selection buttons
- Clear CTAs at each step
- Minimal friction in the flow
- Immediate feedback on actions

## Component Structure

### Main Component: `AddFundsScreen.jsx`

#### State Management
```javascript
- currentStep: 'amount' | 'payment_method' | 'processing' | 'success' | 'error'
- selectedAmount: number | null
- customAmount: string
- selectedPaymentMethod: 'card' | 'bank' | null
- currentBalance: number | null
- processing: boolean
- errorMessage: string | null
```

#### Flow Steps

**Step 1: Amount Selection**
- Current balance display
- Quick amount buttons ($10, $25, $50, $100, $250, $500)
- Custom amount input with validation
- Continue button (disabled until valid amount)

**Step 2: Payment Method Selection**
- Payment method cards (Credit/Debit, Bank Transfer)
- Amount summary with breakdown
- Process payment button
- Back button to return to amount selection

**Step 3: Processing**
- Loading spinner
- Status messages
- Progress indicators
- Estimated time display

**Step 4: Success**
- Success icon
- Confirmation message
- New balance display
- Done button (returns to profile)

**Step 5: Error**
- Error icon
- Error message
- Try again button
- Cancel button

## UI Components

### 1. Balance Card
- **Purpose**: Display current account balance
- **Styling**: Prominent, centered, uses primary color
- **Data**: Fetched from `/api/users/{userId}/balance`

### 2. Progress Indicator
- **Purpose**: Show user progress through flow
- **Visual**: Horizontal progress bar (33% → 66% → 100%)

### 3. Quick Amount Buttons
- **Purpose**: Fast selection of common amounts
- **Layout**: Responsive grid (3 columns on mobile)
- **States**: Default, Selected, Disabled

### 4. Custom Amount Input
- **Purpose**: Allow users to enter any amount
- **Validation**: 
  - Minimum: $5
  - Maximum: $10,000
  - Numeric only
- **Format**: Currency formatted display

### 5. Payment Method Cards
- **Purpose**: Select payment method
- **Information**: 
  - Method name
  - Description
  - Icon
  - Availability status
- **States**: Default, Selected, Disabled

### 6. Summary Card
- **Purpose**: Show payment breakdown
- **Contents**:
  - Amount to add
  - Processing fee (currently $0.00)
  - Total amount

### 7. Processing Screen
- **Purpose**: Show payment in progress
- **Elements**:
  - Loading spinner
  - Status messages
  - Step-by-step progress

### 8. Success/Error Screens
- **Purpose**: Confirm payment result
- **Success**: Shows new balance, confirmation message
- **Error**: Shows error message, retry option

## API Integration

### Endpoint: `POST /api/onramp`

**Request Body:**
```json
{
  "amount": 100.00,
  "paymentMethod": "card",
  "userId": "privy_user_id"
}
```

**Response (Success):**
```json
{
  "success": true,
  "transactionId": "txn_123456",
  "newBalance": 250.00,
  "amountAdded": 100.00
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Payment processing failed",
  "errorCode": "PAYMENT_DECLINED"
}
```

### Service Function: `processFiatPayment()`

Located in `src/services/walletService.js`

```javascript
export async function processFiatPayment(
  privyUserId,
  { amount, paymentMethod },
  authToken
)
```

## UX Copy Guidelines

### Do's ✅
- "Add funds to your account"
- "Your balance"
- "Amount to add"
- "Payment method"
- "Processing your payment"
- "Funds added successfully"
- "Your funds are available immediately"

### Don'ts ❌
- "Add USDC"
- "Wallet address"
- "Blockchain"
- "Cryptocurrency"
- "Token"
- "On-chain"
- "Gas fees"

## User Flow

```
1. User clicks "Add Funds" button
   ↓
2. Amount Selection Screen
   - See current balance
   - Select quick amount OR enter custom
   - Click "Continue"
   ↓
3. Payment Method Selection
   - See amount summary
   - Select payment method
   - Click "Add $X"
   ↓
4. Processing Screen
   - See loading state
   - Wait for backend processing
   ↓
5a. Success Screen
   - See confirmation
   - See new balance
   - Click "Done" → Return to profile
   
5b. Error Screen
   - See error message
   - Click "Try Again" → Return to Step 1
   - OR Click "Cancel" → Return to profile
```

## Error Handling

### Validation Errors
- Amount too low (< $5)
- Amount too high (> $10,000)
- Invalid payment method
- Display inline error messages

### Payment Errors
- Payment declined
- Network errors
- Backend errors
- Show error screen with retry option

## Responsive Design

### Mobile (Primary)
- Full-width cards
- Stacked layout
- Touch-friendly buttons (min 44px height)
- Keyboard-aware scrolling

### Desktop (Future)
- Centered modal (max-width: 600px)
- Side-by-side layouts where appropriate
- Hover states for interactive elements

## Accessibility

- Semantic HTML elements
- ARIA labels for screen readers
- High contrast text
- Touch target sizes (min 44x44px)
- Keyboard navigation support

## Future Enhancements

1. **Saved Payment Methods**
   - Store cards for faster checkout
   - Default payment method selection

2. **Payment History**
   - Show recent transactions
   - Transaction details

3. **Multiple Currencies**
   - Support for different fiat currencies
   - Currency conversion display

4. **Payment Provider Integration**
   - Stripe for card payments
   - Plaid for bank transfers
   - Embedded payment widgets

5. **Receipt Generation**
   - Email receipts
   - Transaction confirmation

## Technical Notes

- Uses React Native components
- Integrates with existing theme system
- Follows app's design patterns
- Uses existing navigation structure
- Backend handles all crypto operations transparently

