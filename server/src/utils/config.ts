import { existsSync, readFileSync, writeFileSync } from "fs";

let configExists = existsSync("config.json");
if (!configExists && existsSync("config.example.json")) {
    writeFileSync("config.json", readFileSync("config.example.json", "utf8"));
    configExists = true;
}

import type { ConfigSchema } from "./config.d";
export const Config = (configExists ? JSON.parse(readFileSync("config.json", "utf8")) : {}) as ConfigSchema;
