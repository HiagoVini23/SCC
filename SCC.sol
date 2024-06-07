// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SCC - Software Compliance Contract
 * @dev Manages Software Permissions and Binary Monitoring
 */

/**
 * Requirements:
 *
 * Owner (Company):
 *  -> Can submit permissions and binary hash on creation
 *  -> Can register valid keys for software user logins
 *
 * Software Users:
 *  -> Can report software behavior
 *  -> Can revoke authorization upon software uninstallation
 *  -> Can link themselves to a valid key upon software installation (login)
 *
 *  Everyone:
 *  -> Can consult reports with active user count and recently software behavior
 */

contract SCC {
    // Binary hash representing the software's unique identifier
    string public binaryHash;

    // Array storing the list of permissions associated with the software
    string[] public permissions;

    // Address of the contract owner, typically the company managing the software
    address private owner;

    /* MAPPING */
    //  User addresses to their respective access keys for software validation
    mapping(address => bytes32) private userToKeys;
    // Keys to used or not used
    mapping(bytes32 => bool) private usedKeys;
    // List registered keys
    mapping(bytes32 => bool) private registeredKeys;
    //  Report IDs to arrays of software behavior descriptions
    mapping(uint256 => string[]) public reports;

    /* COUNTER */
    //  for active software users
    uint256 public activateUsers;
    //  for generated reports
    uint256 public reportCount;

    // Events for important contract actions
    event ReportGenerated(uint256 indexed reportId, address indexed user);

    /* MODIFIERS */
    // Restrict access to owner-only functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    modifier onlyNotOwner() {
        require(msg.sender != owner, "Not the contract owner");
        _;
    }

    // Restrict access to software users-only functions
    modifier onlySoftwareUser() {
        require(userToKeys[msg.sender] != bytes32(0), "You are not a software user");
        _;
    }

    // Constructor to initialize the contract with binary hash and permissions
    constructor(string memory _binaryHash, string[] memory _permissions) {
        owner = msg.sender;
        binaryHash = _binaryHash;
        permissions = _permissions;
    }

    // Function for software users to generate a new report
    function reportSoftwareBehavior(string[] memory _behavior) public onlySoftwareUser {
        reports[reportCount] = _behavior;
        reportCount++;
        emit ReportGenerated(reportCount - 1, msg.sender);
    }

    function registerKey(bytes32 _key) public onlyOwner {
        require(_key != bytes32(0), "Invalid key");
        require(!registeredKeys[_key], "Key already registered");
        registeredKeys[_key] = true;
    }

    //0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

    // Function to register a new valid key and not used (owner-only)
    function authorizeUser(bytes32 _key) public onlyNotOwner {
        require(registeredKeys[_key], "Invalid key");
        require(!usedKeys[_key], "Key already used");
        userToKeys[msg.sender] = _key;
        usedKeys[_key] = true; 
        activateUsers++;
    }

    // Function for software users to revoke their own authorization
    function revokeAuthorization() public onlySoftwareUser {
        userToKeys[msg.sender] = bytes32(0);
        activateUsers--;
    }
}
