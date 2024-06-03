pragma solidity ^0.8.0;

/** 
 * @title SCC - Software Compliance Contract
 * @dev Implements Software Permissions and Binary Monitor on User's Computer
 */

/**
Requirements:
    Owner:
        -> can submit permissions and binary hash on creation
        -> receive tokens if his affirmation passes

**/

contract SCC {

    string binaryHash;
    string permissions;
    address public owner;
    mapping(address => bytes32) public userToKeys;
    mapping(bytes32 => bool) public validKeys;

    constructor(string memory _binaryHash, string memory _permissions) {
        owner = msg.sender;
        binaryHash = _binaryHash;
        permissions = _permissions;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    function registerKey(bytes32 _key) public onlyOwner {
        validKeys[_key] = true;
    }

    function authorizeUser(bytes32 _key) public {
        require(validKeys[_key], "Invalid key");
        userToKeys[msg.sender] = _key;
        validKeys[_key] = false; 
    }

    function revokeAuthorization() public {
        require(userToKeys[msg.sender] != 0x0, "No authorization to revoke");
        bytes32 keyHash = userToKeys[msg.sender];
        userToKeys[msg.sender] = 0x0;
        delete validKeys[keyHash]; 
    }

    function isUserAuthorized(address _user) public view returns (bool) {
        return userToKeys[_user] != 0x0;
    }
}
