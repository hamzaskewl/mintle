# ✅ Contract Deployed!

Your MintleNFT contract has been deployed!

## Contract Details

- **Address**: `0x6E3Cf9F63eb409E4071422a0467F9Bb81bB4Bd06`
- **Network**: Base Sepolia (Testnet)
- **Contract Name**: MintleNFT
- **Token Name**: Mintle Game Results
- **Token Symbol**: MINTLE

## View Your Contract

- **BaseScan Sepolia**: https://sepolia.basescan.org/address/0x6E3Cf9F63eb409E4071422a0467F9Bb81bB4Bd06
- **BaseScan Mainnet**: (Update when you deploy to mainnet)

## Next Steps

### 1. Verify Contract on BaseScan (Optional but Recommended)

1. Go to [BaseScan Sepolia](https://sepolia.basescan.org/address/0x6E3Cf9F63eb409E4071422a0467F9Bb81bB4Bd06)
2. Click "Contract" tab
3. Click "Verify and Publish"
4. Follow the verification process

### 2. Test Minting

You can test minting in Remix:

1. Go to **Deployed Contracts** in Remix
2. Find your contract at `0x6E3Cf9F63eb409E4071422a0467F9Bb81bB4Bd06`
3. Use `safeMint` function:
   - `to`: Your wallet address
   - `uri`: `https://morless.vercel.app/api/nft/metadata/1`
4. Click **transact**
5. Check the transaction on BaseScan

### 3. Update Code for Mainnet (When Ready)

When you're ready to deploy to Base mainnet:

1. Deploy contract to Base mainnet
2. Update `lib/nft/contract.ts`:
   ```typescript
   export const NFT_CONTRACT_ADDRESS = {
     base: '0xYourMainnetAddress', // Base mainnet
     baseSepolia: '0x6E3Cf9F63eb409E4071422a0467F9Bb81bB4Bd06', // Base Sepolia
   }
   ```
3. Set `isTestnet = false` in `lib/nft/mint.ts` (line ~47)

### 4. Set Up Database

Make sure you've run the SQL script to create the metadata table:

1. Go to your Supabase dashboard
2. Run `supabase-nft-metadata.sql`
3. This allows your API to store and serve NFT metadata

### 5. Test the Full Flow

1. Complete a game in your app
2. Click "Mint NFT & Share"
3. Check that metadata is generated
4. Verify metadata is stored in database
5. Test viewing metadata at: `https://morless.vercel.app/api/nft/metadata/[tokenId]`

## Current Status

✅ Contract deployed to Base Sepolia  
✅ Contract address updated in code  
✅ Mint function prepared  
⏳ Database setup needed (run SQL script)  
⏳ Test minting flow  
⏳ Deploy to mainnet when ready  

## Important Notes

- **Owner Only**: Currently only the contract owner can mint. To allow public minting, you'd need to modify the contract or set up a minting service.
- **Account Abstraction**: The minting will use Base's account abstraction when users interact from within the Base app.
- **Metadata**: Metadata is served via your API endpoint, which is flexible and can be updated.

## Contract Functions

- `safeMint(address to, string memory uri)` - Mint an NFT (owner only)
- `tokenURI(uint256 tokenId)` - Get metadata URI for a token
- `ownerOf(uint256 tokenId)` - Get owner of a token
- `balanceOf(address owner)` - Get balance of an address

## Need Help?

- BaseScan: https://sepolia.basescan.org/address/0x6E3Cf9F63eb409E4071422a0467F9Bb81bB4Bd06
- Base Docs: https://docs.base.org
- Your contract is ready to use! 🎉

