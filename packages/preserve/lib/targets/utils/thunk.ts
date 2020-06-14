import { normalize } from "./normalize";
import * as Common from "../target";

export namespace Thunked {
  export type Content = string;

  export interface Source extends Common.Source {
    content: Content;
  }

  export interface Target extends Common.Target {
    sources: Source[];
  }
}

export const thunk = async (target: Common.Target): Promise<Thunked.Target> => {
  const { sources } = normalize(target);

  const thunkedTarget: Thunked.Target = {
    sources: []
  };

  for await (const source of sources) {
    thunkedTarget.sources.push({
      ...source,
      content: await thunkContent(source.content)
    });
  }

  return thunkedTarget;
};

const thunkContent = async (
  content: AsyncIterable<Buffer>
): Promise<Thunked.Content> => {
  const buffers: Buffer[] = [];

  for await (const piece of content) {
    buffers.push(piece);
  }

  return Buffer.concat(buffers).toString();
};
