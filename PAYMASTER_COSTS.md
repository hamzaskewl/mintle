# Base Paymaster Costs & Setup

## Good News! 🎉

**You DON'T need to deploy to mainnet right now!** Base Sepolia (testnet) has **UNLIMITED paymaster sponsorship** for testing and development.

## Cost Breakdown

### Base Sepolia (Testnet) - Current Setup ✅
- **Cost**: **FREE** (unlimited sponsorship)
- **Perfect for**: Testing, development, demos
- **Your contract**: Already deployed at `0x6E3Cf9F63eb409E4071422a0467F9Bb81bB4Bd06`
- **Status**: Ready to use with gasless transactions!

### Base Mainnet (Production) - Future
- **Monthly Limit**: $15,000 worth of gas sponsorship
- **Can Request More**: Yes, via Discord
- **Typical Gas Cost**: Less than $0.01 per transaction on Base
- **When to Deploy**: When you're ready for production users

## Current Setup

Your app is configured to:
- ✅ Use **Base Sepolia** by default
- ✅ Request paymaster sponsorship automatically
- ✅ Provide **gasless transactions** for users
- ✅ Work with your existing contract on Sepolia

## How Much Does It Cost?

### On Sepolia (Now):
- **$0** - Unlimited free sponsorship for testing
- Perfect for development and demos

### On Mainnet (Later):
- **Per Transaction**: ~$0.001 - $0.01 (Base has very low gas fees)
- **Monthly Limit**: $15,000 (can request more)
- **Example**: 1,000,000 transactions/month ≈ $1,000 - $10,000 (well under limit)

## When Should You Deploy to Mainnet?

Deploy to mainnet when:
1. ✅ You've tested thoroughly on Sepolia
2. ✅ You're ready for real users
3. ✅ You want NFTs to have real value on mainnet
4. ✅ You're ready to use your $15k/month paymaster credits

**For now**: Keep testing on Sepolia with unlimited free gasless transactions!

## Switching to Mainnet (When Ready)

1. Deploy contract to Base Mainnet
2. Update `lib/nft/contract.ts`:
   ```typescript
   base: '0x...', // Your mainnet contract address
   ```
3. Set environment variable or update code:
   ```typescript
   const isTestnet = false // Use mainnet
   ```
4. Your paymaster credits will automatically work on mainnet

## Summary

- **Now**: Use Sepolia with unlimited free paymaster ✅
- **Later**: Deploy to mainnet when ready (still very cheap!)
- **Cost**: $0 on testnet, ~$0.01/transaction on mainnet
- **Your Setup**: Already configured and ready to go!

No need to deploy to mainnet right now - test to your heart's content on Sepolia for free! 🚀

