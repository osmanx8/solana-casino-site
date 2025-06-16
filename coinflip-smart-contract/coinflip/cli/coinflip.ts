export type Coinflip = {
  "version": "0.1.0",
  "name": "coinflip",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initializePlayerPool",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "playerPool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "update",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loyaltyWallet",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": {
            "option": "publicKey"
          }
        },
        {
          "name": "loyaltyFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "playGame",
      "docs": [
        "The main function to play dice.\n    Input Args:\n    set_number: The number is set by a player to play : 0: Tail, 1: Head\n    deposit:    The SOL amount to deposit"
      ],
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "playerPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loyaltyWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "setNumber",
          "type": "u64"
        },
        {
          "name": "deposit",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimReward",
      "docs": [
        "The claim Reward function after playing"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "player",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "playerPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "withdraw",
      "docs": [
        "Withdraw function to withdraw SOL from the PDA with amount\n    Args:\n    amount: The sol amount to withdraw from this PDA\n    Only Admin can withdraw SOL from this PDA"
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superAdmin",
            "type": "publicKey"
          },
          {
            "name": "loyaltyWallet",
            "type": "publicKey"
          },
          {
            "name": "loyaltyFee",
            "type": "u64"
          },
          {
            "name": "totalRound",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "playerPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "publicKey"
          },
          {
            "name": "round",
            "type": "u64"
          },
          {
            "name": "gameData",
            "type": {
              "defined": "GameData"
            }
          },
          {
            "name": "winTimes",
            "type": "u64"
          },
          {
            "name": "receivedReward",
            "type": "u64"
          },
          {
            "name": "claimableReward",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "GameData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "playTime",
            "type": "i64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "rewardAmount",
            "type": "u64"
          },
          {
            "name": "setNum",
            "type": "u64"
          },
          {
            "name": "rand",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPlayerPool",
      "msg": "Invalid Player Pool Owner"
    },
    {
      "code": 6001,
      "name": "InvalidAdmin",
      "msg": "Invalid Admin to Withdraw"
    },
    {
      "code": 6002,
      "name": "InvalidClaim",
      "msg": "Invalid Claim to Withdraw Reward"
    },
    {
      "code": 6003,
      "name": "InvalidRewardVault",
      "msg": "Invalid Reward Vault to receive"
    },
    {
      "code": 6004,
      "name": "InsufficientRewardVault",
      "msg": "Insufficient Reward SOL Balance"
    },
    {
      "code": 6005,
      "name": "InsufficientUserBalance",
      "msg": "Insufficient User SOL Balance"
    },
    {
      "code": 6006,
      "name": "InvalidDeposit",
      "msg": "Invalid Deposit Amount"
    },
    {
      "code": 6007,
      "name": "NoPendingRewardExist",
      "msg": "There is no pending reward by played round"
    },
    {
      "code": 6008,
      "name": "NeedClaimPendingReward",
      "msg": "Should claim pending reward before play new round"
    }
  ]
};

export const IDL: Coinflip = {
  "version": "0.1.0",
  "name": "coinflip",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initializePlayerPool",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "playerPool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "update",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loyaltyWallet",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": {
            "option": "publicKey"
          }
        },
        {
          "name": "loyaltyFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "playGame",
      "docs": [
        "The main function to play dice.\n    Input Args:\n    set_number: The number is set by a player to play : 0: Tail, 1: Head\n    deposit:    The SOL amount to deposit"
      ],
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "playerPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loyaltyWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "setNumber",
          "type": "u64"
        },
        {
          "name": "deposit",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimReward",
      "docs": [
        "The claim Reward function after playing"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "player",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "playerPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "withdraw",
      "docs": [
        "Withdraw function to withdraw SOL from the PDA with amount\n    Args:\n    amount: The sol amount to withdraw from this PDA\n    Only Admin can withdraw SOL from this PDA"
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superAdmin",
            "type": "publicKey"
          },
          {
            "name": "loyaltyWallet",
            "type": "publicKey"
          },
          {
            "name": "loyaltyFee",
            "type": "u64"
          },
          {
            "name": "totalRound",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "playerPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "publicKey"
          },
          {
            "name": "round",
            "type": "u64"
          },
          {
            "name": "gameData",
            "type": {
              "defined": "GameData"
            }
          },
          {
            "name": "winTimes",
            "type": "u64"
          },
          {
            "name": "receivedReward",
            "type": "u64"
          },
          {
            "name": "claimableReward",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "GameData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "playTime",
            "type": "i64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "rewardAmount",
            "type": "u64"
          },
          {
            "name": "setNum",
            "type": "u64"
          },
          {
            "name": "rand",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPlayerPool",
      "msg": "Invalid Player Pool Owner"
    },
    {
      "code": 6001,
      "name": "InvalidAdmin",
      "msg": "Invalid Admin to Withdraw"
    },
    {
      "code": 6002,
      "name": "InvalidClaim",
      "msg": "Invalid Claim to Withdraw Reward"
    },
    {
      "code": 6003,
      "name": "InvalidRewardVault",
      "msg": "Invalid Reward Vault to receive"
    },
    {
      "code": 6004,
      "name": "InsufficientRewardVault",
      "msg": "Insufficient Reward SOL Balance"
    },
    {
      "code": 6005,
      "name": "InsufficientUserBalance",
      "msg": "Insufficient User SOL Balance"
    },
    {
      "code": 6006,
      "name": "InvalidDeposit",
      "msg": "Invalid Deposit Amount"
    },
    {
      "code": 6007,
      "name": "NoPendingRewardExist",
      "msg": "There is no pending reward by played round"
    },
    {
      "code": 6008,
      "name": "NeedClaimPendingReward",
      "msg": "Should claim pending reward before play new round"
    }
  ]
};
