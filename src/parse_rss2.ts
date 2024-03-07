import { XMLParser } from "fast-xml-parser";

export interface Rss2 {
    channel: Channel,
}

export interface Channel {
    title: RssText,
    link: RssText,
    description: RssText,

    language: RssText,
    copyright: RssText,
    managingEditor: RssText,
    webMaster: RssText,
    pubDate: RssText,
    lastBuildDate: RssText,
    category: [Category] | undefined,
    generator: RssText,
    docs: RssText,
    cloud: any,
    ttl: RssText,
    image: Image,
    rating: RssText,
    textInput: any,
    skipHours: RssText,
    skipDays: RssText,

    item: [Item] | undefined,
}

export interface Item {
    title: RssText,
    link: RssText,
    description: RssText,
    author: RssText,
    category: [Category] | undefined,
    comments: RssText,
    enclosure: Enclosure,
    guid: Guid,
    pubDate: RssText,
    source: Source,
}

export interface Image {
    url: RssText,
    title: RssText,
    link: RssText,
    width: RssText,
    height: RssText,
}

export interface Source {
    "@_url": RssText,
    "#text": string | undefined,
}

export interface Enclosure {
    "@_url": RssText,
    "@_length": RssText,
    "@_type": RssText,
}

export interface Category {
    "@_domain": RssText,
    "#text": string | undefined,
}

export interface Guid {
    "@_isPermaLink": RssText,
    "#text": string | undefined,
}

export type RssText = { "#text": string | undefined } | undefined;

export function parseRss2(feedText: string): Channel | undefined {
    const options = {
        ignoreAttributes: false,
        alwaysCreateTextNode: true,
        attributeNamePrefix: "@_",
        stopNodes: [
            "*.title",
            "*.description",
        ],
        isArray: (_name: string, jpath: string, _isLeafNode: boolean, _isAttribute: boolean) => {
            if ([
                "rss.channel.category",
                "rss.channel.item",
                "rss.channel.item.category",
            ].indexOf(jpath) != -1) {
                return true;
            } else {
                return false;
            }
        },
    };
    const parser = new XMLParser(options);
    const output: { rss: Rss2 } = parser.parse(feedText);

    return output?.rss?.channel;
}
