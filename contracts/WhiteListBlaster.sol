// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ISP} from "@ethsign/sign-protocol-evm/src/interfaces/ISP.sol";
import {ISPHook} from "@ethsign/sign-protocol-evm/src/interfaces/ISPHook.sol";
import {Attestation} from "@ethsign/sign-protocol-evm/src/models/Attestation.sol";

// @dev This contract manages attestation data validation logic.
contract WhiteListBlasterManage is Ownable {
    address public blaster1;
    address public blaster2;

    constructor() Ownable(_msgSender()) {}

    function setBlaster1(address blaster) external onlyOwner {
        blaster1 = blaster;
    }

    function setBlaster2(address blaster) external onlyOwner {
        blaster2 = blaster;
    }

    function _checkGenuineBlaster(address signer) internal view {
        // solhint-disable-next-line custom-errors
        require(signer == blaster1 || signer == blaster2, "not a valid signing address");
    }
}

// @dev This contract implements the actual schema hook.
contract WhiteListBlaserHook is ISPHook, WhiteListBlasterManage {
    error UnsupportedOperation();

    function didReceiveAttestation(
        address, // attester
        uint64, // schemaId
        uint64 attestationId,
        bytes calldata // extraData
    ) external payable {
        Attestation memory attestation = ISP(_msgSender()).getAttestation(attestationId);
        _checkGenuineBlaster(abi.decode(attestation.data, (address)));
    }

    function didReceiveAttestation(
        address, // attester
        uint64, // schemaId
        uint64, // attestationId
        IERC20, // resolverFeeERC20Token
        uint256, // resolverFeeERC20Amount
        bytes calldata // extraData
    ) external pure {
        revert UnsupportedOperation();
    }

    function didReceiveRevocation(
        address, // attester
        uint64, // schemaId
        uint64, // attestationId
        bytes calldata // extraData
    ) external payable {
        revert UnsupportedOperation();
    }

    function didReceiveRevocation(
        address, // attester
        uint64, // schemaId
        uint64, // attestationId
        IERC20, // resolverFeeERC20Token
        uint256, // resolverFeeERC20Amount
        bytes calldata // extraData
    ) external pure {
        revert UnsupportedOperation();
    }
}