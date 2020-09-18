import { Column, Connection, ConnectionOptions, Entity, getConnectionManager, PrimaryColumn, UpdateDateColumn } from "typeorm";


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


export const CONNECTION_OPTIONS: ConnectionOptions = {
    type: "sqlite",
    database: "student_info.sqlite",
    entities: [StudentInfo],
    synchronize: true
};

export async function ensureConnection(): Promise<Connection> {
    const mgr = getConnectionManager();

    // typeorm does not work with HMR
    // + <https://github.com/vercel/next.js/discussions/12254> 
    // + <https://github.com/typeorm/typeorm/issues/6241>

    if (mgr.has("default")) {
        return mgr.get();
    }

    const connection = mgr.create(CONNECTION_OPTIONS);
    await connection.connect()
    return connection;
}