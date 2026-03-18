// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {MockERC20} from "src/MockERC20.sol";
import {StakingPool} from "src/StakingPool.sol";

contract StakingPoolTest is Test {
    uint256 internal constant INITIAL_SUPPLY = 1_000_000e18;
    uint256 internal constant ALICE_STAKE_1 = 100e18;
    uint256 internal constant ALICE_STAKE_2 = 50e18;
    uint256 internal constant ALICE_UNSTAKE = 40e18;
    uint256 internal constant BOB_STAKE = 100e18;
    uint256 internal constant REWARD_RATE = 1e18; // 1 token / second

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    MockERC20 internal stakingToken;
    MockERC20 internal rewardToken;
    StakingPool internal pool;

    function setUp() external {
        stakingToken = new MockERC20("Stake Token", "STK", INITIAL_SUPPLY);
        rewardToken = new MockERC20("Reward Token", "RWD", INITIAL_SUPPLY);

        pool = new StakingPool(address(stakingToken), address(rewardToken), REWARD_RATE);

        stakingToken.transfer(alice, 1_000e18);
        stakingToken.transfer(bob, 1_000e18);

        rewardToken.transfer(address(pool), 100_000e18);

        vm.prank(alice);
        stakingToken.approve(address(pool), type(uint256).max);

        vm.prank(bob);
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

    function test_UnstakeSuccess_ReturnsPrincipal() external {
        vm.prank(alice);
        pool.stake(ALICE_STAKE_1);

        uint256 balanceBefore = stakingToken.balanceOf(alice);

        vm.prank(alice);
        pool.unstake(ALICE_STAKE_2);

        uint256 balanceAfter = stakingToken.balanceOf(alice);
        assertEq(balanceAfter - balanceBefore, ALICE_STAKE_2);

        (uint256 amount,,) = pool.userInfo(alice);
        assertEq(amount, ALICE_STAKE_1 - ALICE_STAKE_2);
        assertEq(pool.totalStaked(), ALICE_STAKE_1 - ALICE_STAKE_2);
    }

    function test_UnstakeZero_Reverts() external {
        vm.prank(alice);
        pool.stake(ALICE_STAKE_1);

        vm.prank(alice);
        vm.expectRevert(StakingPool.ZeroAmount.selector);
        pool.unstake(0);
    }

    function test_UnstakeExceeds_Reverts() external {
        vm.prank(alice);
        pool.stake(ALICE_STAKE_1);

        vm.prank(alice);
        vm.expectRevert(StakingPool.InsufficientStake.selector);
        pool.unstake(ALICE_STAKE_1 + 1);
    }

    function test_Unstake_DoesNotLoseAccumulatedPendingRewards() external {
        vm.prank(alice);
        pool.stake(ALICE_STAKE_1);

        vm.warp(block.timestamp + 10);
        uint256 pendingBeforeUnstake = pool.pendingReward(alice);
        assertEq(pendingBeforeUnstake, 10e18);

        vm.prank(alice);
        pool.unstake(ALICE_UNSTAKE);

        (uint256 amount,, uint256 cachedPending) = pool.userInfo(alice);
        assertEq(amount, ALICE_STAKE_1 - ALICE_UNSTAKE);
        assertEq(cachedPending, pendingBeforeUnstake);
    }

    function test_ClaimReward_Succeeds() external {
        vm.prank(alice);
        pool.stake(ALICE_STAKE_1);

        vm.warp(block.timestamp + 10);

        uint256 rewardBefore = rewardToken.balanceOf(alice);

        vm.prank(alice);
        pool.claimReward();

        uint256 rewardAfter = rewardToken.balanceOf(alice);
        assertEq(rewardAfter - rewardBefore, 10e18);
    }

    function test_ClaimReward_ClearsPendingRewards() external {
        vm.prank(alice);
        pool.stake(ALICE_STAKE_1);

        vm.warp(block.timestamp + 10);

        vm.prank(alice);
        pool.claimReward();

        (,, uint256 pendingRewards) = pool.userInfo(alice);
        assertEq(pendingRewards, 0);

        uint256 pending = pool.pendingReward(alice);
        assertEq(pending, 0);
    }

    function test_ClaimReward_ZeroReverts() external {
        vm.prank(alice);
        pool.stake(ALICE_STAKE_1);

        vm.prank(alice);
        vm.expectRevert(StakingPool.ZeroAmount.selector);
        pool.claimReward();
    }

    function test_ClaimReward_DoesNotChangeUserStakedAmount() external {
        vm.prank(alice);
        pool.stake(ALICE_STAKE_1);

        vm.warp(block.timestamp + 10);

        vm.prank(alice);
        pool.claimReward();

        (uint256 amount,,) = pool.userInfo(alice);
        assertEq(amount, ALICE_STAKE_1);
        assertEq(pool.totalStaked(), ALICE_STAKE_1);
    }

    function test_Flow_StakeUnstakeClaim_NoRewardLossOrDoubleCount() external {
        vm.prank(alice);
        pool.stake(ALICE_STAKE_1);

        vm.warp(block.timestamp + 10);

        vm.prank(alice);
        pool.unstake(ALICE_UNSTAKE);

        vm.warp(block.timestamp + 10);

        uint256 rewardBefore = rewardToken.balanceOf(alice);
        uint256 pendingBeforeClaim = pool.pendingReward(alice);

        // First 10s with 100 staked => 10 reward.
        // Next 10s with 60 staked out of total 60 (single user) => 10 reward.
        assertApproxEqAbs(pendingBeforeClaim, 20e18, 1e8);

        vm.prank(alice);
        pool.claimReward();

        uint256 rewardAfter = rewardToken.balanceOf(alice);
        assertEq(rewardAfter - rewardBefore, pendingBeforeClaim);

        uint256 pendingAfterClaim = pool.pendingReward(alice);
        assertEq(pendingAfterClaim, 0);
    }

    function test_Unstake_DoesNotAccrueForWithdrawnAmount() external {
        vm.prank(alice);
        pool.stake(ALICE_STAKE_1);

        vm.prank(bob);
        pool.stake(BOB_STAKE);

        vm.warp(block.timestamp + 10);

        vm.prank(alice);
        pool.unstake(ALICE_STAKE_2);

        vm.warp(block.timestamp + 10);

        uint256 expectedFirst = (10e18 * ALICE_STAKE_1) / (ALICE_STAKE_1 + BOB_STAKE);
        uint256 expectedSecond = (10e18 * (ALICE_STAKE_1 - ALICE_STAKE_2)) /
            ((ALICE_STAKE_1 - ALICE_STAKE_2) + BOB_STAKE);

        uint256 expectedTotal = expectedFirst + expectedSecond;
        uint256 pending = pool.pendingReward(alice);

        assertApproxEqAbs(pending, expectedTotal, 1e8);
    }

    function test_PartialUnstake_StillAccruesRewards() external {
        vm.prank(alice);
        pool.stake(ALICE_STAKE_1);

        vm.prank(bob);
        pool.stake(BOB_STAKE);

        vm.warp(block.timestamp + 10);

        vm.prank(alice);
        pool.unstake(ALICE_STAKE_2);

        uint256 pendingAfterUnstake = pool.pendingReward(alice);

        vm.warp(block.timestamp + 10);

        uint256 pendingAfterMoreTime = pool.pendingReward(alice);
        assertGt(pendingAfterMoreTime, pendingAfterUnstake);
    }
}
