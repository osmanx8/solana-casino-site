import * as anchor from '@project-serum/anchor';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  Connection,
} from '@solana/web3.js';
import { GLOBAL_AUTHORITY_SEED, VAULT_AUTHORITY_SEED } from '../../cli/scripts';
import { GlobalPool } from '../../cli/types';
import { getAccountRent, getBalance } from '../utils';

const initialize = async (program: anchor.Program, provider: anchor.Provider) => {
  const [globalAuthority] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );
  const [rewardVault] = await PublicKey.findProgramAddress(
    [Buffer.from(VAULT_AUTHORITY_SEED)],
    program.programId
  );

  let tx = new Transaction();

  tx.add(program.instruction.initialize(
    {
      accounts: {
        admin: provider.publicKey,
        globalAuthority,
        rewardVault: rewardVault,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
      signers: [],
    }));

  const txId = await provider.sendAndConfirm(tx, [], {
    commitment: "confirmed",
  });

  console.log("txHash =", txId);

  return true;
}

export const depositSolVault = async (amount: number, program: anchor.Program, provider: anchor.Provider) => {
  if (!provider.publicKey) return false;

  const [rewardVault] = await PublicKey.findProgramAddress(
    [Buffer.from(VAULT_AUTHORITY_SEED)],
    program.programId
  );

  let tx = new Transaction();

  tx.add(SystemProgram.transfer({
    fromPubkey: provider.publicKey,
    toPubkey: rewardVault,
    lamports: amount,
  }));

  const txId = await provider.sendAndConfirm(tx, [], {
    commitment: "confirmed",
  });

  console.log("txHash =", txId);
}

export const getSolVaultKey = async (program: anchor.Program) => {
  const [rewardVault] = await PublicKey.findProgramAddress(
    [Buffer.from(VAULT_AUTHORITY_SEED)],
    program.programId
  );

  return rewardVault;
}

export const getSolVaultBalance = async (program: anchor.Program, connection: Connection) => {
  const vaultKey = await getSolVaultKey(program);
  const balance = await getBalance(vaultKey, connection);
  const rent = await getAccountRent(0, connection);
  return balance - rent;
}

export const getGlobalState = async (
  program: anchor.Program
): Promise<GlobalPool | null> => {
  const [globalAuthority] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );
  try {
    let globalState = await program.account.globalPool.fetch(globalAuthority);
    return globalState as unknown as GlobalPool;
  } catch {
    return null;
  }
}

export default initialize;