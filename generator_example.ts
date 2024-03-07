import { Entry, Feed } from "./src/parse_atom"
import { Channel, Item } from "./src/parse_rss2";

export const FEED_URL: string = "https://example.com/";
export const POST_URL: string = "https://example.com/";

export const POST_BODY_MIME_TYPE = "application/json"

export function generatePostBody(message: string): string {
    return JSON.stringify(
        {
            message: message,
        }
    );
}

export function generateMessageFromAtom(articleInfo: Feed, article: Entry): string {
    console.log(articleInfo.title, article.title);

    return `${article?.title?.["#text"] ?? ""}\n\n${article?.link?.map((link) => { link["@_href"] })?.join("\n")}`;
}

export function generateMessageFromRss2(articleInfo: Channel, article: Item): string {
    console.log(articleInfo.title, article.title);

    return `${article?.title?.["#text"] ?? ""}\n\n${article?.link?.["#text"]}`;
}
