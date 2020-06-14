import fs from "fs";
import { join as joinPath } from "path";

import * as Preserve from "@truffle/preserve";

export interface FilesystemReferenceTarget {
  path: string;
  settings?: Preserve.Targets.TargetSettings;
}

export const targetPath = async (
  target: FilesystemReferenceTarget
): Promise<Preserve.Target> => {
  const { path, settings = {} } = target;

  const stats = await fs.promises.stat(path);

  if (stats.isFile()) {
    return {
      sources: [
        {
          content: fs.createReadStream(path),
          settings
        }
      ]
    };
  } else if (stats.isDirectory()) {
    return {
      sources: await sourcePath({ path, settings })
    };
  }
};

const sourcePath = async ({
  path,
  settings = {}
}: FilesystemReferenceTarget): Promise<Preserve.Target["sources"]> => {
  const stats = await fs.promises.stat(path);

  if (stats.isFile()) {
    return (async function*() {
      yield {
        path,
        content: fs.createReadStream(path),
        settings
      };
    })();
  } else if (stats.isDirectory()) {
    const directory = await fs.promises.readdir(path);

    return (async function*() {
      for (const entry of directory) {
        const child = {
          path: joinPath(path, entry),
          settings:
            "path" in settings
              ? { ...settings, path: joinPath(settings.path, entry) }
              : settings
        };

        for await (const content of await sourcePath(child)) {
          yield content;
        }
      }
    })();
  }
};
