// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {MockERC20} from "src/MockERC20.sol";
import {StakingPool} from "src/StakingPool.sol";

/// @notice Deployment script for local/dev usage.
contract Deploy is Script {
    uint256 internal constant INITIAL_SUPPLY = 1_000_000e18;
    uint256 internal constant REWARD_RATE = 1e18; // 1 token per second
    uint256 internal constant REWARD_DEPOSIT = 100_000e18;

    function run() external {
        uint256 deployerKey = vm.envOr("PRIVATE_KEY", uint256(0));
        if (deployerKey == 0) {
            vm.startBroadcast();
        } else {
            vm.startBroadcast(deployerKey);
        }

        MockERC20 stakingToken = new MockERC20("Stake Token", "STK", INITIAL_SUPPLY);
        MockERC20 rewardToken = new MockERC20("Reward Token", "RWD", INITIAL_SUPPLY);

        StakingPool pool = new StakingPool(address(stakingToken), address(rewardToken), REWARD_RATE);

        rewardToken.transfer(address(pool), REWARD_DEPOSIT);

        vm.stopBroadcast();

        console2.log("stakingToken", address(stakingToken));
        console2.log("rewardToken", address(rewardToken));
        console2.log("stakingPool", address(pool));
        console2.log("rewardRate", REWARD_RATE);
        console2.log("rewardBalanceInPool", rewardToken.balanceOf(address(pool)));
    }
}
