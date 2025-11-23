import { Keypair, PublicKey } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { BanksClient, Clock, ProgramTestContext, startAnchor } from 'solana-bankrun'
import IDL from '../target/idl/vesting.json'
import { SYSTEM_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/native/system'
import { BankrunProvider } from 'anchor-bankrun'
import { Program } from '@coral-xyz/anchor'
import { Vesting } from '../target/types/vesting'
import { createMint, mintTo } from 'spl-token-bankrun'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet'
import { BN } from 'bn.js'
// import { it } from 'node:test'
describe('Vesting', () => {
    const companyName = 'companyName'
    let beneficiary: Keypair

    let context: ProgramTestContext
    let provider: BankrunProvider
    let program: Program<Vesting>
    let banksClient: BanksClient
    let employer: Keypair
    let mint: PublicKey
    let beneficiaryProvider: BankrunProvider
    let vestingAccountKey: PublicKey
    let program2: Program<Vesting>
    let treasuryAccountKey: PublicKey
    let employeeAccountKey: PublicKey
    beforeAll(async () => {
        ; ((beneficiary = new anchor.web3.Keypair()),
            (context = await startAnchor(
                '',
                [{ name: 'vesting', programId: new PublicKey(IDL.address) }],
                [
                    {
                        address: beneficiary.publicKey,
                        info: {
                            lamports: 100000000,
                            data: Buffer.alloc(0),
                            owner: SYSTEM_PROGRAM_ID,
                            executable: false,
                        },
                    },
                ],
            )))
        provider = new BankrunProvider(context)
        anchor.setProvider(provider)
        program = new Program<Vesting>(IDL as Vesting, provider)
        banksClient = context.banksClient
        employer = provider.wallet.payer

        mint = await createMint(banksClient, employer, employer.publicKey, null, 2)
        beneficiaryProvider = new BankrunProvider(context, new NodeWallet(beneficiary))
        program2 = new Program<Vesting>(IDL as Vesting, beneficiaryProvider)
       
       
        ;[vestingAccountKey] = PublicKey.findProgramAddressSync([Buffer.from('companyName')], program.programId)
       
        ;[treasuryAccountKey] =PublicKey.findProgramAddressSync(
                [Buffer.from('vesting_treasury'), Buffer.from('companyName')],
                program.programId,
            )

            ;[employeeAccountKey] =
            PublicKey.findProgramAddressSync(
                [Buffer.from('employee_vesting'), beneficiary.publicKey.toBuffer(), vestingAccountKey.toBuffer()],
                program.programId,
            )
    })
    it('should create a vesting account', async () => {
        const tx = await program.methods
            .createVestingAccount(companyName)
            .accounts({
                signer: employer.publicKey,
                mint: mint,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc({ commitment: 'confirmed' })
        console.log('create vesting account', tx)

        const vestingAccountData = await program.account.vestingAccount.fetch(vestingAccountKey, 'confirmed')
        console.log('vesting account data', vestingAccountData)
    })
    it('should fund the treasury token account', async () => {
        const amount = 1_000_000n * 10n ** 9n
        const mintTx = await mintTo(banksClient, employer, mint, treasuryAccountKey, employer, amount)
        console.log('mint tx', mintTx)
    })
    it('should create an employee vesting account', async () => {


        const tx2=await program.methods.createEmployeeVesting(new BN(0), new BN(100),new BN(100),new BN(0)).accounts({
            beneficiary:beneficiary.publicKey,
            vestingAccount: vestingAccountKey,
        }).rpc({commitment:'confirmed',skipPreflight:true})
        console.log('create employee vesting account', tx2)
        console.log('employee vesting account', employeeAccountKey.toBase58())
    })
    it("should claim the employee's vesting", async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const currentClock=await banksClient.getClock()
        context.setClock(
            new Clock(
                currentClock.slot,
                currentClock.epochStartTimestamp,
                currentClock.epoch,
                currentClock.leaderScheduleEpoch,
                1000n
            )
        )
        const tx3=await program2.methods.claimTokens(companyName).accounts({tokenProgram:TOKEN_PROGRAM_ID}).rpc({commitment:'confirmed'})
        console.log('claim tokens', tx3)



    })
})









// cd /home/dexter/vesting/vesting/anchor && grep -n "function mintTo" -R node_modules/spl-token-bankrun -n || grep -n "mintTo(" -R node_modules/spl-token-bankrun -n