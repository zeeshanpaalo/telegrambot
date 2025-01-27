import { BN } from "@coral-xyz/anchor";

// Constants
export enum Actions {
  CHECK_SOL_BALANCE = "check_balance",
  PARSE_TX = "check_tx:",
}

export const RADIUM_CP_SWAP = "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C";

export type DecodedInstructionData = {
  amountIn: BN;
  minimumAmountOut: BN;
};
