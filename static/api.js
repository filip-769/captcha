(() => {
    const currentScript = document.currentScript;
    const script = document.createElement("script");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = getURL("/style.css");
    script.type = "module";
    script.src = getURL("/module.js");
    document.head.appendChild(script);
    document.head.appendChild(link);

    script.onload = () => {
        const onready = window.captcha.onready;
        window.captcha = {
            getResponse: (c) => {
                const el = typeof c === "string" ? document.querySelector(`#${c}`.replace("##", "#")) : (c ?? document.querySelector(".captcha[data-sitekey]"));
                return el.getAttribute("data-response");
            },
            reset: (c) => {
                const el = typeof c === "string" ? document.querySelector(`#${c}`.replace("##", "#")) : (c ?? document.querySelector(".captcha[data-sitekey]"));
                render(el);
            },
            remove: (c) => {
                const el = typeof c === "string" ? document.querySelector(`#${c}`.replace("##", "#")) : (c ?? document.querySelector(".captcha[data-sitekey]"));
                el.textContent = "";
                el.parentElement.querySelectorAll(`input[type=hidden][name="${el.getAttribute("data-response-field-name") ?? "captcha-response"}"]`).forEach(x => x.remove());
            },
            ready: (f) => {
                window.captcha.onready = f;
            },
            implicitRender: () => {
                document.querySelectorAll(".captcha[data-sitekey]").forEach(render);
            },
            render: (c, p) => {
                const el = typeof c === "string" ? document.querySelector(`#${c}`.replace("##", "#")) : (c ?? document.querySelector(".captcha[data-sitekey]"));

                el.classList.add("captcha");
                if(p.sitekey) el.setAttribute("data-sitekey", p.sitekey);
                if(p.theme) el.setAttribute("data-theme", p.theme);
                if(p["response-field"] === "false") el.setAttribute("data-response-field", p["response-field"]);
                if(p["response-field-name"]) el.setAttribute("data-response-field-name", p["response-field-name"]);
                if(p.callback) {
                    if(typeof p.callback === "function") {
                        const id = crypto.randomUUID();
                        window[id] = p.callback;
                        el.setAttribute("data-callback", id)
                    } else {
                        el.setAttribute("data-callback", p.callback)
                    }
                }
                if(p["expired-callback"]) {
                    if(typeof p["expired-callback"] === "function") {
                        const id = crypto.randomUUID();
                        window[id] = p["expired-callback"];
                        el.setAttribute("data-expired-callback", id)
                    } else {
                        el.setAttribute("data-expired-callback", p["expired-callback"])
                    }
                }
                if(p["timeout-callback"]) {
                    if(typeof p["timeout-callback"] === "function") {
                        const id = crypto.randomUUID();
                        window[id] = p["timeout-callback"];
                        el.setAttribute("data-timeout-callback", id)
                    } else {
                        el.setAttribute("data-timeout-callback", p["timeout-callback"])
                    }
                }

                render(el);
            }
        }

        if(new URL(currentScript.src).searchParams.get("render") !== "explicit") window.captcha.implicitRender();

        try { window[new URL(currentScript.src).searchParams.get("onload")](); } catch (_) {}
        try { onready(); } catch (_) {}
    }

    function getURL(path) {
        return (new URL(path, currentScript.src)).href;
    }

    async function render(captchaEl) {
        captchaEl.textContent = "Spam protection";
        captchaEl.classList.remove("verified");

        setTimeout(() => {
            if(captchaEl.textContent === "Spam protection") {
                try { window[captchaEl.getAttribute("data-expired-callback")](); } catch (_) {}
                window.captcha.reset(captchaEl);
            }
        }, 300000)


        const response = await fetch(getURL("/generateCaptcha"), {
            method: "POST",
            body: JSON.stringify({
                sitekey: captchaEl.getAttribute("data-sitekey"),
                hostname: location.protocol === "file:" ? "localhost" : location.hostname
            })
        });
        
        const json = await response.json();
        const n = await powCaptcha(json.salt, json.hash, json.count);

        const data = `${json.id}/${n}`;

        captchaEl.parentElement.querySelectorAll(`input[type=hidden][name="${captchaEl.getAttribute("data-response-field-name") ?? "captcha-response"}"]`).forEach(x => x.remove());
        const input = document.createElement("input");
        input.type = "hidden";
        input.value = data;

        if(captchaEl.getAttribute("data-response-field") !== "false") {
            input.name = captchaEl.getAttribute("data-response-field-name") ?? "captcha-response";
        }
        
        captchaEl.parentElement.appendChild(input);
        captchaEl.classList.add("verified");
        captchaEl.setAttribute("data-response", data);

        if(captchaEl.textContent === "Spam protection") {
            try { window[captchaEl.getAttribute("data-callback")](data); } catch (_) {}
        }
    }
})();

window.captcha = {
    ready: f => window.captcha.onready = f
}