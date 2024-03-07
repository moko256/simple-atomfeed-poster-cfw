import { parseAtom, Feed } from "./parse_atom"
import { Channel, parseRss2 } from "./parse_rss2";
import { FEED_URL, POST_BODY_MIME_TYPE, POST_URL, generateMessageFromAtom, generateMessageFromRss2, generatePostBody } from "../generator";
import {
    ok,
} from 'node:assert';

export interface Env {
    // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
    SIMPLE_ATOMFEED_POSTER_CFW_STATE_KV: KVNamespace;

    // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
    // MY_DURABLE_OBJECT: DurableObjectNamespace;
    //
    // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
    // MY_BUCKET: R2Bucket;
    //
    // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
    // MY_SERVICE: Fetcher;
    //
    // Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
    // MY_QUEUE: Queue;
    //
    // Example binding to a D1 Database. Learn more at https://developers.cloudflare.com/workers/platform/bindings/#d1-database-bindings
    // DB: D1Database
}

interface ProceedState {
    lastDatePosted: number,
}

function proceed(lastState: ProceedState, responseText: string): [string[], ProceedState] {
    const resultBody = responseText;

    let posts: string[] | undefined;
    let latestDate: number | undefined;

    const rss = parseRss2(resultBody);
    if (rss) {
        const r = processRss2(lastState.lastDatePosted, rss);
        posts = r[0];
        latestDate = r[1];
    } else {
        const atom = parseAtom(resultBody);
        if (atom) {
            const r = processAtom(lastState.lastDatePosted, atom);
            posts = r[0];
            latestDate = r[1];
        }
    }

    return [posts ?? [], { lastDatePosted: latestDate ?? Date.now() }]
}

function processRss2(lastDate: number, channel: Channel): [string[], number] {
    let posts: string[] = [];
    let latestDate: number = Date.now();

    for (const item of Array.from(channel?.item ?? []).reverse()) {
        ok(item?.pubDate?.["#text"]);
        const date = Date.parse(item?.pubDate?.["#text"] ?? "");
        if (date > lastDate.valueOf()) {
            const text = generateMessageFromRss2(channel, item);

            latestDate = date;
            posts.push(text);
        }
    }

    return [posts, latestDate];
}

function processAtom(lastDate: number, feed: Feed): [string[], number] {
    let posts: string[] = [];
    let latestDate: number = Date.now();

    for (const entry of Array.from(feed?.entry ?? []).reverse()) {
        ok(entry?.published?.["#text"]);
        const date = Date.parse(entry?.published?.["#text"] ?? "");
        if (date > lastDate.valueOf()) {
            const text = generateMessageFromAtom(feed, entry);

            latestDate = date;
            posts.push(text);
        }
    }

    return [posts, latestDate];
}

async function getAndPost(env: Env) {
    try {

        let newLastModified = null;


        const requestHeaders = new Headers();
        const lastModified = await env.SIMPLE_ATOMFEED_POSTER_CFW_STATE_KV.get("lastModified");
        if (lastModified) {
            requestHeaders.append("If-Modified-Since", new Date(parseInt(lastModified, 10)).toUTCString())
        }
        const response = await fetch(FEED_URL, { headers: requestHeaders, cf: { cacheEverything: false } },);

        if (response.status == 200) {
            console.log("Status 200: Got.");

            const lastDate = await env.SIMPLE_ATOMFEED_POSTER_CFW_STATE_KV.get("lastDate");

            // FOR TEST
            // let lastDateNumber = Date.parse("Wed, 14 Feb 2024 17:28:38 +0000");

            let lastDateNumber = Date.now();
            if (lastDate) {
                lastDateNumber = parseInt(lastDate, 10);
            }

            const result = proceed({ lastDatePosted: lastDateNumber }, await response.text());

            for (const postMessage of result[0]) {
                console.log("Posting: ", postMessage);

                const postBody = generatePostBody(postMessage);

                const requestHeaders = new Headers();
                requestHeaders.append("Content-Type", POST_BODY_MIME_TYPE);

                const postResponse = await fetch(POST_URL, { method: "POST", body: postBody, headers: requestHeaders });
                if (!postResponse.ok) {
                    throw new Error("Error: Post returns error: " + postResponse.status.toString());
                }
            }

            await env.SIMPLE_ATOMFEED_POSTER_CFW_STATE_KV.put("lastDate", result[1].lastDatePosted.toString(10));

            newLastModified = response.headers.get("Last-Modified");
        } else if (response.status == 304) {
            console.log("Status 304: skipped.");
            newLastModified = response.headers.get("Last-Modified");
        } else {
            throw new Error("Error: Feed returns error: " + response.status.toString());
        }


        if (newLastModified) {
            await env.SIMPLE_ATOMFEED_POSTER_CFW_STATE_KV.put("lastModified", Date.parse(newLastModified).toString());
        }
    } catch (e: any) {
        console.log("Error: ", e.toString());
        throw new Error("Error: " + e.toString());
    }
}

const sleep = (second: number) => new Promise(resolve => setTimeout(resolve, second));

export default {
    // FOR TEST
    // async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    //     if (new URL(request.url).pathname == "/") {
    //         // await getAndPost(env);
    //         // return new Response("HELLO!");

    //         return await fetch(FEED_URL);
    //     }
    // },

    async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
        await sleep(1 + Math.random() * 10);
        await getAndPost(env);
    },
};
