"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCode = exports.Random = exports.DateFromTime = exports.Time = exports.StringToMap = exports.MapToString = exports.Json = exports.Folder = exports.SaveFile = exports.LoadFile = exports.Print = exports.FolderType = exports.TypePrint = exports._debug = exports._dbVersion = exports._path = exports._root = void 0;
const path_1 = require("path");
const _1 = require(".");
const fs = require('fs');
exports._root = process.cwd();
exports._path = Dir();
exports._dbVersion = 2;
exports._debug = false;
var TypePrint;
(function (TypePrint) {
    TypePrint[TypePrint["info"] = 0] = "info";
    TypePrint[TypePrint["succes"] = 1] = "succes";
    TypePrint[TypePrint["error"] = 2] = "error";
    TypePrint[TypePrint["alert"] = 3] = "alert";
    TypePrint[TypePrint["default"] = 4] = "default";
    TypePrint[TypePrint["debug"] = 5] = "debug";
})(TypePrint = exports.TypePrint || (exports.TypePrint = {}));
var FolderType;
(function (FolderType) {
    FolderType[FolderType["root"] = 0] = "root";
    FolderType[FolderType["local"] = 1] = "local";
    FolderType[FolderType["plugin"] = 2] = "plugin";
})(FolderType = exports.FolderType || (exports.FolderType = {}));
function Dir() {
    if (fs.existsSync(`${(0, path_1.join)(exports._root, '..', 'plugins', 'multiworlds')}/package.json`))
        return (0, path_1.join)(exports._root, '..', 'plugins', 'multiworlds');
    if (fs.existsSync(`${(0, path_1.join)(exports._root, '..', 'plugins', 'multiworlds-main')}/package.json`))
        return (0, path_1.join)(exports._root, '..', 'plugins', 'multiworlds-main');
    return "../node_modules/@bdsx/multiworlds";
}
/**
 * print to console
 * @param message Message
 * @param type Type
 */
function Print(message, type = TypePrint.default) {
    if (!_1.about)
        return;
    _1.about.name = _1.about.name.replace("@bdsx/", "");
    switch (type) {
        case TypePrint.info: {
            console.info(`[${_1.about.name}] `.magenta + message.blue);
            break;
        }
        case TypePrint.succes: {
            console.log(`[${_1.about.name}] `.magenta + message.green);
            break;
        }
        case TypePrint.error: {
            console.error(`[${_1.about.name}] `.magenta + message.red);
            break;
        }
        case TypePrint.alert: {
            console.warn(`[${_1.about.name}] `.magenta + message.yellow);
            break;
        }
        case TypePrint.debug: {
            if (exports._debug)
                console.warn(`[${_1.about.name}] `.magenta + message.magenta);
            break;
        }
        case TypePrint.default: {
            console.log(`[${_1.about.name}] `.magenta + message.white);
            break;
        }
    }
}
exports.Print = Print;
/**
 *
 * @param path Ruta
 * @param name Nombre de archivo
 * @param type Tipo de archivo, Por defecto JSON
 * @param default_data Regresa el texto colocado si el archivo original esta vacio
 * @returns string
 */
function LoadFile(Folder, path, name, type = "json", default_data = "{}") {
    switch (Folder) {
        case FolderType.root:
            path = `${(0, path_1.join)(exports._root, '..')}/${path}`;
            break;
        case FolderType.plugin:
            path = `${exports._path}/${path}`;
            break;
    }
    try {
        if (fs.existsSync(`${path}${name}.${type}`)) {
            Print(`Load file ${name}.${type} data is ok`, TypePrint.debug);
            return fs.readFileSync(`${path}${name}.${type}`, 'utf8');
        }
    }
    catch (err) {
        Print(err, TypePrint.error);
    }
    Print(`Load file ${name}.${type} data is default`, TypePrint.debug);
    return default_data;
}
exports.LoadFile = LoadFile;
/**
 *
 * @param path Ruta
 * @param name Nombre de archivo
 * @param data Data
 * @param type Tipo de archivo, Por defecto JSON
 */
function SaveFile(Folder, path, name, data, type = "json") {
    switch (Folder) {
        case FolderType.root:
            path = `${(0, path_1.join)(exports._root, '..')}/${path}`;
            break;
        case FolderType.plugin:
            path = `${exports._path}/${path}`;
            break;
    }
    try {
        fs.writeFileSync(`${path}${name}.${type}`, data);
        Print(`Data saved in file ${name}.${type}`, TypePrint.debug);
    }
    catch (error) {
        Print(error, TypePrint.error);
    }
}
exports.SaveFile = SaveFile;
/**
 *
 * @param path Ruta
 * @param name Nombre de carpeta
 */
