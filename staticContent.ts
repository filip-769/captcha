import { Context } from "https://deno.land/x/oak@v16.1.0/mod.ts";

export default async (context: Context) => {
    let fileName = context.request.url.pathname.slice(1);
    if(fileName === "") fileName = "index.html";

    if(!/^[a-z]+\.[a-z]+$/i.test(fileName)) {
        context.response.status = 400;
        context.response.body = "invalid file name";
    } else {
        try {
            context.response.type = fileName.split(".")[1];
            context.response.body = await Deno.readTextFile(`./static/${fileName}`);
        } catch (_) {
            context.response.status = 404;
            context.response.body = "file not found";
        }
    }
}