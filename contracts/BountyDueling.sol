// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract BountyFactory {
    BountyDuel[] public bounties;

    event NewBounty(
        address bountyAddress,
        address indexed placer,
        address indexed target,
        uint256 bountyAmount
    );

    function createBounty(address _target) external payable {
        require(msg.value > 0, "Bounty must have a value");

        BountyDuel newBounty = (new BountyDuel){value: msg.value}(
            msg.sender,
            _target,
            msg.value
        );

        bounties.push(newBounty);

        emit NewBounty(address(newBounty), msg.sender, _target, msg.value);
    }

    function getAllBounties() external view returns (BountyDuel[] memory) {
        return bounties;
    }
}

contract BountyDuel {
    address public placer; // User who placed the bounty
    address public target; // User with a bounty on them
    uint256 public bountyAmount; // Bounty value in wei
    bool public active; // Whether the bounty is available for new challengers
    address public challenger; // The current challenger
    bool public completed; // Whether the current duel is completed
    address public winner; // Winner of the current duel

    event DuelStarted(address indexed challenger, address indexed target);
    event ShotFired(address shooter, address target);
    event Reload(address user);
    event DuelEnded(address winner);
    event Payout(address indexed winner, uint256 amount);

    modifier onlyParticipants() {
        //require(
        //    msg.sender == challenger || msg.sender == target,
        //    "Only participants can call this function"
       // );
        _;
    }

    modifier onlyTarget() {
        //require(msg.sender == target, "Only the target can call this function");
        _;
    }

    modifier bountyActive() {
        //require(active, "Bounty is not active");
        _;
    }

    constructor(
        address _placer,
        address _target,
        uint256 _bountyAmount
    ) payable {
        require(msg.value == _bountyAmount, "Bounty amount mismatch");
        placer = _placer;
        target = _target;
        bountyAmount = msg.value;
        active = true;
        completed = false;
    }

    function startDuel(address _challenger) external bountyActive onlyTarget {
        require(challenger == address(0), "A duel is already in progress");

        challenger = _challenger;
        emit DuelStarted(challenger, target);
    }

    function logShotFired(address _shooter, address _target)
        external
        onlyParticipants
    {
        emit ShotFired(_shooter, _target);
    }

    function logReload(address _user) external onlyParticipants {
        emit Reload(_user);
    }

    function endDuel(address _winner) external onlyParticipants {
        require(!completed, "Duel already completed");

        completed = true;
        winner = _winner;

        if (winner == challenger) {
            payable(challenger).transfer(bountyAmount);
            active = false;
            emit Payout(challenger, bountyAmount);
        } else if (winner == target) {
            // target wins, they get 10% of the bounty
            uint256 payout = (bountyAmount * 10) / 100;
            payable(target).transfer(payout);
            bountyAmount -= payout;
            challenger = address(0);
            completed = false;
            emit Payout(target, payout);
        }

        emit DuelEnded(winner);
    }
}