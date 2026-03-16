// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title StakingPool
/// @notice Minimal single-pool staking skeleton (v1) for iterative development.
contract StakingPool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error ZeroAddress();
    error NotImplemented();

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    // Reward tokens emitted per second.
    uint256 public rewardRate;

    // Total tokens currently staked in this pool.
    uint256 public totalStaked;

    // Accumulated reward per staked token share, scaled by PRECISION.
    uint256 public accRewardPerShare;

    // Last timestamp when pool reward state was updated.
    uint256 public lastRewardTimestamp;

    uint256 public constant PRECISION = 1e12;

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
    }

    mapping(address => UserInfo) public userInfo;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(address stakingToken_, address rewardToken_, uint256 rewardRate_) {
        if (stakingToken_ == address(0) || rewardToken_ == address(0)) {
            revert ZeroAddress();
        }

        stakingToken = IERC20(stakingToken_);
        rewardToken = IERC20(rewardToken_);
        rewardRate = rewardRate_;
        lastRewardTimestamp = block.timestamp;
    }

    /// @notice Stake `amount` of staking token into the pool.
    /// @dev TODO(v1): implement reward settlement, amount accounting, token transfer, and rewardDebt update.
    function stake(uint256 amount) external nonReentrant {
        amount; // silence warning until implementation.
        revert NotImplemented();
    }

    /// @notice Unstake `amount` of staking token from the pool.
    /// @dev TODO(v1): implement reward settlement, amount checks, token transfer, and rewardDebt update.
    function unstake(uint256 amount) external nonReentrant {
        amount; // silence warning until implementation.
        revert NotImplemented();
    }

    /// @notice Claim accumulated rewards for caller.
    /// @dev TODO(v1): implement pending reward calculation, reward transfer, and debt refresh.
    function claimReward() external nonReentrant {
        revert NotImplemented();
    }

    /// @notice View pending reward for `user` at current timestamp.
    /// @dev TODO(v1): implement full simulation with up-to-date accRewardPerShare.
    function pendingReward(address user) external view returns (uint256) {
        user; // silence warning until implementation.
        return 0;
    }

    /// @notice Returns raw user accounting fields.
    function getUserInfo(address user)
        external
        view
        returns (uint256 amount, uint256 rewardDebt)
    {
        UserInfo memory info = userInfo[user];
        return (info.amount, info.rewardDebt);
    }

    /// @dev TODO(v1): update `accRewardPerShare` and `lastRewardTimestamp`.
    function _updatePool() internal {
        revert NotImplemented();
    }

    /// @dev TODO(v1): safely transfer reward token to `to` with balance checks.
    function _safeRewardTransfer(address to, uint256 amount) internal {
        to;
        amount;
        revert NotImplemented();
    }
}
