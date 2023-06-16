"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const event_1 = require("bdsx/event");
const utils_1 = require("./utils");
const attribute_1 = require("bdsx/bds/attribute");
const abilities_1 = require("bdsx/bds/abilities");
const effects_1 = require("bdsx/bds/effects");
const serverproperties_1 = require("bdsx/serverproperties");
const child_process_1 = require("child_process");
const path_1 = require("path");
const command_1 = require("bdsx/command");
const command_2 = require("bdsx/bds/command");
const nativetype_1 = require("bdsx/nativetype");
const actor_1 = require("bdsx/bds/actor");
const common_1 = require("bdsx/common");
const form_1 = require("bdsx/bds/form");
const inventory_1 = require("bdsx/bds/inventory");
const enchants_1 = require("bdsx/bds/enchants");
(0, utils_1.Folder)(utils_1.FolderType.plugin, ``, `users`);
const Worlds = (0, utils_1.StringToMap)((0, utils_1.LoadFile)(utils_1.FolderType.plugin, "", "worlds", "json", `{"version":${utils_1._dbVersion},"data":[]}`), "level_name");
const batWorlds = new Map();
var isRun = false;
var mainWorld = "";
if ((0, utils_1.LoadFile)(utils_1.FolderType.local, "", "server", "bak", "") == "")
    (0, utils_1.SaveFile)(utils_1.FolderType.local, "", "server", (0, utils_1.LoadFile)(utils_1.FolderType.local, "", "server", "properties", ""), "bak");
