# NFT Minting Setup Guide

This guide explains how to set up on-chain NFT minting for MorL game results on Base.

## Overview

When players complete a game, they can mint an NFT that represents their score and results. The NFT includes:
- Game category (Movies or Spotify)
- Score (e.g., 4/5)
- Result pattern (🟢🟢🟢🟢🔴)
- Streak count
- Date
- Tier (Bronze, Silver, Gold, Perfect)

## Architecture

1. **Metadata Generation** (`lib/nft/metadata.ts`)
   - Generates NFT metadata JSON following OpenSea standards
   - Includes attributes for rarity/tier determination

2. **Minting API** (`app/api/nft/mint/route.ts`)
   - Generates metadata for completed games
   - Returns metadata URI for minting

3. **Contract Interaction** (`lib/nft/contract.ts`)
   - Handles contract calls using viem
   - Supports Base mainnet and Base Sepolia testnet

4. **Client Integration** (`lib/nft/mint.ts`)
   - Uses Base Mini App SDK for account abstraction
   - Handles minting and sharing to Base social feed

## Setup Steps

### 1. Deploy NFT Contract

You need to deploy an ERC-721 NFT contract to Base. Here's a simple example:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MorLNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    string private _baseTokenURI;

    constructor(address initialOwner) ERC721("MorL Game Results", "MORL") Ownable(initialOwner) {
        _baseTokenURI = "https://morless.vercel.app/api/nft/metadata/";
    }

    function safeMint(address to, string memory tokenURI) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }

    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        // Store token URI mapping
    }
}
```

**Deployment Options:**
- Use [Remix](https://remix.ethereum.org/) for simple deployment
- Use [Hardhat](https://hardhat.org/) or [Foundry](https://book.getfoundry.sh/) for advanced setups
- Deploy to Base Sepolia first for testing

### 2. Update Contract Address

After deploying, update `lib/nft/contract.ts`:

```typescript
export const NFT_CONTRACT_ADDRESS = {
  base: '0xYourDeployedContractAddress', // Base mainnet
  baseSepolia: '0xYourTestnetContractAddress', // Base Sepolia
}
```

### 3. Set Up Account Abstraction

The minting uses Base's account abstraction for gasless transactions. The Base Mini App SDK handles this automatically when users interact from within the Base app.

For testing outside Base app:
- Use a wallet like Coinbase Wallet or MetaMask
- Ensure you're connected to Base network
- The contract owner needs to approve minting

### 4. Metadata Storage

Currently, metadata is generated on-demand. For production, consider:

**Option A: IPFS Storage**
- Upload metadata to IPFS (Pinata, NFT.Storage, Web3.Storage)
- Store IPFS hash in contract
- Update `app/api/nft/mint/route.ts` to upload to IPFS

**Option B: On-Chain Storage**
- Store metadata directly in contract (more expensive but permanent)
- Modify contract to accept full metadata JSON

**Option C: Your API**
- Store metadata in your database
- Serve via `/api/nft/metadata/[id]` endpoint
- Less decentralized but easier to manage

### 5. Image Generation

NFTs need images. Options:

**Option A: Dynamic Image API**
- Create `/app/api/nft/image/route.ts` using `@vercel/og` or canvas
- Generate images based on game results
- Store images on IPFS or your CDN

**Option B: Pre-made Templates**
- Create image templates for each tier/score combination
- Store in `public/nft-images/`
- Reference in metadata

### 6. Environment Variables

Add to `.env.local`:

```env
# Base Network
NEXT_PUBLIC_BASE_CHAIN_ID=8453  # Base mainnet, 84532 for Sepolia

# Contract Addresses (optional, can be hardcoded)
NEXT_PUBLIC_NFT_CONTRACT_BASE=0x...
NEXT_PUBLIC_NFT_CONTRACT_BASE_SEPOLIA=0x...

# IPFS (if using)
PINATA_API_KEY=...
PINATA_SECRET_KEY=...
```

## Testing

1. Deploy contract to Base Sepolia
2. Update contract address in code
3. Complete a game in your app
4. Click "Mint NFT & Share"
5. Check transaction on [BaseScan Sepolia](https://sepolia.basescan.org/)

## Production Checklist

- [ ] Deploy contract to Base mainnet
- [ ] Update contract addresses
- [ ] Set up IPFS or metadata storage
- [ ] Create NFT image generation
- [ ] Test minting flow end-to-end
- [ ] Set up contract owner wallet
- [ ] Configure gas sponsorship (if using paymaster)
- [ ] Add error handling and user feedback
- [ ] Test sharing to Base social feed

## Resources

- [Base Documentation](https://docs.base.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [ERC-721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Base Account Abstraction](https://docs.base.org/cookbook/account-abstraction/)

## Current Status

✅ Metadata generation implemented
✅ API endpoint created
✅ GameOver component updated
✅ Base sharing integration
⏳ Contract deployment needed
⏳ Image generation needed
⏳ IPFS integration needed

