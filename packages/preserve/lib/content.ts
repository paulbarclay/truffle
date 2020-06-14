// (blech...)
type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array;

export type Bytes = Buffer | ArrayBuffer | TypedArray;

export type Content = string | Bytes | Iterable<Bytes> | AsyncIterable<Bytes>;
