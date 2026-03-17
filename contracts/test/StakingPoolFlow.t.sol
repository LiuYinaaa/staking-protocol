// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {MockERC20} from "src/MockERC20.sol";
import {StakingPool} from "src/StakingPool.sol";

contract StakingPoolFlowTest is Test {
    uint256 internal constant INITIAL_SUPPLY = 1_000_000e18;
    uint256 internal constant REWARD_RATE = 1e18;
    uint256 internal constant REWARD_DEPOSIT = 100_000e18;
    uint256 internal constant USER_FUND = 1_000e18;
    uint256 internal constant STAKE_AMOUNT = 100e18;

    address internal user = makeAddr("user");

    MockERC20 internal stakingToken;
    MockERC20 internal rewardToken;
    StakingPool internal pool;

    function setUp() external {
        stakingToken = new MockERC20("Stake Token", "STK", INITIAL_SUPPLY);
        rewardToken = new MockERC20("Reward Token", "RWD", INITIAL_SUPPLY);
        pool = new StakingPool(address(stakingToken), address(rewardToken), REWARD_RATE);

        rewardToken.transfer(address(pool), REWARD_DEPOSIT);
        stakingToken.transfer(user, USER_FUND);

        vm.prank(user);
        stakingToken.approve(address(pool), type(uint256).max);
    }

    function test_DeployStakeClaimUnstakeFlow() external {
        uint256 stakeBalanceBefore = stakingToken.balanceOf(user);

        vm.prank(user);
        pool.stake(STAKE_AMOUNT);

        vm.warp(block.timestamp + 10);

        uint256 pendingBefore = pool.pendingReward(user);
        assertEq(pendingBefore, 10e18);

        uint256 rewardBalanceBefore = rewardToken.balanceOf(user);

        vm.prank(user);
        pool.claimReward();

        uint256 rewardBalanceAfter = rewardToken.balanceOf(user);
        assertEq(rewardBalanceAfter - rewardBalanceBefore, 10e18);

        vm.prank(user);
        pool.unstake(STAKE_AMOUNT);

        uint256 stakeBalanceAfter = stakingToken.balanceOf(user);
        assertEq(stakeBalanceAfter - stakeBalanceBefore, 0);

        assertEq(pool.totalStaked(), 0);
    }
}
