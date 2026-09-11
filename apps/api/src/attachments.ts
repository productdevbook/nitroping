const startsWithBytes = (bytes: Uint8Array, signature: number[]): boolean =>
  signature.every((value, index) => bytes[index] === value);

export const attachmentSignatureMatches = (
  contentType: string,
  input: ArrayBuffer | Uint8Array,
): boolean => {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  switch (contentType) {
    case "image/png":
      return startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg":
      return startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
    case "image/gif":
      return startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38]);
    case "image/webp":
      return (
        startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        bytes.length >= 12 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      );
    case "application/pdf":
      return startsWithBytes(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    case "text/plain":
      return !bytes.some((value) => value === 0);
    default:
      return false;
  }
};
