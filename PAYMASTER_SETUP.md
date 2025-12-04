# Base Paymaster Setup for Gasless Transactions

## Overview

Your NFT minting now supports **gasless transactions** using Base's paymaster service! This means users can mint NFTs without paying gas fees - you (the app owner) sponsor the gas.

## How It Works

1. **User completes game** → Metadata is generated
2. **Paymaster sponsorship** → Your app requests gas sponsorship from Base
3. **Transaction sent** → User operation is sent to bundler (gasless)
4. **NFT minted** → Transaction completes, user gets NFT

## Paymaster Credits

You mentioned you've already claimed paymaster credits. Great! Here's how to verify:

1. **Check your credits**: Visit Base's paymaster dashboard
2. **Monitor usage**: Track how much gas you're sponsoring
3. **Top up**: Add more credits when needed

## Current Implementation

The code now:
- ✅ Requests paymaster sponsorship automatically
- ✅ Applies paymaster data to user operations
- ✅ Attempts to send transactions via Base SDK or bundler
- ✅ Falls back gracefully if paymaster is unavailable

## Testing

### In Base Mini App:
1. Complete a game
2. Click "Mint NFT & Share"
3. Transaction should be gasless (sponsored by paymaster)
4. Check console for "✅ Paymaster sponsorship obtained"

### In Web Preview:
- Paymaster should work on Base Sepolia testnet
- You may need testnet paymaster credits

## Troubleshooting

### Paymaster Not Working?

1. **Check credits**: Ensure you have paymaster credits available
2. **Network**: Verify you're using the correct network (Sepolia vs Mainnet)
3. **Console logs**: Check for paymaster errors in browser console
4. **API endpoint**: Verify `/api/nft/paymaster` is accessible

### Transaction Not Sending?

The transaction might be prepared but not sent if:
- Base SDK doesn't have `sendTransaction` method yet
- Bundler requires user signature first
- Nonce/gas estimation needed

**Solution**: The user operation is returned in the response - you can send it manually or wait for Base SDK updates.

## Next Steps

1. **Test in Base Mini App**: Try minting an NFT and verify gasless transaction
2. **Monitor paymaster usage**: Track your credit consumption
3. **Deploy to mainnet**: When ready, update contract address and use mainnet paymaster

## Paymaster Endpoints

- **Base Sepolia**: `https://paymaster.base.org/v2/84532`
- **Base Mainnet**: `https://paymaster.base.org/v2/8453`

## Bundler Endpoints

- **Base Sepolia**: `https://bundler.base.org/v2/84532`
- **Base Mainnet**: `https://bundler.base.org/v2/8453`

## Notes

- Paymaster sponsorship is **automatic** - no user action needed
- If paymaster fails, transaction falls back to user-paying-gas mode
- All transactions use account abstraction (smart contract wallets)

