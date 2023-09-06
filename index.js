const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

const defaultSuffix = '_SECRET';
const defaultStrictMode = true;
const defaultAutoDetect = false;

const autoDetectRegEx = new RegExp(/^projects\/\d*\/secrets\/.*\/versions\/(\d*|latest)$/);

function getOptValue(options, optName, defaultOptValue) {
    if (options && options[optName] !== undefined) {
        return options[optName];
    }
    else {
        return defaultOptValue;
    }
}

async function getSecret(secretName) {
    const [secret] = await client.accessSecretVersion({ name: secretName });
    return secret.payload.data.toString();
}

async function getEnvSecrets(options) {
    const suffix = getOptValue(options, 'suffix', defaultSuffix);
    const strictMode = getOptValue(options, 'strict', defaultStrictMode);
    const autoDetect = getOptValue(options, 'auto', defaultAutoDetect);
    if (!process.env['GAE_SERVICE'] && !process.env['GAE_RUNTIME']) {
        console.log('Not running in GAE. Nothing to do for getEnvSecrets.');
        return;
    }
    console.log('Starting getEnvSecrets');
    for (const [key, value] of Object.entries(process.env)) {
        if (key.endsWith(suffix) || autoDetect && autoDetectRegEx.test(value)) {
            console.log(`Retrieving secret for key ${key}`);
            try {
                const secret = await getSecret(value);
                process.env[key] = secret;
            }
            catch (error) {
                console.error(`Could not retrieve secret for key ${key}: ${error.message}`);
                if (strictMode) throw (error);
            }
        }
    }
    console.log('getEnvSecrets done');
}

module.exports.getEnvSecrets = getEnvSecrets;