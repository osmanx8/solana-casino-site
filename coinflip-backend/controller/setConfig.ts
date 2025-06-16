import { Program, web3 } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import {
  Keypair as Web3JsKeypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  Mint,
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import { GLOBAL_VAULT_SEED, GAME_VAULT_SEED, COINFLIP } from "../constant";
import { getOrCreateATAInstruction, getAssociatedTokenAccount } from "./utils";
import {
  networkStateAccountAddress,
  Orao,
  randomnessAccountAddress,
} from "@orao-network/solana-vrf";
import bs58 from "bs58";
import { IDL } from "../coinflip";
import { BN } from "bn.js";
import GameModel from "../model/GameModel";

let solConnection: web3.Connection;
let provider: anchor.Provider;
let payer: NodeWallet;
const treasury = new PublicKey("9ZTHWWZDpB36UFe1vszf2KEpt83vwi27jDqtHQ7NSXyR");
let vrf: Orao;
export let program: Program;
// Address of the deployed program.
let programId = new anchor.web3.PublicKey(COINFLIP);
/**
 * Set cluster, provider, program
 * If rpc != null use rpc, otherwise use cluster param
 * @param cluster - cluster ex. mainnet-beta, devnet ...
 * @param keypair - wallet keypair
 * @param rpc - rpc
 */

export const setClusterConfig = (cluster: web3.Cluster, rpc?: string) => {
  if (!rpc) {
    solConnection = new web3.Connection(web3.clusterApiUrl(cluster));
  } else {
    solConnection = new web3.Connection(rpc);
  }

  const secretKey = process.env.PRIVATE_KEY || "";
  const walletKeypair = Web3JsKeypair.fromSecretKey(bs58.decode(secretKey));

  const wallet = new NodeWallet(walletKeypair);

  // Configure the client to use the local cluster.
  anchor.setProvider(
    new anchor.AnchorProvider(solConnection, wallet, {
      skipPreflight: true,
      commitment: "confirmed",
    })
  );
  payer = wallet;

  provider = anchor.getProvider();
  vrf = new Orao(anchor.getProvider() as any);
  // Generate the program client from IDL.
  program = new anchor.Program(IDL as anchor.Idl, programId);
};

export const global = async () => {
  const global = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_VAULT_SEED)],
    COINFLIP
  )[0];
  const eventAuthority = PublicKey.findProgramAddressSync(
    [Buffer.from("__event_authority")],
    COINFLIP
  )[0];

  const tx = await program.methods
    .initialize({
      adminAuthority: payer.publicKey,
      feeReciever: new PublicKey(process.env.FEE_RECEIVER as string),
    })
    .accounts({
      global,
      eventAuthority,
      systemProgram: SystemProgram.programId,
      program: programId,
    })
    .transaction();

  const latestBlockHash = await provider.connection.getLatestBlockhash(
    provider.connection.commitment
  );
  const creatTx = new web3.Transaction({
    feePayer: payer.publicKey,
    ...latestBlockHash,
  }).add(tx);

  creatTx.sign(payer.payer);

  const preInxSim = await solConnection.simulateTransaction(creatTx);

  const txHash = await provider.sendAndConfirm!(creatTx, [], {
    commitment: "finalized",
  });

  return txHash;
};

