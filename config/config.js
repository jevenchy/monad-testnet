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
    stake: [250000, 350000, 450000],
    unstake: [250000, 350000, 450000],
    claim: [250000, 350000, 450000],
    wrap: [250000, 350000, 450000],
    unwrap: [250000, 350000, 450000],
    mint: [250000, 350000, 450000],
    swap: [250000, 350000, 450000]
  },

  delay: {
    min: 5,
    max: 50
  },

  amount: {
    min: 0.01,
    max: 0.02
  }
}
