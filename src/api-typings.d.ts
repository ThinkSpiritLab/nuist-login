export type ApiRes<T> = {
    code: 1001, data: T;
} | {
    code: 2001, message: "请求格式错误";
} | {
    code: 2002, message: "模拟登录失败"
} | {
    code: 2003, message: "服务配置错误"
} | {
    code: 2004, message: "服务内部错误"
};