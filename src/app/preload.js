import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("projectX", {
  version: "0.1.0",
});
