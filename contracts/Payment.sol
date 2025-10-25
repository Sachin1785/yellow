// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Payment {
    event PaymentSent(address indexed sender, address indexed receiver, uint256 amount);

    // Function to send Ether
    function sendPayment(address payable receiver) external payable {
        require(msg.value > 0, "Amount must be greater than zero");
        require(receiver != address(0), "Invalid receiver address");

    (bool sent, ) = receiver.call{value: msg.value}("");
    require(sent, "Failed to send MON");
    emit PaymentSent(msg.sender, receiver, msg.value);
    }
}
