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

    var testOutput = [];
    const originalConsoleLog = console.log;
    const testConsoleLog = (output) => { testOutput.push(output); };

    beforeEach(() => {
        delete process.env['GAE_SERVICE'];
        delete process.env['GAE_RUNTIME'];
        delete process.env['TEST_SECRET'];
        console.log = testConsoleLog;
        testOutput = [];
    });

    afterEach(() => {
        jest.clearAllMocks();
        console.log = originalConsoleLog;
    });

    it('test a successful env var secret retrieval', async () => {
        process.env['GAE_SERVICE'] = 'x';
        process.env['GAE_RUNTIME'] = 'x';
        process.env['TEST_SECRET'] = 'original value';
        await getEnvSecrets();
        expect(process.env['TEST_SECRET']).toEqual('Mock-Secret');
        expect(SecretManagerServiceClient).toBeCalledTimes(1);
        expect(testOutput.length).toBe(3);
        expect(testOutput[1].toString().endsWith('TEST_SECRET')).toBeTruthy();
    });

    it('test a \'nothing-to-do\' beacuse GAE is not detected', async () => {
        process.env['TEST_SECRET'] = 'original value';
        await getEnvSecrets();
        expect(process.env['TEST_SECRET']).toEqual('original value');
        expect(SecretManagerServiceClient).toBeCalledTimes(0);
        expect(testOutput.length).toBe(1);
    });

});