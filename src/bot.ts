import "dotenv/config";
import { Context, InlineKeyboard } from "grammy";
import { Actions } from "./constants";

const { Bot } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

// Show options when the bot starts
bot.command("start", async (ctx: Context) => {
  const keyboard = new InlineKeyboard()
    .text("Check Solana Balance", Actions.CHECK_SOL_BALANCE)
    .text("Parse Raydium Transaction", Actions.PARSE_TX);
  console.log("Starting the flow");
  await ctx.reply("What would you like to do?", {
    reply_markup: keyboard,
  });
});

// Register listeners to handle messages
bot.on("message:text", (ctx: Context) => {
  console.log("User Input");
  ctx.reply("Echo: " + ctx.message?.text);
});

// Handle button clicks (callback queries)
bot.on("callback_query:data", async (ctx: Context) => {
  const action = ctx.callbackQuery?.data;
  console.log("callback in play");
  if (action === Actions.CHECK_SOL_BALANCE) {
    // Handle the Check Balance button click
    await ctx.answerCallbackQuery();
    // TODO: handle getting address for sol balance
    await ctx.reply("Your balance is: $123.45");
  } else if (action === Actions.PARSE_TX) {
    // Handle the Check Transactions button click
    await ctx.answerCallbackQuery();
    // TODO: parse radyium transaction
    await ctx.reply("Your last transaction: -$45.67 on 2025-01-20");
  } else {
    // Handle unexpected button actions
    await ctx.answerCallbackQuery("Unknown action!");
  }
});

bot.catch((err: any) => console.error(err));

bot.start();
