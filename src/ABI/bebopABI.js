export const bebopABI = [
  {
    type: 'function',
    name: 'deposit',
    inputs: [],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [
      { name: 'wad', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    name: 'Deposit',
    inputs: [
      { name: 'dst', type: 'address', indexed: true },
      { name: 'wad', type: 'uint256', indexed: false }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Withdrawal',
    inputs: [
      { name: 'src', type: 'address', indexed: true },
      { name: 'wad', type: 'uint256', indexed: false }
    ],
    anonymous: false
  }
]
