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
 *  -> Can register keys for software user logins
 *
 * Software Users:
 *  -> Can report software behavior
 *  -> Can revoke authorization upon software uninstallation
 *  -> Can link themselves to a valid key upon software installation (login)
 *
 *  Everyone:
 *  -> Consults Binary Hash and Permissions
 *  -> Views reports with behaviors.
 *  -> Accesses an overview of all reports.
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
    // Report IDs to arrays of software behavior descriptions
    mapping(uint256 => string[]) public reports;
    mapping(uint256 => string[]) private pendingReports;
    // Maps each pending report ID to the count of approval votes.
    mapping(uint256 => uint256) private pendingReportToApprovalVotes;
    // Tracks whether a user has voted on a specific pending report ID.
    mapping(uint256 => mapping(address => bool)) private userHasVotedOnPendingReport;

    /* COUNTER */
    //  for active software users
    uint256 private activateUsers;
    //  for generated reports
    uint256 private reportCount;
    //  for pending reports
    uint256 private pendingReportCount;
    // For reporting permissions that have been violated
    uint256 private violatedPermissionsCount;

    // Event emitted when a new software behavior report is generated
    event ReportGenerated(
        uint256 indexed reportId, // Unique identifier for the report
        address indexed user, // Address of the user who generated the report
        string[] reportSoftwareBehavior, // Array of behaviors reported by the user
        bool indexed violated // Flag indicating if permissions were violated
    );

    //Event emitted when a pending software behavior report is generated
    event pendingReportGenerated(
        uint256 indexed reportId, // Unique identifier for the report
        address indexed user, // Address of the user who generated the report
        string[] reportSoftwareBehavior, // Array of behaviors reported by the user
        bytes32 indexed windowsKey // Flag indicating if permissions were violated
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

    // Constructor to initialize the contract with binary hash and permissions
    constructor(string memory _binaryHash, string[] memory _permissions) {
        owner = msg.sender;
        binaryHash = _binaryHash;
        permissions = _permissions;
    }

    //// Allows software users to vote on pending reports until 50% + 1 approve the report.
    function reportPendingSoftwareBehavior(string[] memory _behavior, bytes32 _windowsKey) public onlySoftwareUser{
        require(_behavior.length > 0, "Behavior array cannot be empty");
        require(_windowsKey != bytes32(0), "Windows Key cannot be 0");
        pendingReports[pendingReportCount] = _behavior;
        pendingReportCount++;
        emit pendingReportGenerated(pendingReportCount - 1, msg.sender, _behavior, _windowsKey);
    }

    // Vote to pending report untill 50% approve the report
    function voteOnPendingReport(bool approve, uint256 pendingReportID) public onlySoftwareUser{
        require(reports[pendingReportID].length > 0, "Already published");
        require(userHasVotedOnPendingReport[pendingReportID][msg.sender] != true, "Already voted");
        userHasVotedOnPendingReport[pendingReportID][msg.sender] = true;
        if(approve){
            pendingReportToApprovalVotes[pendingReportID]++;
            if(pendingReportToApprovalVotes[pendingReportID] > activateUsers / 2){
                approvePendingReport(pendingReportID);
            }
        }
    }

    // Function for contract to approve a new report
    function approvePendingReport(uint256 pendingReportID) internal  onlySoftwareUser{
        bool violated = false;
        if (pendingReports[pendingReportID].length > permissions.length) {
            violatedPermissionsCount++;
            violated = true;
        }
        reports[pendingReportID] = pendingReports[pendingReportID];
        reportCount++;

        // Emit event to notify about the new report generated
        emit ReportGenerated(pendingReportID, msg.sender, pendingReports[pendingReportID], violated);
    }

    // Key example: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
    // Function to register a new valid key and not used
    function registerKey(bytes32 _key) public onlyOwner {
        require(_key != bytes32(0), "Invalid key");
        require(!registeredKeys[_key], "Key already registered");
        registeredKeys[_key] = true;
    }

    // Function to a software user authorize yourself
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

    // Function to return a report overview
    function retrieveReportOverview() public view returns (uint256, uint256, uint256){
        return (activateUsers, reportCount, violatedPermissionsCount);
    }
}
