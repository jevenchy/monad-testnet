export const moncockABI = [
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'quantity', type: 'uint256' },
      { name: '_merkleProof', type: 'bytes32[]' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  }
]
