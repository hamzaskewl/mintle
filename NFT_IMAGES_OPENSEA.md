# NFT Images & OpenSea Visibility

## ✅ NFT Image Generation

Your NFT images are now generated dynamically using **Vercel OG Image Generation**!

### How It Works

1. **Image Endpoint**: `/api/nft/image` generates images on-the-fly
2. **Dynamic Content**: Shows category, score, tier, streak, and result pattern
3. **Beautiful Design**: Dark theme with gradients matching your app
4. **No Storage Needed**: Images are generated when requested

### Image Features

- 🎨 **Category Emoji** (🎬 or 🎵)
- 📊 **Score Display** (e.g., "2/5")
- 🏆 **Tier Badge** (Bronze 🥉, Silver 🥈, Gold 🥇, Perfect 🏆)
- 🟢🔴 **Result Pattern** (visual representation of correct/wrong answers)
- 🔥 **Streak Counter**
- ✨ **Perfect Game Badge** (if applicable)

### Testing

Visit: `https://morless.vercel.app/api/nft/image?category=spotify&score=2&total=5&streak=3&perfect=false&pattern=11000`

## 🔗 BaseScan Links

### Fixed: Now Uses Sepolia Explorer

- **Transaction Link**: `https://sepolia.basescan.org/tx/[txHash]`
- **NFT Token Link**: `https://sepolia.basescan.org/token/[contract]?a=[tokenId]`

The "View Minted NFT" button now correctly links to BaseScan Sepolia!

## 🌊 OpenSea Visibility

### Base Sepolia (Testnet) - Current Setup

**Short Answer**: NFTs on Base Sepolia are **NOT visible on OpenSea mainnet**.

**Why?**
- OpenSea mainnet only shows NFTs from mainnet chains
- Base Sepolia is a testnet
- Testnet NFTs are for testing only

### Where to View Your NFTs

1. **BaseScan Sepolia**: ✅ Your NFTs are visible here!
   - `https://sepolia.basescan.org/token/[contract]?a=[tokenId]`
   - Shows all NFT details, metadata, and images

2. **OpenSea Testnet** (if available):
   - Some testnet explorers exist but aren't as popular
   - Not the same as OpenSea mainnet

3. **Your App**: ✅ NFTs are visible in your app
   - Metadata is served from your API
   - Images are generated dynamically

### To Show on OpenSea Mainnet

When you're ready for production:

1. **Deploy contract to Base Mainnet**
2. **Update contract address** in `lib/nft/contract.ts`
3. **Set `isTestnet = false`** in your code
4. **Mint NFTs on Mainnet**
5. **Your NFTs will appear on OpenSea** at:
   - `https://opensea.io/assets/base/[contract]/[tokenId]`

### Current Status

- ✅ **NFTs Minting**: Working on Base Sepolia
- ✅ **Images Generated**: Dynamic image generation working
- ✅ **Metadata Served**: API endpoint working
- ✅ **BaseScan Links**: Fixed to use Sepolia
- ⏳ **OpenSea**: Will work when deployed to Mainnet

## 🎨 Image Customization

Want to customize the NFT images? Edit `app/api/nft/image/route.ts`:

- Change colors, fonts, layout
- Add more stats or information
- Use different emojis or icons
- Add background patterns or gradients

The image is generated using React-like JSX with Vercel OG, so you can style it however you want!

## 📝 Summary

- ✅ **Images**: Now generated dynamically!
- ✅ **BaseScan Links**: Fixed to use Sepolia
- ⏳ **OpenSea**: Will work on Mainnet (not available on Sepolia)
- 🎉 **Everything else**: Working perfectly!

