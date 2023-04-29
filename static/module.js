function pow(salt, hash, count) {
    return new Promise(resolve => {
        const workerList = [];

        for (let i = 0; i < navigator.hardwareConcurrency; i++) {
            let worker;

            try {
                worker = new Worker(
                    `data:text/javascript;base64,${btoa(
                    `
                        import { sha384 } from "https://esm.run/hash-wasm@4";
    
                        self.onmessage = async e => {
                            let lastHash;
                            let counter = e.data.min;

                            while(true) {
                                if(lastHash === e.data.hash) {
                                    postMessage(counter - 1);
                                }
                                lastHash = await sha384(e.data.salt + counter);
                                if(e.data.max < counter) postMessage(false);
                                counter++;
                            }
                        }
                    `
                    )}`,
                    { type: "module" }
                );
            } catch (_) {
                worker = new Worker(
                    `data:text/javascript;base64,${btoa(
                    `
                    self.onmessage = async e => {
                        let lastHash;
                        let counter = e.data.min;

                        while(true) {
                            if(lastHash === e.data.hash) {
                                postMessage(counter - 1);
                            }
                            lastHash = await sha384(e.data.salt + counter);
                            if(e.data.max < counter) postMessage(false);
                            counter++;
                        }
                    }

                    async function sha384(text) {
                        const msgUint8 = new TextEncoder().encode(text);
                        const hashBuffer = await crypto.subtle.digest("SHA-384", msgUint8);
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        const hashHex = hashArray
                            .map((b) => b.toString(16).padStart(2, "0"))
                            .join("");
                        return hashHex;
                    }
                    `
                    )}`,
                    { type: "module" }
                );
            }

            worker.postMessage({
                salt,
                hash,
                min: Math.floor(i*(count/navigator.hardwareConcurrency))-10,
                max: Math.ceil((i+1)*(count/navigator.hardwareConcurrency))+10
            })

            worker.onmessage = e => {
                if(e.data !== false) {
                    workerList.forEach(x => x.terminate());
                    resolve(e.data);
                } else {
                    worker.terminate();
                }
            }

            workerList.push(worker);
        }
    })
}

window.powCaptcha = pow;