# gae-env-secrets

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![npm](https://img.shields.io/npm/v/gae-env-secrets)
![node-current](https://img.shields.io/node/v/gae-env-secrets)
[![Build Status](https://img.shields.io/github/actions/workflow/status/tsmx/gae-env-secrets/git-build.yml?branch=master)](https://img.shields.io/github/actions/workflow/status/tsmx/gae-env-secrets/git-build.yml?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/tsmx/gae-env-secrets/badge.svg?branch=master)](https://coveralls.io/github/tsmx/gae-env-secrets?branch=master)

>  Seamlessly integrates GCP Secret Manager with App Engine environment variables.

Works with CommonJS and ESM/ECMAScript. Does not create a vendor-lock in or makes your code "App Engine only" - still works in any other environment. For details refer to [determining the environment](#determining-the-environment).

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
const { getEnvSecrets } = require('gae-env-secrets');

getEnvSecrets().then(() => {
  const secret = process.env['PASSWORD_SECRET']; // value of MY_PASSWORD from Secret Manager
});
```

**ESM**
```js
import { getEnvSecrets } from 'gae-env-secrets';

await getEnvSecrets();
const secret = process.env['PASSWORD_SECRET']; // value of MY_PASSWORD from Secret Manager
```

*Notes:* 
- Since the `getEnvSecrets` function is async you'll need to `await` the result or chain on using `.then` to be able to work with the secret values. CommonJS does not support top-level await. 
- As the env var secrets are resolved at runtime of your code, any top-level code of other modules that is executed upon require/import cannot make use of the secret values and instead would see the secret references as values of the env vars.

## Using Secret Manager secrets in app.yaml

### Referencing secrets

To reference secrets in the deployment descriptor, you'll need to pass the versioned reference of the secret from Secret Manager. This has the form of...

`projects/[Project-Number]/secrets/[Secret-Name]/versions/[Version-Number|latest]`

To retrieve the reference path of a secrets version in Secret Manager simply click "Copy resource name" on the three dots behind a version. Specifying `latest` as the version will supply the highest active version of a secret.

Then pass the secrets reference to the desired variable in the `env_variables` block of the deployment descriptor, like so...

```yaml
env_variables:
  SECRET_ENV_VAR: "projects/11223344/secrets/MY_SECRET/versions/latest"
```

### Granting Secret Manager rights to the GAE service account

In order to resolve secrets from Secret Manager, the service account principal running your App Engine service - by default `PROJECT_ID@appspot.gserviceaccount.com` - must have at least the `Secret Manager Secret Accessor` role. For more details refer to the [Secret Manager access control documentation](https://cloud.google.com/secret-manager/docs/access-control).

If this is not already the case, go to IAM in the console and edit the App Engine principal. There, click "Add another role" and search for `Secret Manager Secret Accessor` and save.

## How it works

### Determining the environment

`gae-env-secrets` will evaluate environment variables to detect if it is running directly in App Engine. If the following env vars both are present, the library would assume it's running in GAE and substitute relevant env vars with their respective secret values from Secret Manager:
- `GAE_SERVICE`
- `GAE_RUNTIME`

If these two env vars are not present, the library **won't do anything**. So it should be safe to call it unconditionally in your code without inferring local development, testing etc. 

To simulate running under GAE, simply set those two env vars to anything.

### Substituting env vars from Secret Manager

If running under GAE is detected, `gae-env-secrets` will iterate through all env vars and substitute the value with the corresponding secret derived from Secret Manager if one of the following condition is true:
- The name of the env var ends with `_SECRET` (default suffix) or another deviating suffix passed via the [options](#passing-options-to-getenvsecrets)
- [Auto-Detection](#autodetect) is enabled via options and the value of the anv var matches a Secret Manager secret reference

### Error handling

By default and for security reasons, the library will `throw` an error if substituting an env vars value from Secret Manager fails for any reason...
- secret reference is invalid
- secret is inactive or not present
- invalid version number
- missing permissions to access Secret Manager
- or else...

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

Example: Having this feature enabled, the following env var would be substituted with version 2 of the secret `MY_SECRET` regardless of the suffix because is contains a value of a Secret Manager reference.

```yaml
env_variables:
  VAR_WITH_ANY_NAME: "projects/00112233/secrets/MY_SECRET/versions/2"
```
