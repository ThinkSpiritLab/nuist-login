import { NextApiHandler } from "next";
import superagent from "superagent";
import timeout from "../../timeout";
import { logger } from "../../env";

const CAPTCHA_URL = "https://authserver.nuist.edu.cn/authserver/getCaptcha.htl"

const CaptchaTransfer: NextApiHandler = async (req, res) => {
    if (req.method?.toLowerCase() !== "get") {
        res.status(405);
        return;
    }

    try {
        const getCaptcha = async () => {
            return await superagent.get(CAPTCHA_URL).query(new Date().getTime().toString);
        }
        const r = await timeout(getCaptcha(), 16000);
        res.status(200).send(r.body);
    } catch (e) {
        logger.error("/api/captcha-transfer: ", e);
        res.status(500).json({ code: 2005, message: "获取验证码失败" });
    }
}
export default CaptchaTransfer;