// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {MockERC20} from "src/MockERC20.sol";
import {TokenFaucet} from "src/TokenFaucet.sol";

/// @notice Deploy faucet for an existing staking token and fund it.
/// @dev Required env:
/// - STAKING_TOKEN
/// Optional env:
/// - PRIVATE_KEY
/// - FAUCET_DRIP_AMOUNT (default 1000e18)
/// - FAUCET_COOLDOWN (default 10 seconds)
/// - FAUCET_INITIAL_FUND (default 100000e18)
contract DeployFaucet is Script {
    function run() external {
        uint256 deployerKey = vm.envOr("PRIVATE_KEY", uint256(0));

        address stakingTokenAddr = vm.envAddress("STAKING_TOKEN");
        uint256 dripAmount = vm.envOr("FAUCET_DRIP_AMOUNT", uint256(1_000e18));
        uint256 cooldown = vm.envOr("FAUCET_COOLDOWN", uint256(10));
        uint256 initialFund = vm.envOr("FAUCET_INITIAL_FUND", uint256(100_000e18));

        if (deployerKey == 0) {
            vm.startBroadcast();
        } else {
            vm.startBroadcast(deployerKey);
        }

        TokenFaucet faucet = new TokenFaucet(stakingTokenAddr, dripAmount, cooldown);
        MockERC20(stakingTokenAddr).transfer(address(faucet), initialFund);

        vm.stopBroadcast();

        console2.log("stakingToken", stakingTokenAddr);
        console2.log("faucet", address(faucet));
        console2.log("dripAmount", dripAmount);
        console2.log("cooldown", cooldown);
        console2.log("faucetBalance", MockERC20(stakingTokenAddr).balanceOf(address(faucet)));
    }
}
