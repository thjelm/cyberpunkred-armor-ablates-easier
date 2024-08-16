import { Config } from "./config.js";
import { Constants } from "./constants.js";



console.log("cyberpunkred-armor-ablates-easier start");

const ablationCache = {}

Hooks.once("init", function () {
    Config.registerSettings();
});

Hooks.on("createChatMessage", async function(message) {
    if (!game.settings.get(Constants.MODULE_NAME, "house-rule-enable")) return;
    if (game.userId != message._source.user) return;
    const div = document.createElement("div");
    div.innerHTML = message.content;

    //chat message that appears after user clicks a blood drop to roll damage
    const isDamageRoll = div.querySelector(
        `[data-tooltip='${game.i18n.localize(
          "CPR.chat.damageApplication.applyDamage"
        )}']`
    );

    //chat message that appears after user clicks a lightning bolt to apply damage
    const isDamageResult = div.querySelector(
        `[data-tooltip='${game.i18n.localize(
          "CPR.chat.damageApplication.reverseDamage"
        )}']`
    );

    if (!isDamageRoll && !isDamageResult) return;

    if (isDamageRoll) {
        //get the ablation value of the attack/ammo and store for future use.
        const data = div.querySelector("[data-action=applyDamage]")?.dataset;
        if (!data) return;
        if (!data.ablation) return;
        const actorId = message.speaker?.actor;
        if (!actorId) return;
        ablationCache[actorId] = data.ablation;
        ablationCache["last_attacker"] = actorId;
        const actorName = game.actors.get(actorId).name;
        console.log("cyberpunkred-armor-ablates-easier :: " + actorName + " (" + actorId + ") ablation value of " + data.ablation + " cached.")

    } else if (isDamageResult) {
        //check for 0 damage dealt and configured SP threshhold. 
        //If so, ablate armor by our stored ablation value (if house rule is enabled)
        const data = div.querySelector("[data-action=reverseDamage]")?.dataset;
        if (!data) return;
        const targetId = data.actorId;
        if (!targetId) return;
        const text = div.querySelector('.d6-data-details > div:first-child').innerHTML.trim();
        if (text == `${game.i18n.localize("CPR.chat.damageApplication.damageDidNotPenetrate")}`) {
            console.log("Woohoo! 0 damage");
        }
    }

    //console.log(message);
})

console.log("cyberpunkred-armor-ablates-easier start");