// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title TokenFaucet
/// @notice Minimal faucet for local demo users to claim staking token.
contract TokenFaucet is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error ZeroAddress();
    error ZeroAmount();
    error ClaimTooSoon(uint256 nextClaimTimestamp);
    error InsufficientFaucetBalance();

    IERC20 public immutable token;
    uint256 public immutable dripAmount;
    uint256 public immutable claimCooldown;

    mapping(address => uint256) public lastClaimTimestamp;

    event Claimed(address indexed user, uint256 amount);

    constructor(address token_, uint256 dripAmount_, uint256 claimCooldown_) {
        if (token_ == address(0)) revert ZeroAddress();
        if (dripAmount_ == 0) revert ZeroAmount();

        token = IERC20(token_);
        dripAmount = dripAmount_;
        claimCooldown = claimCooldown_;
    }

    function claim() external nonReentrant {
        uint256 last = lastClaimTimestamp[msg.sender];
        uint256 current = block.timestamp;

        if (last != 0 && claimCooldown > 0 && current < last + claimCooldown) {
            revert ClaimTooSoon(last + claimCooldown);
        }

        if (token.balanceOf(address(this)) < dripAmount) {
            revert InsufficientFaucetBalance();
        }

        lastClaimTimestamp[msg.sender] = current;
        token.safeTransfer(msg.sender, dripAmount);

        emit Claimed(msg.sender, dripAmount);
    }

    function nextClaimTimestamp(address user) external view returns (uint256) {
        uint256 last = lastClaimTimestamp[user];
        if (last == 0) return 0;
        return last + claimCooldown;
    }
}
