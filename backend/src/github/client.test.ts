import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { validatePublicWebhookUrl } from "./client";

describe("validatePublicWebhookUrl", () => {
  it("accepts a public HTTPS URL", () => {
    assert.equal(
      validatePublicWebhookUrl("https://example.ngrok-free.app"),
      "https://example.ngrok-free.app"
    );
  });

  it("rejects localhost webhook URLs", () => {
    assert.throws(
      () => validatePublicWebhookUrl("http://localhost:4000"),
      /public HTTPS URL.*localhost/i
    );
  });
});
