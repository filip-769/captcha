import { Application, Router } from "https://deno.land/x/oak@v16.1.0/mod.ts";
import staticContent from "./staticContent.ts";
import generateCaptcha from "./generateCaptcha.ts";
import verifyCaptcha from "./verifyCaptcha.ts";

(globalThis as any).captchas = {};

const app = new Application();
const router = new Router();

app.use(async (context, next) => {
    context.response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    context.response.headers.set("Access-Control-Allow-Origin", "*");
    context.response.headers.set("Access-Control-Allow-Headers", "*");
    context.response.headers.set("Access-Control-Allow-Methods", "*");
    await next();
})

app.use(router.routes());
app.use(router.allowedMethods());

router.post("/generateCaptcha", generateCaptcha);
router.all("/verifyCaptcha", verifyCaptcha);

app.use(staticContent);

await app.listen({ port: 8080 });