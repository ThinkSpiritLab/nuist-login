import { MaxLength, IsString, IsNotEmpty } from "class-validator";
import { NextApiHandler, PageConfig } from "next";
import { plainToClass } from "class-transformer";
import superagent from "superagent";
import type { ApiRes } from "../../api-typings";
import timeout from "../../timeout";
import { logger } from "../../env";

const CAPTCHA_URL = "http://authserver.nuist.edu.cn/authserver/checkNeedCaptcha.htl";

export type CaptchaCheckerRes = ApiRes<boolean>;

class CaptchaCheckerReq {
    @MaxLength(128)
    @IsString()
    @IsNotEmpty()
    username!: string
}

const CaptchaChecker: NextApiHandler<CaptchaCheckerRes> = async (req, res) => {
    if (req.method?.toLowerCase() !== "get") {
        res.status(405);
        return;
    }

    const checkNeedCaptcha = async (username: string) => {
        const res = await superagent.get(CAPTCHA_URL).query({ username, "_": new Date().getTime() });
        const data: { isNeed: boolean } = JSON.parse(res.text);
        return data;
    }

    try {
        const dto = plainToClass(CaptchaCheckerReq, req.query);
        const r = await timeout(checkNeedCaptcha(dto.username), 16000);
        // if (dto.username == "nocaptest") {
        //     res.status(200).json({ code: 1001, data: false });
        //     return;
        // }
        res.status(200).json({ code: 1001, data: r.isNeed });
    } catch (e) {
        logger.error("/api/captcha-checker: dto error:", e);
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

export default CaptchaChecker;