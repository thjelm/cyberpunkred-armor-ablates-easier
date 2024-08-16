import { Constants } from "./constants.js";

export class Config {
    static registerSettings() {
        console.log("cyberpunkred-armor-ablates-easier settings start");

        game.settings.register(Constants.MODULE_NAME, "house-rule-enable", {
            name: game.i18n.localize("cyberpunkred-armor-ablates-easier.settings.house-rule-enable.name"),
            hint: game.i18n.localize("cyberpunkred-armor-ablates-easier.settings.house-rule-enable.hint"),
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
        });

        game.settings.register(Constants.MODULE_NAME, "armor-sp-ignore-threshold", {
            name: game.i18n.localize("cyberpunkred-armor-ablates-easier.settings.armor-sp-ignore-threshold.name"),
            hint: game.i18n.localize("cyberpunkred-armor-ablates-easier.settings.armor-sp-ignore-threshold.hint"),
            scope: "world",
            config: true,
            type: Number,
            default: 13,
        });

        console.log("cyberpunkred-armor-ablates-easier settings end");
  }
}