import { serverProperties } from "bdsx/serverproperties";
import { LoadFile, Print, SaveFile, TypePrint } from "./utils";
import { join } from "path";
import { events } from "bdsx/event";
import { command } from "bdsx/command";
import { CommandPermissionLevel } from "bdsx/bds/command";
import { CxxString } from "bdsx/nativetype";
import { Time } from "./utils";
import { storageManager } from "bdsx/storage";
import { ServerPlayer } from "bdsx/bds/player";
import { AttributeId } from "bdsx/bds/attribute";
import { bedrockServer } from "bdsx/launcher";
import { ContainerId, ItemStack } from "bdsx/bds/inventory";
import { EnchantmentInstance, ItemEnchants } from "bdsx/bds/enchants";
import { getPlayer } from "../salas-system/users/users";
import { DimensionId } from "bdsx/bds/actor";
import { BlockPos, Vec3 } from "bdsx/bds/blockpos";
import { CANCEL } from "bdsx/common";

const { spawn } = require('child_process');
const _path = join(process.cwd(), '..');
const Worlds = JSON.parse(LoadFile("","worlds")||"[]");
const Servers = new Map<string,any>();

let server = LoadFile("bedrock_server","server","properties");
const default_server = server;
if(LoadFile("bedrock_server","server","bak") == "")
    SaveFile("bedrock_server","server",server,"bak");

async function worlds(){
    for(const world of Worlds){
        if(serverProperties["level-name"] != Worlds[0].name){
            return;
        }
        if(world.name == serverProperties["level-name"] || world.run){
            continue;
        }
        server = server.replace(`level-name=${serverProperties["level-name"]}`,
        `level-name=${world.name}`);
        server = server.replace(`server-port=${serverProperties["server-port"]}`,
        `server-port=${world.port}`);
        server = server.replace(`server-portv6=${serverProperties["server-portv6"]}`,
        `server-portv6=${(world.portv6)}`);

        SaveFile("bedrock_server","server",server,"properties");

        const bat = spawn('cmd.exe', ['/c',`${_path}/bdsx.bat`]);

        bat.stdout.on('data', (data: any) => {
            let send = false;
            if(data.toString().indexOf(`World ${world.name} done`) == 0){
                server = default_server;
                world.run = true;
                worlds();
                send = true;
            }
            if(data.toString().indexOf(`Player connected:`) > 0){
                send = true;
            }
            if(data.toString().indexOf(`Player disconnected:`) > 0){
                send = true;
            }
            if(send)
                Print(`${world.name}: ${data.toString()}`,TypePrint.info);
        });

        bat.stderr.on('data', (data: any) => {
            Print(`${world.name}: ${data.toString()}`,TypePrint.error);
        });

        bat.on('exit', (code: any) => {
            Print(`${world.name} exited with code ${code}`,TypePrint.alert);
        });

        Servers.set(world.name,bat);
        bat.stdin.write(`worldok\n`);
        return;
    }
}

setTimeout(function(){worlds()},0);

command.register('world', "multiworlds.command.world.info",CommandPermissionLevel.Normal).overload((param, origin, output)=>{
    if(origin.isServerCommandOrigin()){
        output.error("multiworlds.command.world.console");
        return;
    }
    for(const world of Worlds){
        if(world.name != Worlds[0].name && !world.run){
            output.success("multiworlds.command.world.notrun");
            return;
        }
        if(world.name.toLocaleLowerCase() == param.name.toLocaleLowerCase()){
            const player = origin.getEntity()!.getNetworkIdentifier().getActor()!;
            transgerWorld(player,`${serverProperties["level-name"]}`,world.name);
            output.success("multiworlds.command.world.success");
            return;
        }
    }
    output.error("multiworlds.command.world.error");
}, {
    name: CxxString
});

command.register('worldok', "",CommandPermissionLevel.Operator).overload((param, origin, output)=>{
    if(origin.isServerCommandOrigin()){
        SaveFile("bedrock_server","server",LoadFile("bedrock_server","server","bak"),"properties");
        output.success(`World ${serverProperties["level-name"]} done`);
    }
}, {});

command.register('worldcmd', "multiworlds.command.worldcmd.info",CommandPermissionLevel.Operator).overload((param, origin, output)=>{
    for(const name of Servers.keys()){
        if(param.world.toLocaleLowerCase() == name.toLocaleLowerCase()){
            const world = Servers.get(name);
            world.stdin.write(`${param.command}\n`);
            output.success("multiworlds.command.worldcmd.success");
            return;
        }
    }
    output.error("multiworlds.command.worldcmd.error");
}, {
    world: CxxString,
    command: CxxString
});

events.command.on((command,origin,ctx) => {
    if(command == "/stop"){
        for(const world of Servers.values()){
            world.stdin.write(`${command.substring(1)}\n`);
        }
        return;
    }
});

function getCustomName(item: ItemStack){
    if(item.hasCustomName())
        return item.getCustomName();
    return "";
}

