"use strict";

const encodedRun = /(?:%[a-f\d]{2})+/gi;

function decodeRun(run) {
  const bytes = run.match(/%[a-f\d]{2}/gi) || [];
  let result = "";

  for (let index = 0; index < bytes.length; ) {
    let decoded = null;
    let consumed = 0;

    // A UTF-8 code point is at most four bytes. Limiting each attempt keeps
    // malformed input handling linear instead of repeatedly rescanning it.
    for (let size = Math.min(4, bytes.length - index); size > 0; size -= 1) {
      try {
        decoded = decodeURIComponent(bytes.slice(index, index + size).join(""));
        consumed = size;
        break;
      } catch {
        // Try a shorter sequence; an invalid byte is preserved below.
      }
    }

    if (decoded === null) {
      result += bytes[index];
      index += 1;
    } else {
      result += decoded;
      index += consumed;
    }
  }

  return result;
}

module.exports = function decodeUriComponent(encodedUri) {
  if (typeof encodedUri !== "string") {
    throw new TypeError(
      `Expected encodedUri to be a string, received ${typeof encodedUri}`
    );
  }

  try {
    return decodeURIComponent(encodedUri);
  } catch {
    return encodedUri.replace(encodedRun, decodeRun);
  }
};
