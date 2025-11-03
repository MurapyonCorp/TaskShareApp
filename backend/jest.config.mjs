export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      { useESM: true, tsconfig: 'tsconfig.jest.json' },
    ],
  },

  // ★ここが肝：ESM-only パッケージは変換対象にする（allowlist）
  // 使っているものだけ残す。分からなければこのまま試してOK。
  transformIgnorePatterns: [
    'node_modules/(?!(@faker-js/faker|uuid|nanoid|node-fetch|chalk)/)',
  ],

  moduleNameMapper: {
    // TSのimportに .js と書いたときの救済（これだけでOK）
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  modulePathIgnorePatterns: ['/dist/', '/build/'],
  coverageProvider: 'v8',

  // ESM のモック関連（必要に応じて）
  // setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};
