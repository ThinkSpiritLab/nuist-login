import React, { useState, useCallback, useEffect } from "react";
import { Form, Input, Button, Row, Col, message, Spin, Image } from "antd";
import { UserOutlined, LockOutlined, LoadingOutlined } from "@ant-design/icons"
import axios from "axios";
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

    const handleSubmit = useCallback(async () => {
        const username = loginForm.getFieldValue("username");
        const password = loginForm.getFieldValue("password");
        const captcha  = loginForm.getFieldValue("captcha");
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
            }
        }
        setLoading(false);
    }, [])

    const handleGoBack = useCallback(() => {
        setAccount(null);
        setUserInfo(null);
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
                    setCaptcha("api/captcha-transfer");
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
    const REPO_HREF = "https://github.com/ThinkSpiritLab/nuist-login";

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
                    <p>
                        相关代码已开源于
                        <a href={REPO_HREF} style={{ margin: "0 0.5em" }}>ThinkSpiritLab/nuist-login</a>
                    </p>

                    <Form
                        form={loginForm}
                        onFinish={handleSubmit}
                        style={{ display: step !== 1 ? "none" : undefined }}
                    >
                        <Spin spinning={loading}>
                            <Form.Item name="username" rules={[{ required: true, message: "学号不能为空" }]}>
                                <Input onBlur={() => { handleCaptcha(); }}
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
                                        <Image src={captcha}></Image>
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
                                rules={[{ required: true, message: "密码不能为空" }]}
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
