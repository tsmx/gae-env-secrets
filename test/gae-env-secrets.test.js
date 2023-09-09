const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { getEnvSecrets } = require('../index');

jest.mock('@google-cloud/secret-manager', () => {
    return {
        SecretManagerServiceClient: jest.fn(() => {
            return {
                accessSecretVersion: jest.fn((params) => {
                    if (params.name == 'test-error') {
                        throw new Error('error');
                    }
                    else {
                        return Promise.resolve([{ payload: { data: 'Mock-Secret' } }]);
                    }
                })
            };
        })
    };
});

describe('getEnvSecrets test suite', () => {

    var testLogOutput = [];
    var testErrorOutput = [];
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const testConsoleLog = (output) => { testLogOutput.push(output); };
    const testConsoleError = (output) => { testErrorOutput.push(output); };

    beforeEach(() => {
        delete process.env['GAE_SERVICE'];
        delete process.env['GAE_RUNTIME'];
        delete process.env['TEST_SECRET'];
        console.log = testConsoleLog;
        console.error = testConsoleError;
        testLogOutput = [];
        testErrorOutput = [];
    });

    afterEach(() => {
        jest.clearAllMocks();
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    });

    it('test a successful env var secret retrieval', async () => {
        process.env['GAE_SERVICE'] = 'x';
        process.env['GAE_RUNTIME'] = 'x';
        process.env['TEST_SECRET'] = 'original value';
        await getEnvSecrets();
        expect(process.env['TEST_SECRET']).toEqual('Mock-Secret');
        expect(SecretManagerServiceClient).toBeCalledTimes(1);
        expect(testLogOutput.length).toBe(3);
        expect(testLogOutput[1].toString().endsWith('TEST_SECRET')).toBeTruthy();
        expect(testErrorOutput.length).toBe(0);
    });

    it('test a \'nothing-to-do\' beacuse GAE is not detected', async () => {
        process.env['TEST_SECRET'] = 'original value';
        await getEnvSecrets();
        expect(process.env['TEST_SECRET']).toEqual('original value');
        expect(SecretManagerServiceClient).toBeCalledTimes(0);
        expect(testLogOutput.length).toBe(1);
        expect(testErrorOutput.length).toBe(0);
    });

    it('test a failed env var secret retrieval throwing an error', async () => {
        process.env['GAE_SERVICE'] = 'x';
        process.env['GAE_RUNTIME'] = 'x';
        process.env['TEST_SECRET'] = 'test-error';
        await expect(getEnvSecrets()).rejects.toThrow('error');
        expect(process.env['TEST_SECRET']).toEqual('test-error');
        expect(SecretManagerServiceClient).toBeCalledTimes(0);
        expect(testErrorOutput.length).toBe(1);
    });

});