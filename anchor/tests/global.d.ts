
declare module 'spl-token-bankrun' {
    import BN from "bn.js";
    import { Keypair, PublicKey } from "@solana/web3.js";
    import { BanksClient, BanksTransactionMeta } from "solana-bankrun";
    export  function createMint(
    banksClient: BanksClient,
    payer: Keypair,
    mintAuthority: PublicKey,
    freezeAuthority: PublicKey | null,
    decimals: number
): Promise<PublicKey>
    export function mintTo(
    banksClient: BanksClient,
    payer: Keypair,
    mint: PublicKey,
    destination: PublicKey,
    amount:number
): Promise<BanksTransactionMeta>
}