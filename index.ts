import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { DateFromTime, LoadFile, Print, SaveFile, Time, TypePrint } from "./utils";

export const about = JSON.parse(LoadFile("","package")||"{}");

Print(`Iniciando`,TypePrint.info);

events.serverOpen.on(()=>{
    require("./multiworlds");
    Print(`v${about.version}`,TypePrint.succes);
});

events.error.on(err=>{
    Print('ERR: '+ err.message,TypePrint.error);
    let data = `${LoadFile("","log","txt")}\n[${DateFromTime(Time())}] ${err.toString()}`;
    SaveFile("","log",data,"txt");
    return CANCEL;
});

events.serverClose.on(()=>{
    Print(`Cerrando`,TypePrint.info);
});
