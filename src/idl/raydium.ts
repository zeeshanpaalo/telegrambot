export const RayIDL = {
  version: "0.1.0",
  name: "raydium_cp_swap",
  instructions: [
    {
      name: "swapBaseInput",
      docs: ["Buys tokens from a bonding curve."],
      accounts: [
        {
          name: "payer",
          isMut: false,
          isSigner: true,
        },
        { name: "authority", isMut: false, isSigner: false },
        {
          name: "ammConfig",
          isMut: false,
          isSigner: false,
        },
        {
          name: "poolState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "inputTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "outputTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "inputVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "outputVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "inputTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "outputTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "inputTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "outputTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "observationState",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        { name: "amountIn", type: "u64" },
        { name: "minimumAmountOut", type: "u64" },
      ],
    },
    {
      name: "swapBaseOutput",
      docs: ["base output"],
      accounts: [
        {
          name: "payer",
          isMut: false,
          isSigner: true,
        },
        { name: "authority", isMut: false, isSigner: false },
        {
          name: "ammConfig",
          isMut: false,
          isSigner: false,
        },
        {
          name: "poolState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "inputTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "outputTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "inputVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "outputVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "inputTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "outputTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "inputTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "outputTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "observationState",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        { name: "maxAmountIn", type: "u64" },
        { name: "amountOut", type: "u64" },
      ],
    },
  ],
  accounts: [],
  events: [],
  errors: [],
  metadata: {
    address: "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C",
  },
};
