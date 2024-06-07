// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/** 
 * @title SCC - Software Compliance Contract
 * @dev Implements Software Permissions and Binary Monitor on User's Computer
 */

/**
Requirements:
    Owner:
        -> can submit permissions and binary hash on creation
        -> can register valid keys to software's user login on contract
**/

contract SCC {

    // Binary hash representing the software's unique identifier
    string public binaryHash;

    // Array storing the list of permissions associated with the software
    string[] public permissions;
    
    // Address of the contract owner, typically the company managing the software
    address private owner;

    // Mapping user addresses to their respective access keys for software validation
    mapping(address => bytes32) public userToKeys;

    // Mapping of valid access keys that can be used to register new users for the software
    mapping(bytes32 => bool) public validKeys;

    // Constructor to initialize the contract with binary hash and permissions
    constructor(string memory _binaryHash, string[] memory _permissions) {
        owner = msg.sender;
        binaryHash = _binaryHash;
        permissions = _permissions;
    }

    // Modifier to restrict access to owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    // Modifier to restrict access to software users
    modifier onlySoftwareUser() {
        require(userToKeys[msg.sender] != bytes32(0), "You are not a software user");
        _;
    }

    // Function to register a new valid key
    function registerKey(bytes32 _key) public onlyOwner {
        require(_key != bytes32(0), "Invalid key");
        validKeys[_key] = true;
    }

    // Function to authorize a user with a valid key
    function authorizeUser(bytes32 _key) public {
        require(validKeys[_key], "Invalid key");
        userToKeys[msg.sender] = _key;
        validKeys[_key] = false; 
    }

    // Function for software users to revoke their own authorization
    function revokeAuthorization() public onlySoftwareUser {
        bytes32 key = userToKeys[msg.sender];
        userToKeys[msg.sender] = bytes32(0);
        delete validKeys[key];
    }
}