function getInventory(player: ServerPlayer){
    const inventory = [];
    let count = 0;
    for(const slot of player.getInventory().container.getSlots()){
        const item =
        {
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
        if(slot.isEnchanted()){
            let EnchantsData = slot.constructItemEnchantsFromUserData()!;
            for(let enchant of EnchantsData.enchants1){
                item.enchants.push({enchant:enchant.type,level:enchant.level,d:"enchants1"});
            }
            for(let enchant of EnchantsData.enchants2){
                item.enchants.push({enchant:enchant.type,level:enchant.level,d:"enchants2"});
            }
            for(let enchant of EnchantsData.enchants3){
                item.enchants.push({enchant:enchant.type,level:enchant.level,d:"enchants3"});
            }
            EnchantsData.destruct();
        }
        count++;
        inventory.push(item);
    }
    const item =
    {
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
    if(player.getOffhandSlot().isEnchanted()){
        let EnchantsData = player.getOffhandSlot().constructItemEnchantsFromUserData()!;
        for(let enchant of EnchantsData.enchants1){
            item.enchants.push({enchant:enchant.type,level:enchant.level,d:"enchants1"});
        }
        for(let enchant of EnchantsData.enchants2){
            item.enchants.push({enchant:enchant.type,level:enchant.level,d:"enchants2"});
        }
        for(let enchant of EnchantsData.enchants3){
            item.enchants.push({enchant:enchant.type,level:enchant.level,d:"enchants3"});
        }
        EnchantsData.destruct();
    }
    inventory.push(item);
    return inventory;
}

function setInventory(player: ServerPlayer, slots: any){
    for(const data of slots){
        const item = ItemStack.constructWith(data.name);
        if(data.name != "minecraft:air"){
            if(data.customName != "")
                item.setCustomName(data.customName);
            item.setAmount(data.amount);
            item.setAuxValue(data.aux);
            item.setDamageValue(data.damage);
            item.setCustomLore(data.lore);
            const Enchants = ItemEnchants.construct();
            for(const enchant of data.enchants){
                let newEnchant = EnchantmentInstance.construct();
                newEnchant.type = enchant.type;
                newEnchant.level = enchant.level;
                if(enchant.d == "enchants1")
                    Enchants.enchants1.push(newEnchant);
                if(enchant.d == "enchants2")
                    Enchants.enchants2.push(newEnchant);
                if(enchant.d == "enchants3")
                    Enchants.enchants3.push(newEnchant);
                newEnchant.destruct();
            }
            item.saveEnchantsToUserData(Enchants);
            Enchants.destruct();
        }
        if(data.slot == -1)
            player.setOffhandSlot(item);
        else
            player.getInventory().setItem(data.slot, item, ContainerId.Inventory, false);
        player.sendInventory();
        item.destruct();
    }
}

function getArmor(player: ServerPlayer){
    const inventory = [];
    for(let i=0;i<4;i++){
        const slot = player.getArmor(i);
        const item =
        {
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
        if(slot.isEnchanted()){
            let EnchantsData = slot.constructItemEnchantsFromUserData()!;
            for(let enchant of EnchantsData.enchants1){
                item.enchants.push({enchant:enchant.type,level:enchant.level});
            }
            for(let enchant of EnchantsData.enchants2){
                item.enchants.push({enchant:enchant.type,level:enchant.level});
            }
            for(let enchant of EnchantsData.enchants3){
                item.enchants.push({enchant:enchant.type,level:enchant.level});
            }
            EnchantsData.destruct();
        }
        inventory.push(item);
    }
    return inventory;
}

function setArmor(player: ServerPlayer, slots: any){
    for(const data of slots){
        const item = ItemStack.constructWith(data.name);
        if(data.name != "minecraft:air"){
            if(data.customName != "")
                item.setCustomName(data.customName);
            item.setAmount(data.amount);
            item.setAuxValue(data.aux);
            item.setDamageValue(data.damage);
            item.setCustomLore(data.lore);
            const Enchants = ItemEnchants.construct();
            Enchants.slot = data.slot;
            for(const enchant of data.enchants){
                let newEnchant = EnchantmentInstance.construct();
                newEnchant.type = enchant.type;
                newEnchant.level = enchant.level;
                if(enchant.d == "enchants1")
                    Enchants.enchants1.push(newEnchant);
                if(enchant.d == "enchants2")
                    Enchants.enchants2.push(newEnchant);
                if(enchant.d == "enchants3")
                    Enchants.enchants3.push(newEnchant);
                newEnchant.destruct();
            }
            item.saveEnchantsToUserData(Enchants);
            Enchants.destruct();
        }
        player.setArmor(data.slot,item);
        item.destruct();
        player.sendArmorSlot(data.slot);
    }
}

function transgerWorld(player: ServerPlayer, last: string, next: string){
    for(const world of Worlds){
        if(world.name == next){
            if(savePlayer(player)){
                const storage = JSON.parse(LoadFile("@users",player.getXuid()));
                storage.worldSelf = next;
                storage.worldLast = last;
                SaveFile("@users",player.getXuid(),JSON.stringify(storage,null,4));
                sendMsg(`${player.getName()} was sent to the world ${next}`);
                player.transferServer(world.ip,world.port);
            }
            else
                player.sendMessage(`an error occurred while sending to the world ${world.name}`);
            break;
        }
    }
}

async function sendMsg(msg: string) {
    for(const player of bedrockServer.level.getPlayers()){
        player.sendMessage(msg);
    }
}

function savePlayer(player: ServerPlayer) {
    const storage = JSON.parse(LoadFile("@users",player.getXuid()));
    if(storage.worldSelf == serverProperties["level-name"]){
        for(const world of Worlds){
            if(world.name == serverProperties["level-name"]){
                if(world.shared){
                    storage.levelExperience = player.getExperience();
                    storage.level = player.getExperienceLevel();
                    storage.levelProgress = player.getExperienceProgress();
                    storage.inventory = getInventory(player);
                    storage.armor = getArmor(player);
                    storage.health = player.getHealth();
                    storage.hunger = player.getAttribute(AttributeId.PlayerHunger);
                    break;
                }
            }
        }
        SaveFile("@users",player.getXuid(),JSON.stringify(storage,null,4));
    }
    return true;
}

events.playerJoin.on((ev)=>{
    const storage = JSON.parse(LoadFile("@users",ev.player.getXuid()));
    if(!storage.worldSelf) storage.worldSelf = serverProperties["level-name"];
    if(!storage.worldLast) storage.worldLast = serverProperties["level-name"];
    if(storage.worldSelf != serverProperties["level-name"]){
        for(const world of Worlds){
            if(world.name == storage.worldSelf){
                transgerWorld(ev.player,storage.worldLast,world.name);
                return;
            }
        }
    }
    if(storage.inventory){
        for(const world of Worlds){
            if(world.name == storage.worldSelf){
                if(world.shared||world.shared_read && world.name != Worlds[0]){
                    ev.player.setExperience(storage.levelExperience);
                    ev.player.setExperienceLevel(storage.level);
                    ev.player.setExperienceProgress(storage.levelProgress);
                    setInventory(ev.player,storage.inventory);
                    setArmor(ev.player,storage.armor);
                    ev.player.setAttribute(AttributeId.Health,storage.health);
                    ev.player.setAttribute(AttributeId.PlayerHunger,storage.hunger);
                    break;
                }
            }
        }
    }
});

events.playerDimensionChange.on(ev => {
    if(ev.dimension == DimensionId.Nether){
        for(const world of Worlds){
            if(world.name == serverProperties["level-name"]){
                if(!world.dimensions.nether){
                    return CANCEL;
                    //ev.player.teleport(Vec3.create(bedrockServer.level.getDefaultSpawn()), DimensionId.Overworld);
                }
            }
        }
    }
    if(ev.dimension == DimensionId.TheEnd){
        for(const world of Worlds){
            if(world.name == serverProperties["level-name"]){
                if(!world.dimensions.end){
                    return CANCEL;
                    //ev.player.teleport(Vec3.create(bedrockServer.level.getDefaultSpawn()), DimensionId.Overworld);
                }
            }
        }
    }
    if(ev.dimension == DimensionId.Overworld){
        if(ev.player.getPosition().y > 10000){
            const region = ev.player.getRegion();
            for(let i=400;i>-70;i--){
                const pos = BlockPos.create(Vec3.create(ev.player.getPosition().x,i,ev.player.getPosition().z));
                const block = region.getBlock(pos)!;
                if(block.getName() != "minecraft:air"){
                    ev.player.teleport(Vec3.create(ev.player.getPosition().x,i+2,ev.player.getPosition().z), DimensionId.Overworld);
                }
                block.destruct();
            }
        }
    }
});

events.playerLeft.on((ev)=>{
    savePlayer(ev.player);
});

async function save(){
    for(const player of bedrockServer.level.getPlayers()){
        const data = JSON.parse(LoadFile("@users",player.getXuid()));
        if(data.worldSelf == serverProperties["level-name"]){
            savePlayer(player);
        }
    }
}

events.entityDie.on(ev => {
    const player = ev.entity;
    if(player && player.isPlayer()){
        if(Worlds[0].name != serverProperties["level-name"]){
            for(const world of Worlds){
                if(world.name == serverProperties["level-name"]){
                    if(world.killreturn){
                        const data = JSON.parse(LoadFile("@users",player.getXuid()));
                        transgerWorld(player,data.worldSelf,data.worldLast);
                        break;
                    }
                }
            }
        }
    }
});

let _time = 0;
events.levelTick.on(ev => {
    if(Time() > _time){
        save();
        _time = Time()+60;
    }
});

events.serverLeave.on(() => {
    _time = Time() + 1000;
});