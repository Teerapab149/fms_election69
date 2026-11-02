// What to show an admin when a save or upload gets a bad answer. Pure, so node:test loads it.
//
// The answer is not always ours: nginx replies 413 with an HTML page when the body is over its
// client_max_body_size (1 MB unless the deploy sets it), and calling res.json() on that page threw
// `Unexpected token '<'` straight into the form. Our own refusals are JSON with a Thai sentence
// that says exactly what is wrong, so that sentence wins whenever it is there.

export const TOO_LARGE_MESSAGE =
  "ไฟล์ที่ส่งใหญ่เกินกว่าที่เซิร์ฟเวอร์รับได้ ลองย่อรูปให้เล็กลงแล้วบันทึกใหม่ ถ้ายังไม่ผ่านให้แจ้งเจ้าหน้าที่ IT";

/**
 * @param {{status:number, json:()=>Promise<any>}} res a response that is not ok
 * @param {string} fallback what to say when the answer explains nothing
 * @returns {Promise<string>}
 */
export async function readApiError(res, fallback) {
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null; // an HTML error page from the proxy, an empty body
  }
  if (body && typeof body.error === "string" && body.error.trim()) return body.error;
  if (res.status === 413) return TOO_LARGE_MESSAGE;
  return fallback;
}
