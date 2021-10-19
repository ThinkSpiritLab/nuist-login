import React, { useState, useCallback, useEffect } from "react";
import { Form, Input, Button, Row, Col, message, Spin, Image } from "antd";
import { UserOutlined, LockOutlined, LoadingOutlined } from "@ant-design/icons"
import axios from "axios";
import PasswordValidator from "password-validator";
import type { InfoRes } from "./api/info";
import type { RegisterRes } from "./api/register";
import type { CaptchaCheckerRes } from "./api/captcha-checker";
import type { UserInfo } from "../info";
import Head from "next/head";

const Index: React.FC = () => {
    useEffect(() => {
        console.log("欢迎关注 ThinkSpirit 开发组", "https://github.com/ThinkSpiritLab");
        console.log("欢迎关注 ThinkSpirit 开发组", "https://github.com/ThinkSpiritLab");
        console.log("欢迎关注 ThinkSpirit 开发组", "https://github.com/ThinkSpiritLab");
    }, []);

    type Account = { username: string, password: string };

    const [account, setAccount] = useState<Account | null>();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [captcha, setCaptcha] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loginForm] = Form.useForm();
    const [registerForm] = Form.useForm();

    const schema = new PasswordValidator()
    schema.is().min(8).is().max(128).has().letters().has().digits();

    const handleSubmit = useCallback(async () => {
        const username = loginForm.getFieldValue("username");
        const password = loginForm.getFieldValue("password");
        const captcha = loginForm.getFieldValue("captcha");
        setLoading(true);
        let data = null;
        try {
            const res = await axios.post<InfoRes>("./api/info",
                { username, password, captcha: (captcha ? captcha : "") },
                { validateStatus: () => true }
            );
            data = res.data;
        } catch (e) {
            message.error({ content: "网络异常", style: { marginTop: "50vh" } });
        }
        if (data) {
            if (data.code === 1001) {
                setAccount({ username, password });
                setUserInfo(data.data);
                setStep(2);
            } else {
                message.error({ content: data.message, style: { marginTop: "50vh" } });
                setCaptcha(`api/captcha-transfer?${new Date().getTime()}`);
            }
        }
        setLoading(false);
    }, [])

    const handleGoBack = useCallback(() => {
        setAccount(null);
        setUserInfo(null);
        setCaptcha(undefined);
        loginForm.resetFields(["username", "password", "captcha"]);
        setStep(1);
    }, []);

    const handleRegister = useCallback(async () => {
        const nickname = registerForm.getFieldValue("nickname");
        const ojPassword = registerForm.getFieldValue("password");

        try {
            setLoading(true);
            const res = await axios.post<RegisterRes>("./api/register", { nickname, ojPassword, ...account });
            if (res.data.code === 1001) {
                const location = res.data.data.location;
                setTimeout(() => { window.location.href = location }, 1200)
            }
            setStep(3);
        } catch (e) {
            console.error(e);
            message.error({ content: "注册失败", style: { marginTop: "50vh" } });
        }
        finally {
            setLoading(false);
        }
    }, [account])

    const handleCaptcha = useCallback(async () => {
        if (!loginForm.getFieldValue("username")) return

        try {
            const r = await axios.get<CaptchaCheckerRes>("./api/captcha-checker", {
                params: {
                    username: loginForm.getFieldValue("username")
                }
            });
            if (r.data.code === 1001) {
                if (r.data.data) {
                    setCaptcha(`api/captcha-transfer?${new Date().getTime()}`);
                } else {
                    setCaptcha(undefined);
                }
            } else if (r.data.code === 2005) {
                throw new Error(r.data.message)
            }
        } catch (e) {
            console.error(e);
            message.error({ content: "验证码服务异常", style: { marginTop: "50vh" } });
        }
    }, []);

    const OJ_HREF = "https://cpc.nuist.edu.cn";

    return (
        <>
            <Head>
                <title>自助注册</title>
            </Head>
            <Row justify="center" style={{ margin: "1em" }}>
                <Col style={{ maxWidth: "600px" }} >
                    <h1 style={{ textAlign: "center" }}>
                        自助注册
                    </h1>
                    <p>
                        本服务用于注册 Leverage 正式账号，请在
                        <a href={OJ_HREF} style={{ margin: "0 0.5em" }}>{OJ_HREF}</a>
                        登录。
                    </p>
                    <p>
                        本服务将使用您的学号和密码登录教务系统，以确认真实身份。
                    </p>

                    <Form
                        form={loginForm}
                        onFinish={handleSubmit}
                        style={{ display: step !== 1 ? "none" : undefined }}
                    >
                        <Spin spinning={loading}>
                            <Form.Item name="username" rules={[{ required: true, message: "学号不能为空" }]}>
                                <Input onBlur={() => { handleCaptcha(); }} onFocus={() => { handleCaptcha(); }}
                                    prefix={<UserOutlined style={{ color: "rgba(0, 0, 0, 0.25)" }} />} type="text" placeholder="学号" />
                            </Form.Item>
                            <Form.Item name="password" rules={[{ required: true, message: "密码不能为空" }]}>
                                <Input prefix={<LockOutlined style={{ color: "rgba(0, 0, 0, 0.25)" }} />} type="password" placeholder="统一身份认证密码" />
                            </Form.Item>
                            <Form.Item name="captcha" hidden={captcha === undefined ? true : false}>
                                <Row>
                                    <Col flex="auto">
                                        <Input prefix={<LockOutlined style={{ color: "rgba(0, 0, 0, 0.25)" }} />} type="text" placeholder="验证码" />
                                    </Col>
                                    <Col>
                                        <Image height={30} fallback="data:image/png;base64,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" src={captcha} placeholder={true} onError={() => { message.error({ content: "验证码服务异常", style: { marginTop: "50vh" } }) }}></Image>
                                    </Col>
                                </Row>
                            </Form.Item>
                            <Form.Item style={{ textAlign: "center" }}>
                                <Button type="primary" htmlType="submit" style={{ width: "30%" }}>
                                    提交
                                </Button>
                            </Form.Item>
                        </Spin>
                    </Form>

                    <Form
                        form={registerForm}
                        onFinish={handleRegister}
                        labelCol={{ span: 3 }}
                        style={{ display: step !== 2 ? "none" : undefined }}
                    >
                        <Spin spinning={loading}>
                            {(["学号", "姓名", "性别", "年级", "学院", "专业", "班级"] as Array<keyof UserInfo>).map((field: keyof UserInfo) => (
                                <Form.Item label={field} required key={field}>
                                    <Input type="text" value={userInfo !== null ? userInfo[field] : undefined} disabled />
                                </Form.Item>
                            ))}

                            <Form.Item
                                label="昵称"
                                name="nickname"
                                rules={[{ required: true, message: "昵称不能为空" }]}
                                required
                            >
                                <Input type="text" placeholder="请输入昵称" />
                            </Form.Item>

                            <Form.Item
                                label="密码"
                                name="password"
                                rules={[{
                                    required: true, validator: (_, value) => {
                                        if (schema.validate(value)) {
                                            return Promise.resolve();
                                        } else {
                                            return Promise.reject();
                                        }
                                    },
                                    message: "密码应至少 8 位长，包含数字和字母"
                                }]}
                                required
                            >
                                <Input type="password" placeholder="请输入密码" />
                            </Form.Item>

                            <Form.Item
                                name="confirmPassword"
                                dependencies={["password"]}
                                rules={[
                                    { required: true, message: "密码不能为空" },
                                    (form) => ({
                                        async validator(_rule, value) {
                                            if (form.getFieldValue("password") !== value) {
                                                throw new Error("两次密码不一致")
                                            }
                                        }
                                    })
                                ]}
                                wrapperCol={{ sm: { offset: 3 } }}
                                required
                            >
                                <Input type="password" placeholder="再次输入密码" />
                            </Form.Item>

                            <div style={{ display: "flex", justifyContent: "space-around" }}>
                                <Button onClick={handleGoBack} style={{ minWidth: "5em" }}>
                                    后退
                                </Button>
                                <Button type="primary" htmlType="submit" style={{ minWidth: "5em" }}>
                                    确认
                                </Button>
                            </div>
                        </Spin>
                    </Form>

                    <div style={{ textAlign: "center", display: step !== 3 ? "none" : undefined }}>
                        <Spin spinning indicator={<LoadingOutlined />} size="large" />
                        <p style={{ marginTop: "1em" }}>验证成功，正在跳转……</p>
                    </div>
                </Col>
            </Row>
        </>
    )
};

export default Index;
