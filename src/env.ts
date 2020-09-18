import { getLogger } from "log4js";

export const logger = getLogger("global");
logger.level = "debug";

export function getOJSecret(): string | null {
    const secret = process.env["OJ_SECRET"];
    if (typeof secret !== "string" || secret.length === 0) {
        logger.error("missing environment variable: OJ_SECRET")
        return null;
    }
    return secret;
}

