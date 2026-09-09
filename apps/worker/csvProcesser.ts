import { db } from "@repo/db";
import { createClient } from "redis";
import { parse } from "csv-parse";
import { createReadStream, unlinkSync } from "node:fs";

const BATCH_SIZE = 500;
const [jobId, filepath] = process.argv.slice(2);

if (!jobId || !filepath) {
  console.error("Job ID and file path are required");
  process.exit(1);
}

const redis = createClient();



async function run() {
    await redis.connect();
    await db.orm.public.Job.where({ id: jobId }).update({ status: "processing" });

    let batch: {jobId: string, rowNumber: number, data: unknown}[] = [];
    let rowNumber = 0;

    try{
        const parser = createReadStream(filepath).pipe(
            parse({columns: true, skip_empty_lines: true})
        )

        for await (const record of parser) {
            rowNumber++;
            batch.push({ jobId, rowNumber, data: record });

            if( batch.length >= BATCH_SIZE) {
                
                await flushBatch(batch);
                batch = [];
            }
        }
        if( batch.length > 0) { await flushBatch(batch); }

        await db.orm.public.Job.where({ id: jobId }).update({ 
            status: "done" ,
            totalRows: rowNumber,
            processedRows: rowNumber
        });
        console.log(`Job ${jobId} complete: ${rowNumber} rows`);
    }
    catch (error) {
        console.error(`Job ${jobId} failed:`, error);
        await db.orm.public.Job.where({ id: jobId }).update({ status: "failed" });
    }
    finally {
        unlinkSync(filepath);
        await redis.quit();
    }
}
async function flushBatch(batch: {jobId: string, rowNumber: number, data: unknown}[]) {
    await db.orm.public.Row.createAll(batch)
    const processed = batch[batch.length - 1].rowNumber;
    await db.orm.public.Job.where({ id: jobId }).update({ processedRows: processed });
    await redis.hSet(`job:${jobId}`, "processedRows", processed.toString());
}

run();