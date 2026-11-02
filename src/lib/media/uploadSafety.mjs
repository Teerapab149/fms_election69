// Guards for the party form's multipart upload (api/admin/candidates). Pure, no
// imports, so node:test loads it directly (scripts/smoke/uploadSafety.test.mjs).
//
// Three things the route used to take on trust:
//   - the ?id= value, which was spliced into a directory name (party${id}) as the
//     raw string, so "1/../../x" wrote outside the upload root;
//   - a member's studentId, which became part of the file name, so "../x" did the same;
//   - the size of anything: a 150 MB "photo" was read whole into memory (server
//     working set 162 MB to 612 MB for that one request) and then handed to sharp.

// One photo. A 48 MP phone JPEG is about 12 MB, so 20 MB leaves room for a
// camera's best setting while refusing the file that is not a photo at all.
export const MAX_UPLOAD_FILE_BYTES = 20 * 1024 * 1024;

// The whole request. Next buffers the full body before the route sees a single
// file (req.formData()), so this is the check that protects memory; the
// per-file check above only catches what already got in. A party with 30
// members and a few group photos is 60 to 120 MB of real phone photos (63 MB was
// measured on the old form, P-LOG-145), so 200 MB is not in an honest admin's way.
export const MAX_UPLOAD_REQUEST_BYTES = 200 * 1024 * 1024;

const mb = (bytes) => Math.round((bytes / (1024 * 1024)) * 10) / 10;

/** Content-Length says the body is over the cap. A missing or garbled header passes: the per-file check still runs. */
export function requestTooLarge(contentLength, max = MAX_UPLOAD_REQUEST_BYTES) {
  if (contentLength === null || contentLength === undefined || contentLength === "") return false;
  const n = Number(contentLength);
  return Number.isFinite(n) && n > max;
}

export function requestTooLargeMessage(max = MAX_UPLOAD_REQUEST_BYTES) {
  return `ไฟล์ที่ส่งมารวมกันใหญ่เกินไป (เกิน ${mb(max)} MB) ลองย่อรูปก่อนอัปโหลด หรือบันทึกทีละส่วน`;
}

/** The first uploaded file over the per-file cap, as { key, name, size }, or null. Text fields are skipped. */
export function firstOversizedFile(formData, max = MAX_UPLOAD_FILE_BYTES) {
  for (const [key, value] of formData.entries()) {
    if (value && typeof value !== "string" && typeof value.size === "number" && value.size > max) {
      return { key, name: String(value.name || "").slice(0, 60), size: value.size };
    }
  }
  return null;
}

export function oversizedFileMessage(found, max = MAX_UPLOAD_FILE_BYTES) {
  const which = found.name ? ` (${found.name})` : "";
  return `มีรูปที่ใหญ่เกิน ${mb(max)} MB${which} ขนาด ${mb(found.size)} MB กรุณาย่อรูปก่อนอัปโหลด`;
}

/** A positive integer id from a query string, or null. "1abc", "1/../x", "0", "-1", "1e3", " 1" are all null. */
export function parseNumericId(raw) {
  if (typeof raw !== "string" || !/^[0-9]{1,9}$/.test(raw)) return null;
  const n = Number(raw);
  return n > 0 ? n : null;
}

/**
 * A value that is safe to put inside a file name: letters, digits, "_" and "-"
 * only, so no separator and no "." survives ("../x" becomes "___x"). The stored
 * studentId is not changed, only the name of the file written for it.
 */
export function safeFilePart(value, fallback = "x") {
  const cleaned = String(value ?? "").replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 40);
  return cleaned.replace(/_/g, "") === "" ? fallback : cleaned;
}
