contract_abi = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_binaryHash",
                "type": "string"
            },
            {
                "internalType": "string[]",
                "name": "_permissions",
                "type": "string[]"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "uint256",
                "name": "reportId",
                "type": "uint256"
            },
            {
                "indexed": False,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": False,
                "internalType": "string[]",
                "name": "reportSoftwareBehavior",
                "type": "string[]"
            },
            {
                "indexed": False,
                "internalType": "bool",
                "name": "violated",
                "type": "bool"
            }
        ],
        "name": "ReportGenerated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "string[]",
                "name": "_behavior",
                "type": "string[]"
            },
            {
                "internalType": "bytes32",
                "name": "_windowsKey",
                "type": "bytes32"
            }
        ],
        "name": "reportPendingSoftwareBehavior",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bool",
                "name": "approve",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "pendingReportID",
                "type": "uint256"
            }
        ],
        "name": "voteOnPendingReport",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_key",
                "type": "bytes32"
            }
        ],
        "name": "registerKey",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_key",
                "type": "bytes32"
            }
        ],
        "name": "authorizeUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "revokeAuthorization",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "retrieveReportOverview",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "fallback"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    }
]