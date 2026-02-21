import { Config } from "./config.js";
import { Constants } from "./constants.js";

console.log("cyberpunkred-armor-ablates-easier start");

const ablationCache = {}

Hooks.once("init", function () {
    Config.registerSettings();
});

Hooks.on("createChatMessage", async function(message) {
    if (!game.settings.get(Constants.MODULE_NAME, "house-rule-enable")) return;
    
    const div = document.createElement("div");
    div.innerHTML = message.content;

    // Chat message that appears after user clicks a blood drop to roll damage
    const isDamageRoll = div.querySelector(
        `[data-tooltip='${game.i18n.localize("CPR.chat.damageApplication.applyDamage")}']`
    );

    // Chat message that appears after user clicks a lightning bolt to apply damage
    const isDamageResult = div.querySelector(
        `[data-tooltip='${game.i18n.localize("CPR.chat.damageApplication.reverseDamage")}']`
    );

    if (!isDamageRoll && !isDamageResult) return;

    if (isDamageRoll) {
        const data = div.querySelector("[data-action=applyDamage]")?.dataset;
        if (!data || !data.ablation) return;
        
        const actorId = message.speaker?.actor;
        if (!actorId) return;
        
        ablationCache[actorId] = parseInt(data.ablation);
        ablationCache.last_attacker = actorId;
        
        const actor = game.actors.get(actorId);
        if (actor) {
            console.log(`cyberpunkred-armor-ablates-easier :: ${actor.name} (${actorId}) ablation value of ${data.ablation} cached.`);
        }

    } else if (isDamageResult) {
        // v12 check for message author
        if (game.userId !== message.author.id) return;

        const data = div.querySelector("[data-action=reverseDamage]")?.dataset;
        if (!data) return;
        
        const targetId = data.actorId;
        if (!targetId) return;

        const text = div.querySelector('.d6-data-details > div:first-child')?.innerHTML.trim();
        if (text === `${game.i18n.localize("CPR.chat.damageApplication.damageDidNotPenetrate")}`) {
            const location = data.location;
            
            if (location !== 'head' && location !== 'body') return;
            if (!!data.shieldAblation && parseInt(data.shieldAblation) > 0) return;

            const target = game.actors.get(targetId);
            if (!target) return;

            const armors = target.getEquippedArmors(location);
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
            if (currentArmorSp >= spThreshold) return;

            const lastAttackerId = ablationCache.last_attacker;
            const lastAttacker = game.actors.get(lastAttackerId);
            if (!lastAttacker) return;

            const lastAttackerAblation = parseInt(ablationCache[lastAttackerId]);
            
            // Warning: calling an underscore-prefixed function remains risky but is still standard in CPR core for now.
            await target._ablateArmor(location, lastAttackerAblation);

            let backgroundColor = "var(--cpr-text-chat-success, #2d9f36)";
            let chatMessage = game.i18n.format(
                "cyberpunkred-armor-ablates-easier.message.ablate",
                {attacker: lastAttacker.name, target: target.name, ablation: lastAttackerAblation}
            );

            ChatMessage.create({
                speaker: message.speaker,
                content: `<div class="cpr-block" style="padding:10px;background-color:${backgroundColor}">${chatMessage}</div>`,
                style: message.style, // v12 uses .style instead of .type
                whisper: message.whisper,
            });
        }
    }
});
