const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

const defaultSuffix = '_SECRET';

function getOptValue(options, optName, defaultOptValue) {
    if (options && options[optName]) {
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
            }
        }
    }
    console.log('getEnvSecrets done');
}

module.exports.getEnvSecrets = getEnvSecrets;