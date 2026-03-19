// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {MockERC20} from "src/MockERC20.sol";
import {StakingPool} from "src/StakingPool.sol";

/// @notice Unstake script for multiple users.
/// @dev Expected env vars:
/// - PRIVATE_KEY (optional, used as default noise sender)
/// - STAKING_POOL
/// - STAKING_TOKEN
/// - REWARD_TOKEN
/// - USER_PRIVATE_KEYS (comma-separated uint256 private keys)
/// - USER_UNSTAKE_AMOUNTS (comma-separated uint256; set 0 to unstake full amount)
/// Optional:
/// - NOISE_TX_COUNT (default: 3)
/// - NOISE_SENDER_PRIVATE_KEY (fallback to PRIVATE_KEY)
contract MultiUnstake is Script {
    error LengthMismatch();
    error MissingAddressConfig();

    function run() external {
        uint256 deployerKey = vm.envOr("PRIVATE_KEY", uint256(0));
        uint256 noiseSenderKey = vm.envOr("NOISE_SENDER_PRIVATE_KEY", deployerKey);
        uint256 noiseTxCount = vm.envOr("NOISE_TX_COUNT", uint256(3));

        address poolAddr = vm.envOr("STAKING_POOL", address(0));
        address stakingTokenAddr = vm.envOr("STAKING_TOKEN", address(0));
        address rewardTokenAddr = vm.envOr("REWARD_TOKEN", address(0));
        if (poolAddr == address(0) || stakingTokenAddr == address(0) || rewardTokenAddr == address(0)) {
            revert MissingAddressConfig();
        }

        uint256[] memory userKeys = vm.envUint("USER_PRIVATE_KEYS", ",");
        uint256[] memory unstakeAmounts = vm.envUint("USER_UNSTAKE_AMOUNTS", ",");
        if (userKeys.length == 0 || userKeys.length != unstakeAmounts.length) {
            revert LengthMismatch();
        }

        StakingPool pool = StakingPool(poolAddr);
        MockERC20 stakingToken = MockERC20(stakingTokenAddr);
        MockERC20 rewardToken = MockERC20(rewardTokenAddr);

        // Produce extra blocks with unrelated transactions to move chain time/state forward.
        if (noiseTxCount > 0) {
            address noiseReceiver = noiseSenderKey == 0 ? address(0xBEEF) : vm.addr(noiseSenderKey);
            for (uint256 i = 0; i < noiseTxCount; i++) {
                if (noiseSenderKey == 0) {
                    vm.startBroadcast();
                } else {
                    vm.startBroadcast(noiseSenderKey);
                }
                stakingToken.transfer(noiseReceiver, 0);
                vm.stopBroadcast();
            }
            console2.log("[unstake] noiseTxCount", noiseTxCount);
        }

        for (uint256 i = 0; i < userKeys.length; i++) {
            uint256 userKey = userKeys[i];
            address user = vm.addr(userKey);

            uint256 pending = pool.pendingReward(user);
            uint256 rewardBefore = rewardToken.balanceOf(user);
            (uint256 stakedBefore,, uint256 cachedBefore) = pool.getUserInfo(user);

            if (userKey == 0) {
                vm.startBroadcast();
            } else {
                vm.startBroadcast(userKey);
            }

            if (pending > 0) {
                pool.claimReward();
            }

            uint256 unstakeAmount = unstakeAmounts[i] == 0 ? stakedBefore : unstakeAmounts[i];
            if (unstakeAmount > 0) {
                pool.unstake(unstakeAmount);
            }

            vm.stopBroadcast();

            uint256 rewardAfter = rewardToken.balanceOf(user);
            (uint256 stakedAfter,, uint256 cachedAfter) = pool.getUserInfo(user);

            console2.log("[unstake] user", user);
            console2.log("[unstake] pendingBefore", pending);
            console2.log("[unstake] stakedBefore", stakedBefore);
            console2.log("[unstake] cachedBefore", cachedBefore);
            console2.log("[unstake] rewardDelta", rewardAfter - rewardBefore);
            console2.log("[unstake] stakedAfter", stakedAfter);
            console2.log("[unstake] cachedAfter", cachedAfter);
        }

        console2.log("[unstake] pool", poolAddr);
        console2.log("[unstake] totalStaked", pool.totalStaked());
    }
}
