export const contracts = {
  apriori: {
    name: 'Apriori',
    contract: '0xb2f82D0f38dc453D596Ad40A37799446Cc89274A',
    type: 'stake'
  },
  bean: {
    name: 'Bean',
    router: '0xCa810D095e90Daae6e867c19DF6D9A8C56db2c89',
    type: 'dex'
  },
  bebop: {
    name: 'Bebop',
    router: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
    type: 'wrap'
  },
  izumi: {
    name: 'Izumi',
    router: '0xF6FFe4f3FdC8BBb7F70FFD48e61f17D1e343dDfD',
    type: 'dex'
  },
  kintsu: {
    name: 'Kintsu',
    contract: '0xe1d2439b75fb9746e7bc6cb777ae10aa7f7ef9c5',
    router: '0xCa810D095e90Daae6e867c19DF6D9A8C56db2c89',
    type: 'stake'
  },
  kuru: {
    name: 'Kuru',
    router: '0xc816865f172d640d93712C68a7E1F83F3fA63235',
    utils: '0x9E50D9202bEc0D046a75048Be8d51bBa93386Ade',
    type: 'dex',
    api: {
      base: 'https://api.testnet.kuru.io',
      endpoints: {
        markets: {
          path: '/api/v1/markets/filtered',
          method: 'POST'
        }
      }
    }
  },
  lilchogstars: {
    name: 'LilChogstars',
    contract: '0xb33D7138c53e516871977094B249C8f2ab89a4F4',
    type: 'nft'
  },
  madness: {
    name: 'Madness',
    router: '0x64Aff7245EbdAAECAf266852139c67E4D8DBa4de',
    type: 'dex'
  },
  magma: {
    name: 'Magma',
    contract: '0x2c9C959516e9AAEdB2C748224a41249202ca8BE7',
    type: 'stake'
  },
  memebridge: {
    name: 'MemeBridge',
    contract: '0x120c6C7055Ac7A31CFcAB77EaF584DECfEF34a61',
    type: 'nft'
  },
  moncock: {
    name: 'Moncock',
    contract: '0xC1afdED3A96adCfd5D2148ddD54A2dB95F770b19',
    type: 'nft'
  },
  octo: {
    name: 'Octo',
    router: '0xb6091233aacacba45225a2b2121bbac807af4255',
    type: 'dex'
  },
  rubic: {
    name: 'Rubic',
    contract: '0x3335733c454805df6a77f825f266e136FB4a3333',
    type: 'wrap'
  },
  shmonad: {
    name: 'shMONAD',
    contract: '0x3a98250F98Dd388C211206983453837C8365BDc1',
    type: 'stake'
  },
  uniswap: {
    name: 'Uniswap',
    router: '0xfb8e1c3b833f9e67a71c859a132cf783b645e436',
    type: 'dex'
  }
}
