'use client'

import { getVestingProgram, getVestingProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey, SystemProgram } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { BN } from 'bn.js'
interface CreateVestingArgs {
  companyName: string
  mint: string
  owner: PublicKey
}
interface CreateEmployeeArgs {
  startTime: number
  endTime: number
  amount: number
  cliffTime: number
  beneficiary: string
}

export function useVestingProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getVestingProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getVestingProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['Vesting', 'all', { cluster }],
    queryFn: () => program.account.vestingAccount.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation<string, Error, CreateVestingArgs>({
    mutationKey: ['VestingAccount', 'create', { cluster }],
    mutationFn: ({ companyName, mint }: CreateVestingArgs) =>
      program.methods
        .createVestingAccount(companyName)
        .accounts({ mint: new PublicKey(mint), tokenProgram: TOKEN_PROGRAM_ID })
        .rpc(),
    onSuccess: async (signature) => {
      transactionToast(signature)
      await accounts.refetch()
    },
    onError: (e) => {
      toast.error('Failed to initialize account')
      console.error(e)
    },
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useVestingProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useVestingProgram()

  const accountQuery = useQuery({
    queryKey: ['Vesting', 'fetch', { cluster, account }],
    queryFn: () => program.account.vestingAccount.fetch(account),
  })

  const createEmployeeVesting = useMutation<string, Error, CreateEmployeeArgs>({
    mutationKey: ['employeeAccount', 'create', { cluster }],
    mutationFn: async ({ startTime, endTime, amount, cliffTime, beneficiary }: CreateEmployeeArgs) => {
      if (!beneficiary || typeof beneficiary !== 'string') {
        throw new Error('Beneficiary address is required')
      }

      // Trim whitespace
      const trimmedBeneficiary = beneficiary.trim()

      if (!trimmedBeneficiary) {
        throw new Error('Beneficiary address cannot be empty')
      }

      // Validate and create PublicKey
      let beneficiaryPubkey: PublicKey
      try {
        beneficiaryPubkey = new PublicKey(trimmedBeneficiary)
      } catch (err) {
        throw new Error(`Invalid beneficiary public key: ${trimmedBeneficiary}`)
      }

      return await program.methods
        .createEmployeeVesting(new BN(startTime), new BN(endTime), new BN(amount), new BN(cliffTime))
        .accounts({ vestingAccount: account, beneficiary: beneficiaryPubkey })
        .rpc()
    },
    onSuccess: async (signature) => {
      transactionToast(signature)
      await accounts.refetch()
    },
    onError: () => {
      toast.error('Failed to initialize account')
    },
  })

  // const setMutation = useMutation({
  //   mutationKey: ['Vesting', 'set', { cluster, account }],
  //   mutationFn: (value: number) => program.methods.set(value).accounts({ Vesting: account }).rpc(),
  //   onSuccess: async (tx) => {
  //     transactionToast(tx)
  //     await accountQuery.refetch()
  //   },
  // })

  return {
    accountQuery,
    createEmployeeVesting,
    // setMutation,
  }
}
