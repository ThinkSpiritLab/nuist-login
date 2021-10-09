import { NextApiRequest, NextApiResponse, PageConfig } from "next";
import superagent from "superagent";
import { withIronSession, Session } from "next-iron-session";
import timeout from "../../timeout";
import { logger, getAppCookieName, getIronSessionPW } from "../../env";

const CAPTCHA_URL = "https://authserver.nuist.edu.cn/authserver/getCaptcha.htl"


const CaptchaTransfer = async (req: NextApiRequest & { session: Session }, res: NextApiResponse) => {
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
    cookieName: getAppCookieName()
})