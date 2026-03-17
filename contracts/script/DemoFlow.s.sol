// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {MockERC20} from "src/MockERC20.sol";
import {StakingPool} from "src/StakingPool.sol";

/// @notice Demo flow for local verification of stake -> claim -> unstake.
contract DemoFlow is Script {
    uint256 internal constant INITIAL_SUPPLY = 1_000_000e18;
    uint256 internal constant REWARD_RATE = 1e18; // 1 token per second
    uint256 internal constant REWARD_DEPOSIT = 100_000e18;
    uint256 internal constant USER_FUND = 1_000e18;
    uint256 internal constant STAKE_AMOUNT = 100e18;
    uint256 internal constant DEFAULT_WARP_SECONDS = 10;

    function run() external {
        uint256 deployerKey = vm.envOr("PRIVATE_KEY", uint256(0));
        uint256 userKey = vm.envOr("USER_PRIVATE_KEY", deployerKey);
        uint256 warpSeconds = vm.envOr("WARP_SECONDS", DEFAULT_WARP_SECONDS);

        address stakingTokenAddr = vm.envOr("STAKING_TOKEN", address(0));
        address rewardTokenAddr = vm.envOr("REWARD_TOKEN", address(0));
        address poolAddr = vm.envOr("STAKING_POOL", address(0));

        MockERC20 stakingToken;
        MockERC20 rewardToken;
        StakingPool pool;

        if (poolAddr == address(0)) {
            if (deployerKey == 0) {
                vm.startBroadcast();
            } else {
                vm.startBroadcast(deployerKey);
            }

            stakingToken = new MockERC20("Stake Token", "STK", INITIAL_SUPPLY);
            rewardToken = new MockERC20("Reward Token", "RWD", INITIAL_SUPPLY);
            pool = new StakingPool(address(stakingToken), address(rewardToken), REWARD_RATE);
            rewardToken.transfer(address(pool), REWARD_DEPOSIT);

            vm.stopBroadcast();
        } else {
            stakingToken = MockERC20(stakingTokenAddr);
            rewardToken = MockERC20(rewardTokenAddr);
            pool = StakingPool(poolAddr);
        }

        address user = userKey == 0 ? vm.addr(0xA11CE) : vm.addr(userKey);

        if (deployerKey == 0) {
            vm.startBroadcast();
        } else {
            vm.startBroadcast(deployerKey);
        }
        stakingToken.transfer(user, USER_FUND);
        vm.stopBroadcast();

        if (userKey == 0) {
            vm.startBroadcast();
        } else {
            vm.startBroadcast(userKey);
        }

        uint256 balanceBefore = stakingToken.balanceOf(user);
        stakingToken.approve(address(pool), type(uint256).max);
        pool.stake(STAKE_AMOUNT);

        if (warpSeconds > 0) {
            vm.rpc(
                "evm_increaseTime",
                string.concat("[", vm.toString(warpSeconds), "]")
            );
            vm.rpc("evm_mine", "[]");
        }

        uint256 pendingBeforeClaim = pool.pendingReward(user);
        uint256 rewardBefore = rewardToken.balanceOf(user);

        pool.claimReward();

        uint256 rewardAfter = rewardToken.balanceOf(user);
        pool.unstake(STAKE_AMOUNT);
        uint256 balanceAfter = stakingToken.balanceOf(user);

        vm.stopBroadcast();

        (uint256 stakedAmount,, uint256 cachedPending) = pool.getUserInfo(user);

        console2.log("user", user);
        console2.log("stakingPool", address(pool));
        console2.log("userStakeBefore", STAKE_AMOUNT);
        console2.log("userStakedAmount", stakedAmount);
        console2.log("pendingBeforeClaim", pendingBeforeClaim);
        console2.log("cachedPendingAfter", cachedPending);
        console2.log("userRewardBefore", rewardBefore);
        console2.log("userRewardAfter", rewardAfter);
        console2.log("userStakeBalanceBefore", balanceBefore);
        console2.log("userStakeBalanceAfter", balanceAfter);
        console2.log("poolTotalStaked", pool.totalStaked());
    }
}
