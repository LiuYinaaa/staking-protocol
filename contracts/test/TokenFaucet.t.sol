// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {MockERC20} from "src/MockERC20.sol";
import {TokenFaucet} from "src/TokenFaucet.sol";

contract TokenFaucetTest is Test {
    uint256 internal constant INITIAL_SUPPLY = 1_000_000e18;
    uint256 internal constant DRIP_AMOUNT = 1_000e18;
    uint256 internal constant COOLDOWN = 10;

    address internal alice = makeAddr("alice");

    MockERC20 internal token;
    TokenFaucet internal faucet;

    function setUp() external {
        token = new MockERC20("Stake Token", "STK", INITIAL_SUPPLY);
        faucet = new TokenFaucet(address(token), DRIP_AMOUNT, COOLDOWN);
        token.transfer(address(faucet), 100_000e18);
    }

    function test_Claim_Succeeds() external {
        uint256 beforeBalance = token.balanceOf(alice);

        vm.prank(alice);
        faucet.claim();

        uint256 afterBalance = token.balanceOf(alice);
        assertEq(afterBalance - beforeBalance, DRIP_AMOUNT);
    }

    function test_Claim_CooldownReverts() external {
        vm.prank(alice);
        faucet.claim();

        vm.prank(alice);
        vm.expectRevert();
        faucet.claim();
    }

    function test_Claim_AfterCooldown_SucceedsAgain() external {
        vm.prank(alice);
        faucet.claim();

        vm.warp(block.timestamp + COOLDOWN + 1);

        vm.prank(alice);
        faucet.claim();

        assertEq(token.balanceOf(alice), DRIP_AMOUNT * 2);
    }
}
