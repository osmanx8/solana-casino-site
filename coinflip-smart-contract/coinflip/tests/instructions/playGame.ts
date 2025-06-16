import * as anchor from '@project-serum/anchor';
import {
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { GLOBAL_AUTHORITY_SEED, VAULT_AUTHORITY_SEED } from '../../cli/scripts';
import { getGlobalState } from './initialize';
import { initPlayerPoolTx } from './initPlayerPool';

export const playGame = async (
  userAddress: PublicKey,
  setValue: number,
  deposit: number,
  program: anchor.Program,
  provider: anchor.Provider,
) => {
  try {
    const tx = await createPlayGameTx(
      userAddress,
      setValue,
      deposit,
      program,
      provider,
    );
    const txId = await provider.sendAndConfirm(tx, [], {
      commitment: "confirmed",
    });
    return true;
  } catch (e) {
    return false;
  }
}

const createPlayGameTx = async (userAddress: PublicKey, setNum: number, deposit: number, program: anchor.Program, provider: anchor.Provider) => {
  const [globalAuthority] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );
  // console.log('GlobalAuthority: ', globalAuthority.toBase58());

  const [rewardVault] = await PublicKey.findProgramAddress(
    [Buffer.from(VAULT_AUTHORITY_SEED)],
    program.programId
  );
  // console.log('RewardVault: ', rewardVault.toBase58());

  let playerPoolKey = await PublicKey.createWithSeed(
    userAddress,
    "player-pool",
    program.programId,
  );
  // console.log(playerPoolKey.toBase58());

  const state = await getGlobalState(program);

  let tx = new Transaction();
  let poolAccount = await provider.connection.getAccountInfo(playerPoolKey);
  if (poolAccount === null || poolAccount.data === null) {
    // console.log('init User Pool');
    let tx1 = await initPlayerPoolTx(userAddress, program, provider);
    tx.add(tx1)
  }

  tx.add(program.instruction.playGame(
    new anchor.BN(setNum), new anchor.BN(deposit * 1e9), {
    accounts: {
      owner: userAddress,
      playerPool: playerPoolKey,
      globalAuthority,
      rewardVault: rewardVault,
      loyaltyWallet: state.loyaltyWallet,
      systemProgram: SystemProgram.programId,
    },
    signers: [],
  }));

  return tx;
}

export default playGame;