# nuist-login

南京信息工程大学在线评测系统自助注册服务

## 部署

1. 创建 `.env.local` 文件，写入

    ```
    OJ_SECRET=密钥
    IRONSESSION_PASS=superstronnnnnnnnnnnnnnnnnngpassword
    APP_COOKIE_NAME=session
    ```

    其中`密钥`替换为 Leverage OJ 自助注册接口的哈希密钥
    `IRONSESSION_PASS` 为加密 session 所用的密钥
    `APP_COOKIE_NAME` 用以在 cookie 中标识 session 字段

2. 编译

    ```
    npm install
    npm run build
    ```

3. 运行

    ```
    npm start
    ```
