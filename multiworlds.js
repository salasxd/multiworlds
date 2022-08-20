"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serverproperties_1 = require("bdsx/serverproperties");
const utils_1 = require("./utils");
const path_1 = require("path");
const event_1 = require("bdsx/event");
const command_1 = require("bdsx/command");
const command_2 = require("bdsx/bds/command");
const nativetype_1 = require("bdsx/nativetype");
const utils_2 = require("./utils");
const attribute_1 = require("bdsx/bds/attribute");
const launcher_1 = require("bdsx/launcher");
const inventory_1 = require("bdsx/bds/inventory");
const enchants_1 = require("bdsx/bds/enchants");
const actor_1 = require("bdsx/bds/actor");
const blockpos_1 = require("bdsx/bds/blockpos");
const common_1 = require("bdsx/common");
const { spawn } = require('child_process');
const _path = (0, path_1.join)(process.cwd(), '..');
const Worlds = JSON.parse((0, utils_1.LoadFile)("", "worlds") || "[]");
const Servers = new Map();
let server = (0, utils_1.LoadFile)("bedrock_server", "server", "properties");
const default_server = server;
if ((0, utils_1.LoadFile)("bedrock_server", "server", "bak") == "")
    (0, utils_1.SaveFile)("bedrock_server", "server", server, "bak");
