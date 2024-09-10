import { Config } from "./config.js";
import { Constants } from "./constants.js";



console.log("cyberpunkred-armor-ablates-easier start");

const ablationCache = {}

Hooks.once("init", function () {
    Config.registerSettings();
});

Hooks.on("createChatMessage", async function(message) {
    if (!game.settings.get(Constants.MODULE_NAME, "house-rule-enable")) return;
    //if (game.userId != message._source.user) return;
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
        //we need all clients to store data in their ablation cache, so no user check.
        //get the ablation value of the attack/ammo and store for future use.
        const data = div.querySelector("[data-action=applyDamage]")?.dataset;
        if (!data) return;
        if (!data.ablation) return;
        const actorId = message.speaker?.actor;
        if (!actorId) return;
        ablationCache[actorId] = parseInt(data.ablation);
        ablationCache.last_attacker = actorId;
        const actorName = game.actors.get(actorId).name;
        console.log("cyberpunkred-armor-ablates-easier :: " + actorName + " (" + actorId + ") ablation value of " + data.ablation + " cached.")

    } else if (isDamageResult) {
        //since we are potentially creating a message in the chat, we only want to run one the client that hit the button.
        if (game.userId != message._source.user) return;
        //check for 0 damage dealt and configured SP threshhold. 
        //If so, ablate armor by our stored ablation value (if house rule is enabled)
        const data = div.querySelector("[data-action=reverseDamage]")?.dataset;
        if (!data) return;
        const targetId = data.actorId;
        if (!targetId) return;
        const text = div.querySelector('.d6-data-details > div:first-child').innerHTML.trim();
        if (text == `${game.i18n.localize("CPR.chat.damageApplication.damageDidNotPenetrate")}`) {
            console.log("Woohoo! 0 damage");
            const location = data.location;
            
            //ignore brain and shield targets.
            if (location != 'head' && location != 'body') return;
            //don't ablate armor if a shield soaks the damage (still possible if attack location is body or head).
            if (!!data.shieldAblation && parseInt(data.shieldAblation) > 0) return;

            const targetId = data.actorId;
            if (!location || !targetId) return;
            const target = game.actors.get(targetId);
            if (!target) return;

            //check that armor SP isn't at or above threshold.
            const armors = target.getEquippedArmors(location);
            // Determine the highest value of all the equipped armors in the specific location
            let currentArmorSp = 0;
            armors.forEach((a) => {
                let newValue;
                if (location === "head") {
                    newValue = a.system.headLocation.sp - a.system.headLocation.ablation;
                } else {
                    newValue = a.system.bodyLocation.sp - a.system.bodyLocation.ablation;
                }
                if (newValue > currentArmorSp) {
                    currentArmorSp = newValue;
                }
            });
            
            const spThreshold = game.settings.get(Constants.MODULE_NAME, "armor-sp-ignore-threshold");
            if (!spThreshold) return;
            
            if (currentArmorSp >= spThreshold) {
                console.log("cyberpunkred-armor-ablates-easier :: 0 damage dealt to " + target.name + ", but armor is not ablated because current armor SP is " + currentArmorSp + " which is greater than or equal to the configured SP threshold of " + spThreshold);
                return;
            }

            const lastAttackerId = ablationCache.last_attacker;
            const lastAttacker = game.actors.get(lastAttackerId);
            //important to cast this to an int, or else a string concatination can occur in _ablateArmor(): in js, 1 + "1" is "11"
            const lastAttackerAblation = parseInt(ablationCache[lastAttackerId]);
            //if we are here, it's time for the house rule to ablate the armor.
            //Warning: calling an underscore-prefixed function. This could break in future. 
            await target._ablateArmor(location, lastAttackerAblation);
            let backgroundColor = "var(--cpr-text-chat-success, #2d9f36)";
            let chatMessage = game.i18n.format(
                "cyberpunkred-armor-ablates-easier.message.ablate",
                {attacker: lastAttacker.name, target: target.name, ablation: lastAttackerAblation}
              );
            ChatMessage.create(
                {
                    speaker: message.speaker,
                    content: `<div class="cpr-block" style="padding:10px;background-color:${backgroundColor}">${chatMessage}</div>`,
                    type: message.type,
                    whisper: message.whisper,
                },
                { chatBubble: false }
            );
            console.log("cyberpunkred-armor-ablates-easier :: " + lastAttacker.name + " dealt 0 damage to " + target.name + ", but ablated armor by " + lastAttackerAblation);
        }
    }

    //console.log(message);
})

console.log("cyberpunkred-armor-ablates-easier start");