export const initGame = async (
  selection: boolean,
  creatorPubkey: String,
  mint: String,
  amount: number,
  decimal: number,
  isSol: boolean,
  index: number
) => {
  try {
    const global = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_VAULT_SEED)],
      COINFLIP
    )[0];
    const eventAuthority = PublicKey.findProgramAddressSync(
      [Buffer.from("__event_authority")],
      COINFLIP
    )[0];
    const tokenMint = new PublicKey(mint);
    const feeReciever = payer.publicKey;
    const creator = new PublicKey(creatorPubkey);

    const [feeRecieverAta, ataInstruction] = await getOrCreateATAInstruction(
      tokenMint,
      feeReciever,
      solConnection,
      creator
    );

    let latestBlockHash = await provider.connection.getLatestBlockhash(
      provider.connection.commitment
    );

    const creatorAta = getAssociatedTokenAccount(tokenMint, creator);
    let newGame = PublicKey.findProgramAddressSync(
      [
        Buffer.from(GAME_VAULT_SEED),
        creator.toBuffer(),
        Buffer.from(index.toString()),
      ],
      COINFLIP
    )[0];
    let gameAccInfo = await solConnection.getAccountInfo(newGame);
    while (gameAccInfo) {
      index++;
      newGame = PublicKey.findProgramAddressSync(
        [
          Buffer.from(GAME_VAULT_SEED),
          creator.toBuffer(),
          Buffer.from(index.toString()),
        ],
        COINFLIP
      )[0];
      gameAccInfo = await solConnection.getAccountInfo(newGame);
    }

    let search = await GameModel.findOne({ gamePDA: newGame.toBase58() });
    while (search) {
      index++;
      newGame = PublicKey.findProgramAddressSync(
        [
          Buffer.from(GAME_VAULT_SEED),
          creator.toBuffer(),
          Buffer.from(index.toString()),
        ],
        COINFLIP
      )[0];
      search = await GameModel.findOne({ gamePDA: newGame.toBase58() });
    }

    const random = randomnessAccountAddress(newGame.toBuffer());
    const tx = await program.methods
      .createGame({
        creatorSelection: selection,
        bettingAmount: new BN(amount * Math.pow(10, decimal)),
        isSol,
        tokenMint,
        index,
        force: [...newGame.toBuffer()],
      })
      .accounts({
        global,
        feeReciever,
        feeRecieverAta,
        creator,
        creatorAta,
        newGame,
        treasury,
        random,
        config: networkStateAccountAddress(),
        vrf: vrf.programId,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();

    latestBlockHash = await provider.connection.getLatestBlockhash(
      provider.connection.commitment
    );
    const creatTx = new web3.Transaction({
      feePayer: creator,
      ...latestBlockHash,
    }).add(tx);

    // const serializedTx = creatTx.serialize({verifySignatures:false,requireAllSignatures:false})

    // const base64Transaction = Buffer.from(serializedTx).toString('base64');
    // return { base64Transaction, newGame };
    const setBudgetInx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 200_000,
    });
    const messageV0 = new TransactionMessage({
      payerKey: creator,
      recentBlockhash: latestBlockHash.blockhash,
      instructions: [setBudgetInx, ...tx.instructions],
    }).compileToV0Message();

    const vtx = new VersionedTransaction(messageV0);

    const serializedTx = vtx.serialize();

    const base64Transaction = Buffer.from(serializedTx).toString("base64");
    return { base64Transaction, newGame, index };
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const joinGame = async (
  opposite: String,
  creator_key: String,
  mint: String,
  index: number
) => {
  try {
    const global = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_VAULT_SEED)],
      COINFLIP
    )[0];
    const feeReciever = payer.publicKey;
    const player = new PublicKey(opposite);
    const tokenMint = new PublicKey(mint);

    const feeRecieverAta = getAssociatedTokenAccount(tokenMint, feeReciever);
    console.log("here1");

    let latestBlockHash = await provider.connection.getLatestBlockhash(
      provider.connection.commitment
    );

    const creator = new PublicKey(creator_key);
    const playerAta = getAssociatedTokenAccount(tokenMint, player);

    const coinFlipGame = PublicKey.findProgramAddressSync(
      [
        Buffer.from(GAME_VAULT_SEED),
        creator.toBuffer(),
        Buffer.from(index.toString()),
      ],
      COINFLIP
    )[0];
    const tx = await program.methods
      .joinOpposite({
        index: index,
      })
      .accounts({
        global,
        feeReciever,
        feeRecieverAta,
        creator,
        player,
        playerAta,
        coinFlipGame,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();

    latestBlockHash = await provider.connection.getLatestBlockhash(
      provider.connection.commitment
    );
    const creatTx = new web3.Transaction({
      feePayer: player,
      ...latestBlockHash,
    }).add(tx);

    const setBudgetInx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 200_000,
    });
    const messageV0 = new TransactionMessage({
      payerKey: player,
      recentBlockhash: latestBlockHash.blockhash,
      instructions: [setBudgetInx, ...tx.instructions],
    }).compileToV0Message();

    const vtx = new VersionedTransaction(messageV0);

    const serializedTx = vtx.serialize();

    const base64Transaction = Buffer.from(serializedTx).toString("base64");
    return { base64Transaction, coinFlipGame };
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const fetchGameStatus = async (gamePDA: String) => {
  const creator = payer.publicKey;
  const coinFlipGame = new PublicKey(gamePDA);

  try {
    let status = await program.account.coinFlipGame.fetch(
      coinFlipGame,
      "confirmed"
    );

    return status;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const handleGame = async (
  creator_key: String,
  mint: String,
  opposite: String,
  index: number
) => {
  let txId: string = "";
  try {
    console.log("handle game transaction...");
    const creator = new PublicKey(creator_key);
    const tokenMint = new PublicKey(mint);
    const player = new PublicKey(opposite);
    const feeReceiver = new PublicKey(process.env.FEE_RECEIVER as string);
    const auth = payer.publicKey;
    const authAta = getAssociatedTokenAccount(tokenMint, payer.publicKey);
    const feeRecieverAta = getAssociatedTokenAccount(tokenMint, feeReceiver);
    const global = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_VAULT_SEED)],
      COINFLIP
    )[0];
    const coinFlipGame = PublicKey.findProgramAddressSync(
      [
        Buffer.from(GAME_VAULT_SEED),
        creator.toBuffer(),
        Buffer.from(index.toString()),
      ],
      COINFLIP
    )[0];
    const creatorAta = getAssociatedTokenAccount(tokenMint, creator);
    const playerAta = getAssociatedTokenAccount(tokenMint, player);
    const random = randomnessAccountAddress(coinFlipGame.toBuffer());

    let latestBlockHash = await provider.connection.getLatestBlockhash(
      provider.connection.commitment
    );

    const tx = await program.methods
      .handleGame({
        creatorSelection: true,
        bettingAmount: new BN(100000),
        isSol: true,
        tokenMint,
        index: index,
        force: [...coinFlipGame.toBuffer()],
      })
      .accounts({
        global,
        coinFlipGame,
        feeReceiver,
        feeRecieverAta,
        random,
        auth,
        authAta,
        creator,
        creatorAta,
        player,
        playerAta,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();

    const setBudgetInx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 200_000,
    });

    latestBlockHash = await provider.connection.getLatestBlockhash(
      provider.connection.commitment
    );

    const messageV0 = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: latestBlockHash.blockhash,
      instructions: [setBudgetInx, ...tx.instructions],
    }).compileToV0Message();

    const vtx = new VersionedTransaction(messageV0);

    vtx.sign([payer.payer]);

    const vtx_sim = await solConnection.simulateTransaction(vtx, {
      sigVerify: true,
    });
    console.log("Transaction simulator:", vtx_sim);
    txId = await solConnection.sendTransaction(vtx, { skipPreflight: true });
    console.log("handle game tx id:", txId);
    const tx_sig = await solConnection.confirmTransaction(txId, "finalized");
    console.log("signature:", tx_sig);
    return txId;
  } catch (error) {
    console.log("handle game errorr=>", error);
    return txId;
  }
};

