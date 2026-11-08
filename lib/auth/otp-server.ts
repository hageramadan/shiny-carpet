import type { Locale } from "../i18n";
import { createHash, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { ApiError, requestJson } from "../api/client";
import { isRecord } from "../api/validation";
import { authInput, parseAuthResult } from "./contracts";
import type { ApiPhone } from "../phone";

const TTL = 5 * 60_000;
let database: DatabaseSync | undefined;
function db() {
  if (database) return database;
  const file = process.env.AUTH_OTP_DB_PATH || ".data/auth-otp.sqlite";
  if (file !== ":memory:") mkdirSync(dirname(resolve(file)), { recursive: true });
  database = new DatabaseSync(file);
  database.exec(`PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS challenges (id TEXT PRIMARY KEY, phone TEXT NOT NULL, digest BLOB NOT NULL, expires INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, started INTEGER NOT NULL, last INTEGER NOT NULL, count INTEGER NOT NULL);`);
  return database;
}
function fail(status: number, message: string): never {
  throw new ApiError(status, { message });
}
function hash(id: string, phone: string, code: string) {
  return createHash("sha256").update(`${id}:${phone}:${code}`).digest();
}
function reserve(phone: string, ip: string) {
  const store = db(),
    now = Date.now();
  store.exec("BEGIN IMMEDIATE");
  try {
    store.prepare("DELETE FROM challenges WHERE expires < ?").run(now);
    store.prepare("DELETE FROM limits WHERE started < ?").run(now - 3_600_000);
    for (const [key, maximum, cooldown] of [
      [`phone:${phone}`, 10, 60_000],
      [`ip:${ip}`, 30, 0],
    ] as const) {
      const row = store.prepare("SELECT count, last FROM limits WHERE key = ?").get(key);
      if (row && (Number(row.count) >= maximum || now - Number(row.last) < cooldown))
        fail(429, "انتظر قليلًا قبل طلب رمز جديد.");
      store
        .prepare(
          "INSERT INTO limits VALUES (?, ?, ?, 1) ON CONFLICT(key) DO UPDATE SET count=count+1, last=excluded.last",
        )
        .run(key, now, now);
    }
    store.exec("COMMIT");
  } catch (error) {
    store.exec("ROLLBACK");
    throw error;
  }
}

export async function sendOtp(rawInput: unknown, ip: string, signal?: AbortSignal) {
  const input = authInput("resend", rawInput) as ApiPhone;
  const key = process.env.MORA_SMS_API_KEY;
  if (!key || !/^\d{6}$/.test(process.env.BACKEND_AUTH_VERIFY_CODE || ""))
    fail(503, "خدمة إرسال رمز التحقق غير مهيأة الآن.");
  const phone = input.country_code + input.phone;
  reserve(phone, ip);
  const id = randomUUID(),
    code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const url = new URL("https://mora-sa.com/api/v1/sendsms");
  url.search = new URLSearchParams({
    api_key: key,
    username: process.env.MORA_SMS_USERNAME || "ShinyCarpet",
    sender: process.env.MORA_SMS_SENDER || "ShinyCarpet",
    numbers: phone.replace(/^\+/, ""),
    message: `رمز التحقق الخاص بك في شايني كاربت: ${code}. صالح لمدة 5 دقائق. لا تشاركه مع أحد.`,
    return: "json",
  }).toString();
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    redirect: "error",
    signal,
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) fail(502, "تعذر إرسال رمز التحقق. حاول لاحقًا.");
  const body: unknown = await response.json();
  const envelope = isRecord(body) && isRecord(body.status) ? body.status : undefined;
  const data = isRecord(body) && isRecord(body.data) ? body.data : undefined;
  const status =
    data?.code ??
    (isRecord(body) ? (body.code ?? body.response_code ?? body.status) : body);
  // The live API wraps its SMS result in data.code; status.code=200 is not SMS acceptance.
  const invalidEnvelope =
    envelope &&
    (envelope.error !== false || (envelope.code !== 200 && envelope.code !== "200"));
  if (invalidEnvelope || (status !== 100 && status !== "100")) {
    const messages: Record<string, string> = {
      "105": "رصيد خدمة الرسائل غير كافٍ. تواصل مع الدعم.",
      "106": "اسم المرسل غير متاح لدى خدمة الرسائل. تواصل مع الدعم.",
      "107": "اسم المرسل محظور لدى خدمة الرسائل. تواصل مع الدعم.",
      "108": "خدمة الرسائل رفضت رقم الهاتف. تحقق من الرقم ورمز الدولة.",
      "112": "خدمة الرسائل رفضت محتوى الرسالة. تواصل مع الدعم.",
      "114": "حساب خدمة الرسائل موقوف. تواصل مع الدعم.",
      "115": "رقم حساب خدمة الرسائل غير مفعّل. تواصل مع الدعم.",
      "116": "بريد حساب خدمة الرسائل غير مفعّل. تواصل مع الدعم.",
      "117": "خدمة الرسائل لم تستقبل نص رمز التحقق. تواصل مع الدعم.",
      "118": "اسم مرسل الرسائل غير مضبوط. تواصل مع الدعم.",
      "119": "خدمة الرسائل لم تستقبل رقم الهاتف. تحقق من الرقم ورمز الدولة.",
    };
    fail(
      502,
      typeof status === "number" || typeof status === "string"
        ? messages[String(status)] || "تعذر إرسال رمز التحقق. حاول لاحقًا."
        : "تعذر إرسال رمز التحقق. حاول لاحقًا.",
    );
  }
  signal?.throwIfAborted();
  const store = db();
  store.exec("BEGIN IMMEDIATE");
  try {
    store.prepare("DELETE FROM challenges WHERE phone = ?").run(phone);
    store
      .prepare("INSERT INTO challenges (id, phone, digest, expires) VALUES (?, ?, ?, ?)")
      .run(id, phone, hash(id, phone, code), Date.now() + TTL);
    store.exec("COMMIT");
  } catch (error) {
    store.exec("ROLLBACK");
    throw error;
  }
  return { id, message: "تم إرسال رمز التحقق إلى هاتفك." };
}

