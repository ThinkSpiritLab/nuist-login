# 自助注册服务的设计与实现

## 1 项目背景和意义

OJ 账号体系与学校统一身份认证相互独立，互不依赖。

OJ 个人账号和竞赛账号需要对应真实学生身份，其他账号由管理员分配。

新生注册账号有两种方法：

+ 教师或管理员批量导入
+ 新生提前自助注册

自行注册的实现有三种方案：

+ OJ 对接统一身份认证
+ OJ 自行模拟登录
+ 第三方服务模拟登录并转发给 OJ

本项目是第三种方案的实现。

## 2 需求分析

在网页上完成自助注册流程，要求适度的校验，保证能够正确对应账号和身份信息。

## 3 相关技术介绍

### React

前端用户界面库/框架。

<https://reactjs.org/>

<https://react.docschina.org/>

### Next.js

前端框架，支持 SSR 和 API 路由。

<https://nextjs.org/>

<https://www.nextjs.cn/>

### antd

前端 UI 组件库

<https://ant.design/index-cn>

### 爬虫

一类自动获取、清洗、保存网页中有用数据的技术。

### TypeORM

TypeScript ORM，用于操作数据库。

<https://typeorm.io/>

### SQLite

嵌入式 SQL 数据库。

<https://sqlite.org/index.html>

# 4 项目设计

## 4.1 注册流程

```mermaid
sequenceDiagram
	participant OJ
	actor 用户
	participant 前端
	participant 后端
	participant 统一身份认证
	participant 教务系统
	用户 ->> 前端: 输入学号
	前端 ->> 后端: GET /api/captcha-checker
	后端 ->> 统一身份认证: 检查是否需要验证码
	alt 需要验证码 
		统一身份认证 --) 后端: 返回「需要验证码」
		后端 ->> 统一身份认证: 获取 验证码
		统一身份认证 --) 后端: 返回验证码和 cookie
		后端 --) 前端: 返回验证码cookie
	else 不需要验证码 
		统一身份认证 --) 后端: 返回「不需要验证码」
		后端 --) 前端: 返回「不需要验证码」
	end
	
	用户 ->> 前端: 提交登录表单
	前端 ->> 后端: POST /api/info
	后端 ->> 统一身份认证: 模拟登录
	统一身份认证 --)后端: 更新 cookie
	后端 ->> 教务系统: 携带 cookie 请求学生身份信息
	教务系统 --) 后端: 返回学生身份信息
	后端 --) 前端: 提取并返回整理好的身份数据
	前端 --) 用户: 返回注册表单 
	用户 ->> 前端: 输入昵称、密码
	前端 ->> 后端: POST /api/register
	后端 --) 前端: 保存学生昵称、身份信息，留作统计，生成OJ注册URL并签名
	前端 --) 用户: 显示验证成功，准备重定向
	用户 ->> OJ: 访问注册URL
	OJ --) 用户: 返回注册结果

```

![](signup.svg)

## 4.2 数据库表结构

```typescript
@Entity()
export class StudentInfo {
    @PrimaryColumn({ type: "varchar", length: 32 })
    id!: string; // 学号

    @Column({ type: "varchar", length: 32 })
    name!: string; // 姓名

    @Column({ type: "varchar", length: 32 })
    gender!: string; // 性别

    @Column({ type: "varchar", length: 256 })
    major!: string; // 专业

    @Column({ type: "varchar", length: 256 })
    college!: string; // 学院

    @Column({ type: "varchar", length: 256 })
    class!: string; // 班级

    @Column({ type: "varchar", length: 32 })
    grade!: string; // 年级

    @Column({ type: "varchar", length: 512 })
    nickname!: string; // 昵称

    @UpdateDateColumn()
    updatedTime!: Date; // 更新时间
}
```

## 4.3 安全机制

部署者在配置文件中写入 OJ 注册接口的**密钥**。

后端根据**账号数据**和**接口密钥**生成**签名**，使用 SHA-256 哈希算法。

OJ 注册接口接受**账号数据**和**签名**，根据**密钥**重新计算**正确签名**。

如果**传入的签名**与**正确签名**匹配，说明此次注册来源于已授权的服务，可以接受。

如果不匹配，则拒绝注册。

## 4.4 Session 实现

前端学号输入框焦点改变时，检查该用户此次登录是否需要验证码。

如果需要验证码，后端请求验证码，同时将此 Session 上下文加密后以 Cookie 形式保存到前端。后端得到提交登录凭证并爬取用户信息后，将用户信息同样保存到前端，直到用户注册完成后，清理之前保存的信息。

需要部署者在配置文件中写入 `IRONSESSION_PASS` ( 用于加密 Cookie ) 和 `APP_COOKIE_NAME` ( 保存 Cookie 的名称 ) 。