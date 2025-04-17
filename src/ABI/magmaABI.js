export const magmaABI = [
  {
    type: 'function',
    name: 'stake',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
    signature: '0xd5575982'
  },
  {
    type: 'function',
    name: 'unstake',
    inputs: [
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable',
    signature: '0x6fed1ea7'
  },
  {
    type: 'event',
    name: 'Stake',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: true },
      { name: 'round', type: 'uint256', indexed: true }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Unstake',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: true }
    ],
    anonymous: false
  }
]
