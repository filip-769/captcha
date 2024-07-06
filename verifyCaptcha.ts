import { Context } from "https://deno.land/x/oak@v16.1.0/mod.ts";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";

export default async (context: Context) => {
    const responseBody: {
        success: boolean,
        hostname?: string,
        "error-codes": string[]
    } = {
        success: false,
        hostname: "",
        "error-codes": []
    }

    try {
        let requestBody: any = {};
        try {
            if(context.request.method === "POST") {
                if(context.request.body.type() === "json") {
                    requestBody = await context.request.body.json();
                } else if (context.request.body.type() === "form") {
                    requestBody = Object.fromEntries(await context.request.body.form());
                } else {
                    responseBody["error-codes"].push("bad-request");
                    return;
                }
            } else if(context.request.method === "GET") {
                requestBody = Object.fromEntries(context.request.url.searchParams);
            } else {
                responseBody["error-codes"].push("bad-request");
                return;
            }
        } catch(_) {
            responseBody["error-codes"].push("bad-request");
            return;
        }

        const { secret, response, remoteip, sitekey } = requestBody;

        if(!secret) return responseBody["error-codes"].push("missing-input-secret");
        if(!response) return responseBody["error-codes"].push("missing-input-response");
        if(!/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/\d+$/.test(response)) return responseBody["error-codes"].push("invalid-input-response");

        const [ id, number ] = response.split("/");

        const captcha = (globalThis as any).captchas[id];

        if(!captcha || captcha.expires < Date.now()) return responseBody["error-codes"].push("invalid-input-response");

        (globalThis as any).captchas[id] = undefined;

        if(await hash(`${Deno.env.get("SERVER_TOKEN")}/${captcha.sitekey}`, "SHA-256") !== secret) {
            return responseBody["error-codes"].push("invalid-input-secret");
        }

        responseBody.hostname = captcha.hostname;
        responseBody.success = +number === captcha.number;

        if(sitekey && (sitekey !== captcha.sitekey)) responseBody.success = false;
        if(remoteip && (remoteip !== captcha.ip)) responseBody.success = false;
    } catch (error) {
        console.error(error);
        responseBody["error-codes"].push("internal-error");
    } finally {
        context.response.body = responseBody;
    }
}

async function hash(text: string, algo: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512") {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest(algo, msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return hashHex;
}