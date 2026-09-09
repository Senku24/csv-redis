import { createClient } from "redis";
import fs from "fs";
import { spawn } from "bun";
import { db } from "@repo/db";
import path from "path/win32";


const redis = createClient();
await redis.connect();

while (true) {
    const res = await redis.rPop("csv_data");
    if (!res) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
    }

    const { jobId, csv } = JSON.parse(res.toString());

    const filePath = __dirname +  `/csv/${jobId}.csv`;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, csv);
    await db.orm.public.Job.where({ id: jobId }).update({ filename: filePath });
    console.log(`Job ${jobId}: CSV written to ${filePath}`);

    const proc = spawn({
        cmd: ["bun", "csvProcesser.ts" , jobId, filePath], 
        stdout: "inherit",
        stderr: "inherit",
    });

    proc.exited.then((code) => {
    console.log(`Job ${jobId} process exited with code ${code}`);
  });

}