import { NextApiHandler, PageConfig } from "next";
import { getUserInfo } from "../../info";
import type { ApiRes } from "../../api-typings";

import crypto from "crypto";

export type RegisterRes = ApiRes<{ location: string }>;

const Register: NextApiHandler<RegisterRes> = async (req, res) => {
    if (req.method?.toLowerCase() !== "post") {
        res.status(405);
        return;
    }

    const username: unknown = req.body.username;
    const password: unknown = req.body.password;
    const nickname: unknown = req.body.nickname;
    const ojPassword: unknown = req.body.ojPassword;
    if (
        typeof username !== "string"
        || typeof password !== "string"
        || typeof nickname !== "string"
        || typeof ojPassword !== "string"
    ) {
        res.status(400).json({ code: 2001, message: "请求格式错误" });
        return;
    }

    let info = undefined;
    try {
        info = await getUserInfo(username, password);
    } catch (e) {
        console.error(e);
        res.status(500).json({ code: 2002, message: "模拟登录失败" })
        return;
    }

    console.debug(new Date().toLocaleString(), info);

    const secret = process.env["OJ_SECRET"];
    if (typeof secret !== "string" || secret.length === 0) {
        console.error("missing environment variable: OJ_SECRET")
        res.status(500).json({ code: 2003, message: "服务配置错误" })
        return;
    }

    const data = {
        id: info["学号"],
        name: info["姓名"],
        sex: info["性别"],
        major: info["专业"],
        college: info["学院"],
        class: info["班级"],
        grade: info["年级"],
        password: ojPassword,
        nickname: nickname,
    };

    const json = JSON.stringify(data);
    const params = {
        data: Buffer.from(json).toString('hex'),
        hash: crypto.createHash('sha256')
            .update(json)
            .update(secret)
            .digest('hex'),
    }

    const location = `https://acm.nuist.edu.cn/v1/register-direct?data=${params.data}&hash=${params.hash}`;
    res.status(200).json({ code: 1001, data: { location } });
};

export const config: PageConfig = {
    api: {
        bodyParser: {
            sizeLimit: "1kb"
        }
    }
}

export default Register;

