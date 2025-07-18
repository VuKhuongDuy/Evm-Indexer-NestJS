# Order Generation Script

This script generates multiple orders for the P2P Market contract with random amounts and parameters.

## Setup

1. Install dependencies:
```bash
npm install ethers dotenv
```

2. Create a `.env` file with the following variables:
```env
# RPC URL for the blockchain network
RPC_URL=http://localhost:8545

# Private key of the wallet that will place orders (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Contract address of the P2PMarket contract
CONTRACT_ADDRESS=0x...

# Token addresses (ERC20 tokens)
TOKEN_TO_SELL=0x...  # Address of the token being sold
TOKEN_TO_PAY=0x...   # Address of the token used for payment

# Number of orders to generate (default: 10)
NUM_ORDERS=10
```

## Usage

Run the script:
```bash
npx ts-node generateData.ts
```

## Features

- Generates random order amounts (1-1000 tokens)
- Generates random prices (0.1-10 tokens per unit)
- Calculates appropriate minimum order sizes
- Waits for transaction confirmations
- Saves order details to `generated-orders.json`
- Provides detailed logging and progress tracking
- Handles errors gracefully and continues with remaining orders

## Output

The script will:
1. Display progress for each order being placed
2. Show transaction hashes and block numbers
3. Provide a summary of successful vs failed orders
4. Save all order details to `generated-orders.json`

## Requirements

- The wallet must have sufficient ETH for gas fees
- The wallet must have sufficient tokens to sell (TOKEN_TO_SELL)
- The contract must be deployed and accessible
- The wallet must have approved the contract to spend tokens

## Error Handling

The script will:
- Continue processing remaining orders if one fails
- Display detailed error messages
- Show a final summary of success/failure rates 