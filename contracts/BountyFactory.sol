// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BountyDuel.sol";  // We'll write this next

contract BountyFactory {
    address public admin;
    BountyDuel[] public bounties;  // Array to keep track of all bounty duels

    event NewBounty(address bountyAddress, address indexed challenger, address indexed target, uint256 bountyAmount);

    constructor() {
        admin = msg.sender;  // The admin is the contract deployer
    }

    // Function to create a new bounty contract
    function createBounty(address _target) external payable {
        require(msg.value > 0, "Bounty must have a value");

        // Create new BountyDuel contract
        BountyDuel newBounty = new BountyDuel(msg.sender, _target, msg.value, admin);
        
        // Add the bounty to the array
        bounties.push(newBounty);

        // Emit an event with the address of the new bounty contract
        emit NewBounty(address(newBounty), msg.sender, _target, msg.value);
    }

    // Helper function to get all bounties
    function getAllBounties() external view returns (BountyDuel[] memory) {
        return bounties;
    }
}
