import { join } from "path";
import { about } from ".";

const fs = require('fs');
const _path = join(process.cwd(), '..','plugins','multiworlds');

export function LoadFile(path: string, name: string, type: string = "json"): string{
    if(path == "") path = `${_path}/`;
    else if(path.indexOf("@") == 0) path = `${_path}/${path.replace("@","")}/`;
    else if(path == "bedrock_server") path = "";
    else path = `${path}/`;
	if (fs.existsSync(`${path}${name}.${type}`))
        return fs.readFileSync(`${path}${name}.${type}`, 'utf8');
    if(type == "json")
        return "{}";
    return "";
}

export function SaveFile(path: string,name: string,data: string, type: string = "json"){
    if(path == "") path = `${_path}/`;
    else if(path.indexOf("@") == 0) path = `${_path}/${path.replace("@","")}/`;
    else if(path == "bedrock_server") path = "";
    else path = `${path}/`;
    fs.writeFileSync(`${path}${name}.${type}`, data);
}


export enum TypePrint {
    info,
    succes,
    error,
    alert,
    default
}

export function Time(): number{
    let time = new Date().getTime()+"";
    return parseInt(time.substring(0,10),10);
}

export function DateFromTime(time: number): string{
    const date = new Date(time*1000);
    return `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

/**
 * print to console
 * @param message Message
 * @param type Type
 */
export function Print(message: string, type: TypePrint = TypePrint.default){
    about.name = about.name.replace("@bdsx/","");
    switch(type){
        case TypePrint.info:{
            console.info(`[${about.name}] `.magenta + message.blue);
            break;
        }
        case TypePrint.succes:{
            console.log(`[${about.name}] `.magenta + message.green);
            break;
        }
        case TypePrint.error:{
            console.error(`[${about.name}] `.magenta + message.red);
            break;
        }
        case TypePrint.alert:{
            console.warn(`[${about.name}] `.magenta + message.yellow);
            break;
        }
        case TypePrint.default:{
            console.log(`[${about.name}] `.magenta + message.white);
            break;
        }
    }
}