export const fetchGlobalStatus = async () => {
  const global = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_VAULT_SEED)],
    COINFLIP
  )[0];
  try {
    const accountInfo = await solConnection.getAccountInfo(global);
    if (!accountInfo) {
      return null;
    }
    let status = await program.account.global.fetch(global, "confirmed");

    return status;
  } catch (error) {
    console.log("when get global account:", error);
    return null;
  }
};

export const refundSol = async (
  creator: String,
  amount: number,
  opposite?: String
) => {
  const transaction = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 200_000,
    }),
    SystemProgram.transfer({
      fromPubkey: payer.publicKey, // Sender's public key
      toPubkey: new PublicKey(creator), // Receiver's public key
      lamports: amount, // Amount to send (in lamports)
    })
  );
  if (opposite) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey, // Sender's public key
        toPubkey: new PublicKey(opposite), // Receiver's public key
        lamports: amount, // Amount to send (in lamports)
      })
    );
  }
  const signature = await solConnection.sendTransaction(transaction, [
    payer.payer,
  ]);

  await solConnection.confirmTransaction(signature);

  console.log(`Transaction successful with signature: ${signature}`);
};

export const refundToken = async (
  creator: String,
  amount: number,
  token: String,
  opposite?: String
) => {
  let tokenMint = new PublicKey(token);
  const authAta = getAssociatedTokenAccount(tokenMint, payer.publicKey);
  const reciever = getAssociatedTokenAccount(tokenMint, new PublicKey(creator));

  const transaction = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 200_000,
    }),
    createTransferInstruction(
      authAta, // Sender's token account
      reciever, // Receiver's token account
      payer.publicKey, // Sender's public key (authority)
      amount,
      [],
      TOKEN_PROGRAM_ID
    )
  );
  if (opposite) {
    const reciever2 = getAssociatedTokenAccount(
      tokenMint,
      new PublicKey(opposite)
    );
    transaction.add(
      createTransferInstruction(
        authAta, // Sender's token account
        reciever2, // Receiver's token account
        payer.publicKey, // Sender's public key (authority)
        amount,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }
  // Sign and send the transaction
  const signature = await solConnection.sendTransaction(transaction, [
    payer.payer,
  ]);

  // Wait for confirmation
  await solConnection.confirmTransaction(signature);
  console.log(`Transaction successful with signature: ${signature}`);
};

export const checkBalance = async (
  isSol: boolean,
  mint: String,
  amount: number,
  address: string
) => {
  if (isSol) {
    const balance = await solConnection.getBalance(new PublicKey(address));
    console.log(balance);

    if (balance <= amount) {
      return false;
    }
  } else {
    try {
      const ataAddress = await getAssociatedTokenAddress(
        new PublicKey(mint),
        new PublicKey(address)
      );
      const tokenAccount = await getAccount(solConnection, ataAddress);

      if (tokenAccount.amount < amount) {
        return false;
      }
    } catch (error) {
      console.log(error);

      return false;
    }
  }

  return true;
};
