const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { getEnvSecrets } = require('../index');

jest.mock('@google-cloud/secret-manager', () => {
    return {
        SecretManagerServiceClient: jest.fn(() => {
            return {
                accessSecretVersion: jest.fn(() => Promise.resolve([{ payload: { data: 'Mock-Secret' } }]))
            };
        })
    };
});

describe('getEnvSecrets test suite', () => {

    beforeEach(() => {
        process.env['GAE_SERVICE'] = 'x';
        process.env['GAE_RUNTIME'] = 'x';
        process.env['TEST_SECRET'] = 'secret-reference';
    });

    it('test a success ful env var secret retrieval', async () => {
        await getEnvSecrets();
        expect(process.env['TEST_SECRET']).toEqual('Mock-Secret');
        expect(SecretManagerServiceClient).toBeCalledTimes(1);
    });

});