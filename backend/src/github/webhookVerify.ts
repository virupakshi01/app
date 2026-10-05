import crypto from "crypto";

/**
 * GitHub signs the raw request body with HMAC-SHA256 using the webhook secret.
 * Must be compared against the *raw* bytes, before any JSON parsing/re-serialization.
 */
export function verifyGithubSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const expectedHeader = `sha256=${expected}`;

  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expectedHeader);
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}
