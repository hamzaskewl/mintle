# NFT Contract Deployment Guide

## Quick Start - Remix Deployment

### Step 1: Fix Your Contract in Remix

Copy this complete contract into Remix:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MorLNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    string private _baseTokenURI;
    mapping(uint256 => string) private _tokenURIs;

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
        _tokenURIs[tokenId] = uri;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseTokenURI;
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }
        return bytes(base).length > 0 ? string(abi.encodePacked(base, _toString(tokenId))) : "";
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
```

### Step 2: Install OpenZeppelin in Remix

1. In Remix, go to the **File Explorer** tab
2. Click the **+** button to create a new file
3. Name it `@openzeppelin/contracts/token/ERC721/ERC721.sol`
4. Go to [OpenZeppelin GitHub](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/token/ERC721/ERC721.sol)
5. Copy the ERC721.sol code and paste it
6. Repeat for `Ownable.sol` from [here](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/access/Ownable.sol)

**OR** use Remix's import feature:
- Remix should auto-import from npm if you use the import statement correctly
- If not, use the GitHub import: `https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/token/ERC721/ERC721.sol`

### Step 3: Compile

1. Go to **Solidity Compiler** tab
2. Set compiler version to **0.8.20** or higher
3. Click **Compile MorLNFT.sol**
4. Check for errors (should be none)

### Step 4: Deploy to Base Sepolia (Testnet First!)

1. Go to **Deploy & Run Transactions** tab
2. Select **Injected Provider - MetaMask** (or your wallet)
3. **IMPORTANT**: Switch MetaMask to **Base Sepolia** network
   - Network Name: Base Sepolia
   - RPC URL: https://sepolia.base.org
   - Chain ID: 84532
   - Currency Symbol: ETH
   - Block Explorer: https://sepolia.basescan.org
4. Get Sepolia ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
5. In the deploy section:
   - Contract: **MorLNFT**
   - Constructor parameter: Your wallet address (the owner)
6. Click **Deploy**
7. **Copy the contract address** - you'll need this!

### Step 5: Update Your Code

After deployment, update `lib/nft/contract.ts`:

```typescript
export const NFT_CONTRACT_ADDRESS = {
  base: '0x0000000000000000000000000000000000000000', // Update after mainnet deploy
  baseSepolia: '0xYOUR_DEPLOYED_CONTRACT_ADDRESS', // Paste your Sepolia address here
}
```

## Metadata Storage Options

### Option 1: Your API Endpoint (Easiest - Start Here) ✅

**Pros:**
- ✅ Easiest to set up
- ✅ Full control over metadata
- ✅ Can update metadata if needed
- ✅ No additional services needed

**Cons:**
- ❌ Centralized (depends on your server)
- ❌ Not fully decentralized

**How it works:**
1. Your contract stores the token URI: `https://morless.vercel.app/api/nft/metadata/12345`
2. When someone queries `tokenURI(12345)`, it returns that URL
3. Your API endpoint serves the JSON metadata

**Implementation:**
Your current `/api/nft/metadata/[id]` endpoint already works! Just need to:
- Store metadata in your database with the token ID
- Return it when requested

### Option 2: IPFS (Recommended for Production) 🌟

**Pros:**
- ✅ Fully decentralized
- ✅ Permanent storage
- ✅ Standard for NFTs
- ✅ Works with OpenSea, etc.

**Cons:**
- ❌ Requires IPFS service (Pinata, NFT.Storage, etc.)
- ❌ Slightly more complex setup

**Setup Steps:**

1. **Sign up for Pinata** (easiest option):
   - Go to [pinata.cloud](https://pinata.cloud)
   - Create account
   - Get API keys

2. **Install Pinata SDK:**
   ```bash
   npm install @pinata/sdk
   ```

3. **Update your mint API** to upload to IPFS:
   ```typescript
   // In app/api/nft/mint/route.ts
   import pinataSDK from '@pinata/sdk'
   
   const pinata = new pinataSDK({
     pinataJWT: process.env.PINATA_JWT
   })
   
   // After generating metadata:
   const result = await pinata.pinJSONToIPFS(metadata)
   const ipfsHash = result.IpfsHash
   const metadataUri = `ipfs://${ipfsHash}`
   ```

4. **Update contract to accept IPFS URIs:**
   - When minting, pass `ipfs://QmXXX...` as the tokenURI
   - Contract stores it as-is

### Option 3: Hybrid Approach (Best of Both) 🎯

**Use your API for now, migrate to IPFS later:**

1. Start with API endpoint (quick to ship)
2. Later, add IPFS upload as backup
3. Store both: API URL for flexibility, IPFS hash for permanence

## Recommended Approach for You

**Start with Option 1 (API Endpoint)** because:
1. You can deploy and test immediately
2. No additional services needed
3. Easy to update metadata
4. Can migrate to IPFS later without changing contract

**Then add IPFS (Option 2)** when ready for production:
1. Add Pinata integration
2. Upload metadata to IPFS
3. Store IPFS hash in your database
4. Contract can use either API URL or IPFS URL

## Next Steps After Deployment

1. ✅ Deploy contract to Base Sepolia
2. ✅ Update contract address in code
3. ✅ Test minting a test NFT
4. ✅ Update `/api/nft/metadata/[id]` to return real metadata
5. ✅ Test full flow: Complete game → Mint NFT → View on BaseScan
6. 🚀 Deploy to Base Mainnet when ready

## Testing Your Contract

After deployment:

1. **Check on BaseScan:**
   - Go to [BaseScan Sepolia](https://sepolia.basescan.org)
   - Paste your contract address
   - Verify it deployed correctly

2. **Test Mint (in Remix):**
   - Go to **Deployed Contracts**
   - Find your contract
   - Use `safeMint` function:
     - `to`: Your wallet address
     - `tokenURI`: `https://morless.vercel.app/api/nft/metadata/1`
   - Click **transact**
   - Check transaction on BaseScan

3. **View NFT:**
   - Call `tokenURI(1)` to see the URI
   - Visit that URL to see metadata

## Important Notes

- **Owner Address**: The address you pass to constructor becomes the owner
- **Only Owner Can Mint**: Only the owner can call `safeMint`
- **For Public Minting**: You'd need to modify the contract to allow anyone to mint (remove `onlyOwner`)
- **Gas Costs**: Each mint costs gas (sponsored by Base Paymaster if using account abstraction)

## Need Help?

- Base Docs: https://docs.base.org
- Remix Docs: https://remix-project.org
- OpenZeppelin: https://docs.openzeppelin.com/contracts

