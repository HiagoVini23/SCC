// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

/**
 * @title SCC - Software Compliance Contract
 * @dev Manages Software Capabilities and Binary Monitoring
 */

/**
 * Requirements:
 *
 * Owner (Company):
 *  -> Can submit Capabilities and binary hash on creation
 *  -> Can register keys for software user logins
 *
 * Software Users:
 *  -> Can submit a report
 *  -> Can revoke authorization upon software uninstallation
 *  -> Can link themselves to a valid key upon software installation (login)
 *
 *  Everyone:
 *  -> Consults Binary Hash and Capabilities
 *  -> Views reports with behaviors.
 *  -> Accesses an overview of all reports.
 */

 // criar função que retorna capabilities permitidas
 // criar função que retorna report com capabilities

contract SCC {

    //last user from ganache
    address private microsoftAddress = 0x189926E611c2B238D339e25E81345831dE884056;
    
    // variable to define time to inactivity
    uint256 constant inactivityPeriod = 1 weeks;

    // Binary hash representing the software's unique identifier
    string public binaryHash;

    mapping(bytes32 => bool) public allowedCapabilities;
    // Array storing the list of capabilities associated with the software
    //bytes32[] public allowedCapabilities;

    // Array storing the list of capabilities found by users
    mapping(bytes32 => bool) public foundCapabilities;
    //bytes32[] public foundCapabilities;

    // Address of the contract owner, typically the company managing the software
    address private owner;

    /* MAPPING */
    //  User addresses to their respective access keys for software validation
    mapping(address => bytes32) private userToKeys;
    // Keys to used or not used
    mapping(bytes32 => bool) private usedKeys;
    // List registered keys
    mapping(bytes32 => bool) private registeredKeys;

    mapping(address => uint256) private userToLastInteraction;

    /* COUNTER */
    //  for software users
    uint256 private users;
    address[] private usersAddress;
    //  for activate software users
    uint256 private activeUsers;

    // For reporting capabilities that have been violated
    uint256 private violatedCapabilitiesCount;

    //Event Capabilities found
    event CapabilityFoundByUser(
        address indexed user,
        bytes32 indexed softwareBehavior
    );

    // Event emitted when a new software behavior report is generated
    // Event Capabilities violated
    event CapabilityViolated(
        address indexed user,
        bytes32 softwareBehavior
    );

    /* MODIFIERS */
    // Restrict access to owner-only functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function");
        _;
    }

    //Restrict access to functions not allowed for the contract owner.
    modifier onlyNotOwner() {
        require(msg.sender != owner, "Not available to the contract owner");
        _;
    }

    //Restrict access to functions allowed only for registered software users.
    modifier onlySoftwareUser() {
        require(userToKeys[msg.sender] != bytes32(0), "You are not a software user");
        _;
    }

    // Constructor to initialize the contract with binary hash and capabilities
    constructor(string memory _binaryHash, bytes32[] memory _allowedCapabilities) public {
        owner = msg.sender;
        binaryHash = _binaryHash;
        for (uint i = 0; i < _allowedCapabilities.length; i++) {
            allowedCapabilities[_allowedCapabilities[i]] = true;
        }
    }

    // Key example: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
    // Function to register a new valid key and not used
    function registerKey(bytes32 _key) public onlyOwner {
        require(_key != bytes32(0), "Invalid key");
        require(!registeredKeys[_key], "Key already registered");
        registeredKeys[_key] = true;
        checkAndUpdateInactiveUser();
    }

    // Function to a software user authorize yourself
    function authorizeUser(bytes32 _key) public onlyNotOwner {
        require(registeredKeys[_key], "Invalid key");
        require(!usedKeys[_key], "Key already used");
        userToKeys[msg.sender] = _key;
        usedKeys[_key] = true;
        users++;
        usersAddress.push(msg.sender);
        activeUsers++;
        userToLastInteraction[msg.sender] = block.timestamp;
        checkAndUpdateInactiveUser();
    }

    // Function for software users to revoke their own authorization
    function revokeAuthorization() public onlySoftwareUser {
        userToKeys[msg.sender] = bytes32(0);
        users--;
        // if user wasnt inactive, decrement active users
        if(userToLastInteraction[msg.sender]!=0){
            activeUsers--;
        }
        checkAndUpdateInactiveUser();
    }

    // Function to return a report overview
    function retrieveReportOverview() public view returns (uint256, uint256, uint256){
        return (users, activeUsers, violatedCapabilitiesCount);
    }

    // update the activeUser count to approve pending report
    function checkAndUpdateInactiveUser() internal {
        for (uint256 i = 0; i < usersAddress.length; i++) {
            uint256 lastInteraction = userToLastInteraction[usersAddress[i]];
            if (lastInteraction != 0) {
                uint256 timeElapsed = block.timestamp - lastInteraction;
                if (timeElapsed >= inactivityPeriod) {
                    // If the user has become inactive
                    activeUsers--;
                    // Reset the interaction timestamp to 0
                    userToLastInteraction[usersAddress[i]] = 0;
                }
            }
        }
    }

    function toHex(address _addr) internal pure returns (string memory) {
         return string(abi.encode(_addr));
    }

    //verificar se foi de fato violated
    function reportCapability(bytes32 _softwareBehavior, bytes memory _signature) public {
        bytes32 reportHash = keccak256(abi.encode(_softwareBehavior));
        //bytes32 prefixedHash = prefixed(reportHash);

         // Verifica a assinatura
        address signer = verifySignature(reportHash, _signature);

        //require(signer == microsoftAddress, string(abi.encode("Expected: ", toHex(microsoftAddress), " Got: ", toHex(signer))));

        emit CapabilityFoundByUser(msg.sender, _softwareBehavior);
        foundCapabilities[_softwareBehavior] = true;
        if (!allowedCapabilities[_softwareBehavior]) {
            emit CapabilityViolated(msg.sender, _softwareBehavior);
            violatedCapabilitiesCount++;
        }
    }

    // function to verify the signature
    function verifySignature(bytes32 _hash, bytes memory _signature) public pure returns (address) {
        address signer = recoverSigner(_hash, _signature);
        return signer;
    }

    // function to add prefix to the message
    function prefixed(bytes32 _hash) internal pure returns (bytes32) {
        return keccak256(abi.encode("\x19Ethereum Signed Message:\n32", _hash));
    }

    function recoverSigner(bytes32 _messageHash, bytes memory _signature) public pure returns (address) {
        require(_signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }

        return ecrecover(_messageHash, v, r, s);
    }

}