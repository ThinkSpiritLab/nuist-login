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

export function getIronSessionPW(): string {
    const secret = process.env["IRONSESSION_PASS"];
    if (typeof secret !== "string" || secret.length < 32) {
        logger.fatal("missing environment variable: IRONSESSION_PASS or variable too simple")
        throw new Error("environment variable not correctly configured");
    }
    return secret;
}

export function getAppCookieName(): string {
    const name = process.env["APP_COOKIE_NAME"];
    if (typeof name !== "string" || name.length === 0) {
        logger.fatal("missing environment variable: APP_COOKIE_NAME")
        throw new Error("environment variable not correctly configured");
    }
    return name;
}