// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Launchpad is ReentrancyGuard, Ownable {
    struct Pool {
        address tokenAddress;
        uint256 startTime;
        uint256 endTime;
        uint256 totalTokens;
        uint256 tokenPrice;
        uint256 minContribution;
        uint256 maxContribution;
        uint256 totalRaised;
        bool finalized;
    }
       constructor() Ownable(msg.sender) {}

    mapping(uint256 => Pool) public pools;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    uint256 public poolCount;

    event PoolCreated(
        uint256 indexed poolId,
        address tokenAddress,
        uint256 startTime,
        uint256 endTime
    );
    event Contributed(
        uint256 indexed poolId,
        address indexed contributor,
        uint256 amount
    );
    event PoolFinalized(uint256 indexed poolId, uint256 totalRaised);

    function createPool(
        address _tokenAddress,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _totalTokens,
        uint256 _tokenPrice,
        uint256 _minContribution,
        uint256 _maxContribution
    ) external onlyOwner {
        require(_startTime > block.timestamp, "Invalid start time");
        require(_endTime > _startTime, "Invalid end time");
        require(_totalTokens > 0, "Invalid token amount");
        require(_tokenPrice > 0, "Invalid token price");

        IERC20 token = IERC20(_tokenAddress);
        require(
            token.transferFrom(msg.sender, address(this), _totalTokens),
            "Token transfer failed"
        );

        pools[poolCount] = Pool({
            tokenAddress: _tokenAddress,
            startTime: _startTime,
            endTime: _endTime,
            totalTokens: _totalTokens,
            tokenPrice: _tokenPrice,
            minContribution: _minContribution,
            maxContribution: _maxContribution,
            totalRaised: 0,
            finalized: false
        });

        emit PoolCreated(poolCount, _tokenAddress, _startTime, _endTime);
        poolCount++;
    }

    function contribute(uint256 _poolId) external payable nonReentrant {
        Pool storage pool = pools[_poolId];
        require(block.timestamp >= pool.startTime, "Pool not started");
        require(block.timestamp <= pool.endTime, "Pool ended");
        require(!pool.finalized, "Pool finalized");
        require(msg.value >= pool.minContribution, "Below min contribution");
        require(
            contributions[_poolId][msg.sender] + msg.value <= pool.maxContribution,
            "Exceeds max contribution"
        );

        contributions[_poolId][msg.sender] += msg.value;
        pool.totalRaised += msg.value;

        emit Contributed(_poolId, msg.sender, msg.value);
    }

    function finalizePool(uint256 _poolId) external onlyOwner {
        Pool storage pool = pools[_poolId];
        require(block.timestamp > pool.endTime, "Pool not ended");
        require(!pool.finalized, "Pool already finalized");

        pool.finalized = true;
        payable(owner()).transfer(pool.totalRaised);

        emit PoolFinalized(_poolId, pool.totalRaised);
    }

    function claimTokens(uint256 _poolId) external nonReentrant {
        Pool storage pool = pools[_poolId];
        require(pool.finalized, "Pool not finalized");

        uint256 contribution = contributions[_poolId][msg.sender];
        require(contribution > 0, "No contribution");

        uint256 tokenAmount = (contribution * 1e18) / pool.tokenPrice;
        contributions[_poolId][msg.sender] = 0;

        IERC20(pool.tokenAddress).transfer(msg.sender, tokenAmount);
    }
}