const default_data = (0, utils_1.LoadFile)(utils_1.FolderType.local, "", "server", "bak", "");
function saveWorlds() {
    (0, utils_1.SaveFile)(utils_1.FolderType.plugin, "", "worlds", (0, utils_1.MapToString)(Worlds));
}
command_1.command.register('worldok', "", command_2.CommandPermissionLevel.Host).overload((param, origin, output) => {
    if (origin.isServerCommandOrigin()) {
        output.success(`World ${serverproperties_1.serverProperties["level-name"]} done`);
    }
}, {});
function isRunWorld(worldName) {
    let run = batWorlds.get(worldName);
    if (run)
        return true;
    return false;
}
function isNotMain() {
    let secundary = Worlds.get(serverproperties_1.serverProperties["level-name"]);
    for (let world of Worlds.values()) {
        if (world.main) {
            return secundary.level_name != world.level_name;
        }
    }
    return false;
}
function runWorld(worldName) {
    if (isRun) {
        (0, utils_1.Print)(`wait run world`, utils_1.TypePrint.debug);
        setTimeout(() => {
            runWorld(worldName);
        }, 5000);
    }
    else {
        isRun = true;
        let world = Worlds.get(worldName);
        if (!world) {
            isRun = false;
            return;
        }
        if (world.main || isRunWorld(world.level_name) || isNotMain()) {
            if (world.main)
                mainWorld = world.level_name;
            (0, utils_1.Print)(`world ${world.level_name} does not follow the rules main:${world.main} isRun:${isRunWorld(world.level_name)} isNotMain:${isNotMain()}`, utils_1.TypePrint.debug);
            isRun = false;
            return;
        }
        let server = default_data;
        server = server.replace(`level-name=${serverproperties_1.serverProperties["level-name"]}`, `level-name=${world.level_name}`);
        server = server.replace(`server-port=${serverproperties_1.serverProperties["server-port"]}`, `server-port=${world.port}`);
        server = server.replace(`server-portv6=${serverproperties_1.serverProperties["server-portv6"]}`, `server-portv6=${(world.portv6)}`);
        server = server.replace(`gamemode=${serverproperties_1.serverProperties["gamemode"]}`, `gamemode=${(world.gamemode)}`);
        server = server.replace(`difficulty=${serverproperties_1.serverProperties["difficulty"]}`, `difficulty=${(world.difficulty)}`);
        server = server.replace(`max-players=${serverproperties_1.serverProperties["max-players"]}`, `max-players=${(world.max_players)}`);
        server = server.replace(`level-seed=${serverproperties_1.serverProperties["level-seed"]}`, `level-seed=${(world.level_seed)}`);
        server = server.replace(`level-type=DEFAULT`, `level-type=${(world.level_type)}`);
        server = server.replace(`level-type=FLAT`, `level-type=${(world.level_type)}`);
        (0, utils_1.SaveFile)(utils_1.FolderType.local, "", "server", server, "properties");
        (0, utils_1.Print)(`World ${world.level_name} load`, utils_1.TypePrint.info);
        const bat = (0, child_process_1.spawn)('cmd.exe', ['/c', `${(0, path_1.join)(utils_1._root, '..')}/bdsx.bat`]);
        bat.stdout.on('data', (data) => {
            let send = false;
            if (data.toString().indexOf(`World ${world.level_name} done`) == 0) {
                (0, utils_1.SaveFile)(utils_1.FolderType.local, "", "server", default_data, "properties");
                isRun = false;
                send = true;
            }
            if (data.toString().indexOf(`Player connected:`) > 0)
                send = true;
            if (data.toString().indexOf(`Player disconnected:`) > 0)
                send = true;
            if (send)
                (0, utils_1.Print)(`${world.level_name}: ${data.toString()}`, utils_1.TypePrint.info);
        });
        bat.stderr.on('data', (data) => {
            (0, utils_1.Print)(`${world.level_name}: ${data.toString()}`, utils_1.TypePrint.error);
        });
        bat.on('exit', (code) => {
            (0, utils_1.Print)(`${world.level_name} exited with code ${code}`, utils_1.TypePrint.alert);
            batWorlds.delete(world.level_name);
            (0, utils_1.SaveFile)(utils_1.FolderType.local, "", "server", default_data, "properties");
            isRun = false;
        });
        bat.stdin.write(`worldok\n`);
        batWorlds.set(world.level_name, bat);
    }
}
function runWorlds() {
    if (Worlds.size == 0) {
        (0, utils_1.Print)(`use the /worlds command to configure the worlds within the game`, utils_1.TypePrint.alert);
    }
    (0, utils_1.Print)(`run worlds`, utils_1.TypePrint.debug);
    for (let world of Worlds.values()) {
        runWorld(world.level_name);
    }
}
command_1.command.register('worldsruns', "", command_2.CommandPermissionLevel.Host).overload((param, origin, output) => {
    if (origin.isServerCommandOrigin()) {
        batWorlds.clear();
        let worlds = param.runworlds.split(",");
        for (let world of worlds) {
            batWorlds.set(world, world);
            (0, utils_1.Print)(`load batWorlds`, utils_1.TypePrint.debug);
        }
    }
}, {
    runworlds: nativetype_1.CxxString
});
function runWorldsNotMain() {
    (0, utils_1.Print)(`run worldsNotMain`, utils_1.TypePrint.debug);
    let worlds = [];
    worlds.push(serverproperties_1.serverProperties["level-name"]);
    for (let run of batWorlds.keys()) {
        worlds.push(run);
    }
    for (let bat of batWorlds.values()) {
        bat.stdin.write(`worldsruns "${worlds.join()}"\n`);
    }
}
runWorlds();
if (!isNotMain()) {
    setInterval(() => {
        runWorldsNotMain();
    }, 1000);
}
function getEffect(player, effect) {
    if (player.hasEffect(effect)) {
        let instance = player.getEffect(effect);
        return {
            id: instance.id,
            duration: instance.duration,
            amplifier: instance.amplifier,
            ambient: instance.ambient,
            showParticles: instance.showParticles,
            displayAnimation: instance.displayAnimation
        };
    }
    return { id: 0 };
}
function getCustomName(item) {
    if (item.hasCustomName())
        return item.getCustomName();
    return "";
}
function getInventory(player) {
    const inventory = [];
    let count = 0;
    for (const slot of player.getInventory().container.getSlots()) {
        const item = {
            slot: count,
            name: slot.getName(),
            customName: getCustomName(slot),
            amount: slot.getAmount(),
            aux: slot.getAuxValue(),
            armor: slot.getArmorValue(),
            damage: slot.getDamageValue(),
            attack: slot.getAttackDamage(),
            lore: slot.getCustomLore(),
            enchants: [{}]
        };
        item.enchants.pop();
        if (slot.isEnchanted()) {
            let EnchantsData = slot.constructItemEnchantsFromUserData();
            for (let enchant of EnchantsData.enchants1) {
                item.enchants.push({ enchant: enchant.type, level: enchant.level, d: "enchants1" });
            }
            for (let enchant of EnchantsData.enchants2) {
                item.enchants.push({ enchant: enchant.type, level: enchant.level, d: "enchants2" });
            }
            for (let enchant of EnchantsData.enchants3) {
                item.enchants.push({ enchant: enchant.type, level: enchant.level, d: "enchants3" });
            }
            EnchantsData.destruct();
        }
        count++;
        inventory.push(item);
    }
    const item = {
        slot: -1,
        name: player.getOffhandSlot().getName(),
        customName: getCustomName(player.getOffhandSlot()),
        amount: player.getOffhandSlot().getAmount(),
        aux: player.getOffhandSlot().getAuxValue(),
        armor: player.getOffhandSlot().getArmorValue(),
        damage: player.getOffhandSlot().getDamageValue(),
        attack: player.getOffhandSlot().getAttackDamage(),
        lore: player.getOffhandSlot().getCustomLore(),
        enchants: [{}]
    };
    item.enchants.pop();
    if (player.getOffhandSlot().isEnchanted()) {
        let EnchantsData = player.getOffhandSlot().constructItemEnchantsFromUserData();
        for (let enchant of EnchantsData.enchants1) {
            item.enchants.push({ enchant: enchant.type, level: enchant.level, d: "enchants1" });
        }
        for (let enchant of EnchantsData.enchants2) {
            item.enchants.push({ enchant: enchant.type, level: enchant.level, d: "enchants2" });
        }
        for (let enchant of EnchantsData.enchants3) {
            item.enchants.push({ enchant: enchant.type, level: enchant.level, d: "enchants3" });
        }
        EnchantsData.destruct();
    }
    inventory.push(item);
    return inventory;
}
function setInventory(player, slots) {
    for (const data of slots) {
        const item = inventory_1.ItemStack.constructWith(data.name);
        if (data.name != "minecraft:air") {
            if (data.customName != "")
                item.setCustomName(data.customName);
            item.setAmount(data.amount);
            item.setAuxValue(data.aux);
            item.setDamageValue(data.damage);
            item.setCustomLore(data.lore);
            const Enchants = enchants_1.ItemEnchants.construct();
            for (const enchant of data.enchants) {
                let newEnchant = enchants_1.EnchantmentInstance.construct();
                newEnchant.type = enchant.type;
                newEnchant.level = enchant.level;
                if (enchant.d == "enchants1")
                    Enchants.enchants1.push(newEnchant);
                if (enchant.d == "enchants2")
                    Enchants.enchants2.push(newEnchant);
                if (enchant.d == "enchants3")
                    Enchants.enchants3.push(newEnchant);
                newEnchant.destruct();
            }
            item.saveEnchantsToUserData(Enchants);
            Enchants.destruct();
        }
        if (data.slot == -1)
            player.setOffhandSlot(item);
        else
            player.getInventory().setItem(data.slot, item, inventory_1.ContainerId.Inventory, false);
        player.sendInventory();
        item.destruct();
    }
}
function getArmor(player) {
    const inventory = [];
    for (let i = 0; i < 4; i++) {
        const slot = player.getArmor(i);
        const item = {
            slot: i,
            name: slot.getName(),
            customName: getCustomName(slot),
            amount: slot.getAmount(),
            aux: slot.getAuxValue(),
            armor: slot.getArmorValue(),
            damage: slot.getDamageValue(),
            attack: slot.getAttackDamage(),
            lore: slot.getCustomLore(),
            enchants: [{}]
        };
        item.enchants.pop();
        if (slot.isEnchanted()) {
            let EnchantsData = slot.constructItemEnchantsFromUserData();
            for (let enchant of EnchantsData.enchants1) {
                item.enchants.push({ enchant: enchant.type, level: enchant.level });
            }
            for (let enchant of EnchantsData.enchants2) {
                item.enchants.push({ enchant: enchant.type, level: enchant.level });
            }
            for (let enchant of EnchantsData.enchants3) {
                item.enchants.push({ enchant: enchant.type, level: enchant.level });
            }
            EnchantsData.destruct();
        }
        inventory.push(item);
    }
    return inventory;
}
function setArmor(player, slots) {
    for (const data of slots) {
        const item = inventory_1.ItemStack.constructWith(data.name);
        if (data.name != "minecraft:air") {
            if (data.customName != "")
                item.setCustomName(data.customName);
            item.setAmount(data.amount);
            item.setAuxValue(data.aux);
            item.setDamageValue(data.damage);
            item.setCustomLore(data.lore);
            const Enchants = enchants_1.ItemEnchants.construct();
            Enchants.slot = data.slot;
            for (const enchant of data.enchants) {
                let newEnchant = enchants_1.EnchantmentInstance.construct();
                newEnchant.type = enchant.type;
                newEnchant.level = enchant.level;
                if (enchant.d == "enchants1")
                    Enchants.enchants1.push(newEnchant);
                if (enchant.d == "enchants2")
                    Enchants.enchants2.push(newEnchant);
                if (enchant.d == "enchants3")
                    Enchants.enchants3.push(newEnchant);
                newEnchant.destruct();
            }
            item.saveEnchantsToUserData(Enchants);
            Enchants.destruct();
        }
        player.setArmor(data.slot, item);
        item.destruct();
        player.sendArmorSlot(data.slot);
    }
}
function SaveDataPlayer(player, oldWorld, newWorld) {
    let data = (0, utils_1.Json)((0, utils_1.LoadFile)(utils_1.FolderType.plugin, "users/", player.getXuid()));
    if (!data.selfWorld && !data.lastWorld) {
        data.selfWorld = serverproperties_1.serverProperties["level-name"];
        data.lastWorld = serverproperties_1.serverProperties["level-name"];
    }
    if (data.selfWorld != serverproperties_1.serverProperties["level-name"]) {
        return;
    }
    let world = Worlds.get(oldWorld);
    if (world.shared.enabled) {
        data.experienceLevel = player.getExperienceLevel();
        data.level = player.getExperience();
        data.experienceProgress = player.getExperienceProgress();
        if (world.shared.inventoryWrite) {
            data.inventory = getInventory(player);
            data.armor = getArmor(player);
        }
        data.health = player.getAttribute(attribute_1.AttributeId.Health);
        data.hunger = player.getAttribute(attribute_1.AttributeId.PlayerHunger);
        data.saturation = player.getAttribute(attribute_1.AttributeId.PlayerSaturation);
        if (world.shared.abilityWrite) {
            data.ability = {
                build: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.Build),
                mine: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.Mine),
                doorAndSwitches: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.DoorsAndSwitches),
                openContainers: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.OpenContainers),
                attackPlayers: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.AttackPlayers),
                attackMobs: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.AttackMobs),
                operatorCommands: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.OperatorCommands),
                teleport: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.Teleport),
                exposedAbilityCount: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.ExposedAbilityCount),
                invulnerable: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.Invulnerable),
                flying: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.Flying),
                mayFly: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.MayFly),
                instaBuild: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.Instabuild),
                lightning: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.Lightning),
                flySpeed: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.FlySpeed),
                walkSpeed: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.WalkSpeed),
                muted: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.Muted),
                worldBuilder: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.WorldBuilder),
                noClip: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.NoClip),
                abilityCount: player.getAbilities().getAbility(abilities_1.AbilitiesIndex.AbilityCount)
            };
        }
        data.tags = player.getTags();
        if (world.shared.effectsWrite) {
            data.effects = {
                speed: getEffect(player, effects_1.MobEffectIds.Speed),
                slowness: getEffect(player, effects_1.MobEffectIds.Slowness),
                haste: getEffect(player, effects_1.MobEffectIds.Haste),
                miningFatigue: getEffect(player, effects_1.MobEffectIds.MiningFatigue),
                strength: getEffect(player, effects_1.MobEffectIds.Strength),
                instantHealth: getEffect(player, effects_1.MobEffectIds.InstantHealth),
                instantDamage: getEffect(player, effects_1.MobEffectIds.InstantDamage),
                jumpBoost: getEffect(player, effects_1.MobEffectIds.JumpBoost),
                nausea: getEffect(player, effects_1.MobEffectIds.Nausea),
                regeneration: getEffect(player, effects_1.MobEffectIds.Regeneration),
                resistance: getEffect(player, effects_1.MobEffectIds.Resistance),
                fireResistant: getEffect(player, effects_1.MobEffectIds.FireResistant),
                waterBreathing: getEffect(player, effects_1.MobEffectIds.WaterBreathing),
                invisibility: getEffect(player, effects_1.MobEffectIds.Invisibility),
                blindness: getEffect(player, effects_1.MobEffectIds.Blindness),
                nightVision: getEffect(player, effects_1.MobEffectIds.NightVision),
                hunger: getEffect(player, effects_1.MobEffectIds.Hunger),
                weakness: getEffect(player, effects_1.MobEffectIds.Weakness),
                poison: getEffect(player, effects_1.MobEffectIds.Poison),
                wither: getEffect(player, effects_1.MobEffectIds.Wither),
                healthBoost: getEffect(player, effects_1.MobEffectIds.HealthBoost),
                absorption: getEffect(player, effects_1.MobEffectIds.Absorption),
                saturation: getEffect(player, effects_1.MobEffectIds.Saturation),
                levitation: getEffect(player, effects_1.MobEffectIds.Levitation),
                fatalPoison: getEffect(player, effects_1.MobEffectIds.FatalPoison),
                conduitPower: getEffect(player, effects_1.MobEffectIds.ConduitPower),
                slowFalling: getEffect(player, effects_1.MobEffectIds.SlowFalling),
                badOmen: getEffect(player, effects_1.MobEffectIds.BadOmen),
                heroOfTheVillage: getEffect(player, effects_1.MobEffectIds.HeroOfTheVillage)
            };
        }
    }
    data.lastWorld = oldWorld;
    data.selfWorld = newWorld;
    (0, utils_1.SaveFile)(utils_1.FolderType.plugin, "users/", player.getXuid(), (0, utils_1.Json)(data));
}
function LoadDataPlayer(player) {
    let data = (0, utils_1.Json)((0, utils_1.LoadFile)(utils_1.FolderType.plugin, "users/", player.getXuid()));
    let world = Worlds.get(data.selfWorld);
    if (world.shared.enabled) {
        player.setExperienceLevel(data.experienceLevel);
        player.setExperience(data.level);
        player.setExperienceProgress(data.experienceProgress);
        if (world.shared.inventoryRead) {
            setInventory(player, data.inventory);
            setArmor(player, data.armor);
        }
        player.setAttribute(attribute_1.AttributeId.Health, data.health);
        player.setAttribute(attribute_1.AttributeId.PlayerHunger, data.hunger);
        player.setAttribute(attribute_1.AttributeId.PlayerSaturation, data.saturation);
        if (world.shared.abilityRead) {
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.Build, data.ability.build);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.Mine, data.ability.mine);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.DoorsAndSwitches, data.ability.doorAndSwitches);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.OpenContainers, data.ability.openContainers);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.AttackPlayers, data.ability.attackPlayers);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.AttackMobs, data.ability.attackMobs);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.OperatorCommands, data.ability.operatorCommands);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.Teleport, data.ability.teleport);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.ExposedAbilityCount, data.ability.exposedAbilityCount);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.Invulnerable, data.ability.invulnerable);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.Flying, data.ability.flying);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.MayFly, data.ability.mayFly);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.Instabuild, data.ability.instaBuild);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.Lightning, data.ability.lightning);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.FlySpeed, data.ability.flySpeed);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.WalkSpeed, data.ability.walkSpeed);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.Muted, data.ability.muted);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.WorldBuilder, data.ability.worldBuilder);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.NoClip, data.ability.noClip);
            player.getAbilities().setAbility(abilities_1.AbilitiesIndex.AbilityCount, data.ability.abilityCount);
        }
        let tags = player.getTags();
        for (let tag of tags) {
            player.removeTag(tag);
        }
        for (let tag of data.tags) {
            player.addTag(tag);
        }
        if (world.shared.effectsRead) {
            player.removeAllEffects();
            for (let effect of data.effects) {
                if (effect.id > 0) {
                    player.addEffect(effects_1.MobEffectInstance.create(effect.id, effect.duration, effect.amplifier, effect.ambient, effect.showParticles, effect.displayAnimation));
                }
            }
        }
    }
}
function transferServer(player, oldWorld, newWorld, forceOnlyOperator = false) {
    let world = Worlds.get(newWorld);
    if (world) {
        if (isRunWorld(world.level_name)) {
            if (world.onlyOperator && !forceOnlyOperator) {
                if (player.getCommandPermissionLevel() != command_2.CommandPermissionLevel.Operator) {
                    player.sendMessage(`selected world only allows operators`);
                    return false;
                }
            }
            SaveDataPlayer(player, oldWorld, newWorld);
            player.transferServer(world.ip, world.port);
            //send msg player change world
            return true;
        }
    }
    return false;
}
event_1.events.playerJoin.on(ev => {
    if (!ev.isSimulated) {
        let data = (0, utils_1.Json)((0, utils_1.LoadFile)(utils_1.FolderType.plugin, "users/", ev.player.getXuid()));
        if (data.selfWorld) {
            if (data.selfWorld != serverproperties_1.serverProperties["level-name"]) {
                if (!transferServer(ev.player, serverproperties_1.serverProperties["level-name"], data.selfWorld)) {
                    ev.player.sendMessage(`[multiwrolds] the world you want to enter is not active`);
                    LoadDataPlayer(ev.player);
                }
            }
            else {
                LoadDataPlayer(ev.player);
            }
        }
    }
});
event_1.events.playerLeft.on(ev => {
    let data = (0, utils_1.Json)((0, utils_1.LoadFile)(utils_1.FolderType.plugin, "users/", ev.player.getXuid()));
    if (data.selfWorld) {
        if (data.selfWorld == serverproperties_1.serverProperties["level-name"]) {
            SaveDataPlayer(ev.player, data.lastWorld, data.selfWorld);
        }
    }
});
event_1.events.playerDimensionChange.on(ev => {
    if (ev.dimension == actor_1.DimensionId.Nether) {
        let world = Worlds.get(serverproperties_1.serverProperties["level-name"]);
        if (!world.dimensions.nether) {
            return common_1.CANCEL;
        }
    }
    if (ev.dimension == actor_1.DimensionId.TheEnd) {
        let world = Worlds.get(serverproperties_1.serverProperties["level-name"]);
        if (!world.dimensions.end) {
            return common_1.CANCEL;
        }
    }
});
command_1.command.register('changeworldplayer', "change the world to the selected player", command_2.CommandPermissionLevel.Operator).overload((param, origin, output) => {
    if (isRunWorld(param.world)) {
        for (const player of param.players.newResults(origin)) {
            transferServer(player, serverproperties_1.serverProperties["level-name"], param.world, true);
        }
        output.success(`[multiworlds] player successfully sent to ${param.world} world`);
    }
    else {
        output.error(`[multiworlds] The world ${param.world} is not active`);
    }
}, {
    players: command_2.PlayerCommandSelector,
    world: nativetype_1.CxxString
});
function listWorlds(player) {
    const form = new form_1.SimpleForm(`Worlds`);
    form.addButton(new form_1.FormButton("Main World", "url", "https://raw.githubusercontent.com/salasxd/multiworlds/main/world.jpg"), "mainworld");
    for (const world of Worlds.values()) {
        if (!world.main) {
            if (isRunWorld(world.level_name)) {
                if (!world.onlyOperator)
                    form.addButton(new form_1.FormButton(world.level_name, "url", "https://raw.githubusercontent.com/salasxd/multiworlds/main/world.jpg"), world.level_name.toLowerCase());
            }
        }
    }
    form.sendTo(player.getNetworkIdentifier(), (form, net) => {
        if (form.response) {
            if (form.response == "mainworld")
                transferServer(player, serverproperties_1.serverProperties["level-name"], mainWorld);
            else
                transferServer(player, serverproperties_1.serverProperties["level-name"], form.response);
        }
    });
}
command_1.command.register('changeworld', "change the world", command_2.CommandPermissionLevel.Normal).overload((param, origin, output) => {
    if (!origin.isServerCommandOrigin()) {
        listWorlds(origin.getEntity().getNetworkIdentifier().getActor());
    }
}, {});
function buildWorld() {
    return {
        main: false,
        level_name: serverproperties_1.serverProperties["level-name"],
        gamemode: serverproperties_1.serverProperties["gamemode"],
        difficulty: serverproperties_1.serverProperties["difficulty"],
        max_players: parseInt(serverproperties_1.serverProperties["max-players"]),
        level_type: "DEFAULT",
        level_seed: serverproperties_1.serverProperties["level-seed"],
        ip: "127.0.0.1",
        port: parseInt(serverproperties_1.serverProperties["server-port"]),
        portv6: parseInt(serverproperties_1.serverProperties["server-portv6"]),
        onlyOperator: false,
        dimensions: {
            nether: true,
            end: true
        },
        shared: {
            enabled: true,
            inventoryRead: true,
            inventoryWrite: true,
            effectsRead: true,
            effectsWrite: true,
            abilityRead: true,
            abilityWrite: true
        }
    };
}
function UINewWorld(player) {
    const form = new form_1.CustomForm(`Create world`);
    const gamemode = ["survival", "creative", "adventure"];
    const difficulty = ["easy", "normal", "hard"];
    const world = buildWorld();
    form.addComponent(new form_1.FormInput("Level Name", "Level Name", ""), "level_name");
    form.addComponent(new form_1.FormDropdown("Game Mode", gamemode, 0), "gamemode");
    form.addComponent(new form_1.FormDropdown("Difficulty", difficulty, 0), "difficulty");
    form.addComponent(new form_1.FormSlider("Max Players", 1, 100, 1, 10), "max_players");
    form.addComponent(new form_1.FormDropdown("Level Type", ["DEFAULT", "FLAT"], 0), "level_type");
    form.addComponent(new form_1.FormInput("Level Seed", "Level Seed", ""), "level_seed");
    form.addComponent(new form_1.FormInput("Port", "Port", "19132"), "port");
    form.addComponent(new form_1.FormInput("Portv6", "Portv6", "19133"), "portv6");
    form.addComponent(new form_1.FormToggle("Only Operator", false), "onlyOperator");
    form.addComponent(new form_1.FormLabel("Dimensions:"));
    form.addComponent(new form_1.FormToggle(`Nether`, true), "nether");
    form.addComponent(new form_1.FormToggle(`The End`, true), "end");
    form.addComponent(new form_1.FormDropdown("Inventory", ["Not Shared", "Only Read", "Read & Write"], 0), "inventory");
    form.addComponent(new form_1.FormLabel("Unstable (keep it to Not Shared)"));
    form.addComponent(new form_1.FormDropdown("Effects", ["Not Shared", "Only Read", "Read & Write"], 0), "effects");
    form.addComponent(new form_1.FormLabel("Unstable (keep it to Not Shared)"));
    form.addComponent(new form_1.FormDropdown("Ability", ["Not Shared", "Only Read", "Read & Write"], 0), "ability");
    form.sendTo(player.getNetworkIdentifier(), (form, net) => {
        if (form.response) {
            let main = Worlds.get(mainWorld);
            world.level_name = form.response.level_name;
            world.gamemode = gamemode[form.response.gamemode];
            world.difficulty = difficulty[form.response.difficulty];
            world.max_players = form.response.max_players;
            world.level_type = form.response.level_type;
            world.level_seed = form.response.level_seed;
            world.ip = main.ip;
            world.port = form.response.port;
            world.portv6 = form.response.portv6;
            world.onlyOperator = form.response.onlyOperator;
            world.dimensions.nether = form.response.nether;
            world.dimensions.end = form.response.end;
            switch (form.response.inventory) {
                case 0:
                    world.shared.inventoryRead = false;
                    world.shared.inventoryWrite = false;
                    break;
                case 1:
                    world.shared.inventoryRead = true;
                    world.shared.inventoryWrite = false;
                    break;
                case 2:
                    world.shared.inventoryRead = true;
                    world.shared.inventoryWrite = true;
                    break;
            }
            switch (form.response.effects) {
                case 0:
                    world.shared.effectsRead = false;
                    world.shared.effectsWrite = false;
                    break;
                case 1:
                    world.shared.effectsRead = true;
                    world.shared.effectsWrite = false;
                    break;
                case 2:
                    world.shared.effectsRead = true;
                    world.shared.effectsWrite = true;
                    break;
            }
            switch (form.response.ability) {
                case 0:
                    world.shared.abilityRead = false;
                    world.shared.abilityWrite = false;
                    break;
                case 1:
                    world.shared.abilityRead = true;
                    world.shared.abilityWrite = false;
                    break;
                case 2:
                    world.shared.abilityRead = true;
                    world.shared.abilityWrite = true;
                    break;
            }
            Worlds.set(world.level_name, world);
            saveWorlds();
            runWorlds();
            UIWorldsConfig(player);
        }
    });
}
function UIWorldConfig(player, worldName) {
    const form = new form_1.ModalForm(`Delete World`, `This action does not remove the folder from the world, it will only remove it from the list`);
    form.setButtonConfirm("Yes");
    form.setButtonCancel("Cancel");
    form.sendTo(player.getNetworkIdentifier(), (form, net) => {
        if (form.response) {
            for (let world of Worlds.keys()) {
                if (worldName == world.toLowerCase()) {
                    if (isRunWorld(world)) {
                        batWorlds.get(world).disconnect();
                        batWorlds.delete(world);
                    }
                    Worlds.delete(world);
                }
            }
            saveWorlds();
        }
        UIWorldsConfig(player);
    });
}
function UIWorldsConfig(player) {
    const form = new form_1.SimpleForm(`Worlds`);
    form.addButton(new form_1.FormButton("New World"), "newworld");
    for (const world of Worlds.values()) {
        if (!world.main)
            form.addButton(new form_1.FormButton(world.level_name, "url", "https://raw.githubusercontent.com/salasxd/multiworlds/main/world.jpg"), world.level_name.toLowerCase());
    }
    form.sendTo(player.getNetworkIdentifier(), (form, net) => {
        if (form.response) {
            if (form.response == "newworld") {
                UINewWorld(player);
            }
            else {
                UIWorldConfig(player, form.response);
            }
        }
    });
}
function UIMainWorldConfig(player, world = buildWorld()) {
    const form = new form_1.CustomForm();
    form.setTitle(`Main World`);
    form.addComponent(new form_1.FormInput(`IP`, `IP`, world.ip), "ip");
    form.addComponent(new form_1.FormInput(`Port`, `Port`, String(world.port)), "port");
    form.addComponent(new form_1.FormInput(`Portv6`, `Portv6`, String(world.portv6)), "portv6");
    form.addComponent(new form_1.FormLabel("Dimensions"));
    form.addComponent(new form_1.FormToggle(`Nether`, true), "nether");
    form.addComponent(new form_1.FormToggle(`The End`, true), "end");
    form.sendTo(player.getNetworkIdentifier(), (form, net) => {
        if (form.response) {
            world.main = true;
            world.ip = form.response.ip;
            world.port = parseInt(form.response.port);
            world.portv6 = parseInt(form.response.portv6);
            world.dimensions.nether = form.response.nether;
            world.dimensions.end = form.response.end;
            Worlds.set(world.level_name, world);
            saveWorlds();
            runWorlds();
            UIWorldsConfig(player);
        }
    });
}
command_1.command.register('worlds', "configuration of worlds", command_2.CommandPermissionLevel.Operator).overload((param, origin, output) => {
    if (!origin.isServerCommandOrigin()) {
        if (Worlds.size == 0)
            UIMainWorldConfig(origin.getEntity().getNetworkIdentifier().getActor());
        else {
            if (mainWorld == serverproperties_1.serverProperties["level-name"])
                UIWorldsConfig(origin.getEntity().getNetworkIdentifier().getActor());
            else
                output.error(`[multiworlds] you can only do this in the main world`);
        }
    }
}, {});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGl3b3JsZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtdWx0aXdvcmxkcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUFvQztBQUNwQyxtQ0FBNkk7QUFHN0ksa0RBQWlEO0FBQ2pELGtEQUFvRDtBQUNwRCw4Q0FBbUU7QUFDbkUsNERBQXlEO0FBQ3pELGlEQUFzQztBQUN0QywrQkFBNEI7QUFDNUIsMENBQXVDO0FBQ3ZDLDhDQUFpRjtBQUNqRixnREFBNEM7QUFDNUMsMENBQTZDO0FBQzdDLHdDQUFxQztBQUNyQyx3Q0FBZ0o7QUFDaEosa0RBQTREO0FBQzVELGdEQUFzRTtBQUV0RSxJQUFBLGNBQU0sRUFBQyxrQkFBVSxDQUFDLE1BQU0sRUFBQyxFQUFFLEVBQUMsT0FBTyxDQUFDLENBQUM7QUFFckMsTUFBTSxNQUFNLEdBQUcsSUFBQSxtQkFBVyxFQUFDLElBQUEsZ0JBQVEsRUFBQyxrQkFBVSxDQUFDLE1BQU0sRUFBQyxFQUFFLEVBQUMsUUFBUSxFQUFDLE1BQU0sRUFBQyxjQUFjLGtCQUFVLGFBQWEsQ0FBQyxFQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzlILE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxFQUFlLENBQUM7QUFDekMsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ2xCLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUVuQixJQUFHLElBQUEsZ0JBQVEsRUFBQyxrQkFBVSxDQUFDLEtBQUssRUFBQyxFQUFFLEVBQUMsUUFBUSxFQUFDLEtBQUssRUFBQyxFQUFFLENBQUMsSUFBSSxFQUFFO0lBQ3BELElBQUEsZ0JBQVEsRUFBQyxrQkFBVSxDQUFDLEtBQUssRUFBQyxFQUFFLEVBQUMsUUFBUSxFQUFDLElBQUEsZ0JBQVEsRUFBQyxrQkFBVSxDQUFDLEtBQUssRUFBQyxFQUFFLEVBQUMsUUFBUSxFQUFDLFlBQVksRUFBQyxFQUFFLENBQUMsRUFBQyxLQUFLLENBQUMsQ0FBQztBQUV4RyxNQUFNLFlBQVksR0FBRyxJQUFBLGdCQUFRLEVBQUMsa0JBQVUsQ0FBQyxLQUFLLEVBQUMsRUFBRSxFQUFDLFFBQVEsRUFBQyxLQUFLLEVBQUMsRUFBRSxDQUFDLENBQUM7QUE2QnJFLFNBQVMsVUFBVTtJQUNmLElBQUEsZ0JBQVEsRUFBQyxrQkFBVSxDQUFDLE1BQU0sRUFBQyxFQUFFLEVBQUMsUUFBUSxFQUFDLElBQUEsbUJBQVcsRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ2hFLENBQUM7QUFFRCxpQkFBTyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFDLGdDQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFDLEVBQUU7SUFDMUYsSUFBRyxNQUFNLENBQUMscUJBQXFCLEVBQUUsRUFBQztRQUM5QixNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsbUNBQWdCLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ2xFO0FBQ0wsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBRVAsU0FBUyxVQUFVLENBQUMsU0FBaUI7SUFDakMsSUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNuQyxJQUFHLEdBQUc7UUFBRSxPQUFPLElBQUksQ0FBQztJQUNwQixPQUFPLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBRUQsU0FBUyxTQUFTO0lBQ2QsSUFBSSxTQUFTLEdBQWdCLE1BQU0sQ0FBQyxHQUFHLENBQUMsbUNBQWdCLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUN4RSxLQUFJLElBQUksS0FBSyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBQztRQUM3QixJQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUM7WUFDVixPQUFPLFNBQVMsQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQztTQUNuRDtLQUNKO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQUVELFNBQVMsUUFBUSxDQUFDLFNBQWlCO0lBQy9CLElBQUcsS0FBSyxFQUFDO1FBQ0wsSUFBQSxhQUFLLEVBQUMsZ0JBQWdCLEVBQUUsaUJBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QyxVQUFVLENBQUMsR0FBRyxFQUFFO1lBQ1osUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hCLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNaO1NBQ0c7UUFDQSxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2IsSUFBSSxLQUFLLEdBQWdCLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDL0MsSUFBRyxDQUFDLEtBQUssRUFBQztZQUNOLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDZCxPQUFPO1NBQ1Y7UUFDRCxJQUFHLEtBQUssQ0FBQyxJQUFJLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxTQUFTLEVBQUUsRUFBQztZQUN6RCxJQUFHLEtBQUssQ0FBQyxJQUFJO2dCQUNULFNBQVMsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO1lBQ2pDLElBQUEsYUFBSyxFQUFDLFNBQVMsS0FBSyxDQUFDLFVBQVUsbUNBQW1DLEtBQUssQ0FBQyxJQUFJLFVBQVUsVUFBVSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsY0FBYyxTQUFTLEVBQUUsRUFBRSxFQUFFLGlCQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEssS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNkLE9BQU87U0FDVjtRQUVELElBQUksTUFBTSxHQUFHLFlBQVksQ0FBQztRQUMxQixNQUFNLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLG1DQUFnQixDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUMsY0FBYyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUN6RyxNQUFNLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxlQUFlLG1DQUFnQixDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUMsZUFBZSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN0RyxNQUFNLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsbUNBQWdCLENBQUMsZUFBZSxDQUFDLEVBQUUsRUFBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2hILE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFlBQVksbUNBQWdCLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNuRyxNQUFNLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLG1DQUFnQixDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDM0csTUFBTSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsZUFBZSxtQ0FBZ0IsQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQy9HLE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsbUNBQWdCLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBQyxjQUFjLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMzRyxNQUFNLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsRUFBQyxjQUFjLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNqRixNQUFNLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBQyxjQUFjLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUU5RSxJQUFBLGdCQUFRLEVBQUMsa0JBQVUsQ0FBQyxLQUFLLEVBQUMsRUFBRSxFQUFDLFFBQVEsRUFBQyxNQUFNLEVBQUMsWUFBWSxDQUFDLENBQUM7UUFFM0QsSUFBQSxhQUFLLEVBQUMsU0FBUyxLQUFLLENBQUMsVUFBVSxPQUFPLEVBQUMsaUJBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2RCxNQUFNLEdBQUcsR0FBRyxJQUFBLHFCQUFLLEVBQUMsU0FBUyxFQUFFLENBQUMsSUFBSSxFQUFDLEdBQUcsSUFBQSxXQUFJLEVBQUMsYUFBSyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBRXJFLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQVMsRUFBRSxFQUFFO1lBQ2hDLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQztZQUNqQixJQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxLQUFLLENBQUMsVUFBVSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUM7Z0JBQzlELElBQUEsZ0JBQVEsRUFBQyxrQkFBVSxDQUFDLEtBQUssRUFBQyxFQUFFLEVBQUMsUUFBUSxFQUFDLFlBQVksRUFBQyxZQUFZLENBQUMsQ0FBQztnQkFDakUsS0FBSyxHQUFHLEtBQUssQ0FBQztnQkFDZCxJQUFJLEdBQUcsSUFBSSxDQUFDO2FBQ2Y7WUFDRCxJQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDO2dCQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDaEUsSUFBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQztnQkFBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ25FLElBQUcsSUFBSTtnQkFDSCxJQUFBLGFBQUssRUFBQyxHQUFHLEtBQUssQ0FBQyxVQUFVLEtBQUssSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLEVBQUMsaUJBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4RSxDQUFDLENBQUMsQ0FBQztRQUVILEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQVMsRUFBRSxFQUFFO1lBQ2hDLElBQUEsYUFBSyxFQUFDLEdBQUcsS0FBSyxDQUFDLFVBQVUsS0FBSyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBQyxpQkFBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JFLENBQUMsQ0FBQyxDQUFDO1FBRUgsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFTLEVBQUUsRUFBRTtZQUN6QixJQUFBLGFBQUssRUFBQyxHQUFHLEtBQUssQ0FBQyxVQUFVLHFCQUFxQixJQUFJLEVBQUUsRUFBQyxpQkFBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RFLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ25DLElBQUEsZ0JBQVEsRUFBQyxrQkFBVSxDQUFDLEtBQUssRUFBQyxFQUFFLEVBQUMsUUFBUSxFQUFDLFlBQVksRUFBQyxZQUFZLENBQUMsQ0FBQztZQUNqRSxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ2xCLENBQUMsQ0FBQyxDQUFDO1FBRUgsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFN0IsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ3hDO0FBQ0wsQ0FBQztBQUVELFNBQVMsU0FBUztJQUNkLElBQUcsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEVBQUM7UUFDaEIsSUFBQSxhQUFLLEVBQUMsaUVBQWlFLEVBQUUsaUJBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUM3RjtJQUNELElBQUEsYUFBSyxFQUFDLFlBQVksRUFBRSxpQkFBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3JDLEtBQUksSUFBSSxLQUFLLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFDO1FBQzdCLFFBQVEsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDOUI7QUFDTCxDQUFDO0FBRUQsaUJBQU8sQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLEVBQUUsRUFBQyxnQ0FBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBQyxFQUFFO0lBQzdGLElBQUcsTUFBTSxDQUFDLHFCQUFxQixFQUFFLEVBQUM7UUFDOUIsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2xCLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hDLEtBQUksSUFBSSxLQUFLLElBQUksTUFBTSxFQUFDO1lBQ3BCLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNCLElBQUEsYUFBSyxFQUFDLGdCQUFnQixFQUFFLGlCQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDNUM7S0FDSjtBQUNMLENBQUMsRUFBRTtJQUNDLFNBQVMsRUFBRSxzQkFBUztDQUN2QixDQUFDLENBQUM7QUFFSCxTQUFTLGdCQUFnQjtJQUNyQixJQUFBLGFBQUssRUFBQyxtQkFBbUIsRUFBRSxpQkFBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzVDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUVoQixNQUFNLENBQUMsSUFBSSxDQUFDLG1DQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDNUMsS0FBSSxJQUFJLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLEVBQUM7UUFDNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNwQjtJQUVELEtBQUksSUFBSSxHQUFHLElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFDO1FBQzlCLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLGVBQWUsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztLQUN0RDtBQUNMLENBQUM7QUFFRCxTQUFTLEVBQUUsQ0FBQztBQUVaLElBQUcsQ0FBQyxTQUFTLEVBQUUsRUFBQztJQUNaLFdBQVcsQ0FBQyxHQUFHLEVBQUU7UUFDYixnQkFBZ0IsRUFBRSxDQUFDO0lBQ3ZCLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztDQUNaO0FBRUQsU0FBUyxTQUFTLENBQUMsTUFBYyxFQUFFLE1BQW9CO0lBQ25ELElBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBQztRQUN4QixJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRSxDQUFDO1FBQ3pDLE9BQU87WUFDSCxFQUFFLEVBQUUsUUFBUSxDQUFDLEVBQUU7WUFDZixRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVE7WUFDM0IsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTO1lBQzdCLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTztZQUN6QixhQUFhLEVBQUUsUUFBUSxDQUFDLGFBQWE7WUFDckMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLGdCQUFnQjtTQUM5QyxDQUFDO0tBQ0w7SUFDRCxPQUFPLEVBQUMsRUFBRSxFQUFFLENBQUMsRUFBQyxDQUFDO0FBQ25CLENBQUM7QUFFRCxTQUFTLGFBQWEsQ0FBQyxJQUFlO0lBQ2xDLElBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRTtRQUNuQixPQUFPLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUNoQyxPQUFPLEVBQUUsQ0FBQztBQUNkLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBQyxNQUFjO0lBQ2hDLE1BQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQztJQUNyQixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDZCxLQUFJLE1BQU0sSUFBSSxJQUFJLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUM7UUFDekQsTUFBTSxJQUFJLEdBQ1Y7WUFDSSxJQUFJLEVBQUUsS0FBSztZQUNYLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ3BCLFVBQVUsRUFBRSxhQUFhLENBQUMsSUFBSSxDQUFDO1lBQy9CLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ3hCLEdBQUcsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3ZCLEtBQUssRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQzNCLE1BQU0sRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQzdCLE1BQU0sRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFO1lBQzlCLElBQUksRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQzFCLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQztTQUNqQixDQUFDO1FBQ0YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNwQixJQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBQztZQUNsQixJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsaUNBQWlDLEVBQUcsQ0FBQztZQUM3RCxLQUFJLElBQUksT0FBTyxJQUFJLFlBQVksQ0FBQyxTQUFTLEVBQUM7Z0JBQ3RDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUMsT0FBTyxFQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUMsS0FBSyxFQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUMsQ0FBQyxFQUFDLFdBQVcsRUFBQyxDQUFDLENBQUM7YUFDaEY7WUFDRCxLQUFJLElBQUksT0FBTyxJQUFJLFlBQVksQ0FBQyxTQUFTLEVBQUM7Z0JBQ3RDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUMsT0FBTyxFQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUMsS0FBSyxFQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUMsQ0FBQyxFQUFDLFdBQVcsRUFBQyxDQUFDLENBQUM7YUFDaEY7WUFDRCxLQUFJLElBQUksT0FBTyxJQUFJLFlBQVksQ0FBQyxTQUFTLEVBQUM7Z0JBQ3RDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUMsT0FBTyxFQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUMsS0FBSyxFQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUMsQ0FBQyxFQUFDLFdBQVcsRUFBQyxDQUFDLENBQUM7YUFDaEY7WUFDRCxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7U0FDM0I7UUFDRCxLQUFLLEVBQUUsQ0FBQztRQUNSLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDeEI7SUFDRCxNQUFNLElBQUksR0FDVjtRQUNJLElBQUksRUFBRSxDQUFDLENBQUM7UUFDUixJQUFJLEVBQUUsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLE9BQU8sRUFBRTtRQUN2QyxVQUFVLEVBQUUsYUFBYSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNsRCxNQUFNLEVBQUUsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLFNBQVMsRUFBRTtRQUMzQyxHQUFHLEVBQUUsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLFdBQVcsRUFBRTtRQUMxQyxLQUFLLEVBQUUsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLGFBQWEsRUFBRTtRQUM5QyxNQUFNLEVBQUUsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLGNBQWMsRUFBRTtRQUNoRCxNQUFNLEVBQUUsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLGVBQWUsRUFBRTtRQUNqRCxJQUFJLEVBQUUsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLGFBQWEsRUFBRTtRQUM3QyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUM7S0FDakIsQ0FBQztJQUNGLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDcEIsSUFBRyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUMsV0FBVyxFQUFFLEVBQUM7UUFDckMsSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLGlDQUFpQyxFQUFHLENBQUM7UUFDaEYsS0FBSSxJQUFJLE9BQU8sSUFBSSxZQUFZLENBQUMsU0FBUyxFQUFDO1lBQ3RDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUMsT0FBTyxFQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUMsS0FBSyxFQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUMsQ0FBQyxFQUFDLFdBQVcsRUFBQyxDQUFDLENBQUM7U0FDaEY7UUFDRCxLQUFJLElBQUksT0FBTyxJQUFJLFlBQVksQ0FBQyxTQUFTLEVBQUM7WUFDdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBQyxPQUFPLEVBQUMsT0FBTyxDQUFDLElBQUksRUFBQyxLQUFLLEVBQUMsT0FBTyxDQUFDLEtBQUssRUFBQyxDQUFDLEVBQUMsV0FBVyxFQUFDLENBQUMsQ0FBQztTQUNoRjtRQUNELEtBQUksSUFBSSxPQUFPLElBQUksWUFBWSxDQUFDLFNBQVMsRUFBQztZQUN0QyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFDLE9BQU8sRUFBQyxPQUFPLENBQUMsSUFBSSxFQUFDLEtBQUssRUFBQyxPQUFPLENBQUMsS0FBSyxFQUFDLENBQUMsRUFBQyxXQUFXLEVBQUMsQ0FBQyxDQUFDO1NBQ2hGO1FBQ0QsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQzNCO0lBQ0QsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQixPQUFPLFNBQVMsQ0FBQztBQUNyQixDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUMsTUFBYyxFQUFFLEtBQVU7SUFDNUMsS0FBSSxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUM7UUFDcEIsTUFBTSxJQUFJLEdBQUcscUJBQVMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hELElBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxlQUFlLEVBQUM7WUFDNUIsSUFBRyxJQUFJLENBQUMsVUFBVSxJQUFJLEVBQUU7Z0JBQ3BCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlCLE1BQU0sUUFBUSxHQUFHLHVCQUFZLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDMUMsS0FBSSxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFDO2dCQUMvQixJQUFJLFVBQVUsR0FBRyw4QkFBbUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDakQsVUFBVSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUMvQixVQUFVLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7Z0JBQ2pDLElBQUcsT0FBTyxDQUFDLENBQUMsSUFBSSxXQUFXO29CQUN2QixRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDeEMsSUFBRyxPQUFPLENBQUMsQ0FBQyxJQUFJLFdBQVc7b0JBQ3ZCLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN4QyxJQUFHLE9BQU8sQ0FBQyxDQUFDLElBQUksV0FBVztvQkFDdkIsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3hDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQzthQUN6QjtZQUNELElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0QyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7U0FDdkI7UUFDRCxJQUFHLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO1lBQ2QsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7WUFFNUIsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSx1QkFBVyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNqRixNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDdkIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQ25CO0FBQ0wsQ0FBQztBQUVELFNBQVMsUUFBUSxDQUFDLE1BQWM7SUFDNUIsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ3JCLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFFLEVBQUM7UUFDaEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoQyxNQUFNLElBQUksR0FDVjtZQUNJLElBQUksRUFBRSxDQUFDO1lBQ1AsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDcEIsVUFBVSxFQUFFLGFBQWEsQ0FBQyxJQUFJLENBQUM7WUFDL0IsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDeEIsR0FBRyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDdkIsS0FBSyxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDM0IsTUFBTSxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUU7WUFDN0IsTUFBTSxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUU7WUFDOUIsSUFBSSxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDMUIsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDO1NBQ2pCLENBQUM7UUFDRixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLElBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFDO1lBQ2xCLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxpQ0FBaUMsRUFBRyxDQUFDO1lBQzdELEtBQUksSUFBSSxPQUFPLElBQUksWUFBWSxDQUFDLFNBQVMsRUFBQztnQkFDdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBQyxPQUFPLEVBQUMsT0FBTyxDQUFDLElBQUksRUFBQyxLQUFLLEVBQUMsT0FBTyxDQUFDLEtBQUssRUFBQyxDQUFDLENBQUM7YUFDbEU7WUFDRCxLQUFJLElBQUksT0FBTyxJQUFJLFlBQVksQ0FBQyxTQUFTLEVBQUM7Z0JBQ3RDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUMsT0FBTyxFQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUMsS0FBSyxFQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUMsQ0FBQyxDQUFDO2FBQ2xFO1lBQ0QsS0FBSSxJQUFJLE9BQU8sSUFBSSxZQUFZLENBQUMsU0FBUyxFQUFDO2dCQUN0QyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFDLE9BQU8sRUFBQyxPQUFPLENBQUMsSUFBSSxFQUFDLEtBQUssRUFBQyxPQUFPLENBQUMsS0FBSyxFQUFDLENBQUMsQ0FBQzthQUNsRTtZQUNELFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUMzQjtRQUNELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDeEI7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNyQixDQUFDO0FBRUQsU0FBUyxRQUFRLENBQUMsTUFBYyxFQUFFLEtBQVU7SUFDeEMsS0FBSSxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUM7UUFDcEIsTUFBTSxJQUFJLEdBQUcscUJBQVMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hELElBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxlQUFlLEVBQUM7WUFDNUIsSUFBRyxJQUFJLENBQUMsVUFBVSxJQUFJLEVBQUU7Z0JBQ3BCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlCLE1BQU0sUUFBUSxHQUFHLHVCQUFZLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDMUMsUUFBUSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQzFCLEtBQUksTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBQztnQkFDL0IsSUFBSSxVQUFVLEdBQUcsOEJBQW1CLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2pELFVBQVUsQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztnQkFDL0IsVUFBVSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO2dCQUNqQyxJQUFHLE9BQU8sQ0FBQyxDQUFDLElBQUksV0FBVztvQkFDdkIsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3hDLElBQUcsT0FBTyxDQUFDLENBQUMsSUFBSSxXQUFXO29CQUN2QixRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDeEMsSUFBRyxPQUFPLENBQUMsQ0FBQyxJQUFJLFdBQVc7b0JBQ3ZCLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN4QyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDekI7WUFDRCxJQUFJLENBQUMsc0JBQXNCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdEMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQ3ZCO1FBQ0QsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNoQixNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNuQztBQUNMLENBQUM7QUFFRCxTQUFTLGNBQWMsQ0FBQyxNQUFjLEVBQUUsUUFBZ0IsRUFBRSxRQUFnQjtJQUN0RSxJQUFJLElBQUksR0FBRyxJQUFBLFlBQUksRUFBQyxJQUFBLGdCQUFRLEVBQUMsa0JBQVUsQ0FBQyxNQUFNLEVBQUMsUUFBUSxFQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFdkUsSUFBRyxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFDO1FBQ2xDLElBQUksQ0FBQyxTQUFTLEdBQUcsbUNBQWdCLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxtQ0FBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUNuRDtJQUVELElBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxtQ0FBZ0IsQ0FBQyxZQUFZLENBQUMsRUFBQztRQUNoRCxPQUFPO0tBQ1Y7SUFFRCxJQUFJLEtBQUssR0FBaUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUUvQyxJQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFDO1FBQ3BCLElBQUksQ0FBQyxlQUFlLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDbkQsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDcEMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBQ3pELElBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUM7WUFDM0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDakM7UUFDRCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsdUJBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0RCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsdUJBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM1RCxJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsdUJBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3BFLElBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUM7WUFDekIsSUFBSSxDQUFDLE9BQU8sR0FBRztnQkFDWCxLQUFLLEVBQUUsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsQ0FBQywwQkFBYyxDQUFDLEtBQUssQ0FBQztnQkFDN0QsSUFBSSxFQUFFLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxJQUFJLENBQUM7Z0JBQzNELGVBQWUsRUFBRSxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLDBCQUFjLENBQUMsZ0JBQWdCLENBQUM7Z0JBQ2xGLGNBQWMsRUFBRSxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLDBCQUFjLENBQUMsY0FBYyxDQUFDO2dCQUMvRSxhQUFhLEVBQUUsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsQ0FBQywwQkFBYyxDQUFDLGFBQWEsQ0FBQztnQkFDN0UsVUFBVSxFQUFFLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxVQUFVLENBQUM7Z0JBQ3ZFLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDbkYsUUFBUSxFQUFFLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxRQUFRLENBQUM7Z0JBQ25FLG1CQUFtQixFQUFFLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxtQkFBbUIsQ0FBQztnQkFDekYsWUFBWSxFQUFFLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxZQUFZLENBQUM7Z0JBQzNFLE1BQU0sRUFBRSxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLDBCQUFjLENBQUMsTUFBTSxDQUFDO2dCQUMvRCxNQUFNLEVBQUUsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsQ0FBQywwQkFBYyxDQUFDLE1BQU0sQ0FBQztnQkFDL0QsVUFBVSxFQUFFLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxVQUFVLENBQUM7Z0JBQ3ZFLFNBQVMsRUFBRSxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLDBCQUFjLENBQUMsU0FBUyxDQUFDO2dCQUNyRSxRQUFRLEVBQUUsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsQ0FBQywwQkFBYyxDQUFDLFFBQVEsQ0FBQztnQkFDbkUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxTQUFTLENBQUM7Z0JBQ3JFLEtBQUssRUFBRSxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLDBCQUFjLENBQUMsS0FBSyxDQUFDO2dCQUM3RCxZQUFZLEVBQUUsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsQ0FBQywwQkFBYyxDQUFDLFlBQVksQ0FBQztnQkFDM0UsTUFBTSxFQUFFLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxNQUFNLENBQUM7Z0JBQy9ELFlBQVksRUFBRSxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLDBCQUFjLENBQUMsWUFBWSxDQUFDO2FBQzlFLENBQUE7U0FDSjtRQUNELElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzdCLElBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUM7WUFDekIsSUFBSSxDQUFDLE9BQU8sR0FBRztnQkFDWCxLQUFLLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxzQkFBWSxDQUFDLEtBQUssQ0FBQztnQkFDNUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsc0JBQVksQ0FBQyxRQUFRLENBQUM7Z0JBQ2xELEtBQUssRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLHNCQUFZLENBQUMsS0FBSyxDQUFDO2dCQUM1QyxhQUFhLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxzQkFBWSxDQUFDLGFBQWEsQ0FBQztnQkFDNUQsUUFBUSxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsc0JBQVksQ0FBQyxRQUFRLENBQUM7Z0JBQ2xELGFBQWEsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLHNCQUFZLENBQUMsYUFBYSxDQUFDO2dCQUM1RCxhQUFhLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxzQkFBWSxDQUFDLGFBQWEsQ0FBQztnQkFDNUQsU0FBUyxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsc0JBQVksQ0FBQyxTQUFTLENBQUM7Z0JBQ3BELE1BQU0sRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLHNCQUFZLENBQUMsTUFBTSxDQUFDO2dCQUM5QyxZQUFZLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxzQkFBWSxDQUFDLFlBQVksQ0FBQztnQkFDMUQsVUFBVSxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsc0JBQVksQ0FBQyxVQUFVLENBQUM7Z0JBQ3RELGFBQWEsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLHNCQUFZLENBQUMsYUFBYSxDQUFDO2dCQUM1RCxjQUFjLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxzQkFBWSxDQUFDLGNBQWMsQ0FBQztnQkFDOUQsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsc0JBQVksQ0FBQyxZQUFZLENBQUM7Z0JBQzFELFNBQVMsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLHNCQUFZLENBQUMsU0FBUyxDQUFDO2dCQUNwRCxXQUFXLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxzQkFBWSxDQUFDLFdBQVcsQ0FBQztnQkFDeEQsTUFBTSxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsc0JBQVksQ0FBQyxNQUFNLENBQUM7Z0JBQzlDLFFBQVEsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLHNCQUFZLENBQUMsUUFBUSxDQUFDO2dCQUNsRCxNQUFNLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxzQkFBWSxDQUFDLE1BQU0sQ0FBQztnQkFDOUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsc0JBQVksQ0FBQyxNQUFNLENBQUM7Z0JBQzlDLFdBQVcsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLHNCQUFZLENBQUMsV0FBVyxDQUFDO2dCQUN4RCxVQUFVLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxzQkFBWSxDQUFDLFVBQVUsQ0FBQztnQkFDdEQsVUFBVSxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsc0JBQVksQ0FBQyxVQUFVLENBQUM7Z0JBQ3RELFVBQVUsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLHNCQUFZLENBQUMsVUFBVSxDQUFDO2dCQUN0RCxXQUFXLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxzQkFBWSxDQUFDLFdBQVcsQ0FBQztnQkFDeEQsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsc0JBQVksQ0FBQyxZQUFZLENBQUM7Z0JBQzFELFdBQVcsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLHNCQUFZLENBQUMsV0FBVyxDQUFDO2dCQUN4RCxPQUFPLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxzQkFBWSxDQUFDLE9BQU8sQ0FBQztnQkFDaEQsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxzQkFBWSxDQUFDLGdCQUFnQixDQUFDO2FBQ3JFLENBQUE7U0FDSjtLQUNKO0lBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7SUFDMUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7SUFDMUIsSUFBQSxnQkFBUSxFQUFDLGtCQUFVLENBQUMsTUFBTSxFQUFDLFFBQVEsRUFBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEVBQUUsSUFBQSxZQUFJLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUN0RSxDQUFDO0FBRUQsU0FBUyxjQUFjLENBQUMsTUFBYztJQUNsQyxJQUFJLElBQUksR0FBRyxJQUFBLFlBQUksRUFBQyxJQUFBLGdCQUFRLEVBQUMsa0JBQVUsQ0FBQyxNQUFNLEVBQUMsUUFBUSxFQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFdkUsSUFBSSxLQUFLLEdBQWlCLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRXJELElBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUM7UUFDcEIsTUFBTSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNoRCxNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQyxNQUFNLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDdEQsSUFBRyxLQUFLLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBQztZQUMxQixZQUFZLENBQUMsTUFBTSxFQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNwQyxRQUFRLENBQUMsTUFBTSxFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUMvQjtRQUNELE1BQU0sQ0FBQyxZQUFZLENBQUMsdUJBQVcsQ0FBQyxNQUFNLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BELE1BQU0sQ0FBQyxZQUFZLENBQUMsdUJBQVcsQ0FBQyxZQUFZLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzFELE1BQU0sQ0FBQyxZQUFZLENBQUMsdUJBQVcsQ0FBQyxnQkFBZ0IsRUFBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbEUsSUFBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBQztZQUN4QixNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLDBCQUFjLENBQUMsS0FBSyxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUUsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsQ0FBQywwQkFBYyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxnQkFBZ0IsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQy9GLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxjQUFjLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUM1RixNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLDBCQUFjLENBQUMsYUFBYSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDMUYsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsQ0FBQywwQkFBYyxDQUFDLFVBQVUsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxnQkFBZ0IsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDaEcsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsQ0FBQywwQkFBYyxDQUFDLFFBQVEsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxtQkFBbUIsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDdEcsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsQ0FBQywwQkFBYyxDQUFDLFlBQVksRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3hGLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxNQUFNLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLDBCQUFjLENBQUMsTUFBTSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUUsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsQ0FBQywwQkFBYyxDQUFDLFVBQVUsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxTQUFTLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLDBCQUFjLENBQUMsUUFBUSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEYsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsQ0FBQywwQkFBYyxDQUFDLFNBQVMsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxLQUFLLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxRSxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLDBCQUFjLENBQUMsWUFBWSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDeEYsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsQ0FBQywwQkFBYyxDQUFDLE1BQU0sRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsMEJBQWMsQ0FBQyxZQUFZLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUMzRjtRQUNELElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM1QixLQUFJLElBQUksR0FBRyxJQUFJLElBQUksRUFBQztZQUNoQixNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3pCO1FBQ0QsS0FBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFDO1lBQ3JCLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDdEI7UUFDRCxJQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFDO1lBQ3hCLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQzFCLEtBQUksSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBQztnQkFDM0IsSUFBRyxNQUFNLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBQztvQkFDYixNQUFNLENBQUMsU0FBUyxDQUFDLDJCQUFpQixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUMsTUFBTSxDQUFDLFNBQVMsRUFBQyxNQUFNLENBQUMsT0FBTyxFQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztpQkFDdEo7YUFDSjtTQUNKO0tBQ0o7QUFDTCxDQUFDO0FBRUQsU0FBUyxjQUFjLENBQUMsTUFBYyxFQUFFLFFBQWdCLEVBQUUsUUFBZ0IsRUFBRSxvQkFBNkIsS0FBSztJQUMxRyxJQUFJLEtBQUssR0FBaUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUUvQyxJQUFHLEtBQUssRUFBQztRQUNMLElBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBQztZQUM1QixJQUFHLEtBQUssQ0FBQyxZQUFZLElBQUksQ0FBQyxpQkFBaUIsRUFBQztnQkFDeEMsSUFBRyxNQUFNLENBQUMseUJBQXlCLEVBQUUsSUFBSSxnQ0FBc0IsQ0FBQyxRQUFRLEVBQUM7b0JBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsc0NBQXNDLENBQUMsQ0FBQztvQkFDM0QsT0FBTyxLQUFLLENBQUM7aUJBQ2hCO2FBQ0o7WUFDRCxjQUFjLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVDLDhCQUE4QjtZQUM5QixPQUFPLElBQUksQ0FBQztTQUNmO0tBQ0o7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBRUQsY0FBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7SUFDdEIsSUFBRyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUM7UUFDZixJQUFJLElBQUksR0FBRyxJQUFBLFlBQUksRUFBQyxJQUFBLGdCQUFRLEVBQUMsa0JBQVUsQ0FBQyxNQUFNLEVBQUMsUUFBUSxFQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFFLElBQUcsSUFBSSxDQUFDLFNBQVMsRUFBQztZQUNkLElBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxtQ0FBZ0IsQ0FBQyxZQUFZLENBQUMsRUFBQztnQkFDaEQsSUFBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLG1DQUFnQixDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBQztvQkFDMUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMseURBQXlELENBQUMsQ0FBQztvQkFDakYsY0FBYyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDN0I7YUFDSjtpQkFDRztnQkFDQSxjQUFjLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQzdCO1NBQ0o7S0FDSjtBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUgsY0FBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7SUFDdEIsSUFBSSxJQUFJLEdBQUcsSUFBQSxZQUFJLEVBQUMsSUFBQSxnQkFBUSxFQUFDLGtCQUFVLENBQUMsTUFBTSxFQUFDLFFBQVEsRUFBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMxRSxJQUFHLElBQUksQ0FBQyxTQUFTLEVBQUM7UUFDZCxJQUFHLElBQUksQ0FBQyxTQUFTLElBQUksbUNBQWdCLENBQUMsWUFBWSxDQUFDLEVBQUM7WUFDaEQsY0FBYyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDN0Q7S0FDSjtBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUgsY0FBTSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtJQUNqQyxJQUFHLEVBQUUsQ0FBQyxTQUFTLElBQUksbUJBQVcsQ0FBQyxNQUFNLEVBQUM7UUFDbEMsSUFBSSxLQUFLLEdBQWlCLE1BQU0sQ0FBQyxHQUFHLENBQUMsbUNBQWdCLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUVyRSxJQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUM7WUFDeEIsT0FBTyxlQUFNLENBQUM7U0FDakI7S0FDSjtJQUNELElBQUcsRUFBRSxDQUFDLFNBQVMsSUFBSSxtQkFBVyxDQUFDLE1BQU0sRUFBQztRQUNsQyxJQUFJLEtBQUssR0FBaUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxtQ0FBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBRXJFLElBQUcsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBQztZQUNyQixPQUFPLGVBQU0sQ0FBQztTQUNqQjtLQUNKO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFSCxpQkFBTyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSx5Q0FBeUMsRUFBQyxnQ0FBc0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBQyxFQUFFO0lBQy9JLElBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBQztRQUN2QixLQUFLLE1BQU0sTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ25ELGNBQWMsQ0FBQyxNQUFNLEVBQUMsbUNBQWdCLENBQUMsWUFBWSxDQUFDLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztTQUM1RTtRQUNELE1BQU0sQ0FBQyxPQUFPLENBQUMsNkNBQTZDLEtBQUssQ0FBQyxLQUFLLFFBQVEsQ0FBQyxDQUFDO0tBQ3BGO1NBQ0c7UUFDQSxNQUFNLENBQUMsS0FBSyxDQUFDLDJCQUEyQixLQUFLLENBQUMsS0FBSyxnQkFBZ0IsQ0FBQyxDQUFDO0tBQ3hFO0FBQ0wsQ0FBQyxFQUFFO0lBQ0MsT0FBTyxFQUFFLCtCQUFxQjtJQUM5QixLQUFLLEVBQUUsc0JBQVM7Q0FDbkIsQ0FBQyxDQUFDO0FBRUgsU0FBUyxVQUFVLENBQUMsTUFBYztJQUM5QixNQUFNLElBQUksR0FBRyxJQUFJLGlCQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGlCQUFVLENBQUMsWUFBWSxFQUFDLEtBQUssRUFBQyxzRUFBc0UsQ0FBQyxFQUFDLFdBQVcsQ0FBQyxDQUFDO0lBRXRJLEtBQUksTUFBTSxLQUFLLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFDO1FBQy9CLElBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFDO1lBQ1gsSUFBRyxVQUFVLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFDO2dCQUM1QixJQUFHLENBQUMsS0FBSyxDQUFDLFlBQVk7b0JBQ2xCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxpQkFBVSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUMsS0FBSyxFQUFDLHNFQUFzRSxDQUFDLEVBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO2FBQ3BLO1NBQ0o7S0FDSjtJQUVELElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLG9CQUFvQixFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFDLEVBQUU7UUFDcEQsSUFBRyxJQUFJLENBQUMsUUFBUSxFQUFDO1lBQ2IsSUFBRyxJQUFJLENBQUMsUUFBUSxJQUFJLFdBQVc7Z0JBQzNCLGNBQWMsQ0FBQyxNQUFNLEVBQUMsbUNBQWdCLENBQUMsWUFBWSxDQUFDLEVBQUMsU0FBUyxDQUFDLENBQUM7O2dCQUVoRSxjQUFjLENBQUMsTUFBTSxFQUFDLG1DQUFnQixDQUFDLFlBQVksQ0FBQyxFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUMzRTtJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUVELGlCQUFPLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxrQkFBa0IsRUFBQyxnQ0FBc0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBQyxFQUFFO0lBQ2hILElBQUcsQ0FBQyxNQUFNLENBQUMscUJBQXFCLEVBQUUsRUFBQztRQUMvQixVQUFVLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRyxDQUFDLG9CQUFvQixFQUFHLENBQUMsUUFBUSxFQUFHLENBQUMsQ0FBQztLQUN2RTtBQUNMLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUVQLFNBQVMsVUFBVTtJQUNmLE9BQU87UUFDSCxJQUFJLEVBQUUsS0FBSztRQUNYLFVBQVUsRUFBRSxtQ0FBZ0IsQ0FBQyxZQUFZLENBQUM7UUFDMUMsUUFBUSxFQUFFLG1DQUFnQixDQUFDLFVBQVUsQ0FBQztRQUN0QyxVQUFVLEVBQUUsbUNBQWdCLENBQUMsWUFBWSxDQUFDO1FBQzFDLFdBQVcsRUFBRSxRQUFRLENBQUMsbUNBQWdCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDdEQsVUFBVSxFQUFFLFNBQVM7UUFDckIsVUFBVSxFQUFFLG1DQUFnQixDQUFDLFlBQVksQ0FBQztRQUMxQyxFQUFFLEVBQUUsV0FBVztRQUNmLElBQUksRUFBRSxRQUFRLENBQUMsbUNBQWdCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDL0MsTUFBTSxFQUFFLFFBQVEsQ0FBQyxtQ0FBZ0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNuRCxZQUFZLEVBQUUsS0FBSztRQUNuQixVQUFVLEVBQUU7WUFDUixNQUFNLEVBQUUsSUFBSTtZQUNaLEdBQUcsRUFBRSxJQUFJO1NBQ1o7UUFDRCxNQUFNLEVBQUU7WUFDSixPQUFPLEVBQUUsSUFBSTtZQUNiLGFBQWEsRUFBRSxJQUFJO1lBQ25CLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLFlBQVksRUFBRSxJQUFJO1NBQ3JCO0tBQ0osQ0FBQTtBQUNMLENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBQyxNQUFjO0lBQzlCLE1BQU0sSUFBSSxHQUFHLElBQUksaUJBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUM1QyxNQUFNLFFBQVEsR0FBRyxDQUFDLFVBQVUsRUFBQyxVQUFVLEVBQUMsV0FBVyxDQUFDLENBQUM7SUFDckQsTUFBTSxVQUFVLEdBQUcsQ0FBQyxNQUFNLEVBQUMsUUFBUSxFQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzVDLE1BQU0sS0FBSyxHQUFpQixVQUFVLEVBQUUsQ0FBQztJQUN6QyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksZ0JBQVMsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQy9FLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxtQkFBWSxDQUFDLFdBQVcsRUFBQyxRQUFRLEVBQUMsQ0FBQyxDQUFDLEVBQUMsVUFBVSxDQUFDLENBQUM7SUFDdkUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLG1CQUFZLENBQUMsWUFBWSxFQUFDLFVBQVUsRUFBQyxDQUFDLENBQUMsRUFBQyxZQUFZLENBQUMsQ0FBQztJQUM1RSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksaUJBQVUsQ0FBQyxhQUFhLEVBQUMsQ0FBQyxFQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLEVBQUMsYUFBYSxDQUFDLENBQUM7SUFDMUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLG1CQUFZLENBQUMsWUFBWSxFQUFDLENBQUMsU0FBUyxFQUFDLE1BQU0sQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3BGLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxnQkFBUyxDQUFDLFlBQVksRUFBQyxZQUFZLEVBQUMsRUFBRSxDQUFDLEVBQUMsWUFBWSxDQUFDLENBQUM7SUFDNUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLGdCQUFTLENBQUMsTUFBTSxFQUFDLE1BQU0sRUFBQyxPQUFPLENBQUMsRUFBQyxNQUFNLENBQUMsQ0FBQztJQUMvRCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksZ0JBQVMsQ0FBQyxRQUFRLEVBQUMsUUFBUSxFQUFDLE9BQU8sQ0FBQyxFQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3JFLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxpQkFBVSxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsRUFBQyxjQUFjLENBQUMsQ0FBQztJQUN6RSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksZ0JBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBQ2hELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxpQkFBVSxDQUFDLFFBQVEsRUFBQyxJQUFJLENBQUMsRUFBQyxRQUFRLENBQUMsQ0FBQztJQUMxRCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksaUJBQVUsQ0FBQyxTQUFTLEVBQUMsSUFBSSxDQUFDLEVBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLG1CQUFZLENBQUMsV0FBVyxFQUFDLENBQUMsWUFBWSxFQUFDLFdBQVcsRUFBQyxjQUFjLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxXQUFXLENBQUMsQ0FBQztJQUN6RyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksZ0JBQVMsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLENBQUM7SUFDckUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLG1CQUFZLENBQUMsU0FBUyxFQUFDLENBQUMsWUFBWSxFQUFDLFdBQVcsRUFBQyxjQUFjLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxTQUFTLENBQUMsQ0FBQztJQUNyRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksZ0JBQVMsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLENBQUM7SUFDckUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLG1CQUFZLENBQUMsU0FBUyxFQUFDLENBQUMsWUFBWSxFQUFDLFdBQVcsRUFBQyxjQUFjLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxTQUFTLENBQUMsQ0FBQztJQUNyRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBQyxFQUFFO1FBQ3BELElBQUcsSUFBSSxDQUFDLFFBQVEsRUFBQztZQUNiLElBQUksSUFBSSxHQUFnQixNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzlDLEtBQUssQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7WUFDNUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsRCxLQUFLLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3hELEtBQUssQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUM7WUFDOUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztZQUM1QyxLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO1lBQzVDLEtBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNuQixLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO1lBQ2hDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7WUFDcEMsS0FBSyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQztZQUNoRCxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUMvQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQztZQUV6QyxRQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFDO2dCQUMzQixLQUFLLENBQUM7b0JBQ0YsS0FBSyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO29CQUNuQyxLQUFLLENBQUMsTUFBTSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7b0JBQ3hDLE1BQU07Z0JBQ04sS0FBSyxDQUFDO29CQUNGLEtBQUssQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztvQkFDbEMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO29CQUN4QyxNQUFNO2dCQUNOLEtBQUssQ0FBQztvQkFDRixLQUFLLENBQUMsTUFBTSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7b0JBQ2xDLEtBQUssQ0FBQyxNQUFNLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztvQkFDdkMsTUFBTTthQUNUO1lBRUQsUUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBQztnQkFDekIsS0FBSyxDQUFDO29CQUNGLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztvQkFDakMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO29CQUN0QyxNQUFNO2dCQUNOLEtBQUssQ0FBQztvQkFDRixLQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7b0JBQ2hDLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztvQkFDdEMsTUFBTTtnQkFDTixLQUFLLENBQUM7b0JBQ0YsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO29CQUNoQyxLQUFLLENBQUMsTUFBTSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7b0JBQ3JDLE1BQU07YUFDVDtZQUVELFFBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUM7Z0JBQ3pCLEtBQUssQ0FBQztvQkFDRixLQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7b0JBQ2pDLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztvQkFDdEMsTUFBTTtnQkFDTixLQUFLLENBQUM7b0JBQ0YsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO29CQUNoQyxLQUFLLENBQUMsTUFBTSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7b0JBQ3RDLE1BQU07Z0JBQ04sS0FBSyxDQUFDO29CQUNGLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztvQkFDaEMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO29CQUNyQyxNQUFNO2FBQ1Q7WUFFRCxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDcEMsVUFBVSxFQUFFLENBQUM7WUFDYixTQUFTLEVBQUUsQ0FBQztZQUNaLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUMxQjtJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLE1BQWMsRUFBRSxTQUFpQjtJQUNwRCxNQUFNLElBQUksR0FBRyxJQUFJLGdCQUFTLENBQUMsY0FBYyxFQUFDLDZGQUE2RixDQUFDLENBQUM7SUFDekksSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdCLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsb0JBQW9CLEVBQUUsRUFBQyxDQUFDLElBQUksRUFBQyxHQUFHLEVBQUMsRUFBRTtRQUNsRCxJQUFHLElBQUksQ0FBQyxRQUFRLEVBQUM7WUFDYixLQUFJLElBQUksS0FBSyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBQztnQkFDM0IsSUFBRyxTQUFTLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRSxFQUFDO29CQUNoQyxJQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBQzt3QkFDakIsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQzt3QkFDbEMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztxQkFDM0I7b0JBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDeEI7YUFDSjtZQUNELFVBQVUsRUFBRSxDQUFDO1NBQ2hCO1FBQ0QsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzNCLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLE1BQWM7SUFDbEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxpQkFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3RDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxpQkFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3ZELEtBQUksTUFBTSxLQUFLLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFDO1FBQy9CLElBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSTtZQUNWLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxpQkFBVSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUMsS0FBSyxFQUFDLHNFQUFzRSxDQUFDLEVBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0tBQ3BLO0lBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUMsRUFBRTtRQUNwRCxJQUFHLElBQUksQ0FBQyxRQUFRLEVBQUM7WUFDYixJQUFHLElBQUksQ0FBQyxRQUFRLElBQUksVUFBVSxFQUFDO2dCQUMzQixVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDdEI7aUJBQ0c7Z0JBQ0EsYUFBYSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDeEM7U0FDSjtJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsTUFBYyxFQUFFLFFBQXNCLFVBQVUsRUFBRTtJQUN6RSxNQUFNLElBQUksR0FBRyxJQUFJLGlCQUFVLEVBQUUsQ0FBQztJQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzVCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxnQkFBUyxDQUFDLElBQUksRUFBQyxJQUFJLEVBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxnQkFBUyxDQUFDLE1BQU0sRUFBQyxNQUFNLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFFLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxnQkFBUyxDQUFDLFFBQVEsRUFBQyxRQUFRLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2xGLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxnQkFBUyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDL0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLGlCQUFVLENBQUMsUUFBUSxFQUFDLElBQUksQ0FBQyxFQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzFELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxpQkFBVSxDQUFDLFNBQVMsRUFBQyxJQUFJLENBQUMsRUFBQyxLQUFLLENBQUMsQ0FBQztJQUN4RCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBQyxFQUFFO1FBQ3BELElBQUcsSUFBSSxDQUFDLFFBQVEsRUFBQztZQUNiLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLEtBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDNUIsS0FBSyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxQyxLQUFLLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzlDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQy9DLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNwQyxVQUFVLEVBQUUsQ0FBQztZQUNiLFNBQVMsRUFBRSxDQUFDO1lBQ1osY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzFCO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBRUQsaUJBQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLHlCQUF5QixFQUFDLGdDQUFzQixDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFDLEVBQUU7SUFDcEgsSUFBRyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxFQUFDO1FBQy9CLElBQUcsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDO1lBQ2YsaUJBQWlCLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRyxDQUFDLG9CQUFvQixFQUFHLENBQUMsUUFBUSxFQUFHLENBQUMsQ0FBQzthQUMzRTtZQUNBLElBQUcsU0FBUyxJQUFJLG1DQUFnQixDQUFDLFlBQVksQ0FBQztnQkFDMUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUcsQ0FBQyxvQkFBb0IsRUFBRyxDQUFDLFFBQVEsRUFBRyxDQUFDLENBQUM7O2dCQUV4RSxNQUFNLENBQUMsS0FBSyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7U0FDNUU7S0FDSjtBQUNMLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyJ9