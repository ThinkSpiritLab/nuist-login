import { PageConfig } from "next";
import superagent from "superagent";
import { withIronSession } from "next-iron-session";
import timeout from "../../timeout";
import type { NextIronHandler, ApiRes } from "../../typings";
import { logger, getAppCookieName, getIronSessionPW } from "../../env";

const CAPTCHA_URL = "https://authserver.nuist.edu.cn/authserver/getCaptcha.htl"

type CaptchaTransferRes = ApiRes<null>;

const CaptchaTransfer: NextIronHandler<CaptchaTransferRes> = async (req, res) => {
    if (req.method?.toLowerCase() !== "get") {
        res.status(405);
        return;
    }

    try {
        const getCaptcha = async () => {
            return await superagent.get(CAPTCHA_URL).query(new Date().getTime().toString);
        }
        const r = await timeout(getCaptcha(), 16000);
        req.session.set("Cookie", r.headers["set-cookie"]);
        await req.session.save();
        res.status(200).send(r.body);
    } catch (e) {
        logger.error("/api/captcha-transfer: ", e);
        res.status(500).json({ code: 2005, message: "获取验证码失败" });
    }
}

export const config: PageConfig = {
    api: {
        bodyParser: {
            sizeLimit: "1kb"
        }
    }
}

export default withIronSession(CaptchaTransfer, {
    password: getIronSessionPW(),
    cookieName: getAppCookieName(),
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
    },    
})