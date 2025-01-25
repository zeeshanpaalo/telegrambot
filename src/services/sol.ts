import { Connection, PublicKey } from "@solana/web3.js";

class SolanaService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  public async getBalance(publicKey: string): Promise<number> {
    const balance = await this.connection.getBalance(new PublicKey(publicKey));
    console.log(balance)
    return balance / 1e9; // Convert lamports to SOL
  }
}

export default SolanaService;
