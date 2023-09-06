# gae-env-secrets

>  Seamlessly integrates GCP Secret Manager with App Engine environment variables.

Works with CommonJS and ESM/ECMAScript.

## Usage

Create your secrets in [Secret Manager](https://cloud.google.com/secret-manager) and reference them in the App Engine deployment descriptor `app.yaml`.

```yaml
service: my-service
runtime: nodejs20

env_variables:
  PASSWORD_SECRET: "projects/100374066341/secrets/MY_PASSWORD/versions/latest"
```

In your code, simply call the async `getEnvSecrets` function from the package and use the environment variables to access the secret values.

**CommonJS**
```js
const { getEnvSecrets } = require('@tsmx/gae-env-secrets');

getEnvSecrets().then(() => {
  const secret = process.env['PASSWORD_SECRET']; // value of MY_PASSWORD from Secret Manager
});
```

**ESM**
```js
import { getEnvSecrets } from '@tsmx/gae-env-secrets';

await getEnvSecrets();
const secret = process.env['PASSWORD_SECRET']; // value of MY_PASSWORD from Secret Manager
```

Note: Since the `getEnvSecrets` function is async you'll need to `await` the result or chain on using `.then` to be able to work with the secret values. CommonJS does not support top-level await.

## Using Secret Manager secrets in app.yaml

To reference secrets in the deployment descriptor, you'll need to pass the versioned reference to the secret from Secret Manager. This has the form of...

`projects/[Project-Number]/secrets/[Secret-Name]/versions/[Version-Number|latest]`

To retrieve the reference path of a secrets version in Secret Manager simply click "Copy resource name" on the three dots behind a version. Specifying `latest` as the version will supply the highest active version of a secret. 

## How it works

### Determining the environment

`gae-env-secrets` will evaluate environment variables to detect if it is are running directly in App Engine. If the following env vars both are present, the library would assume it's running in GAE and substitute relevant env vars with their respective secret values from Secret Manager:
- `GAE_SERVICE`
- `GAE_RUNTIME`

If these two env vars are not present, the library **won't do anything**. So it should be safe to call it unconditionally in your code without inferring local development, testing etc. 

To simulate running under GAE, simply set those two env vars to anything.

### Substituting env vars from Secret Manager

If running under GAE is detected, `gae-env-secrets` will iterate through all env vars and substitute the value with the corresponding secret derived from Secret Manager if one of the following condition is true:
- The name of the env var ends with `_SECRET` (default suffix) or another deviating suffix passed via the [options](#passing-options-to-getenvsecrets), or
- Auto-Detection is enabled and the value of the anv var matches a Secret Manager secret reference

### Error handling

By default and for security reasons, the library will `throw` an error if substituting an env vars value from Secret Manager fails for any reason...
- secret reference invalid
- secret is inactive or not present
- invalid version number
- missing permissions to access Secret Manager
- ...

So make sure to use an appropriate error handling with `try/catch` or `.catch()`. 

To change this behaviour, use the `strict` property available in the [options](#passing-options-to-getenvsecrets).

## Passing options to getEnvSecrets

You can pass an options object to the `getEnvSecrets` function with the following properties.

### suffix

Type: `String`
Default: `_SECRET`

All env vars ending with the `suffix` will be substituted with secrets from Secret Manager.

Pass another value to change the env vars of your choice.

```js
// will substitue all env vars ending with '_KEY'
getEnvSecrets({ suffix: '_KEY' });
```

### strict

Type: `Boolean`
Default: `true`

By default `strict` is `true` which means that if a secret cannot be resolved an error will be thrown.

Setting `strict` to `false` will change this behaviour so that the error is only written to `console.error`. The value of the env var(s) where the error occured will remain unchanged.

```js
// error will only be logged and respective env vars remain unchanged
getEnvSecrets({ strict: false });
```

### autoDetect

Type: `Boolean`
Default: `false`

The `autoDetect` feature enables automatic detection of env var values that contain a Secret Manager secret reference for substitution regardless of the suffix and env vars name.

This feature is additional to the provided suffix, meaning that all env vars ending with the suffix AND all automatically detected will be substituted.

To turn on this feature, pass `true` in the options object.

```js
// turn on autoDetect
getEnvSecret({ autoDetect: true });
```
