import axios, { AxiosInstance } from "axios";

class CoinGeckoService {
  client: AxiosInstance;
  constructor() {
    this.client = axios.create({
      baseURL: "https://api.coingecko.com/api/v3",
      timeout: 5000, // Set a timeout for the requests
    });
  }

  /**
   * Fetches the price of a cryptocurrency in a specific currency.
   * @param {string} cryptoId - The ID of the cryptocurrency (e.g., 'solana').
   * @param {string} vsCurrency - The fiat or crypto currency to convert to (e.g., 'usd').
   * @returns {Promise<number>} - The current price of the cryptocurrency.
   */
  async getPrice(cryptoId: string, vsCurrency = "usd") {
    try {
      const response = await this.client.get("/simple/price", {
        params: {
          ids: cryptoId,
          vs_currencies: vsCurrency,
        },
        headers: {
          accept: "application/json",
          "x-cg-demo-api-key": `${process.env.PRICE_API}`, // TODO: MOVE TO ENV
        },
      });
      //   console.log(response.data.solana);
      return response.data.solana;
    } catch (error: any) {
      console.error("Error in CoinGeckoService.getPrice:", error.message);
      throw error;
    }
  }
}

export default CoinGeckoService;
