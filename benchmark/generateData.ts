import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import CONTRACT_ABI from '../src/config/market-abi-json.json';
import ERC20_ABI from '../src/config/erc20-abi.json';

// Load environment variables
dotenv.config();

// Environment variables
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const TOKEN_TO_SELL = process.env.TOKEN_TO_SELL;
const TOKEN_TO_PAY = process.env.TOKEN_TO_PAY;
const NUM_ORDERS = parseInt(process.env.NUM_ORDERS || '10');

// Validate required environment variables
if (!PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY environment variable is required');
}
if (!CONTRACT_ADDRESS) {
  throw new Error('CONTRACT_ADDRESS environment variable is required');
}
if (!TOKEN_TO_SELL) {
  throw new Error('TOKEN_TO_SELL environment variable is required');
}
if (!TOKEN_TO_PAY) {
  throw new Error('TOKEN_TO_PAY environment variable is required');
}

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
const tokenToPayContract = new ethers.Contract(TOKEN_TO_PAY, ERC20_ABI, wallet);
const tokenToSellContract = new ethers.Contract(
  TOKEN_TO_SELL,
  ERC20_ABI,
  wallet,
);

// Helper function to generate random amount within a range
function getRandomAmount(
  min: number,
  max: number,
  decimals: number = 18,
): bigint {
  const random = Math.random() * (max - min) + min;
  return ethers.parseUnits(random.toFixed(decimals), decimals);
}

// Helper function to generate random price
function getRandomPrice(
  min: number,
  max: number,
  decimals: number = 18,
): bigint {
  const random = Math.random() * (max - min) + min;
  return BigInt(Math.floor(random * 10 ** decimals));
}

// Helper function to generate random minimum order size
function getRandomMinOrderSize(maxAmount: bigint): bigint {
  const maxAmountNumber = Number(ethers.formatEther(maxAmount));
  const minOrderSize =
    Math.random() * (maxAmountNumber * 0.1) + maxAmountNumber * 0.01;
  return ethers.parseUnits(minOrderSize.toFixed(18), 18);
}

// Helper function to sleep
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main function to generate orders
async function generateOrders() {
  console.log('🚀 Starting order generation...');
  console.log(`📊 Generating ${NUM_ORDERS} orders`);
  console.log(`💰 Token to sell: ${TOKEN_TO_SELL}`);
  console.log(`💳 Token to pay: ${TOKEN_TO_PAY}`);
  console.log(`👤 Wallet address: ${wallet.address}`);
  console.log(`📋 Contract address: ${CONTRACT_ADDRESS}`);
  console.log('');

  const orders = [];
  let successCount = 0;
  let failureCount = 0;
  const decimalsTokenPay = await tokenToPayContract.decimals();

  const allowanceToPay = await tokenToPayContract.allowance(
    wallet.address,
    CONTRACT_ADDRESS,
  );
  if (allowanceToPay < ethers.parseUnits('1000', decimalsTokenPay)) {
    await tokenToPayContract.approve(CONTRACT_ADDRESS, ethers.MaxUint256);
  }
  const allowanceToSell = await tokenToSellContract.allowance(
    wallet.address,
    CONTRACT_ADDRESS,
  );
  if (allowanceToSell < ethers.parseUnits('1000', 18)) {
    await tokenToSellContract.approve(CONTRACT_ADDRESS, ethers.MaxUint256);
  }

  for (let i = 0; i < NUM_ORDERS; i++) {
    try {
      console.log(`📝 Generating order ${i + 1}/${NUM_ORDERS}...`);

      // Generate random parameters
      const amountToSell = getRandomAmount(1, 1000); // 1-1000 tokens
      const pricePerToken = getRandomPrice(0.1, 10, Number(decimalsTokenPay)); // 0.1-10 tokens per unit
      const minOrderSize = getRandomMinOrderSize(amountToSell);

      console.log(
        `   Amount to sell: ${ethers.formatEther(amountToSell)} tokens`,
      );
      console.log(
        `   Price per token: ${BigInt(pricePerToken) / decimalsTokenPay} tokens`,
      );
      console.log(
        `   Min order size: ${ethers.formatEther(minOrderSize)} tokens`,
      );

      // Place the order
      const tx = await contract.placeOrder(
        TOKEN_TO_SELL,
        TOKEN_TO_PAY,
        amountToSell,
        pricePerToken,
        minOrderSize,
      );

      console.log(`   Transaction hash: ${tx.hash}`);

      // // Wait for transaction confirmation
      // const receipt = await tx.wait();
      // console.log(
      //   `   ✅ Order placed successfully! Block: ${receipt.blockNumber}`,
      // );

      // // Get the order ID from the event
      // const orderPlacedEvent = receipt.logs.find((log: any) => {
      //   try {
      //     const parsed = contract.interface.parseLog(log);
      //     return parsed?.name === 'OrderPlaced';
      //   } catch {
      //     return false;
      //   }
      // });

      // let orderId = null;
      // if (orderPlacedEvent) {
      //   const parsed = contract.interface.parseLog(orderPlacedEvent);
      //   orderId = parsed?.args[0];
      // }

      // orders.push({
      //   orderId: orderId?.toString(),
      //   txHash: tx.hash,
      //   amountToSell: ethers.formatEther(amountToSell),
      //   pricePerToken: ethers.formatEther(pricePerToken),
      //   minOrderSize: ethers.formatEther(minOrderSize),
      //   blockNumber: receipt.blockNumber,
      //   timestamp: new Date().toISOString(),
      // });

      successCount++;

      // Add delay between transactions to avoid nonce issues
      if (i < NUM_ORDERS - 1) {
        console.log('   ⏳ Waiting 2 seconds before next order...');
        await sleep(2000);
      }
    } catch (error) {
      console.log(error);
      console.error(`   ❌ Failed to place order ${i + 1}:`, error.message);
      failureCount++;

      // Continue with next order even if one fails
      await sleep(1000);
    }

    console.log('');
  }

  // Summary
  console.log('📈 Order Generation Summary:');
  console.log(`✅ Successful orders: ${successCount}`);
  console.log(`❌ Failed orders: ${failureCount}`);
  console.log(
    `📊 Success rate: ${((successCount / NUM_ORDERS) * 100).toFixed(2)}%`,
  );

  // // Save orders to file
  // const outputFile = path.join(__dirname, 'generated-orders.json');
  // fs.writeFileSync(outputFile, JSON.stringify(orders, null, 2));
  // console.log(`💾 Orders saved to: ${outputFile}`);

  return orders;
}

// Error handling for the main execution
async function main() {
  try {
    // Check if wallet has enough balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);

    if (balance < ethers.parseEther('0.01')) {
      console.warn(
        '⚠️  Warning: Low ETH balance. Make sure you have enough for gas fees.',
      );
    }

    await generateOrders();
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { generateOrders };