async function worlds() {
    for (const world of Worlds) {
        if (serverproperties_1.serverProperties["level-name"] != Worlds[0].name) {
            return;
        }
        if (world.name == serverproperties_1.serverProperties["level-name"] || world.run) {
            continue;
        }
        server = server.replace(`level-name=${serverproperties_1.serverProperties["level-name"]}`, `level-name=${world.name}`);
        server = server.replace(`server-port=${serverproperties_1.serverProperties["server-port"]}`, `server-port=${world.port}`);
        server = server.replace(`server-portv6=${serverproperties_1.serverProperties["server-portv6"]}`, `server-portv6=${(world.portv6)}`);
        (0, utils_1.SaveFile)("bedrock_server", "server", server, "properties");
        const bat = spawn('cmd.exe', ['/c', `${_path}/bdsx.bat`]);
        bat.stdout.on('data', (data) => {
            let send = false;
            if (data.toString().indexOf(`World ${world.name} done`) == 0) {
                server = default_server;
                world.run = true;
                worlds();
                send = true;
            }
            if (data.toString().indexOf(`Player connected:`) > 0) {
                send = true;
            }
            if (data.toString().indexOf(`Player disconnected:`) > 0) {
                send = true;
            }
            if (send)
                (0, utils_1.Print)(`${world.name}: ${data.toString()}`, utils_1.TypePrint.info);
        });
        bat.stderr.on('data', (data) => {
            (0, utils_1.Print)(`${world.name}: ${data.toString()}`, utils_1.TypePrint.error);
        });
        bat.on('exit', (code) => {
            (0, utils_1.Print)(`${world.name} exited with code ${code}`, utils_1.TypePrint.alert);
        });
        Servers.set(world.name, bat);
        bat.stdin.write(`worldok\n`);
        return;
    }
}
setTimeout(function () { worlds(); }, 0);
command_1.command.register('world', "multiworlds.command.world.info", command_2.CommandPermissionLevel.Normal).overload((param, origin, output) => {
    if (origin.isServerCommandOrigin()) {
        output.error("multiworlds.command.world.console");
        return;
    }
    for (const world of Worlds) {
        if (world.name != Worlds[0].name && !world.run) {
            output.success("multiworlds.command.world.notrun");
            return;
        }
        if (world.name.toLocaleLowerCase() == param.name.toLocaleLowerCase()) {
            const player = origin.getEntity().getNetworkIdentifier().getActor();
            transgerWorld(player, `${serverproperties_1.serverProperties["level-name"]}`, world.name);
            output.success("multiworlds.command.world.success");
            return;
        }
    }
    output.error("multiworlds.command.world.error");
}, {
    name: nativetype_1.CxxString
});
command_1.command.register('worldok', "", command_2.CommandPermissionLevel.Operator).overload((param, origin, output) => {
    if (origin.isServerCommandOrigin()) {
        (0, utils_1.SaveFile)("bedrock_server", "server", (0, utils_1.LoadFile)("bedrock_server", "server", "bak"), "properties");
        output.success(`World ${serverproperties_1.serverProperties["level-name"]} done`);
    }
}, {});
command_1.command.register('worldcmd', "multiworlds.command.worldcmd.info", command_2.CommandPermissionLevel.Operator).overload((param, origin, output) => {
    for (const name of Servers.keys()) {
        if (param.world.toLocaleLowerCase() == name.toLocaleLowerCase()) {
            const world = Servers.get(name);
            world.stdin.write(`${param.command}\n`);
            output.success("multiworlds.command.worldcmd.success");
            return;
        }
    }
    output.error("multiworlds.command.worldcmd.error");
}, {
    world: nativetype_1.CxxString,
    command: nativetype_1.CxxString
});
event_1.events.command.on((command, origin, ctx) => {
    if (command == "/stop") {
        for (const world of Servers.values()) {
            world.stdin.write(`${command.substring(1)}\n`);
        }
        return;
    }
});
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
function transgerWorld(player, last, next) {
    for (const world of Worlds) {
        if (world.name == next) {
            if (savePlayer(player)) {
                const storage = JSON.parse((0, utils_1.LoadFile)("@users", player.getXuid()));
                storage.worldSelf = next;
                storage.worldLast = last;
                (0, utils_1.SaveFile)("@users", player.getXuid(), JSON.stringify(storage, null, 4));
                sendMsg(`${player.getName()} was sent to the world ${next}`);
                player.transferServer(world.ip, world.port);
            }
            else
                player.sendMessage(`an error occurred while sending to the world ${world.name}`);
            break;
        }
    }
}
async function sendMsg(msg) {
    for (const player of launcher_1.bedrockServer.level.getPlayers()) {
        player.sendMessage(msg);
    }
}
function savePlayer(player) {
    const storage = JSON.parse((0, utils_1.LoadFile)("@users", player.getXuid()));
    if (storage.worldSelf == serverproperties_1.serverProperties["level-name"]) {
        for (const world of Worlds) {
            if (world.name == serverproperties_1.serverProperties["level-name"]) {
                if (world.shared) {
                    storage.levelExperience = player.getExperience();
                    storage.level = player.getExperienceLevel();
                    storage.levelProgress = player.getExperienceProgress();
                    storage.inventory = getInventory(player);
                    storage.armor = getArmor(player);
                    storage.health = player.getHealth();
                    storage.hunger = player.getAttribute(attribute_1.AttributeId.PlayerHunger);
                    break;
                }
            }
        }
        (0, utils_1.SaveFile)("@users", player.getXuid(), JSON.stringify(storage, null, 4));
    }
    return true;
}
event_1.events.playerJoin.on((ev) => {
    const storage = JSON.parse((0, utils_1.LoadFile)("@users", ev.player.getXuid()));
    if (!storage.worldSelf)
        storage.worldSelf = serverproperties_1.serverProperties["level-name"];
    if (!storage.worldLast)
        storage.worldLast = serverproperties_1.serverProperties["level-name"];
    if (storage.worldSelf != serverproperties_1.serverProperties["level-name"]) {
        for (const world of Worlds) {
            if (world.name == storage.worldSelf) {
                transgerWorld(ev.player, storage.worldLast, world.name);
                return;
            }
        }
    }
    if (storage.inventory) {
        for (const world of Worlds) {
            if (world.name == storage.worldSelf) {
                if (world.shared || world.shared_read && world.name != Worlds[0]) {
                    ev.player.setExperience(storage.levelExperience);
                    ev.player.setExperienceLevel(storage.level);
                    ev.player.setExperienceProgress(storage.levelProgress);
                    setInventory(ev.player, storage.inventory);
                    setArmor(ev.player, storage.armor);
                    ev.player.setAttribute(attribute_1.AttributeId.Health, storage.health);
                    ev.player.setAttribute(attribute_1.AttributeId.PlayerHunger, storage.hunger);
                    break;
                }
            }
        }
    }
});
event_1.events.playerDimensionChange.on(ev => {
    if (ev.dimension == actor_1.DimensionId.Nether) {
        for (const world of Worlds) {
            if (world.name == serverproperties_1.serverProperties["level-name"]) {
                if (!world.dimensions.nether) {
                    return common_1.CANCEL;
                    //ev.player.teleport(Vec3.create(bedrockServer.level.getDefaultSpawn()), DimensionId.Overworld);
                }
            }
        }
    }
    if (ev.dimension == actor_1.DimensionId.TheEnd) {
        for (const world of Worlds) {
            if (world.name == serverproperties_1.serverProperties["level-name"]) {
                if (!world.dimensions.end) {
                    return common_1.CANCEL;
                    //ev.player.teleport(Vec3.create(bedrockServer.level.getDefaultSpawn()), DimensionId.Overworld);
                }
            }
        }
    }
    if (ev.dimension == actor_1.DimensionId.Overworld) {
        if (ev.player.getPosition().y > 10000) {
            const region = ev.player.getRegion();
            for (let i = 400; i > -70; i--) {
                const pos = blockpos_1.BlockPos.create(blockpos_1.Vec3.create(ev.player.getPosition().x, i, ev.player.getPosition().z));
                const block = region.getBlock(pos);
                if (block.getName() != "minecraft:air") {
                    ev.player.teleport(blockpos_1.Vec3.create(ev.player.getPosition().x, i + 2, ev.player.getPosition().z), actor_1.DimensionId.Overworld);
                }
                block.destruct();
            }
        }
    }
});
event_1.events.playerLeft.on((ev) => {
    savePlayer(ev.player);
});
async function save() {
    for (const player of launcher_1.bedrockServer.level.getPlayers()) {
        const data = JSON.parse((0, utils_1.LoadFile)("@users", player.getXuid()));
        if (data.worldSelf == serverproperties_1.serverProperties["level-name"]) {
            savePlayer(player);
        }
    }
}
event_1.events.entityDie.on(ev => {
    const player = ev.entity;
    if (player && player.isPlayer()) {
        if (Worlds[0].name != serverproperties_1.serverProperties["level-name"]) {
            for (const world of Worlds) {
                if (world.name == serverproperties_1.serverProperties["level-name"]) {
                    if (world.killreturn) {
                        const data = JSON.parse((0, utils_1.LoadFile)("@users", player.getXuid()));
                        transgerWorld(player, data.worldSelf, data.worldLast);
                        break;
                    }
                }
            }
        }
    }
});
let _time = 0;
event_1.events.levelTick.on(ev => {
    if ((0, utils_2.Time)() > _time) {
        save();
        _time = (0, utils_2.Time)() + 60;
    }
});
event_1.events.serverLeave.on(() => {
    _time = (0, utils_2.Time)() + 1000;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGl3b3JsZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtdWx0aXdvcmxkcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDREQUF5RDtBQUN6RCxtQ0FBK0Q7QUFDL0QsK0JBQTRCO0FBQzVCLHNDQUFvQztBQUNwQywwQ0FBdUM7QUFDdkMsOENBQTBEO0FBQzFELGdEQUE0QztBQUM1QyxtQ0FBK0I7QUFHL0Isa0RBQWlEO0FBQ2pELDRDQUE4QztBQUM5QyxrREFBNEQ7QUFDNUQsZ0RBQXNFO0FBRXRFLDBDQUE2QztBQUM3QyxnREFBbUQ7QUFDbkQsd0NBQXFDO0FBRXJDLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDM0MsTUFBTSxLQUFLLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3hDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBQSxnQkFBUSxFQUFDLEVBQUUsRUFBQyxRQUFRLENBQUMsSUFBRSxJQUFJLENBQUMsQ0FBQztBQUN2RCxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBYyxDQUFDO0FBRXRDLElBQUksTUFBTSxHQUFHLElBQUEsZ0JBQVEsRUFBQyxnQkFBZ0IsRUFBQyxRQUFRLEVBQUMsWUFBWSxDQUFDLENBQUM7QUFDOUQsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDO0FBQzlCLElBQUcsSUFBQSxnQkFBUSxFQUFDLGdCQUFnQixFQUFDLFFBQVEsRUFBQyxLQUFLLENBQUMsSUFBSSxFQUFFO0lBQzlDLElBQUEsZ0JBQVEsRUFBQyxnQkFBZ0IsRUFBQyxRQUFRLEVBQUMsTUFBTSxFQUFDLEtBQUssQ0FBQyxDQUFDO0FBRXJELEtBQUssVUFBVSxNQUFNO0lBQ2pCLEtBQUksTUFBTSxLQUFLLElBQUksTUFBTSxFQUFDO1FBQ3RCLElBQUcsbUNBQWdCLENBQUMsWUFBWSxD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