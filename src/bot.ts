import "dotenv/config";
import { InlineKeyboard } from "grammy";

const { Bot } = require("grammy");

// Create a bot object
const bot = new Bot(process.env.BOT_TOKEN); // <-- place your bot token in this string
console.log(process.env.BOT_TOKEN);

// Show options when the bot starts
bot.command("start", async (ctx: any) => {
  const keyboard = new InlineKeyboard()
    .text("Check Balance", "check_balance") // First option
    .text("Check Transactions", "check_transactions"); // Second option
  console.log("Starting the flow");
  await ctx.reply("What would you like to do?", {
    reply_markup: keyboard,
  });
});

// Register listeners to handle messages
bot.on("message:text", (ctx: any) => {
  console.log("User Input");
  ctx.reply("Echo: " + ctx.message.text);
});

// Handle button clicks (callback queries)
bot.on("callback_query:data", async (ctx: any) => {
  const action = ctx.callbackQuery.data; // Get the action from the button
  console.log("callback in play");
  if (action === "check_balance") {
    // Handle the Check Balance button click
    await ctx.answerCallbackQuery(); // Acknowledge the button press
    await ctx.reply("Your balance is: $123.45"); // Replace with actual logic
  } else if (action === "check_transactions") {
    // Handle the Check Transactions button click
    await ctx.answerCallbackQuery(); // Acknowledge the button press
    await ctx.reply("Your last transaction: -$45.67 on 2025-01-20"); // Replace with actual logic
  } else {
    // Handle unexpected button actions
    await ctx.answerCallbackQuery("Unknown action!", { show_alert: true });
  }
});

// Handle user input
// bot.on("message:text", async (ctx: any) => {
//   const text = ctx.message.text;
//   console.log("getting the message here")
//   if (text === "Check Balance") {
//     await ctx.reply("Your balance is: $123.45"); // Replace with your logic
//   } else if (text === "Check Transactions") {
//     await ctx.reply("Your last transaction: -$45.67 on 2025-01-20"); // Replace with your logic
//   } else {
//     await ctx.reply("Please select a valid option.");
//   }
// });

// Send statistics upon `/stats`
bot.command("stats", async (ctx: any) => {
  const stats = ctx.match;
  console.log(ctx.match);
  console.log(stats);
  // Format stats to string
  const message = `<b>${stats} messages</b>`;

  // Send message in same chat using `reply` shortcut. Don't forget to `await`!
  await ctx.reply(message, { parse_mode: "HTML" });
});

// Catch errors and log them
bot.catch((err: any) => console.error(err));
// Start the bot (using long polling)
bot.start(() => {
  console.log("Started to list");
});
