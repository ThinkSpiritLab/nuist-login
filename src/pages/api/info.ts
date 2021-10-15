import { PageConfig } from "next";
import { withIronSession } from "next-iron-session";
import { UserInfo, getUserInfo } from "../../info";
import type { ApiRes, NextIronHandler } from "../../typings";
import { logger, getIronSessionPW, getAppCookieName } from "../../env"
import { IsNotEmpty, IsString, MaxLength, validateOrReject } from "class-validator";
import { plainToClass } from "class-transformer";
import timeout from "../../timeout";

export type InfoRes = ApiRes<UserInfo>;

class InfoReq {
    @MaxLength(128)
    @IsString()
    @IsNotEmpty()
    username!: string

    @MaxLength(128)
    @IsString()
    @IsNotEmpty()
    password!: string

    @MaxLength(128)
    @IsString()
    captcha!: string
}

const Info: NextIronHandler<InfoRes> = async (req, res) => {
    if (req.method?.toLowerCase() !== "post") {
        res.status(405);
        return;
    }

    const dto = plainToClass(InfoReq, req.body);
    try {
        await validateOrReject(dto);
    } catch (errors) {
        logger.error("/api/info: dto error:", errors);
        res.status(400).json({ code: 2001, message: "请求格式错误" });
        return;
    }

    try {
        const cookies: undefined | string[] = req.session.get("Cookie");
        const info = await timeout(getUserInfo(dto.username, dto.password, dto.captcha, cookies), 16000);
        req.session.set("info", info);
        await req.session.save();
        res.status(200).json({ code: 1001, data: info });
    } catch (e) {
        logger.error("getUserInfo error:", e);
        res.status(500).json({ code: 2002, message: "模拟登录失败" })
    }

}

export const config: PageConfig = {
    api: {
        bodyParser: {
            sizeLimit: "1kb"
        }
    }
}

export default withIronSession(Info, {
    password: getIronSessionPW(),
    cookieName: getAppCookieName(),
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
    },   
})