export default async function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise((_resolve, reject) => {
        setTimeout(() => reject(new Error("timeout")), ms);
    })
    return await Promise.race([promise, timeout]) as Promise<T>
}