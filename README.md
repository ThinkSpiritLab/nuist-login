# nuist-login

南京信息工程大学在线评测系统自助注册服务

## 部署

1. 创建 `.env.local` 文件，写入

    ```
    OJ_SECRET=密钥
    ```

    其中`密钥`替换为 Leverage OJ 自助注册接口的哈希密钥

2. 编译

    ```
    yarn install
    yarn build
    ```

3. 运行

    ```
    yarn start
    ```
