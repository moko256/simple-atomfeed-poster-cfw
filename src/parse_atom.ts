import { XMLParser } from "fast-xml-parser";

export interface Feed {
    author: [Person] | undefined,
    category: [Category] | undefined,
    contributor: [Person] | undefined,
    generator: Generator | undefined,
    icon: AtomText,
    id: AtomText,
    link: [Link] | undefined,
    logo: AtomText,
    rights: AtomText,
    subtitle: AtomText,
    title: AtomText,
    updated: AtomText,
    entry: [Entry] | undefined,
}

export interface Entry {
    author: [Person] | undefined,
    category: [Category] | undefined,
    content: AtomText,
    contributor: [Person] | undefined,
    id: AtomText,
    link: [Link] | undefined,
    published: AtomText,
    rights: AtomText,
    source: Source | undefined,
    summary: AtomText,
    title: AtomText,
    updated: AtomText,
}

export interface Person {
    name: AtomText,
    uri: AtomText,
    email: AtomText,
}

export interface Category {
    "@_term": string | undefined,
    "@_scheme": string | undefined,
    "@_label": string | undefined,
    "#text": string | undefined,
}

export interface Generator {
    "@_uri": string | undefined,
    "@_version": string | undefined,
    "#text": string | undefined,
}

export interface Link {
    "@_href": string | undefined,
    "@_rel": string | undefined,
    "@_type": string | undefined,
    "@_hreflang": string | undefined,
    "@_title": string | undefined,
    "@_length": string | undefined,
    "#text": string | undefined,
}

export interface Source {
    contributor: [Person] | undefined,
    generator: Generator | undefined,
    icon: AtomText,
    id: AtomText,
    link: [Link] | undefined,
    logo: AtomText,
    rights: AtomText,
    subtitle: AtomText,
    title: AtomText,
    updated: AtomText,
}

export type AtomText = { "#text": string | undefined } | undefined;

export function parseAtom(feedText: string): Feed | undefined {
    const options = {
        ignoreAttributes: false,
        alwaysCreateTextNode: true,
        attributeNamePrefix: "@_",
        stopNodes: [
            "*.title",
            "*.rights",
            "*.subtitle",
            "*.content",
            "*.summary",
            "*.name",
            "*.category.@_term",
            "*.category.@_label",
            "*.category.#text",
            "*.generator.#text",
            "*.link.@_title",
            "*.link.#text",
        ],
        isArray: (_name: string, jpath: string, _isLeafNode: boolean, _isAttribute: boolean) => {
            if ([
                "feed.author",
                "feed.category",
                "feed.contributor",
                "feed.link",
                "feed.entry",
                "feed.entry.author",
                "feed.entry.category",
                "feed.entry.contributor",
                "feed.entry.link",
                "feed.entry.source.contributor",
                "feed.entry.source.link",
            ].indexOf(jpath) != -1) {
                return true;
            } else {
                return false;
            }
        },
    };
    const parser = new XMLParser(options);
    const output: { feed: Feed } = parser.parse(feedText);

    return output?.feed;
}
