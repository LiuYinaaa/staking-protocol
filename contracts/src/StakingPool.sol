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
    error ZeroAmount();
    error InsufficientStake();
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
        uint256 pendingRewards;
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
    /// @dev Does not auto-claim rewards. Newly accrued rewards are cached into `pendingRewards`.
    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        _updatePool();

        UserInfo storage user = userInfo[msg.sender];

        if (user.amount > 0) {
            uint256 accumulated = (user.amount * accRewardPerShare) / PRECISION;
            uint256 newlyAccrued = accumulated - user.rewardDebt;
            if (newlyAccrued > 0) {
                user.pendingRewards += newlyAccrued;
            }
        }

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        user.amount += amount;
        totalStaked += amount;
        user.rewardDebt = (user.amount * accRewardPerShare) / PRECISION;

        emit Staked(msg.sender, amount);
    }

    /// @notice Unstake `amount` of staking token from the pool.
    /// @dev TODO(v1): implement reward settlement, amount checks, token transfer, and rewardDebt update.
    function unstake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        _updatePool();

        UserInfo storage user = userInfo[msg.sender];

        if (user.amount < amount) {
            revert InsufficientStake();
        }

        uint256 accumulated = (user.amount * accRewardPerShare) / PRECISION;
        uint256 newlyAccrued = accumulated - user.rewardDebt;
        if (newlyAccrued > 0) {
            user.pendingRewards += newlyAccrued;
        }

        user.amount -= amount;
        totalStaked -= amount;

        stakingToken.safeTransfer(msg.sender, amount);

        user.rewardDebt = (user.amount * accRewardPerShare) / PRECISION;

        emit Unstaked(msg.sender, amount);
    }

    /// @notice Claim accumulated rewards for caller.
    /// @dev TODO(v1): implement pending reward calculation, reward transfer, and debt refresh.
    function claimReward() external nonReentrant {
        _updatePool();

        UserInfo storage user = userInfo[msg.sender];

        uint256 accumulated = (user.amount * accRewardPerShare) / PRECISION;
        uint256 newlyAccrued = accumulated - user.rewardDebt;
        if (newlyAccrued > 0) {
            user.pendingRewards += newlyAccrued;
        }

        uint256 claimable = user.pendingRewards;
        if (claimable == 0) revert ZeroAmount();

        _safeRewardTransfer(msg.sender, claimable);
        user.pendingRewards = 0;
        user.rewardDebt = (user.amount * accRewardPerShare) / PRECISION;

        emit RewardClaimed(msg.sender, claimable);
    }

    /// @notice View pending reward for `user` at current timestamp.
    function pendingReward(address user) external view returns (uint256) {
        UserInfo memory info = userInfo[user];
        uint256 currentAccRewardPerShare = accRewardPerShare;

        if (block.timestamp > lastRewardTimestamp && totalStaked != 0) {
            uint256 elapsed = block.timestamp - lastRewardTimestamp;
            uint256 reward = elapsed * rewardRate;
            currentAccRewardPerShare += (reward * PRECISION) / totalStaked;
        }

        uint256 accumulated = (info.amount * currentAccRewardPerShare) / PRECISION;
        uint256 newlyAccrued = accumulated - info.rewardDebt;

        return info.pendingRewards + newlyAccrued;
    }

    /// @notice Returns raw user accounting fields.
    function getUserInfo(address user)
        external
        view
        returns (uint256 amount, uint256 rewardDebt, uint256 pendingRewards)
    {
        UserInfo memory info = userInfo[user];
        return (info.amount, info.rewardDebt, info.pendingRewards);
    }

    /// @dev Updates global reward accounting up to current timestamp.
    function _updatePool() internal {
        if (block.timestamp <= lastRewardTimestamp) {
            return;
        }

        if (totalStaked == 0) {
            lastRewardTimestamp = block.timestamp;
            return;
        }

        uint256 elapsed = block.timestamp - lastRewardTimestamp;
        uint256 reward = elapsed * rewardRate;
        accRewardPerShare += (reward * PRECISION) / totalStaked;
        lastRewardTimestamp = block.timestamp;
    }

    /// @dev TODO(v1): safely transfer reward token to `to` with balance checks.
    function _safeRewardTransfer(address to, uint256 amount) internal {
        uint256 balance = rewardToken.balanceOf(address(this));
        uint256 transferAmount = amount > balance ? balance : amount;
        if (transferAmount > 0) {
            rewardToken.safeTransfer(to, transferAmount);
        }
    }
}
