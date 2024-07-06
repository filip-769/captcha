# Captcha

Simple PoW (proof of work) captcha. It currently uses SHA384.

## API
The API is similar to popular captchas like reCAPTCHA or hCaptcha.
### Browser

Insert `<script src="CAPTCHA_SERVER/api.js"></script>` into your `<head>` element.
You can also specify url parameters on the js file.
| Name | Required | Default | Description |
|----------|----------|----------|----------|
| onload | no | - | Name of a function that will be executed when the API loads. |
| render | no | onload | `explicit` (you will need to load the captcha using JS) or `onload` (the captcha will be loaded automatically)|

#### Captcha parameters
| Name  | Required | Default | Type | Description |
|----------|----------|----------|----------|----------|
| sitekey | yes | - | UUIDv4 | Your sitekey. |
| theme | no | light | `light` / `dark` | The theme of the captcha. |
| size | no | normal | `normal` / `compact` / `invisible` | Type of the captcha. |
| response-field | no | true | boolean | If a hidden input should be added to the form. |
| response-field-name | no | captcha-response | string | Name of the response field. |
| callback | no | - | function | Callback to call when the captcha is solved. |
| expired-callback | no | - | function | Callback to call when the captcha expires. |

### Server
Send a `POST` request containing a `application/json` encoded body to `/verifyCaptcha`.*

#### Request parameters
| Name | Required | Description |
|----------|----------|----------|
| secret | yes | Your secret key. |
| response | yes | The verification token you received when the user completed the captcha on your site. |
| remoteip | no | The user's IP address. |
| sitekey | no | The sitekey you expect to see. |

#### Response body (JSON object)
| Name | Type | Description |
|----------|----------|----------|
| success | boolean | `true` if the captcha is valid, `false` if it is not |
| hostname | string | The hostname the captcha was solved on. |
| error-codes | array | Array of errors. |

#### Errors
| Name | Description |
|----------|----------|
| bad-request | Invalid request. |
| missing-input-secret | The secret parameter is missing from the request. |
| missing-input-response | The response parameter is missing from the request. |
| invalid-input-response | The response parameter is invalid. |
| invalid-input-secret | The secret parameter is invalid. |
| internal-error | Server error. |

\* `GET` request or `POST` request with `application/x-www-form-urlencoded` encoded body should also work.
## Setup

### Requirements
- Deno

### Installation locally
Install Deno, then clone this repo set the enviroment variable in `.env` file and run `deno run --allow-read --allow-env --allow-net app.ts`.

### Installation in cloud (Deno Deploy)
You can use this project for free using the free tier of Deno Deploy (https://dash.deno.com/).

### Enviroment variables
- SERVER_TOKEN a password you will use to generate secrets from sitekeys