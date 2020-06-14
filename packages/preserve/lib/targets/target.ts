import { Content } from "../content";

export interface Source {
  content: Content;
  settings?: TargetSettings;
}

export interface Target {
  sources: Iterable<Source> | AsyncIterable<Source>;
}

export interface TargetSettings {
  path?: string;
}
