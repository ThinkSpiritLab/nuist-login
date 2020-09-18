import cheerio from "cheerio";
import CryptoJS from "crypto-js";
import superagent from "superagent";
import { logger } from "./env";

const LOGIN_URL = "http://authserver.nuist.edu.cn/authserver/login";
const SERVICE_URL = "http://authserver.nuist.edu.cn/authserver/index.do";
const HOST_HEADER = "authserver.nuist.edu.cn";
const CAPTCHA_URL = "http://authserver.nuist.edu.cn/authserver/checkNeedCaptcha.htl";
const WLKT_TRIGGER_URL = "http://bkxk.nuist.edu.cn/Default_JZ.aspx";

type Agent = superagent.SuperAgentStatic & superagent.Request;

function encryptPassword(password: string, key: string) {
    const randomString = (len: number): string => {
        const aes_chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
        let ret = "";
        for (let i = 0; i < len; ++i) {
            let idx = Math.floor(Math.random()) * aes_chars.length;
            ret += aes_chars.charAt(idx);
        }
        return ret;
    }

    const getAesString = (data: string, key: string, iv: string): string => {
        const parsedKey = CryptoJS.enc.Utf8.parse(key.replace(/(^\s+)|(\s+$)/g, ""));
        const parsedIv = CryptoJS.enc.Utf8.parse(iv);

        return CryptoJS.AES.encrypt(data, parsedKey, {
            iv: parsedIv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }).toString();
    }

    const encryptAes = (data: string, key: string): string => {
        if (!key) { return data; }
        return getAesString(randomString(64) + data, key, randomString(16));
    }

    try {
        return encryptAes(password, key);
    } catch (e) {
        logger.error(e);
        return password;
    }
}

async function login(agent: Agent, username: string, password: string) {
    interface LoginParams {
        username: string;
        password: string;
        captcha: string;
        _eventId: string;
        cllt: string;
        lt: string;
        execution: string;
    }

    const getParams = async (username: string, password: string): Promise<LoginParams> => {
        const res = await agent.get(LOGIN_URL);
        const $ = cheerio.load(res.text);

        const pwdEncryptSalt: string | undefined = $("#pwdEncryptSalt").val();
        if (pwdEncryptSalt === undefined) {
            throw new Error(`failed to get $("#pwdEncryptSalt").val()`)
        }
        const saltPassword = encryptPassword(password, pwdEncryptSalt);

        const execution: string | undefined = $("#execution").val();
        if (execution === undefined) {
            throw new Error(`failed to get $("#execution").val()`)
        }

        const params: LoginParams = {
            username,
            password: saltPassword,
            captcha: "",
            _eventId: "submit",
            cllt: "userNameLogin",
            lt: "",
            execution,
        };

        return params;
    }

    const checkNeedCaptcha = async (username: string) => {
        const res = await agent.get(CAPTCHA_URL).query({ username, "_": new Date().getTime() });
        const data: { isNeed: boolean } = JSON.parse(res.text);
        if (data.isNeed) {
            throw new Error("login requires captcha")
        }
    }

    const postLogin = async (params: LoginParams) => {
        const res = await agent.post(LOGIN_URL)
            .query({ service: SERVICE_URL })
            .set({ "Host": HOST_HEADER, })
            .type("form")
            .send(params)
            .redirects(10)
        if (res.status !== 200) {
            throw new Error("failed to perform postLogin")
        }
    };

    const params = await getParams(username, password);
    await checkNeedCaptcha(username);
    await postLogin(params);
}

export interface UserInfo {
    "学号": string;
    "姓名": string;
    "性别": string;
    "专业": string;
    "学院": string;
    "班级": string;
    "年级": string;
}

export async function getUserInfo(username: string, password: string): Promise<UserInfo> {
    const agent = superagent.agent();

    await login(agent, username, password);

    const loginWlkt = async (): Promise<string> => {
        const res = await agent.get(WLKT_TRIGGER_URL).redirects(10);
        if (res.redirects.length == 0) {
            throw new Error("failed to perform loginWlkt")
        }
        return res.redirects[res.redirects.length - 1];
    }

    const getInfo = async (url: string) => {
        const res = await agent.get(new URL("../../Student/xsjbxx.aspx", url).toString());

        const pattern = /<div class="box_content">([\s\S]+)<\/div>/g;
        const match = res.text.match(pattern);
        if (match === null) {
            throw new Error("failed to get info content");
        }
        const ans = Array.from(match.values());
        const $ = cheerio.load(ans[0]);

        const info = {
            "学号": $("tbody > tr:nth-child(2) > td:nth-child(2)").text().trim(),
            "姓名": $("tbody > tr:nth-child(2) > td:nth-child(4)").text().trim(),
            "性别": $("tbody > tr:nth-child(3) > td:nth-child(2) > span:nth-child(1)").text().trim(),
            "专业": $("tbody > tr:nth-child(4) > td:nth-child(4) > span:nth-child(1)").text().trim(),
            "学院": $("tbody > tr:nth-child(5) > td:nth-child(2) > span:nth-child(1)").text().trim(),
            "班级": $("tbody > tr:nth-child(5) > td:nth-child(4) > span:nth-child(1)").text().trim(),
            "年级": $("tbody > tr:nth-child(6) > td:nth-child(2)").text().trim(),
        }
        return info;
    }

    const url = await loginWlkt();
    return await getInfo(url);
}
