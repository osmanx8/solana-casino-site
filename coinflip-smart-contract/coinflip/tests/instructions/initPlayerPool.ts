import * as anchor from '@project-serum/anchor';
import {
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { PLAYER_POOL_SIZE } from '../../cli/scripts';
import { PlayerPool } from '../../cli/types';
import { getAccountRent } from '../utils';

export const initPlayerPool = async (
  userAddress: PublicKey,
  program: anchor.Program,
  provider: anchor.Provider,
) => {

  const tx = await initPlayerPoolTx(
      userAddress,
      program,
      provider,
  );
  const txId = await provider.sendAndConfirm(tx, [], {
      commitment: "confirmed",
  });

  console.log("txHash =", txId);
}

export const initPlayerPoolTx = async (player: PublicKey, program: anchor.Program, provider: anchor.Provider) => {
  let playerPoolKey = await PublicKey.createWithSeed(
    player,
    "player-pool",
    program.programId,
  );
  console.log(playerPoolKey.toBase58());

  let tx = new Transaction();

  let ix = SystemProgram.createAccountWithSeed({
    fromPubkey: player,
    basePubkey: player,
    seed: "player-pool",
    newAccountPubkey: playerPoolKey,
    lamports: await getAccountRent(PLAYER_POOL_SIZE, provider.connection),
    space: PLAYER_POOL_SIZE,
    programId: program.programId,
  });

  tx.add(ix);
  tx.add(program.instruction.initializePlayerPool(
    {
      accounts: {
        owner: player,
        playerPool: playerPoolKey,
      },
      instructions: [],
      signers: []
    }));

  return tx;
}

export const getUserPoolState = async (
  userAddress: PublicKey,
  program: anchor.Program
): Promise<PlayerPool | null> => {
  if (!userAddress) return null;

  let playerPoolKey = await PublicKey.createWithSeed(
      userAddress,
      "player-pool",
      program.programId,
  );
  console.log('Player Pool: ', playerPoolKey.toBase58());
  try {
      let poolState = await program.account.playerPool.fetch(playerPoolKey);
      return poolState as unknown as PlayerPool;
  } catch {
      return null;
  }
}

export const getPlayerStatus = async (
  userAddress: PublicKey,
  program: anchor.Program
) => {
  const userData = await getUserPoolState(userAddress, program);
  return {
    player: userData.player.toBase58(),
    round: userData.round.toNumber(),
    winTimes: userData.winTimes.toNumber(),
    gameData: {
      playTime: userData.gameData.playTime.toNumber(),
      amount: userData.gameData.amount.toNumber(),
      rewardAmount: userData.gameData.rewardAmount.toNumber(),
      setNum: userData.gameData.setNum.toNumber(),
      rand: userData.gameData.rand.toNumber(),
    }
  }
}

export default initPlayerPool;