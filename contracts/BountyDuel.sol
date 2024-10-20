// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BountyDuel {
    address public challenger;  // User who placed the bounty
    address public target;      // User being challenged
    uint256 public bountyAmount; // Bounty value in wei
    address public admin;        // Admin who can finalize the duel
    bool public accepted;        // Whether the challenge has been accepted
    bool public completed;       // Whether the duel is completed
    address public winner;       // Winner of the duel

    event DuelStarted(address indexed challenger, address indexed target);
    event ShotFired(address shooter, address target);
    event Reload(address user);
    event DuelEnded(address winner);
    event Payout(address indexed winner, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyParticipants() {
        require(msg.sender == challenger || msg.sender == target, "Only participants can call this function");
        _;
    }

    constructor(address _challenger, address _target, uint256 _bountyAmount, address _admin) {
        challenger = _challenger;
        target = _target;
        bountyAmount = _bountyAmount;
        admin = _admin;
        accepted = false;
        completed = false;
    }

    // Accept the challenge and start the duel
    function acceptChallenge() external {
        require(msg.sender == target, "Only the target can accept the challenge");
        require(!accepted, "Challenge already accepted");

        accepted = true;
        emit DuelStarted(challenger, target);
    }

    // Log shot fired event
    function logShotFired(address _shooter, address _target) external onlyParticipants {
        emit ShotFired(_shooter, _target);
    }

    // Log reload event
    function logReload(address _user) external onlyParticipants {
        emit Reload(_user);
    }

    // End the duel and declare the winner
    function endDuel(address _winner) external onlyAdmin {
        require(accepted, "Duel not started");
        require(!completed, "Duel already completed");

        completed = true;
        winner = _winner;

        // Transfer bounty minus admin fee (10%) to the winner
        uint256 payout = (bountyAmount * 90) / 100;
        uint256 adminFee = bountyAmount - payout;
        payable(winner).transfer(payout);
        payable(admin).transfer(adminFee);

        emit DuelEnded(_winner);
        emit Payout(_winner, payout);
    }
}