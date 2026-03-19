// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {MockERC20} from "src/MockERC20.sol";
import {StakingPool} from "src/StakingPool.sol";

/// @notice Stake script for multiple users and multiple rounds.
/// @dev Expected env vars:
/// - PRIVATE_KEY (deployer/funder)
/// - STAKING_POOL
/// - STAKING_TOKEN
/// - USER_PRIVATE_KEYS (comma-separated uint256 private keys)
/// - USER_STAKE_AMOUNTS (comma-separated uint256, 18 decimals)
/// Optional:
/// - STAKE_ROUNDS (default: 1)
contract MultiStake is Script {
    error LengthMismatch();
    error MissingAddressConfig();

    function _startBroadcast(uint256 key) internal {
        if (key == 0) {
            vm.startBroadcast();
        } else {
            vm.startBroadcast(key);
        }
    }

    function _stakeForUser(
        StakingPool pool,
        MockERC20 stakingToken,
        uint256 deployerKey,
        uint256 userKey,
        uint256 amountPerRound,
        uint256 rounds
    ) internal {
        address user = vm.addr(userKey);
        uint256 totalRequired = amountPerRound * rounds;
        uint256 userBalance = stakingToken.balanceOf(user);

        if (userBalance < totalRequired) {
            uint256 shortfall = totalRequired - userBalance;
            _startBroadcast(deployerKey);
            stakingToken.transfer(user, shortfall);
            vm.stopBroadcast();
        }

        _startBroadcast(userKey);
        stakingToken.approve(address(pool), type(uint256).max);
        vm.stopBroadcast();

        for (uint256 r = 0; r < rounds; r++) {
            _startBroadcast(userKey);
            pool.stake(amountPerRound);
            vm.stopBroadcast();
        }

        (uint256 stakedAmount,, uint256 cachedPending) = pool.getUserInfo(user);
        console2.log("[stake] user", user);
        console2.log("[stake] stakedAmount", stakedAmount);
        console2.log("[stake] cachedPending", cachedPending);
    }

    function run() external {
        uint256 deployerKey = vm.envOr("PRIVATE_KEY", uint256(0));

        address poolAddr = vm.envOr("STAKING_POOL", address(0));
        address stakingTokenAddr = vm.envOr("STAKING_TOKEN", address(0));
        if (poolAddr == address(0) || stakingTokenAddr == address(0)) {
            revert MissingAddressConfig();
        }

        uint256[] memory userKeys = vm.envUint("USER_PRIVATE_KEYS", ",");
        uint256[] memory stakeAmounts = vm.envUint("USER_STAKE_AMOUNTS", ",");
        uint256 rounds = vm.envOr("STAKE_ROUNDS", uint256(1));

        if (userKeys.length == 0 || userKeys.length != stakeAmounts.length) {
            revert LengthMismatch();
        }

        MockERC20 stakingToken = MockERC20(stakingTokenAddr);
        StakingPool pool = StakingPool(poolAddr);

        for (uint256 i = 0; i < userKeys.length; i++) {
            _stakeForUser(
                pool,
                stakingToken,
                deployerKey,
                userKeys[i],
                stakeAmounts[i],
                rounds
            );
        }

        console2.log("[stake] pool", poolAddr);
        console2.log("[stake] totalStaked", pool.totalStaked());
    }
}
