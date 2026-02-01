/**
 * Reference canonicalization for receipt verification.
 * This is NOT the kernel canonicalization used for decision-making.
 * 
 * Rules:
 * 1. Object keys sorted by ASCII.
 * 2. Arrays preserve order.
 * 3. No whitespace in output JSON.
 * 4. undefined fields are removed; null is preserved.
 * 5. Date/BigInt are FORBIDDEN (must be pre-serialized).
 * 6. Numbers MUST be integers. Decimals MUST be strings.
 * 
 * @module @kilu/sdk
 */
export function canonicalize(data: any): string {
    if (data === undefined) {
        return "";
    }

    // Primitive types
    if (data === null || typeof data !== "object") {
        if (typeof data === "number") {
            if (!Number.isInteger(data)) {
                throw new Error(`[AAX Canonical] Floating point numbers forbidden in signed payloads: ${data}. Use strings for decimals.`);
            }
            // Standard JSON.stringify behavior for integers is safe (no exponential notation for typical API integers)
            // JS Safe Integer range: +/- 9007199254740991
            return JSON.stringify(data);
        }
        if (typeof data === "bigint") {
            throw new Error("[AAX Canonical] BigInt forbidden. Use strings.");
        }
        return JSON.stringify(data);
    }

    // Date check
    if (data instanceof Date) {
        throw new Error("[AAX Canonical] Date objects forbidden. Use ISO strings.");
    }

    // Array: Process elements recursively, preserve order
    if (Array.isArray(data)) {
        const parts = data
            .map((item) => {
                const s = canonicalize(item);
                // "undefined" in arrays becomes "null" in standard JSON, 
                // but AAX protocol usually implies removing undefined fields in objects.
                // In arrays, standard JSON.stringify turns undefined->null. 
                // We will follow partial compliance: if canonicalize returns empty string for undefined, handle it?
                // Standard JSON.stringify([undefined]) -> "[null]".
                return item === undefined ? "null" : s;
            })
            .join(",");
        return `[${parts}]`;
    }

    // Object: Sort keys by ASCII
    const keys = Object.keys(data).sort();
    const parts: string[] = [];

    for (const key of keys) {
        const value = data[key];
        // Skip undefined
        if (value === undefined) continue;

        const jsonKey = JSON.stringify(key);
        const jsonValue = canonicalize(value);
        parts.push(`${jsonKey}:${jsonValue}`);
    }

    return `{${parts.join(",")}}`;
}
