import { Config } from "./config.js";

console.log("cyberpunkred-armor-ablates-easier start");
Hooks.once("init", function () {
    Config.registerSettings();
});