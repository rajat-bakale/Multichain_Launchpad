export const LAUNCHPAD_ABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [{"internalType": "uint256","name": "_poolId","type": "uint256"}],
      "name": "contribute",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "address","name": "_tokenAddress","type": "address"},
        {"internalType": "uint256","name": "_startTime","type": "uint256"},
        {"internalType": "uint256","name": "_endTime","type": "uint256"},
        {"internalType": "uint256","name": "_totalTokens","type": "uint256"},
        {"internalType": "uint256","name": "_tokenPrice","type": "uint256"},
        {"internalType": "uint256","name": "_minContribution","type": "uint256"},
        {"internalType": "uint256","name": "_maxContribution","type": "uint256"}
      ],
      "name": "createPool",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256","name": "_poolId","type": "uint256"}
      ],
      "name": "finalizePool",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256","name": "_poolId","type": "uint256"}
      ],
      "name": "claimTokens",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "poolCount",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "name": "pools",
      "outputs": [
        { "internalType": "address", "name": "tokenAddress", "type": "address" },
        { "internalType": "uint256", "name": "startTime", "type": "uint256" },
        { "internalType": "uint256", "name": "endTime", "type": "uint256" },
        { "internalType": "uint256", "name": "totalTokens", "type": "uint256" },
        { "internalType": "uint256", "name": "tokenPrice", "type": "uint256" },
        { "internalType": "uint256", "name": "minContribution", "type": "uint256" },
        { "internalType": "uint256", "name": "maxContribution", "type": "uint256" },
        { "internalType": "uint256", "name": "totalRaised", "type": "uint256" },
        { "internalType": "bool", "name": "finalized", "type": "bool" }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];