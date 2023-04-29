import "https://deno.land/std@0.180.0/dotenv/load.ts";
import { Application, Router, Context } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { Redis, connect } from "https://deno.land/x/redis@v0.29.3/mod.ts";
import staticContent from "./staticContent.ts";
import generateCaptcha from "./generateCaptcha.ts";
import verifyCaptcha from "./verifyCaptcha.ts";

declare global {
    interface Window { 
        redis: Redis
    }
}

const app = new Application();
const router = new Router();
window.redis = await connect({
    hostname: Deno.env.get("REDIS_HOSTNAME") ?? "",
    port: Deno.env.get("REDIS_PORT"),
    name: Deno.env.get("REDIS_USERNAME"),
    password: Deno.env.get("REDIS_PASSWORD")
})

app.use(async (context: Context, next) => {
    context.response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    context.response.headers.set("Access-Control-Allow-Origin", "*");
    await next();
})

app.use(router.routes());
app.use(router.allowedMethods());

router.post("/generateCaptcha", generateCaptcha);
router.all("/verifyCaptcha", verifyCaptcha);

app.use(staticContent);

await app.listen({ port: parseInt(Deno.env.get("SERVER_PORT") ?? "8080") });