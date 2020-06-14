import * as Common from "../target";
import { Content, Bytes } from "../../content";

export namespace Normalized {
  export type Content = AsyncIterable<Buffer>;

  export interface Source extends Common.Source {
    content: Content;
  }

  export interface Target extends Common.Target {
    sources: AsyncIterable<Source>;
  }
}

export const normalize = (target: Common.Target): Normalized.Target => {
  return {
    sources: (async function*() {
      for await (const source of target.sources) {
        yield {
          ...source,
          content: normalizeContent(source.content)
        };
      }
    })()
  };
};

/*
 * string
 */

const isString = (content: any): content is string =>
  typeof content === "string";

const normalizeString = (content: string): Normalized.Content => {
  return (async function*() {
    yield Buffer.from(content);
  })();
};

/*
 * Bytes
 */

const isBytes = (content: any): content is Bytes =>
  Buffer.isBuffer(content) ||
  content instanceof ArrayBuffer ||
  ArrayBuffer.isView(content);

const normalizeBytes = (content: Bytes): Normalized.Content => {
  return (async function*() {
    yield Buffer.from(content);
  })();
};

/*
 * Iterable
 */

const isIterable = (content: any): content is Iterable<Bytes> => {
  return content && Symbol.iterator in content;
};

const normalizeIterable = (content: Iterable<Bytes>): Normalized.Content => {
  return (async function*() {
    for (const bytes of content) {
      yield Buffer.from(bytes);
    }
  })();
};

/*
 * AsyncIterable
 */

const isAsyncIterable = (content: any): content is AsyncIterable<Bytes> => {
  return content && Symbol.asyncIterator in content;
};

const normalizeAsyncIterable = (
  content: AsyncIterable<Bytes>
): Normalized.Content => {
  return (async function*() {
    for await (const bytes of content) {
      yield Buffer.from(bytes);
    }
  })();
};

/**
 * Plumbing
 */

const normalizeContent = (content: Content): Normalized.Content => {
  if (isString(content)) {
    return normalizeString(content);
  }
  if (isBytes(content)) {
    return normalizeBytes(content);
  }
  if (isIterable(content)) {
    return normalizeIterable(content);
  }
  if (isAsyncIterable(content)) {
    return normalizeAsyncIterable(content);
  }
};