export async function verifyOtp(
  rawInput: unknown,
  id: string,
  token?: string,
  signal?: AbortSignal,
  locale: Locale = "ar",
) {
  const input = authInput("verify", rawInput) as ApiPhone & { code: string };
  const phone = input.country_code + input.phone;
  const legacyCode = process.env.BACKEND_AUTH_VERIFY_CODE;
  if (!legacyCode || !/^\d{6}$/.test(legacyCode))
    fail(503, "خدمة التحقق غير مهيأة الآن.");
  const store = db();
  // Increment atomically before checking, including across workers sharing the SQLite file.
  const row = store
    .prepare(
      "UPDATE challenges SET attempts=attempts+1 WHERE id=? AND phone=? AND expires>? AND attempts<5 RETURNING digest",
    )
    .get(id, phone, Date.now());
  if (!row)
    fail(422, "انتهت صلاحية الرمز أو تجاوزت المحاولات المتاحة. اطلب رمزًا جديدًا.");
  if (
    !timingSafeEqual(Buffer.from(row.digest as Uint8Array), hash(id, phone, input.code))
  )
    fail(422, "رمز التحقق غير صحيح.");
  // A code is single-use, even when two verification requests arrive together.
  const used = store.prepare("DELETE FROM challenges WHERE id=? RETURNING id").get(id);
  if (!used) fail(422, "تم استخدام الرمز بالفعل. اطلب رمزًا جديدًا.");
  const result = parseAuthResult(
    "verify",
    await requestJson("/auth/verify", {
      locale,
      method: "POST",
      body: { phone: input.phone, country_code: input.country_code, code: legacyCode },
      token,
      signal,
    }),
  );
  return {
    result: true,
    message: result.message,
    data: {
      user: { ...result.user!, country_code: input.country_code },
      token: result.token,
    },
  };
}
