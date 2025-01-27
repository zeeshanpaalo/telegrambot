import {
  ConfirmedTransactionMeta,
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
import {
  DecodedBaseInputInstructionData,
  DecodedBaseOutputInstructionData,
  RADIUM_CP_SWAP,
  RAY_VAULT_AUTH,
  WSOL,
} from "../constants";

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
  functionName: string;
  instructionArgs: Object | null; // decoded instruction data
}

class SolanaService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  public async getBalance(publicKey: string): Promise<number> {
    const balance = await this.connection.getBalance(new PublicKey(publicKey));
    return balance / 1e9; // Convert lamports to SOL
  }
  // Get raydium instruction
  public getRaydiumInstruction(
    instructions:
      | (ParsedInstruction | PartiallyDecodedInstruction)[]
      | undefined
  ) {
    let functionName: string = "swap_base_input";
    // also the instruction needs to have a discriminator for either swapBaseInput or swapBaseOutput
    const baseInput = Buffer.from(sha256("global:swap_base_input").slice(0, 8));
    const baseOutput = Buffer.from(
      sha256("global:swap_base_output").slice(0, 8)
    );
    const ray_instruction = instructions?.filter((ins) => {
      if (ins.programId.equals(new PublicKey(RADIUM_CP_SWAP))) {
        const { data } = ins as PartiallyDecodedInstruction;
        const decodeBuffer = bs58.decode(data);
        const accounts = this.getAccounts(ins as PartiallyDecodedInstruction);

        if (
          (decodeBuffer.slice(0, 8).equals(baseInput.slice(0, 8)) ||
            decodeBuffer.slice(0, 8).equals(baseOutput.slice(0, 8))) &&
          (accounts.inputTokenMint.toString() == WSOL ||
            accounts.outputTokenMint.toString() == WSOL)
        ) {
          // so its a swap
          console.log("Its a valid swap involving wsol");
          if (decodeBuffer.slice(0, 8).equals(baseOutput.slice(0, 8))) {
            functionName = "swap_base_output";
          }
          return true;
        }

        // not a transaction we would want to parse
        return false;
      }
      return false;
    });
    if (!ray_instruction || !ray_instruction.length) {
      return undefined;
    }

    // Add more data to instruction
    return { instruction: ray_instruction[0], functionName };
  }

  // raydium context layout
  private getAccounts(instruction: PartiallyDecodedInstruction) {
    return {
      payer: instruction.accounts[0],
      authority: instruction.accounts[1],
      ammConfig: instruction.accounts[2],
      poolState: instruction.accounts[3],
      inputTokenAccount: instruction.accounts[4],
      outputTokenAccount: instruction.accounts[5],
      inputVault: instruction.accounts[6],
      outputVault: instruction.accounts[7],
      inputTokenProgram: instruction.accounts[8],
      outputTokenProgram: instruction.accounts[9],
      inputTokenMint: instruction.accounts[10],
      outputTokenMint: instruction.accounts[11],
      observationState: instruction.accounts[12],
    };
  }

  // Parses transction object.
  public async parseTx(txSignature: string): Promise<Swap | null> {
    // todo Implement parsing the transactions
    const parsedTx = await this.connection.getParsedTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
    });
    console.log(parsedTx);
    if (!parsedTx) {
      return null;
    }

    const ray_Ins = this.getRaydiumInstruction(
      parsedTx?.transaction?.message.instructions
    );
    // console.log(ray_instruction);
    if (!ray_Ins) {
      console.log("Not a valid raydium SWAP transaction");
      return null;
    }
    const ray_instruction = ray_Ins.instruction;
    const functionName = ray_Ins.functionName;
    const meta = parsedTx.meta;
    if (!meta) {
      return null;
    }
    console.log(meta.preTokenBalances);
    console.log(meta.postTokenBalances);
    // Extract more data from the instruction
    const swapDetails = this.extractInfo(
      meta,
      ray_instruction as PartiallyDecodedInstruction,
      functionName
    );

    return {
      signature: txSignature,
      timestamp: parsedTx?.blockTime,
      tokenMint: swapDetails.altToken.toString(), // altToken Mint
      tokenDecimals: swapDetails.decimals,
      type: swapDetails.type,
      amountIn: Number(swapDetails.amountIn.toString()),
      amountOut: Number(swapDetails.amountOut.toString()),
      poolId: swapDetails.poolId,
      signer: swapDetails.signer,
      functionName: swapDetails.functionName,
      instructionArgs: swapDetails.arguments,
    };
  }

  private getTokenBalanceWithDecimal = (
    balances: anchor.web3.TokenBalance[],
    mint: string
  ): { balance: number; decimal: number } => {
    const balanceInfo = balances?.find(
      (b) => b.owner == RAY_VAULT_AUTH && b.mint == mint
    );
    console.log(balanceInfo);
    const balance = balanceInfo ? balanceInfo.uiTokenAmount.uiAmount! : 0;
    const decimal = balanceInfo ? balanceInfo.uiTokenAmount.decimals : 9;
    return { balance, decimal };
  };

  private getTokenBalanceChanges(
    meta: anchor.web3.ParsedTransactionMeta,
    accounts: any
  ): {
    inputBalanceChange: number;
    outputBalanceChange: number;
    inputDecimal: number;
    outputDecimal: number;
  } {
    const { preTokenBalances, postTokenBalances } = meta;

    const { balance: preInputVaultBalance, decimal: inputDecimal } =
      this.getTokenBalanceWithDecimal(
        preTokenBalances!,
        accounts.inputTokenMint
      );
    const { balance: preOutputVaultBalance, decimal: outputDecimal } =
      this.getTokenBalanceWithDecimal(
        preTokenBalances!,
        accounts.outputTokenMint
      );

    // post
    const { balance: postInputVaultBalance } = this.getTokenBalanceWithDecimal(
      postTokenBalances!,
      accounts.inputTokenMint
    );
    const { balance: postOutputVaultBalance } = this.getTokenBalanceWithDecimal(
      postTokenBalances!,
      accounts.outputTokenMint
    );

    // Calculate balance changes
    const inputBalanceChange = postInputVaultBalance - preInputVaultBalance;
    const outputBalanceChange = postOutputVaultBalance - preOutputVaultBalance;

    return {
      inputBalanceChange,
      outputBalanceChange,
      inputDecimal,
      outputDecimal,
    };
  }

  // return info about the swap
  public extractInfo(
    meta: anchor.web3.ParsedTransactionMeta,
    instruction: PartiallyDecodedInstruction,
    functionName: string
  ) {
    // const { preTokenBalances, postTokenBalances } = meta;
    const { data } = instruction;
    // const decodeBuffer = bs58.decode(data);

    const coder = new anchor.BorshInstructionCoder(
      RayIDL as unknown as anchor.Idl
    );
    const decodeBase58 = coder.decode(data, "base58");

    const accounts = this.getAccounts(instruction);

    // swap details
    let instructionArguments: any = {};
    let altToken =
      accounts.inputTokenMint.toString() == WSOL
        ? accounts.outputTokenMint
        : accounts.inputTokenMint;
    let type: TradeType = "SELL";
    let poolId: string = accounts.poolState.toString();
    let signer: string = accounts.payer.toString();

    // Handle amount changes
    const changes = this.getTokenBalanceChanges(meta, accounts);

    let amountIn: number = 0;
    let amountOut: number = 0;

    let decimals: number = 9;

    console.log(changes);
    console.log(changes.inputBalanceChange.toString());
    console.log(changes.outputBalanceChange.toString());

    if (functionName == "swap_base_input") {
      const decodedData =
        decodeBase58?.data as unknown as DecodedBaseInputInstructionData;
      instructionArguments.amountIn = decodedData.amountIn.toString();
      instructionArguments.minimumAmountOut =
        decodedData.minimumAmountOut.toString();
      // check if base is altToken
      if (altToken.toString() == accounts.outputTokenMint.toString()) {
        // alttoken is taken out  =>>BUY
        type = "BUY";
        amountIn = changes.inputBalanceChange;
        amountOut = changes.outputBalanceChange * -1;
        decimals = changes.outputDecimal;
      } else {
        // alttoken is given in to get wsol ==>> SELL
        console.log("------===================sdfsdfsdfs");
        type = "SELL";
        amountIn = changes.inputBalanceChange;
        console.log(amountIn.toString());
        amountOut = changes.outputBalanceChange * -1;
        decimals = changes.inputDecimal;
      }
    } else if (functionName == "swap_base_output") {
      console.log("Thisisidfisdfisdfsdf--s-d-f-asdf-sa-fdsa-f-s-fsd");
      const decodedData =
        decodeBase58?.data as unknown as DecodedBaseOutputInstructionData;
      instructionArguments.maxAmountIn = decodedData.maxAmountIn.toString();
      instructionArguments.amountOut = decodedData.amountOut.toString();
      // check if base is altToken
      if (altToken.toString() == accounts.inputTokenMint.toString()) {
        // alttoken is being sent in to get wsol =>>sold
        type = "SELL";
        amountIn = changes.inputBalanceChange;
        amountOut = changes.outputBalanceChange * -1;
        decimals = changes.inputDecimal;
      } else {
        // alttoken is being taken out of the pool ==>> BUY
        type = "BUY";
        amountIn = changes.inputBalanceChange;
        amountOut = changes.outputBalanceChange * -1;
        decimals = changes.outputDecimal;
      }
    }

    return {
      functionName,
      arguments: instructionArguments,
      altToken,
      type,
      poolId,
      signer,
      amountIn,
      amountOut,
      decimals,
    };
  }
}

export default SolanaService;
