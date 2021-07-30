// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

const yaml = require('js-yaml');
const fs = require('fs');

module.exports = {
  // All imported modules in your tests should be mocked automatically
  // automock: false,

  // Stop running tests after `n` failures
  // bail: 0,

  // Respect "browser" field in package.json when resolving modules
  // browser: false,

  // The directory where Jest should store its cached dependency information
  // cacheDirectory: "/private/var/folders/_h/kl3xvwcj2hq6lcw1wv74sft80000gp/T/jest_dy",

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  // collectCoverage: false,

  // An array of glob patterns indicating a set of files for which coverage information
  // should be collected
  // collectCoverageFrom: undefined,

  // The directory where Jest should output its coverage  files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/node_modules/',
  ],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    // "json",
    'text',
    // "lcov",
    // "clover"
  ],

  // An object that configures minimum threshold enforcement for coverage results
  // coverageThreshold: undefined,

  // A path to a custom dependency extractor
  // dependencyExtractor: undefined,

  // Make calling deprecated APIs throw helpful error messages
  // errorOnDeprecated: false,

  // Force coverage collection from ignored files using an array of glob patterns
  // forceCoverageMatch: [],

  // A path to a module which exports an async function that is triggered once
  // before all test suites
  // globalSetup: undefined,

  // A path to a module which exports an async function that is triggered once after all test suites
  // globalTeardown: undefined,

  // A set of global variables that need to be available in all test environments
  // globals: {},

  // The maximum amount of workers used to run your tests. Can be specified as % or a number.
  // E.g.maxWorkers: 10% will use 10% of your CPU amount + 1 as the maximum
  // worker number.maxWorkers:
  // 2 will use a maximum of 2 workers.
  // maxWorkers: "50%",

  // An array of directory names to be searched recursively up from the requiring module's location
  // moduleDirectories: [
  //   "node_modules"
  // ],

  // An array of file extensions your modules use
  moduleFileExtensions: [
    'js',
    // "json",
    // "jsx",
    // "ts",
    // "tsx",
    // "node"
  ],

  // A map from regular expressions to module names that allow to stub out resources with a single
  // module
  // moduleNameMapper: {},

  // An array of regexp pattern strings, matched against all module paths before considered
  // 'visible'
  // to the module loader
  // modulePathIgnorePatterns: [],

  // Activates notifications for test results
  // notify: false,

  // An enum that specifies notification mode. Requires { notify: true }
  // notifyMode: "failure-change",

  // A preset that is used as a base for Jest's configuration
  // preset: undefined,

  // Run tests from one or more projects
  // projects: undefined,

  // Use this configuration option to add custom reporters to Jest
  // reporters: undefined,

  // Automatically reset mock state between every test
  // resetMocks: false,

  // Reset the module registry before running each individual test
  // resetModules: false,

  // A path to a custom resolver
  // resolver: undefined,

  // Automatically restore mock state between every test
  // restoreMocks: false,

  // The root directory that Jest should scan for tests and modules within
  // rootDir: undefined,

  // A list of paths to directories that Jest should use to search for files in
  // roots: [
  //   "<rootDir>"
  // ],

  // Allows you to use a custom runner instead of Jest's default test runner
  // runner: "jest-runner",

  // The paths to modules that run some code to configure or set up the testing environment
  // before each test
  // setupFiles: [],

  // A list of paths to modules that run some code to configure or set u p the testing framework
  // before each test
  setupFilesAfterEnv: [
    'jest-extended',
    'jest-chain',
    './jest.setup.js',
    './__tests__/utils/jest.extend.expect.js'],

  // A list of paths to snapshot serializer modules Jest should use for snapshot testing
  // snapshotSerializers: [],

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // Options that will be passed to the testEnvironment
  // testEnvironmentOptions: {},

  // Adds a location field to test results
  // testLocationInResults: false,

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[tj]s?(x)',
  ],

  // An array of regexp pattern strings that are matched against all test paths, matched
  // tests are skipped
  // testPathIgnorePatterns: [
  //   "/node_modules/"
  // ],

  // The regexp pattern or array of patterns that Jest uses to detect test files
  // testRegex: [],

  // This option allows the use of a custom results processor
  // testResultsProcessor: undefined,

  // This option allows use of a custom test runner
  // testRunner: "jasmine2",

  // This option sets the URL for the jsdom environment. It is reflected in properties such
  // as location.href
  // testURL: "http://localhost",

  // Setting this value to "fake" allows the use of fake timers for functions such as "setTimeout"
  // timers: "real",

  // A map from regular expressions to paths to transformers
  // transform: undefined,

  // An array of regexp pattern strings that are matched against all source file paths,
  // matched files will skip transformation
  // transformIgnorePatterns: [
  //   "/node_modules/"
  // ],

  // An array of regexp pattern strings that are matched against all modules before
  // the module loader will automatically return a mock for them
  // unmockedModulePathPatterns: undefined,

  // Indicates whether each individual test should be reported during the run
  // verbose: true,

  // An array of regexp patterns that are matched against all source file paths before
  // re- running tests in watch mode
  // watchPathIgnorePatterns: [],

  // Whether to use watchman for file crawling
  // watchman: true,

  maxConcurrency: 5,
  // testTimeout: 30000,
};

const setEnv = (service, stage) => {
  try {
    const slsConf = yaml.load(fs.readFileSync(`${__dirname}/serverless.yml`, 'utf8'));
    const slsEnv = slsConf.provider.environment;
    const TABLE_PREFIX = `${stage}-${service}`;
    // console.log(slsConf.provider.environment);
    return Object.assign(process.env, {
      SERVERLESS_EXPRESS_PLATFORM: slsConf.provider.name,
      CORE_HOST: slsEnv.CORE_HOST,
      SLS_HOST: slsEnv.SLS_HOST,
      CORE_PORT: slsEnv.CORE_PORT,
      SLS_PORT: slsEnv.SLS_PORT,
      API_TIMEOUT: slsConf.provider.timeout * 1000,

      CORE_URL: 'http://192.168.76.50:9002/dev',
      ELASTIC_SEARCH_ENDPOINT: 'http://192.168.76.50:9200',
      VUELOS_URL: 'http://0.0.0.0:9002/dev',

      IS_LOCAL: true,
      IS_OFFLINE: true,
      BWS_DEFAULT_REGION: 'us-east-1',
      BWS_ACCESS_KEY_ID: 'S3RVER',
      BWS_SECRET_ACCESS_KEY: 'S3RVER',
      DYNAMODB_HOST: slsEnv.CORE_HOST,
      DYNAMODB_PORT: '9001',
      OBS_ALLOWED_TOKENS: '["abcd1234"]',

      stage,
      STAGE: stage,
      SERVICE: service,
      TABLE_PREFIX,
      TABLE_FLIGHTS: `${TABLE_PREFIX}-flights`,
      TABLE_FLIGHTS_CONFIG: `${TABLE_PREFIX}-flightsConfig`,
      TABLE_AIRPORTS: `${TABLE_PREFIX}-airports`,
      TABLE_AIRLINES: `${TABLE_PREFIX}-airlines`,
      TABLE_BOOKINGS: `${TABLE_PREFIX}-bookings`,
      TABLE_HISTORY: `${TABLE_PREFIX}-history`,
      TABLE_GENERAL_SETTINGS: `${TABLE_PREFIX}-generalSettings`,
    });
  } catch (e) {
    console.log(`ERROR loading jest env\n${e.stack}`);
  }
};
// process.env = setEnv('flight-tickets-api', 'dev');
