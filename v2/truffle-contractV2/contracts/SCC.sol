// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

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
 *  -> Can submit a report for voting
 *  -> Can vote on pending reports to publish 
 *  -> Can revoke authorization upon software uninstallation
 *  -> Can link themselves to a valid key upon software installation (login)
 *
 *  Everyone:
 *  -> Consults Binary Hash and Permissions
 *  -> Views reports with behaviors.
 *  -> Accesses an overview of all reports.
 */

contract SCC {

    // variable to define time to inactivity
    uint256 constant inactivityPeriod = 1 weeks;

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
    mapping(address => uint256) private userToLastInteraction;

    /* COUNTER */
    //  for software users
    uint256 private users;
    address[] private usersAddress;
    //  for activate software users
    uint256 private activeUsers;
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
        bool indexed violated //Flag indicating if permissions were violated
    );

    //Event emitted when a pending software behavior report is generated
    event pendingReportGenerated(
        uint256 indexed reportId, // Unique identifier for the report
        address indexed user, // Address of the user who generated the report
        string[] reportSoftwareBehavior, // Array of behaviors reported by the user
        bytes32 indexed windowsKey // windows key associated with this report
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
    constructor(string memory _binaryHash, string[] memory _permissions) public {
        owner = msg.sender;
        binaryHash = _binaryHash;
        permissions = _permissions;
    }

    // allow software user to create a pending report
    function reportPendingSoftwareBehavior(string[] memory _behavior, bytes32 _windowsKey) public onlySoftwareUser{
        require(_behavior.length > 0, "Behavior array cannot be empty");
        require(_windowsKey != bytes32(0), "Windows Key cannot be 0");
        userToLastInteraction[msg.sender] = block.timestamp;
        pendingReports[pendingReportCount] = _behavior;
        pendingReportCount++;
        updateInactiveUsersAndApproveReports();
        emit pendingReportGenerated(pendingReportCount - 1, msg.sender, _behavior, _windowsKey);
    }

    //// Allows software users to vote on pending reports until 50% + 1 approve the report.
    function voteOnPendingReport(bool approve, uint256 pendingReportID) public onlySoftwareUser{
        require(pendingReports[pendingReportID].length > 0, "Pending report does not exist");
        require(reports[pendingReportID].length == 0, "Report already approved");
        require(userHasVotedOnPendingReport[pendingReportID][msg.sender] != true, "Already voted");
        userHasVotedOnPendingReport[pendingReportID][msg.sender] = true;
        userToLastInteraction[msg.sender] = block.timestamp;
        if(approve){
            pendingReportToApprovalVotes[pendingReportID]++;
        }
        updateInactiveUsersAndApproveReports();
    }

    // Function for contract to approve a new report
    function approvePendingReport(uint256 pendingReportID) internal onlySoftwareUser{
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
        updateInactiveUsersAndApproveReports();
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
        updateInactiveUsersAndApproveReports();
    }

    // Function for software users to revoke their own authorization
    function revokeAuthorization() public onlySoftwareUser {
        userToKeys[msg.sender] = bytes32(0);
        users--;
        // if user wasnt inactive, decrement active users
        if(userToLastInteraction[msg.sender]!=0){
            activeUsers--;
        }
        updateInactiveUsersAndApproveReports();
    }

    // Function to return a report overview
    function retrieveReportOverview() public view returns (uint256, uint256, uint256, uint256){
        return (users, activeUsers, reportCount, violatedPermissionsCount);
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

    function checkAndApprovePendingReports() internal {
        for (uint256 i = 0; i < pendingReportCount; i++) {
            // Checks if the report is still pending and not yet approved
            if (pendingReports[i].length > 0 && reports[i].length == 0) {
                // Checks if more than half of the active users have approved the report
                if (pendingReportToApprovalVotes[i] > activeUsers / 2) {
                    approvePendingReport(i);
                }
            }
        }
    }

    function updateInactiveUsersAndApproveReports() internal {
        checkAndUpdateInactiveUser();
        checkAndApprovePendingReports();
    }
}