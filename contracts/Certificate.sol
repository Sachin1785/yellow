// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Certificate {
    // Define a certificate structure
    struct Cert {
        address issuer;
        address recipient;
        string ipfsHash; // Hash of the document stored on IPFS
        uint256 issuedAt;
    }
    
    // Certificate counter (auto-incremented ID)
    uint256 public certCount;
    
    // Mapping from certificate ID to the certificate details
    mapping(uint256 => Cert) public certificates;
    
    // Event emitted when a new certificate is issued
    event CertificateIssued(
        uint256 indexed certId,
        address indexed issuer,
        address indexed recipient,
        string ipfsHash,
        uint256 issuedAt
    );
    
    /**
     * @dev Issues a certificate by storing the IPFS hash on-chain.
     * @param recipient The address of the certificate recipient.
     * @param ipfsHash The IPFS hash of the document (e.g., image, PDF, text).
     * @return The certificate ID.
     */
    function issueCertificate(address recipient, string calldata ipfsHash) external returns (uint256) {
        require(recipient != address(0), "Invalid recipient address");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        
        certCount++;
        
        certificates[certCount] = Cert({
            issuer: msg.sender,
            recipient: recipient,
            ipfsHash: ipfsHash,
            issuedAt: block.timestamp
        });
        
        emit CertificateIssued(certCount, msg.sender, recipient, ipfsHash, block.timestamp);
        return certCount;
    }
}
