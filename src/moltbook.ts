/**
 * Moltbook Identity Integration
 * Docs: https://moltbook.com/developers.md
 */

export interface MoltbookAgent {
    id: string;
    name: string;
    description?: string;
    karma: number;
    avatar_url?: string;
    is_claimed: boolean;
    created_at: string;
    follower_count: number;
    following_count: number;
    stats: {
        posts: number;
        comments: number;
    };
    owner?: {
        x_handle: string;
        x_name: string;
        x_avatar?: string;
        x_verified: boolean;
        x_follower_count: number;
    };
}

export interface VerifyIdentityResponse {
    success: boolean;
    valid: boolean;
    agent?: MoltbookAgent;
    error?: string;
    hint?: string;
}

export interface GenerateTokenResponse {
    success: boolean;
    identity_token?: string;
    expires_in?: number;
    expires_at?: string;
    audience?: string;
    error?: string;
}

const MOLTBOOK_API_URL = "https://moltbook.com/api/v1";

/**
 * Verify a Moltbook identity token
 * Used by your service to authenticate bots
 * 
 * @param identityToken - The identity token from X-Moltbook-Identity header
 * @param appKey - Your Moltbook developer app key (moltdev_...)
 * @param audience - Optional audience restriction (your domain)
 */
export async function verifyMoltbookIdentity(
    identityToken: string,
    appKey: string,
    audience?: string
): Promise<VerifyIdentityResponse> {
    const response = await fetch(`${MOLTBOOK_API_URL}/agents/verify-identity`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Moltbook-App-Key": appKey
        },
        body: JSON.stringify({
            token: identityToken,
            ...(audience && { audience })
        })
    });

    return response.json() as Promise<VerifyIdentityResponse>;
}

/**
 * Generate a Moltbook identity token
 * Used by bots to authenticate with services
 * 
 * @param apiKey - Bot's Moltbook API key
 * @param audience - Optional audience restriction (service domain)
 */
export async function generateIdentityToken(
    apiKey: string,
    audience?: string
): Promise<GenerateTokenResponse> {
    const response = await fetch(`${MOLTBOOK_API_URL}/agents/me/identity-token`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(audience ? { audience } : {})
    });

    return response.json() as Promise<GenerateTokenResponse>;
}
