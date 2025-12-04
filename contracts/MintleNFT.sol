// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract MintleNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    string private _baseTokenURI;
    
    // Mapping to store token URIs
    mapping(uint256 => string) private _tokenURIs;
    
    // Mapping to track if a mint has already been used (prevents replay attacks)
    mapping(bytes32 => bool) private _usedSignatures;
    
    // Signer address for verifying signatures
    address public signer;
    
    // EIP-712 Domain Separator
    bytes32 public constant DOMAIN_SEPARATOR_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    
    // Mint message typehash
    bytes32 public constant MINT_TYPEHASH = keccak256(
        "MintMessage(address to,string uri,uint256 score,uint8 category,string date)"
    );
    
    bytes32 private immutable _domainSeparator;
    
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);

    constructor(address initialOwner, address _signer) ERC721("Mintle Game Results", "MINTLE") Ownable(initialOwner) {
        _baseTokenURI = "https://mintle.vercel.app/api/nft/metadata/";
        signer = _signer;
        
        // Build domain separator
        _domainSeparator = keccak256(
            abi.encode(
                DOMAIN_SEPARATOR_TYPEHASH,
                keccak256(bytes("MintleNFT")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    function safeMint(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    /**
     * Public mint function with signature verification
     * @param to Address to mint NFT to
     * @param uri Metadata URI
     * @param score Game score (0-5)
     * @param category Category (0 = movies, 1 = spotify)
     * @param date Game date (YYYY-MM-DD format)
     * @param signature Server-signed message
     */
    function publicMint(
        address to,
        string memory uri,
        uint256 score,
        uint8 category,
        string memory date,
        bytes memory signature
    ) public returns (uint256) {
        // Verify signature
        bytes32 messageHash = keccak256(
            abi.encode(
                MINT_TYPEHASH,
                to,
                keccak256(bytes(uri)),
                score,
                category,
                keccak256(bytes(date))
            )
        );
        
        // EIP-712 structured data hash
        bytes32 hash = keccak256(
            abi.encodePacked("\x19\x01", _domainSeparator, messageHash)
        );
        
        address recoveredSigner = ECDSA.recover(hash, signature);
        require(recoveredSigner == signer, "Invalid signature");
        
        // Prevent replay attacks
        bytes32 signatureId = keccak256(abi.encodePacked(to, uri, score, category, date));
        require(!_usedSignatures[signatureId], "Signature already used");
        _usedSignatures[signatureId] = true;
        
        // Validate score range
        require(score <= 5, "Invalid score");
        require(category <= 1, "Invalid category");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit URI(uri, tokenId);
        return tokenId;
    }
    
    /**
     * Update the signer address (only owner)
     */
    function setSigner(address newSigner) public onlyOwner {
        address oldSigner = signer;
        signer = newSigner;
        emit SignerUpdated(oldSigner, newSigner);
    }

    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        _tokenURIs[tokenId] = uri;
        emit URI(uri, tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        
        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseTokenURI;

        // If there is a specific token URI, return it
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }
        
        // Otherwise, return base URI + token ID
        return bytes(base).length > 0 ? string(abi.encodePacked(base, _toString(tokenId))) : "";
    }

    // Helper function to convert uint256 to string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
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

    // Event for URI updates
    event URI(string value, uint256 indexed id);
}

