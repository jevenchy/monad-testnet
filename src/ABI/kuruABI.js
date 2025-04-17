export const kuruABI = [
  {
    name: 'anyToAnySwap',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_marketAddresses', type: 'address[]' },
      { name: '_isBuy', type: 'bool[]' },
      { name: '_nativeSend', type: 'bool[]' },
      { name: '_debitToken', type: 'address' },
      { name: '_creditToken', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_minAmountOut', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'calculatePriceOverRoute',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'route', type: 'address[]' },
      { name: 'isBuy', type: 'bool[]' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
]