function Folder(Folder, path, name) {
    switch (Folder) {
        case FolderType.root:
            path = `${(0, path_1.join)(exports._root, '..')}/${path}`;
            break;
        case FolderType.plugin:
            path = `${exports._path}/${path}`;
            break;
    }
    try {
        if (!fs.existsSync(`${path}${name}`)) {
            fs.mkdirSync(`${path}${name}`);
            Print(`Create folder ${name}`, TypePrint.debug);
        }
    }
    catch (err) {
        Print(err, TypePrint.error);
    }
}
exports.Folder = Folder;
function Json(data) {
    if (typeof data == "string")
        return JSON.parse(data);
    return JSON.stringify(data, null, 4);
}
exports.Json = Json;
/**
 * Convert Map to String
 * @param map Map<any,any>
 * @returns string
 */
function MapToString(map) {
    let list = [];
    for (var data of map.values()) {
        list.push(data);
    }
    return Json({ version: exports._dbVersion, data: list });
}
exports.MapToString = MapToString;
/**
 * Return Map
 * @param data Data
 * @param key Primary Key
 * @returns
 */
function StringToMap(data, key) {
    const map = new Map();
    const json = Json(data);
    if (Object.keys(json).length > 0 && Object.keys(json.data).length > 0) {
        for (const _data of json.data) {
            for (const _key of Object.keys(_data)) {
                if (key == _key) {
                    map.set(_data[_key], _data);
                    break;
                }
            }
        }
    }
    return map;
}
exports.StringToMap = StringToMap;
/**
 * Return time
 * @param seconds add seconds in time
 * @returns
 */
function Time(seconds = 0) {
    return new Date().getTime() + (seconds * 1000);
}
exports.Time = Time;
/**
 * Return Date
 * @param time set time number
 * @returns get date
 */
function DateFromTime(time) {
    const date = new Date(time);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}
exports.DateFromTime = DateFromTime;
/**
 * Return a random number
 * @param min Minimum number
 * @param max Maximum number
 * @returns number
 */
function Random(min, max = 0) {
    if (max == 0)
        return Math.floor(Math.random() * min);
    return min + Math.floor(Math.random() * max);
}
exports.Random = Random;
/**
 * Returns a random character string
 * @param length string max number
 * @returns string
 */
function getCode(length = 8) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
exports.getCode = getCode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrQkFBNEI7QUFDNUIsd0JBQTBCO0FBSTFCLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNaLFFBQUEsS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUN0QixRQUFBLEtBQUssR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUNkLFFBQUEsVUFBVSxHQUFHLENBQUMsQ0FBQztBQUNmLFFBQUEsTUFBTSxHQUFHLEtBQUssQ0FBQztBQUU1QixJQUFZLFNBT1g7QUFQRCxXQUFZLFNBQVM7SUFDakIseUNBQUksQ0FBQTtJQUNKLDZDQUFNLENBQUE7SUFDTiwyQ0FBSyxDQUFBO0lBQ0wsMkNBQUssQ0FBQTtJQUNMLCtDQUFPLENBQUE7SUFDUCwyQ0FBSyxDQUFBO0FBQ1QsQ0FBQyxFQVBXLFNBQVMsR0FBVCxpQkFBUyxLQUFULGlCQUFTLFFBT3BCO0FBRUQsSUFBWSxVQUlYO0FBSkQsV0FBWSxVQUFVO0lBQ2xCLDJDQUFJLENBQUE7SUFDSiw2Q0FBSyxDQUFBO0lBQ0wsK0NBQU0sQ0FBQTtBQUNWLENBQUMsRUFKVyxVQUFVLEdBQVYsa0JBQVUsS0FBVixrQkFBVSxRQUlyQjtBQUVELFNBQVMsR0FBRztJQUNSLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLElBQUEsV0FBSSxFQUFDLGFBQUssRUFBRSxJQUFJLEVBQUMsU0FBUyxFQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUM7UUFDMUUsT0FBTyxJQUFBLFdBQUksRUFBQyxhQUFLLEVBQUUsSUFBSSxFQUFDLFNBQVMsRUFBQyxhQUFhLENBQUMsQ0FBQztJQUNyRCxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxJQUFBLFdBQUksRUFBQyxhQUFLLEVBQUUsSUFBSSxFQUFDLFNBQVMsRUFBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUM7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