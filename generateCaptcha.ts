import { sha384 } from "https://cdn.jsdelivr.net/npm/hash-wasm@4/+esm";
import { Context } from "https://deno.land/x/oak@v16.1.0/mod.ts";

export default async (context: Context) => {
    const body = await context.request.body.json();
    const { sitekey, hostname } = body;

    if(
        typeof sitekey !== "string" ||
        typeof hostname !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(sitekey) ||
        !/^.{1,253}$/.test(hostname)
    ) {
        context.response.status = 400;
        context.response.body = "bad request";
        return;
    }

    const salt = crypto.randomUUID();
    const id = crypto.randomUUID();
    const ip = context.request.ip;

    const difficulty = 5000000;
    const number = Math.round(crypto.getRandomValues(new Uint32Array(1))[0]/2**32*difficulty);

    (globalThis as any).captchas[id] = {
        number,
        sitekey,
        hostname,
        ip,
        expires: Date.now() + 300000
    }

    context.response.status = 201;
    context.response.body = {
        id,
        salt,
        hash: await sha384(salt + number),
        count: difficulty
    }
}