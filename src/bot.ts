import "dotenv/config";
import { Bot, Context, session, type SessionFlavor } from "grammy";
import { Menu } from "@grammyjs/menu";
import { hydrate, type HydrateFlavor } from "@grammyjs/hydrate";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { Actions } from "./constants";
import { Connection } from "@solana/web3.js";
import SolanaService from "./services/sol";
import CoinGeckoService from "./services/coinGeeko";

interface SessionData {
  address?: string;
  txHash?: string;
}
type MyContext = ConversationFlavor<Context & SessionFlavor<SessionData>>;

type AddressContext = Context;
type AddressConversation = Conversation<MyContext, AddressContext>;

type TxHashContext = HydrateFlavor<Context>;
type TxHashConversation = Conversation<MyContext, TxHashContext>;

// Sol service
const connection = new Connection(process.env.ENDPOINT!, "confirmed");
const solanaService = new SolanaService(connection);
const coinGecko = new CoinGeckoService();

const bot = new Bot<MyContext>(process.env.BOT_TOKEN!);

bot.use(session({ initial: () => ({}) }));
bot.use(conversations());

const menu = new Menu<MyContext>("root")
  .submenu("Check Solana Balance", Actions.CHECK_SOL_BALANCE)
  .submenu("Parse Transaction", Actions.PARSE_TX);

const checkBalance = new Menu<MyContext>(Actions.CHECK_SOL_BALANCE)
  .text("Enter Address", (ctx) => ctx.conversation.enter("address"))
  .back("Back");
menu.register(checkBalance);

const parseTxHash = new Menu<MyContext>(Actions.PARSE_TX)
  .text("Enter Tx Hash", (ctx) => ctx.conversation.enter("txHash"))
  .back("Back");
menu.register(parseTxHash);

async function address(conversation: AddressConversation, ctx: AddressContext) {
  // Define the structure that the ouside menu expects.
  const addressClone = conversation
    .menu(Actions.CHECK_SOL_BALANCE)
    .text("Enter Address")
    .back("Back");

  // Override the outside menu when the conversation is entered.
  const addressMenu = conversation.menu().text("Cancel", async (ctx: any) => {
    await ctx.menu.nav(Actions.CHECK_SOL_BALANCE, { immediate: true });
    await conversation.halt();
  });
  await ctx.editMessageReplyMarkup({ reply_markup: addressMenu });

  await ctx.reply("Please enter Address");
  const address = await conversation.form.text();
  await conversation.external((ctx: any) => (ctx.session.addres = address));
  // TODO: Fetch balance
  const balance = await solanaService.getBalance(address);
  console.log(balance);
  // Get USD equivalent
  const solanaPrice = await coinGecko.getPrice("solana", "usd");
  console.log("prie of sol");
  console.log(solanaPrice);
  await ctx.reply(
    `Balance of ${address}: ${balance} SOL & USD BALANCE = ${
      balance * solanaPrice.usd
    } $USD`
  );

  await ctx.editMessageReplyMarkup({ reply_markup: addressClone });
}

async function txHash(conversation: TxHashConversation, ctx: TxHashContext) {
  // Define the structure that the ouside menu expects.
  const txHashClone = conversation
    .menu(Actions.PARSE_TX)
    .text("Enter Tx Hash")
    .back("Back");

  // Override the outside menu when the conversation is entered.
  const txHashMenu = conversation.menu().text("Cancel", async (ctx: any) => {
    await ctx.menu.nav(Actions.PARSE_TX, { immediate: true });
    await conversation.halt();
  });
  await ctx.editMessageReplyMarkup({ reply_markup: txHashMenu });

  await ctx.reply("Please enter Transaction Hash for Raydium");
  const txHash = await conversation.form.text();
  await conversation.external((ctx: any) => (ctx.session.txHash = txHash));
  // TODO: Parse transaction
  await ctx.reply(`Parsed transaction for hash ${txHash}: {
    type: Sell
  }`);

  await ctx.editMessageReplyMarkup({ reply_markup: txHashClone });
}

bot.use(createConversation(address));

bot.use(createConversation(txHash, { plugins: [hydrate()] }));

bot.use(menu);

bot.command("start", async (ctx) => {
  await ctx.reply("What would you like to do?", { reply_markup: menu });
});

bot.use((ctx) => ctx.reply("Send /start"));

bot.start();
