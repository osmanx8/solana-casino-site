import { PublicKey, TransactionInstruction, Connection } from "@solana/web3.js";

// export const waitAndCount = async (ms: number) => {
//     return new Promise<void>((resolve) => {
//       let count = 1;
//       const interval = setInterval(() => {
//         console.log(count);
//         count++;
//         if (count > 3) {
//           clearInterval(interval);
//           resolve(); // Resolve the promise after counting to 3
//         }
//       }, ms / 3); // Divide the wait time into 3 intervals
//     });
// };

// export const getOrCreateATAInstruction = async (
//   tokenMint: PublicKey,
//   owner: PublicKey,
//   connection: Connection,
//   payer?: PublicKey,
// ): Promise<[PublicKey, TransactionInstruction?]> => {
//   let toAccount;
//   try {
//     toAccount = getAssociatedTokenAccount(tokenMint, owner);

//     const account = await connection.getAccountInfo(toAccount);

//     if (!account) {
//       const ix = createAssociatedTokenAccountInstruction(
//         payer || owner,
//         toAccount,
//         owner,
//         tokenMint,
//         TOKEN_PROGRAM_ID,
//         ASSOCIATED_TOKEN_PROGRAM_ID,
//       );
//       return [toAccount, ix];
//     }
//     return [toAccount, undefined];
//   } catch (e) {
//     /* handle error */
//     console.error('Error::getOrCreateATAInstruction', e);
//     throw e;
//   }
// };
