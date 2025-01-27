import {
  Connection,
  ParsedInstruction,
  PartiallyDecodedInstruction,
  PublicKey,
} from "@solana/web3.js";
// import { sha256 } from "js-sha256";
// import bs58 from "bs58";
import { sha256 } from "@noble/hashes/sha256";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import * as anchor from "@coral-xyz/anchor";
import { RayIDL } from "../idl/raydium";
import { DecodedInstructionData, RADIUM_CP_SWAP } from "../constants";

export type TradeType = "BUY" | "SELL";

export interface Swap {
  signature: string; // transaction signature
  timestamp: number | undefined | null; // ms since epoch when the transaction was processed
  tokenMint: string; // mint of the alt token being traded
  tokenDecimals: number; // decimals of the alt token being traded
  type: TradeType; // type of trade (BUY or SELL)
  amountIn: number; // UI amount of the input token, without decimals
  amountOut: number; // UI amount of the output token, without decimals
  poolId: string; // raydium amm pool id which was used for the swap
  signer: string; // address of the user who signed the transaction
}

class SolanaService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  public async getBalance(publicKey: string): Promise<number> {
    const balance = await this.connection.getBalance(new PublicKey(publicKey));
    console.log(balance);
    return balance / 1e9; // Convert lamports to SOL
  }
  // Get raydium instruction
  public getRaydiumInstruction(
    instructions:
      | (ParsedInstruction | PartiallyDecodedInstruction)[]
      | undefined
  ) {
    const ray_instruction = instructions?.filter((ins) => {
      if (ins.programId.equals(new PublicKey(RADIUM_CP_SWAP))) {
        return true;
      }
      return false;
    });
    if (!ray_instruction) {
      return undefined;
    }
    console.log("jusdfsdfsdfsdfsdfs-=====");
    console.log(ray_instruction);
    return ray_instruction[0];
  }

  // Parses transction object.
  public async parseTx(txSignature: string): Promise<Swap | null> {
    // todo Implement parsing the transactions
    const parsedTx = await this.connection.getParsedTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
    });
    console.log(parsedTx);
    // console.log("----------------------------------------");
    // console.log(parsedTx?.meta?.innerInstructions);
    // console.log("----------------------------------------");
    // console.log(parsedTx?.meta?.postTokenBalances);
    // console.log("----------------------------------------");
    // console.log(parsedTx?.transaction?.message.accountKeys);
    // console.log("----------------------------------------");
    // console.log(parsedTx?.transaction?.message.instructions);
    // Check if Raydium CP-SWAP is there in the instructions array. CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C
    const ray_instruction = this.getRaydiumInstruction(
      parsedTx?.transaction?.message.instructions
    );
    console.log("------------------------------------------------------------");
    // console.log(ray_instruction);
    if (!ray_instruction) {
      return null;
    }
    const inputDetails = this.decodeInstructionData(ray_instruction);
    console.log("------------------------------------------------------------");
    console.log(inputDetails);
    return {
      signature: txSignature,
      timestamp: parsedTx?.blockTime,
      tokenMint: "string;",
      tokenDecimals: 10,
      type: "BUY",
      amountIn: 10,
      amountOut: 10,
      poolId: "string;",
      signer: "string;",
    };
  }

  // Function to get argument size based on type
  private getArgSize(argType: string): number {
    switch (argType) {
      case "u8":
        return 1;
      case "u16":
        return 2;
      case "u32":
        return 4;
      case "u64":
        return 8;
      default:
        throw new Error(`Unsupported type: ${argType}`);
    }
  }

  // todo: type for instruction
  public decodeInstructionData(instruction: any) {
    const { data, programId } = instruction;
    console.log(data);
    const decodeBuffer = bs58.decode(data);

    const hash = sha256(`global:swap_base_input`);
    console.log(hash);

    const sellDiscriminator = Buffer.from(
      sha256("global:swap_base_input").slice(0, 8)
    );
    console.log("Sell deiscsdfs");
    console.log(sellDiscriminator);
    const discriminator = Buffer.from(hash);
    console.log("discriminator=>>>>>", discriminator);

    // Check if the discriminator matches the start of the data
    if (decodeBuffer.slice(0, 8).equals(discriminator.slice(0, 8))) {
      console.log(`Matched function: swapbaseInput`);

      const coder = new anchor.BorshInstructionCoder(
        RayIDL as unknown as anchor.Idl
      );
      console.log("encoder wokrkssdfs");
      const decodeddddd = coder.decode(data, "base58");
      console.log(decodeddddd);

      const decodedData =
        decodeddddd?.data as unknown as DecodedInstructionData;
      const a = BigInt(decodedData.amountIn.toString());
      const b = BigInt(decodedData.minimumAmountOut.toString());
      console.log(a);
      console.log(b);
      return {
        functionName: "swapbaseinput",
        arguments: {
          a,
          b,
        },
      };
      // Decode the arguments
      let offset = 8; // Skip the discriminator (8 bytes)
      const decodedArgs: Record<string, any> = {};

      // Loop through the arguments in the IDL
      //   for (const arg of instructionInfo.args) {
      //     const size = this.getArgSize(arg.type.toString()); // TODO : check conversion to string
      //     const value = buffer.slice(offset, offset + size);

      //     // Decode the argument based on its type
      //     switch (arg.type) {
      //       case "u8":
      //         decodedArgs[arg.name] = value.readUInt8(0);
      //         break;
      //       case "u16":
      //         decodedArgs[arg.name] = value.readUInt16LE(0);
      //         break;
      //       case "u32":
      //         decodedArgs[arg.name] = value.readUInt32LE(0);
      //         break;
      //       case "u64":
      //         decodedArgs[arg.name] = Number(
      //           BigInt("0x" + value.reverse().toString("hex"))
      //         ); // Handle u64 as BigInt
      //         break;
      //       default:
      //         throw new Error(`Unsupported type: ${arg.type}`);
      //     }

      //     offset += size;
      //   }

      // Return the decoded function name and arguments
      //   console.log("Decoded arguments:", decodedArgs);
      //   return { functionName: instructionInfo.name, arguments: decodedArgs };
    }
    // }

    // If no matching function was found
    console.error("No matching function found in IDL for this data.");
    return null;
  }
}

export default SolanaService;
