# gae-env-secrets

>  Seamlessly integrates GCP Secret Manager with App Engine environment variables.

Works with CommonJS and ESM/ECMAScript.

## Usage

Create your secrets in Secret Manager and reference them in the App Engine deployment descriptor `app.yaml`.

```yaml
service: my-service
runtime: nodejs20

env_variables:
  PASSWORD_SECRET: "projects/100374066341/secrets/MY_PASSWORD/versions/latest"
```

In your code, simply call the async `getEnvSecrets` function from the package and access the environment variables to access the secret values.

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

## Using Secret Manager secrets in app.yaml

To reference secrets in the deployment descriptor, you'll need to pass the versioned reference to the secret from Secret Manager. This has the form of...

`projects/[Project-Number]/secrets/[Secret-Name]/versions/[Version-Number|latest]`

To retrieve the reference path of a secrets version in Secret Manager simply click "Copy resource name" on the three dots behind a version. Specifying `latest` as the version will supply the highest active version of a sceret.

## 


