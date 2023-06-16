"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.about = void 0;
const event_1 = require("bdsx/event");
const utils_1 = require("./utils");
exports.about = (0, utils_1.Json)((0, utils_1.LoadFile)(utils_1.FolderType.plugin, "", "package"));
(0, utils_1.Print)(`Iniciando`, utils_1.TypePrint.info);
event_1.events.serverOpen.on(() => {
    require("./multiworlds");
    (0, utils_1.Print)(`v${exports.about.version}`, utils_1.TypePrint.succes);
});
event_1.events.serverClose.on(() => {
    (0, utils_1.Print)(`Cerrando`, utils_1.TypePrint.info);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxzQ0FBb0M7QUFDcEMsbUNBQXVFO0FBRTFELFFBQUEsS0FBSyxHQUFHLElBQUEsWUFBSSxFQUFDLElBQUEsZ0JBQVEsRUFBQyxrQkFBVSxDQUFDLE1BQU0sRUFBQyxFQUFFLEVBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztBQUVwRSxJQUFBLGFBQUssRUFBQyxXQUFXLEVBQUMsaUJBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUVsQyxjQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFFLEVBQUU7SUFDckIsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ3pCLElBQUEsYUFBSyxFQUFDLElBQUksYUFBSyxDQUFDLE9BQU8sRUFBRSxFQUFDLGlCQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDaEQsQ0FBQyxDQUFDLENBQUM7QUFFSCxjQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFFLEVBQUU7SUFDdEIsSUFBQSxhQUFLLEVBQUMsVUFBVSxFQUFDLGlCQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMifQ==