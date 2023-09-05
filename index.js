const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

const defaultSuffix = '_SECRET';
const defaultStrictMode = true;

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
    if (!process.env['GAE_SERVICE'] && !process.env['GAE_RUNTIME']) {
        console.log('Not running in GAE. Nothing to do for getEnvSecrets.');
        return;
    }
    console.log('Starting getEnvSecrets');
    for (const [key, value] of Object.entries(process.env)) {
        if (key.endsWith(suffix)) {
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