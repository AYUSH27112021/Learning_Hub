import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createRemoteJWKSet, jwtVerify } from "jose";

const REGION      = "ap-south-2";
const BUCKET      = "learning-hub-site-assets-306874448151-ap-south-2-an";
const POOL_ID     = "ap-south-2_w37j6EoXr";
const CLIENT_ID   = "ljo49fqps95ljmp4b065qas8j";
const ISSUER      = `https://cognito-idp.${REGION}.amazonaws.com/${POOL_ID}`;
const JWKS        = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

const s3 = new S3Client({ region: REGION });

const HERO_SIZES    = [480, 768, 1200, 1600];
const STAR_SIZES    = [240, 480];
const FACULTY_SIZES = [300, 600];

const ALLOWED_KEYS = new Set([
  ...Array.from({ length: 5  }, (_, i) => HERO_SIZES.map(s    => `images/hero_${i+1}-${s}.webp`)).flat(),
  ...Array.from({ length: 10 }, (_, i) => STAR_SIZES.map(s    => `images/star_${i+1}-${s}.webp`)).flat(),
  ...Array.from({ length: 5  }, (_, i) => FACULTY_SIZES.map(s => `images/faculty_${i+1}-${s}.webp`)).flat(),
]);

function res(status, body) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

async function verifyToken(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Missing token");
  const token = authHeader.slice(7);
  const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER });
  if (payload.token_use !== "access")   throw new Error("Not an access token");
  if (payload.client_id !== CLIENT_ID)  throw new Error("Wrong client");
  return payload;
}

export const handler = async (event) => {
  const method = event.requestContext?.http?.method;

  if (method === "OPTIONS") return res(200, {});

  try {
    await verifyToken(event.headers?.authorization ?? event.headers?.Authorization);
  } catch {
    return res(401, { error: "Unauthorized" });
  }

  let body;
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf-8")
      : event.body;
    body = JSON.parse(raw);
  } catch {
    return res(400, { error: "Invalid JSON" });
  }

  // ── content.json update ──
  if (body.type === "content") {
    const { content } = body;
    if (!content || typeof content !== "object")        return res(400, { error: "Missing content object" });
    if (typeof content.notice !== "string")             return res(400, { error: "notice must be a string" });
    if (!Array.isArray(content.stars)   || content.stars.length   > 10) return res(400, { error: "stars must be array ≤ 10" });
    if (!Array.isArray(content.faculty) || content.faculty.length >  5) return res(400, { error: "faculty must be array ≤ 5" });

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: "content.json",
      Body: JSON.stringify(content, null, 2),
      ContentType: "application/json",
      CacheControl: "no-cache",
    }));

    return res(200, { ok: true });
  }

  // ── image upload ──
  if (body.type === "image") {
    const { key, data, contentType = "image/png" } = body;
    if (!ALLOWED_KEYS.has(key)) return res(400, { error: "Invalid image key" });
    if (!data)                  return res(400, { error: "Missing base64 data" });

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(data, "base64"),
      ContentType: contentType,
      CacheControl: "no-cache",
    }));

    return res(200, { ok: true, key });
  }

  return res(400, { error: "type must be 'content' or 'image'" });
};
