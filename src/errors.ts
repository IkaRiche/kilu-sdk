export class AAXError extends Error {
    constructor(message: string, public statusCode?: number) {
        super(message);
        this.name = "AAXError";
    }
}

export class RateLimitError extends AAXError {
    constructor(
        message: string,
        public retryAfter: number,
        public bucket?: string,
        public resetAt?: number
    ) {
        super(message, 429);
        this.name = "RateLimitError";
    }
}

export class AuthError extends AAXError {
    constructor(message: string) {
        super(message, 401);
        this.name = "AuthError";
    }
}

export class ApiError extends AAXError {
    constructor(message: string, statusCode: number, public details?: any) {
        super(message, statusCode);
        this.name = "ApiError";
    }
}
