'use client'

import { Keypair, PublicKey } from '@solana/web3.js'
import React, { useMemo, useState } from 'react'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useVestingProgram, useVestingProgramAccount } from './vesting-data-access'
import { ellipsify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { useWallet } from '@solana/wallet-adapter-react'

export function VestingCreate(): React.ReactElement {
  const { initialize } = useVestingProgram()
  const [companyName, setCompanyName] = useState('')
  const [mint, setMint] = useState('')
  const {publicKey} = useWallet()
  const isFormValid=companyName.length>0 && mint.length>0

   const handleSubmit = async () => {
  if (!publicKey) {
    alert('Please connect your wallet');
    return;
  }
  if (!isFormValid) {
    alert('Please fill in all fields');
    return;
  }

  // await initialize.mutateAsync({
  //   companyName,
  //   mint,
  //   owner: publicKey,
  // });


  try {
  const txSig = await initialize.mutateAsync({
    companyName,
    mint,
    owner: publicKey,
  });
  console.log("Initialize transaction signature:", txSig);
} catch (err) {
  console.error("Initialize failed:", err);
}

};

  
  return (
    <div>
      <input type="text" placeholder='company name' value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input input-bordered w-full max-w-xs" />
      <input type="text" placeholder='mint' value={mint} onChange={(e) => setMint(e.target.value)} className="input input-bordered w-full max-w-xs" />
      <Button onClick={ handleSubmit} disabled={initialize.isPending || !isFormValid}>
      Create New Vesting Account{initialize.isPending && '...'}
    </Button>
    </div>
  )

}


export function VestingList() {
  const { accounts, getProgramAccount } = useVestingProgram()

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!getProgramAccount.data?.value) {
    console.log(getProgramAccount)
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }
  return (
    <div className={'space-y-6'}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <VestingCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  )
}

function VestingCard({ account }: { account: PublicKey }) {
  const { accountQuery,createEmployeeVesting} = useVestingProgramAccount({
    account,
  })
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [amount, setAmount] = useState(0)
  const [cliffTime, setCliffTime] = useState(0)
  const [beneficiary, setBeneficiary] = useState('')
  const companyName=useMemo(()=>accountQuery.data?.companyName ?? '',[accountQuery.data?.companyName])

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <Card>
      <CardHeader>
        <CardTitle>Vesting: {companyName}</CardTitle>
        <CardDescription>
          Account: <ExplorerLink path={`account/${account}`} label={ellipsify(account.toString())} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
      <input type="text" placeholder='start time' value={startTime||''} onChange={(e) => setStartTime(parseInt(e.target.value))} className="input input-bordered w-full max-w-xs" />
      <input type="text" placeholder='end time' value={endTime||''} onChange={(e) => setEndTime(parseInt(e.target.value))} className="input input-bordered w-full max-w-xs" />
      <input type="text" placeholder='total amount' value={amount||''} onChange={(e) => setAmount(parseInt(e.target.value))} className="input input-bordered w-full max-w-xs" />
      <input type="text" placeholder='cliff' value={cliffTime||''} onChange={(e) => setCliffTime(parseInt(e.target.value))} className="input input-bordered w-full max-w-xs" />
      <input type="text" placeholder='beneficiary address' value={beneficiary||''} onChange={(e) => setBeneficiary((e.target.value))} className="input input-bordered w-full max-w-xs" />
      
          <Button
            variant="outline"
            onClick={() => {
             
              return createEmployeeVesting.mutateAsync({
                startTime,
                endTime,
                amount,
                cliffTime,
                beneficiary,
              })
            }}
            disabled={createEmployeeVesting.isPending }
          >
            Create Employee Vesting Account
          </Button>

        </div>
      </CardContent>
    </Card>
  )
}

