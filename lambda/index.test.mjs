// node --test index.test.mjs   (Node 20+)

import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

// ── mocks (must be defined before importing handler) ──────────────────────────

let mockJwtVerify = async () => ({
  payload: { token_use: "access", client_id: "ljo49fqps95ljmp4b065qas8j" },
});
let mockS3Send = async () => ({});

mock.module("jose", {
  namedExports: {
    createRemoteJWKSet: () => ({}),
    jwtVerify: (...args) => mockJwtVerify(...args),
  },
});

mock.module("@aws-sdk/client-s3", {
  namedExports: {
    S3Client: class {
      send(...args) { return mockS3Send(...args); }
    },
    PutObjectCommand: class {
      constructor(params) { this.params = params; }
    },
  },
});

const { handler } = await import("./index.mjs");

// ── helpers ───────────────────────────────────────────────────────────────────

function resetMocks() {
  mockJwtVerify = async () => ({
    payload: { token_use: "access", client_id: "ljo49fqps95ljmp4b065qas8j" },
  });
  mockS3Send = async () => ({});
}

function makeEvent({ method = "POST", body = {}, auth = "Bearer valid-token" } = {}) {
  return {
    requestContext: { http: { method } },
    headers: { authorization: auth },
    isBase64Encoded: false,
    body: JSON.stringify(body),
  };
}

const VALID_CONTENT = {
  notice: "Test notice",
  stars:   [{ name: "Alice", course: "JEE", exam: "JEE Adv '25", highlight: "AIR 1" }],
  faculty: [{ name: "Dr. X", sub: "10yr", points: ["p1"], highlight: "100+", highlightLabel: "Selections" }],
};

// ── CORS ─────────────────────────────────────────────────────────────────────

describe("CORS preflight", () => {
  it("returns 200 for OPTIONS", async () => {
    const r = await handler(makeEvent({ method: "OPTIONS" }));
    assert.equal(r.statusCode, 200);
  });
});

// ── Auth ──────────────────────────────────────────────────────────────────────

describe("Auth", () => {
  it("401 when Authorization header is absent", async () => {
    const r = await handler(makeEvent({ auth: "" }));
    assert.equal(r.statusCode, 401);
  });

  it("401 when jwt verification throws", async () => {
    mockJwtVerify = async () => { throw new Error("bad token"); };
    const r = await handler(makeEvent());
    assert.equal(r.statusCode, 401);
    resetMocks();
  });

  it("401 when token_use is not 'access'", async () => {
    mockJwtVerify = async () => ({ payload: { token_use: "id", client_id: "ljo49fqps95ljmp4b065qas8j" } });
    const r = await handler(makeEvent());
    assert.equal(r.statusCode, 401);
    resetMocks();
  });

  it("401 when client_id does not match", async () => {
    mockJwtVerify = async () => ({ payload: { token_use: "access", client_id: "wrong" } });
    const r = await handler(makeEvent());
    assert.equal(r.statusCode, 401);
    resetMocks();
  });
});

// ── Body parsing ──────────────────────────────────────────────────────────────

describe("Body parsing", () => {
  it("400 for malformed JSON", async () => {
    const event = makeEvent();
    event.body = "not-json";
    const r = await handler(event);
    assert.equal(r.statusCode, 400);
  });
});

// ── content.json update ───────────────────────────────────────────────────────

describe("content update", () => {
  it("200 and writes to content.json", async () => {
    let captured;
    mockS3Send = async (cmd) => { captured = cmd.params; return {}; };

    const r = await handler(makeEvent({ body: { type: "content", content: VALID_CONTENT } }));
    assert.equal(r.statusCode, 200);
    assert.equal(captured.Key, "content.json");
    assert.equal(captured.ContentType, "application/json");
    resetMocks();
  });

  it("400 when notice is not a string", async () => {
    const r = await handler(makeEvent({ body: { type: "content", content: { ...VALID_CONTENT, notice: 42 } } }));
    assert.equal(r.statusCode, 400);
  });

  it("400 when stars array exceeds 10", async () => {
    const content = { ...VALID_CONTENT, stars: Array(11).fill(VALID_CONTENT.stars[0]) };
    const r = await handler(makeEvent({ body: { type: "content", content } }));
    assert.equal(r.statusCode, 400);
  });

  it("400 when faculty array exceeds 5", async () => {
    const content = { ...VALID_CONTENT, faculty: Array(6).fill(VALID_CONTENT.faculty[0]) };
    const r = await handler(makeEvent({ body: { type: "content", content } }));
    assert.equal(r.statusCode, 400);
  });

  it("400 when content object is missing", async () => {
    const r = await handler(makeEvent({ body: { type: "content" } }));
    assert.equal(r.statusCode, 400);
  });
});

// ── image upload ──────────────────────────────────────────────────────────────

describe("image upload", () => {
  const fakeData = Buffer.from("fake-image").toString("base64");

  it("200 for valid hero image (hero_1-480)", async () => {
    let captured;
    mockS3Send = async (cmd) => { captured = cmd.params; return {}; };

    const r = await handler(makeEvent({ body: { type: "image", key: "images/hero_1-480.webp", data: fakeData } }));
    assert.equal(r.statusCode, 200);
    assert.equal(captured.Key, "images/hero_1-480.webp");
    resetMocks();
  });

  it("200 for valid hero image (hero_5-1600)", async () => {
    const r = await handler(makeEvent({ body: { type: "image", key: "images/hero_5-1600.webp", data: fakeData } }));
    assert.equal(r.statusCode, 200);
  });

  it("200 for valid star image (star_10-480)", async () => {
    const r = await handler(makeEvent({ body: { type: "image", key: "images/star_10-480.webp", data: fakeData } }));
    assert.equal(r.statusCode, 200);
  });

  it("200 for valid faculty image (faculty_5-600)", async () => {
    const r = await handler(makeEvent({ body: { type: "image", key: "images/faculty_5-600.webp", data: fakeData } }));
    assert.equal(r.statusCode, 200);
  });

  it("400 for out-of-range key (hero_6-480)", async () => {
    const r = await handler(makeEvent({ body: { type: "image", key: "images/hero_6-480.webp", data: fakeData } }));
    assert.equal(r.statusCode, 400);
  });

  it("400 for old .png key scheme", async () => {
    const r = await handler(makeEvent({ body: { type: "image", key: "images/hero_1.png", data: fakeData } }));
    assert.equal(r.statusCode, 400);
  });

  it("400 for arbitrary/path-traversal key", async () => {
    const r = await handler(makeEvent({ body: { type: "image", key: "images/../../secret.webp", data: fakeData } }));
    assert.equal(r.statusCode, 400);
  });

  it("400 when data is missing", async () => {
    const r = await handler(makeEvent({ body: { type: "image", key: "images/hero_1-480.webp" } }));
    assert.equal(r.statusCode, 400);
  });
});

// ── unknown type ──────────────────────────────────────────────────────────────

describe("unknown type", () => {
  it("400 for unrecognised type", async () => {
    const r = await handler(makeEvent({ body: { type: "delete" } }));
    assert.equal(r.statusCode, 400);
  });
});
