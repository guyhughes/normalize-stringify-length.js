"use strict";
module.exports = (function() {
  /**
 * Returns the closing token from the pairs: `{}` and `[]`.
 */
  function closingObjectToken(singlecharstr) {
    if (!~"[{".indexOf(singlecharstr)) {
      throw new Error("Only accepts `[` and `{`.");
    }
    return String.fromCharCode(singlecharstr.codePointAt(0) + 2);
  }

  const STRING_VALUE_DELIMITER = '"',
    STRING_MEDIAL_TERMINATOR = '",',
    STRING_FINAL_TERMINATOR = '"}';

  /**
 * Returns right-most index of the matched possible string terminator, or 0 if no match.
 */
  function nextPossibleStringTerminatorEnd(remainder) {
    const mt_rindex = remainder.indexOf(STRING_MEDIAL_TERMINATOR) + 1;
    return mt_rindex ? mt_rindex : remainder.indexOf(STRING_FINAL_TERMINATOR) + 1;
  }

  /**
 * Returns right-most index of the matched possible string terminator, or 0 if no match.
 */
  function stringTerminatorEnd(part) {
    let partEnd = 0;
    while (partEnd < part.length) {
      const remainder = part.substring(partEnd);
      const endInRemainder = nextPossibleStringTerminatorEnd(remainder);
      partEnd += endInRemainder;
      if (remainder.charAt(endInRemainder - 2) === "\\") {
        // quote was escaped, not a terminator
        continue;
      }
      return partEnd;
    }
  }

  /**
 * Stringify an object to valid JSON, ensuring it has a normalized length less
 * than maxLength.
 *
 * Manually parses the stringify output, such that character escapes and syntax
 * characters are counted towards the maxLength limit,  and truncates it to
 * output valid JSON.
 *
 * This method has tests.
 */
  function normalizedJSONStringify(object, { maxProperties = 0, maxLength }) {
    // XXX: Should also handle Array `object`, but that is not the intended use
    // case now.
    const objectProperties = Object.keys(object);
    const numProperties = objectProperties.length;

    if (maxLength < 2) {
      throw new Error("maxLength must be greater than or equal to 2");
    }

    if (maxProperties && numProperties > maxProperties) {
      throw new Error(`object must not exceed ${maxProperties} properties`);
      return false;
    }

    const encoded = JSON.stringify(object);
    if (encoded.length <= maxLength) {
      // fits
      return encoded;
    }

    // Average each property's max length in encoded json,
    // including escaped and syntax chars
    const maxPartLength =
      Math.floor(
        (maxLength - 1) / numProperties // minus one for opening brace/bracket)
      ) - 1; // minus one for the terminator (comma or closing brace/bracket)

    const truncated = [];
    for (let i = 1; i < encoded.length; ++i) {
      let part = encoded.substring(i);
      const valueStart = part.indexOf(":") + 1;
      const valueIsString = part[valueStart] === STRING_VALUE_DELIMITER;
      const valueIsObject = !valueIsString && ~"{[".indexOf(part[valueStart]);
      const valueTerminator = valueIsObject
        ? closingObjectToken(part[valueStart])
        : valueIsString ? STRING_VALUE_DELIMITER : "";
      const partEnd = (() => {
        if (valueIsString) {
          return stringTerminatorEnd(part);
        }
        if (valueIsObject) {
          const terminatorIndex = part.indexOf(valueTerminator);
          return terminatorIndex + valueTerminator.length;
        }
        // parse the JSON value in remainder as a non-string type
        const valueEnd = part.indexOf(",");
        // this part ends at the next comma, or the very end of the string
        return ~valueEnd ? valueEnd : part.length;
      })();
      i += partEnd; // augment main loop counter
      part = part.substring(0, partEnd);

      // shall we truncate?
      const maxPartEnd = maxPartLength - valueTerminator.length;
      if (part.length >= maxPartEnd) {
        if (valueStart >= maxPartEnd) {
          // first char of value did not fit
          // so drop the key completely
          continue;

          // For the value to fit, both the start and end characters
          // `""`, `{}`, `[]` must be present after the key and the colon
          // at indicies lower than maxPartLength.
        }
        // lazily make nested objects empty (avoiding recursion, expensive runtimes, etc)
        const truncatedPartEnd = valueIsObject ? valueStart + 1 : maxPartEnd;
        // truncate
        part = part.substring(0, truncatedPartEnd) + valueTerminator;
      }
      truncated.push(part);
    }
    const ret = encoded[0] + truncated.join(",") + closingObjectToken(encoded[0]);
    return ret;
  }
  return {
    default: normalizedJSONStringify,
    closingObjectToken
  };
})();
