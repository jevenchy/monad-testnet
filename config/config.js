import dotenv from 'dotenv'
import { tokens } from './tokens.js'
import { randomDelay } from '../src/utils/delay.js'

dotenv.config()

export const config = {
  token: process.env.DISCORD_TOKEN,
  guildId: process.env.GUILD_ID,
  embedChannelId: process.env.EMBED_CHANNEL_ID,

  label: 'Jevenchy',
  color: '#2f3136',

  rpc: 'https://testnet-rpc.monad.xyz/',
  explorer: 'https://testnet.monadexplorer.com/tx/',

  cycle: 1,
  retry: 3,
  rawInfo: true,
  randomDelay,
  tokens,

  gas: {
    stake: [200000, 300000, 400000],
    unstake: [200000, 300000, 400000],
    claim: [200000, 300000, 400000],
    wrap: [200000, 300000, 400000],
    unwrap: [200000, 300000, 400000],
    mint: [200000, 300000, 400000],
    swap: [200000, 300000, 400000]
  },

  delay: {
    min: 10,
    max: 20
  },

  amount: {
    min: 0.01,
    max: 0.02
  }
}
