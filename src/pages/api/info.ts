import { NextApiHandler, PageConfig } from "next";
import { UserInfo, getUserInfo } from "../../info";
import type { ApiRes } from "../../api-typings";
import { logger } from "../../env"

export type InfoRes = ApiRes<UserInfo>;

const Info: NextApiHandler<InfoRes> = async (req, res) => {
    if (req.method?.toLowerCase() !== "post") {
        res.status(405);
        return;
    }

    const username: unknown = req.body.username;
    const password: unknown = req.body.password;
    if (typeof username !== "string" || typeof password !== "string") {
        res.status(400).json({ code: 2001, message: "请求格式错误" });
        return;
    }

    try {
        const info = await getUserInfo(username, password);
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

export default Info;