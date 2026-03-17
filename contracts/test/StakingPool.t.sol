// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {MockERC20} from "src/MockERC20.sol";
import {StakingPool} from "src/StakingPool.sol";

contract StakingPoolTest is Test {
    uint256 internal constant INITIAL_SUPPLY = 1_000_000e18;
    uint256 internal constant ALICE_STAKE_1 = 100e18;
    uint256 internal constant ALICE_STAKE_2 = 50e18;
    uint256 internal constant REWARD_RATE = 1e18; // 1 token / second

    address internal alice = makeAddr("alice");

    MockERC20 internal stakingToken;
    MockERC20 internal rewardToken;
    StakingPool internal pool;

    function setUp() external {
        stakingToken = new MockERC20("Stake Token", "STK", INITIAL_SUPPLY);
        rewardToken = new MockERC20("Reward Token", "RWD", INITIAL_SUPPLY);

        pool = new StakingPool(address(stakingToken), address(rewardToken), REWARD_RATE);

        stakingToken.transfer(alice, 1_000e18);

        vm.prank(alice);
        stakingToken.approve(address(pool), type(uint256).max);
    }

    function test_StakeSuccess_UpdatesUserAmountAndTotalStaked() external {
        vm.prank(alice);
        pool.stake(ALICE_STAKE_1);

        (uint256 amount,,) = pool.userInfo(alice);
        assertEq(amount, ALICE_STAKE_1);
        assertEq(pool.totalStaked(), ALICE_STAKE_1);
    }

    function test_StakeZero_Reverts() external {
        vm.prank(alice);
        vm.expectRevert(StakingPool.ZeroAmount.selector);
        pool.stake(0);
    }

    function test_PendingReward_IncreasesAfterTimeWarp() external {
        vm.prank(alice);
        pool.stake(ALICE_STAKE_1);

        vm.warp(block.timestamp + 10);

        uint256 pending = pool.pendingReward(alice);
        assertGt(pending, 0);
        assertEq(pending, 10e18);
    }

    function test_SecondStake_DoesNotLosePreviouslyAccruedRewards() external {
        vm.prank(alice);
        pool.stake(ALICE_STAKE_1);

        vm.warp(block.timestamp + 10);

        uint256 pendingBeforeSecondStake = pool.pendingReward(alice);
        assertEq(pendingBeforeSecondStake, 10e18);

        vm.prank(alice);
        pool.stake(ALICE_STAKE_2);

        (,, uint256 cachedPendingAfterSecondStake) = pool.userInfo(alice);
        assertEq(cachedPendingAfterSecondStake, pendingBeforeSecondStake);

        uint256 pendingAfterSecondStake = pool.pendingReward(alice);
        assertEq(pendingAfterSecondStake, pendingBeforeSecondStake);
    }
}
