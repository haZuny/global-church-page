import { readFile } from "node:fs/promises";

const config = JSON.parse(await readFile(new URL("../../config/local-development.json", import.meta.url), "utf8"));

export const defaultDirectusUrl = config.directusUrl;
export const defaultNaverCafeCdpUrl = config.naverCafeCdpUrl;
