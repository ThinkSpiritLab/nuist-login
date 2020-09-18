import { NextApiHandler, PageConfig } from "next";
import { getUserInfo } from "../../info";
import type { ApiRes } from "../../api-typings";

import crypto from "crypto";
import { getOJSecret, logger } from "../../env";
import { IsNotEmpty, IsString, MaxLength, validateOrReject } from "class-validator";
import { plainToClass } from "class-transformer";
import { ensureConnection, StudentInfo } from "../../db";
import timeout from "../../timeout";

export type RegisterRes = ApiRes<{ location: string }>;

class RegisterReq {
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
    @IsNotEmpty()
    nickname!: string

    @MaxLength(128)
    @IsString()
    @IsNotEmpty()
    ojPassword!: string
}

const Register: NextApiHandler<RegisterRes> = async (req, res) => {
    if (req.method?.toLowerCase() !== "post") {
        res.status(405);
        return;
    }

    const dto = plainToClass(RegisterReq, req.body);
    try {
        await validateOrReject(dto);
    } catch (errors) {
        logger.error("/api/register: dto error:", errors);
        res.status(400).json({ code: 2001, message: "请求格式错误" });
        return;
    }

    let info = undefined;
    try {
        info = await timeout(getUserInfo(dto.username, dto.password), 16000);
    } catch (e) {
        logger.error("getUserInfo error:", e);
        res.status(500).json({ code: 2002, message: "模拟登录失败" })
        return;
    }

    logger.info(info);

    const secret = getOJSecret();
    if (!secret) {
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
        nickname: dto.nickname,
        password: dto.ojPassword,
    };

    try {
        const connection = await ensureConnection();
        const studentInfoRepo = connection.getRepository(StudentInfo);
        await studentInfoRepo.save({
            id: data.id,
            name: data.name,
            gender: data.sex,
            major: data.major,
            college: data.college,
            class: data.class,
            grade: data.grade,
            nickname: data.nickname,
            updatedTime: new Date()
        });
    } catch (e) {
        logger.error("db error:", e);
        res.status(500).json({ code: 2004, message: "服务内部错误" })
        return;
    }

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

