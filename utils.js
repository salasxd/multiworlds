"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Print = exports.DateFromTime = exports.Time = exports.TypePrint = exports.SaveFile = exports.LoadFile = void 0;
const path_1 = require("path");
const _1 = require(".");
const fs = require('fs');
const _path = (0, path_1.join)(process.cwd(), '..', 'plugins', 'multiworlds');
function LoadFile(path, name, type = "json") {
    if (path == "")
        path = `${_path}/`;
    else if (path.indexOf("@") == 0)
        path = `${_path}/${path.replace("@", "")}/`;
    else if (path == "bedrock_server")
        path = "";
    else
        path = `${path}/`;
    if (fs.existsSync(`${path}${name}.${type}`))
        return fs.readFileSync(`${path}${name}.${type}`, 'utf8');
    if (type == "json")
        return "{}";
    return "";
}
exports.LoadFile = LoadFile;
function SaveFile(path, name, data, type = "json") {
    if (path == "")
        path = `${_path}/`;
    else if (path.indexOf("@") == 0)
        path = `${_path}/${path.replace("@", "")}/`;
    else if (path == "bedrock_server")
        path = "";
    else
        path = `${path}/`;
    fs.writeFileSync(`${path}${name}.${type}`, data);
}
exports.SaveFile = SaveFile;
var TypePrint;
(function (TypePrint) {
    TypePrint[TypePrint["info"] = 0] = "info";
    TypePrint[TypePrint["succes"] = 1] = "succes";
    TypePrint[TypePrint["error"] = 2] = "error";
    TypePrint[TypePrint["alert"] = 3] = "alert";
    TypePrint[TypePrint["default"] = 4] = "default";
})(TypePrint = exports.TypePrint || (exports.TypePrint = {}));
function Time() {
    let time = new Date().getTime() + "";
    return parseInt(time.substring(0, 10), 10);
}
exports.Time = Time;
function DateFromTime(time) {
    const date = new Date(time * 1000);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}
exports.DateFromTime = DateFromTime;
/**
 * print to console
 * @param message Message
 * @param type Type
 */
function Print(message, type = TypePrint.default) {
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
        case TypePrint.default: {
            console.log(`[${_1.about.name}] `.magenta + message.white);
            break;
        }
    }
}
exports.Print = Print;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrQkFBNEI7QUFDNUIsd0JBQTBCO0FBRTFCLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QixNQUFNLEtBQUssR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFDLFNBQVMsRUFBQyxhQUFhLENBQUMsQ0FBQztBQUVoRSxTQUFnQixRQUFRLENBQUMsSUFBWSxFQUFFLElBQVksRUFBRSxPQUFlLE1BQU07SUFDdEUsSUFBRyxJQUFJLElBQUksRUFBRTtRQUFFLElBQUksR0FBRyxHQUFHLEtBQUssR0FBRyxDQUFDO1NBQzdCLElBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQUUsSUFBSSxHQUFHLEdBQUcsS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7U0FDdEUsSUFBRyxJQUFJLElBQUksZ0JBQWdCO1FBQUUsSUFBSSxHQUFHLEVBQUUsQ0FBQzs7UUFDdkMsSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUM7SUFDMUIsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUNwQyxPQUFPLEVBQUUsQ0FBQyxZQUFZLENBQUMsR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzdELElBQUcsSUFBSSxJQUFJLE1BQU07UUFDYixPQUFPLElBQUksQ0FBQztJQUNoQixPQUFPLEVBQUUsQ0FBQztBQUNkLENBQUM7QUFWRCw0QkFVQztBQUVELFNBQWdCLFFBQVEsQ0FBQyxJQUFZLEVBQUMsSUFBWSxFQUFDLElBQVksRUFBRSxPQUFlLE1BQU07SUFDbEYsSUFBRyxJQUFJLElBQUksRUFBRTtRQUFFLElBQUksR0FBRyxHQUFHLEtBQUssR0FBRyxDQUFDO1NBQzdCLElBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQUUsSUFBSSxHQUFHLEdBQUcsS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7U0FDdEUsSUFBRyxJQUFJLElBQUksZ0JBQWdCO1FBQUUsSUFBSSxHQUFHLEVBQUUsQ0FBQzs7UUFDdkMsSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUM7SUFDdkIsRUFBRSxDQUFDLGFBQWEsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDckQsQ0FBQztBQU5ELDRCQU1DO0FBR0QsSUFBWSxTQU1YO0FBTkQsV0FBWSxTQUFTO0lBQ2pCLHlDQUFJLENBQUE7SUFDSiw2Q0FBTSxDQUFBO0lBQ04sMkNBQUssQ0FBQTtJQUNMLDJDQUFLLENBQUE7SUFDTCwrQ0FBTyxDQUFBO0FBQ1gsQ0FBQyxFQU5XLFNBQVMsR0FBVCxpQkFBUyxLQUFULGlCQUFTLFFBTXBCO0FBRUQsU0FBZ0IsSUFBSTtJQUNoQixJQUFJLElBQUksR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFDLEVBQUUsQ0FBQztJQUNuQyxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsRUFBQyxFQUFFLENBQUMsQ0FBQztBQUM3QyxDQUFDO0FBSEQsb0JBR0M7QUFFRCxTQUFnQixZQUFZLENBQUMsSUFBWTtJQUNyQyxNQUFNLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUMsSUFBSSxDQUFDLENBQUM7SUFDakMsT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO0FBQ3ZJLENBQUM7QUFIRCxvQ0FHQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFnQixLQUFLLENBQUMsT0FBZSxFQUFFLE9BQWtCLFNBQVMsQ0FBQyxPQUFPO0lBQ3RFLFFBQUssQ0FBQyxJQUFJLEdBQUcsUUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzdDLFFBQU8sSUFBSSxFQUFDO1FBQ1IsS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLFFBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hELE1BQU07U0FDVDtRQUNELEtBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxRQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4RCxNQUFNO1NBQ1Q7UUFDRCxLQUFLLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNqQixPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksUUFBSyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEQsTUFBTTtTQUNUO1FBQ0QsS0FBSyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDakIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLFFBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFELE1BQU07U0FDVDtRQUNELEtBQUssU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxRQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4RCxNQUFNO1NBQ1Q7S0FDSjtBQUNMLENBQUM7QUF4QkQsc0JBd0JDIn0=