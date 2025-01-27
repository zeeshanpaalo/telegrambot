import { BN } from "@coral-xyz/anchor";

// Constants
export enum Actions {
  CHECK_SOL_BALANCE = "check_balance",
  PARSE_TX = "check_tx:",
}

export const RADIUM_CP_SWAP = "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C";

export const RAY_VAULT_AUTH = "GpMZbSM2GgvTKHJirzeGfMFoaZ8UR2X7F4v8vHTvxFbL";

export const WSOL = "So11111111111111111111111111111111111111112";

export type DecodedBaseInputInstructionData = {
  amountIn: BN;
  minimumAmountOut: BN;
};

export type DecodedBaseOutputInstructionData = {
  maxAmountIn: BN;
  amountOut: BN;
};
