# gae-env-secrets

>  Setting environment variables from Secret Manager in Google App Engine.

Seamlessly integrates GCP Secret Manager with App Engine environment variables.

Works with CommonJS and ESM/ECMAScript.

## Usage

Create your secrets in Secret Manager and reference them in the App Engine deployment descriptor `app.yaml`.

```yaml
service: my-service
runtime: nodejs20

env_variables:
  PASSWORD_SECRET: "projects/100374066341/secrets/MY_PASSWORD/versions/latest"
```

In the code, simply call the async `getEnvSecrets` function and access the environment variables to access the secret values.

```js
// CommonJS
const { getEnvSecrets } = require('@tsmx/gae-env-secrets');

getEnvSecrets().then(() => {
    const secret = process.env['PASSWORD_SECRET']; // value of MY_SECRET from Secret Manager
});

// ESM
import { getEnvSecrets } from '@tsmx/gae-env-secrets';

await getEnvSecrets();
const secret = process.env['PASSWORD_SECRET']; // value of MY_SECRET from Secret Manager
```

**Note**: Since the `getEnvSecrets` function is async you'll need to `await` the result or chain on using `.then` to be able to work with the secret values. CommonJS does not support top-level await.
