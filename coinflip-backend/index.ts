import dotenv from "dotenv";
import { connectMongoDB } from "./config";
import WebSocket from "ws";
import {
  setClusterConfig,
  fetchGlobalStatus,
  global,
  fetchGameStatus,
} from "./controller/setConfig";
import { MESSAGES_PER_PAGE, Room, Message, Client } from "./constant";
import { Connection, VersionedTransaction } from "@solana/web3.js";
import GameModel from "./model/GameModel";
import MessageModel from "./model/MessageModel";
import {
  program,
  refundSol,
  refundToken,
  initGame,
  joinGame,
  handleGame,
  checkBalance,
} from "./controller/setConfig";
import { tweetResult } from "./controller/tweet";

dotenv.config();
connectMongoDB();

let rpc = process.env.RPC || "";

(async () => {
  setClusterConfig("mainnet-beta", rpc);
  let status = await fetchGlobalStatus();
  console.log("status=====", status);

  if (!status) {
    console.log("Init global auth");

    await global();
  }
  status = await fetchGlobalStatus();
})();

export const server = new WebSocket.Server({ port: 8881 });

// import { server } from "..";
// import WebSocket from 'ws';

let connection = new Connection(rpc);
let messages: Message[] = [];
let rooms: Room[] = [];
let clients: Client[] = [];

type Option<T> = T | null;

export const broadcast = (message: object) => {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
};

const expireGame = async () => {
  try {
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 5 * 60;

    let result = await GameModel.findOne({
      finished: false,
      createdAt: { $lt: fiveMinutesAgo },
    });
    if (result) {
      let status = await fetchGameStatus(result.gamePDA);
      if (status && !status.availableOpposite) {
        await refundSol(result.creator as String, Number(result.amount));
      } else if (status && status.availableOpposite) {
        await refundSol(
          result.creator as String,
          Number(result?.amount),
          result.opposite
        );
      }

      if (result?.opposite !== "") {
        broadcast({
          type: "EXPIRE_GAME",
          data: {
            _id: result._id,
            creator: result.creator,
            opposite: result.opposite,
          },
        });
      } else {
        broadcast({
          type: "EXPIRE_GAME",
          data: { _id: result._id, creator: result.creator },
        });
      }

      await result.deleteOne();
      console.log(`${result._id} expired games deleted.`);
    }
  } catch (error) {
    console.error("Error deleting expired games:", error);
  }
};

const expireMessage = async () => {
  try {
    const twoDaysAgo = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 5;
    let result = await MessageModel.deleteMany({
      createdAt: { $lt: twoDaysAgo },
    });
  } catch (error) {
    console.log("error when expire message:", error);
  }
};

const saveMessage = async () => {
  try {
    let copy_message = messages;
    messages = [];
    for (let index = 0; index < copy_message.length; index++) {
      const element = copy_message[index];
      const message = new MessageModel({
        message: element.message,
        wallet: element.wallet,
        createdAt: element.createdAt,
      });

      let result = await message.save();
      console.log("save result==>>>", result);
    }
  } catch (error) {
    console.log("Error when saving message:", error);
  }
};

const filpsBot = async () => {
  await expireGame();
  await saveMessage();
  await expireMessage();
};

setInterval(filpsBot, 5000);

server.on("connection", (ws: WebSocket) => {
  try {
    const client = { ws };
    clients.push(client);
    console.log("connected");

    ws.on("message", async (message: string) => {
      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case "CREATE_ROOM":
            try {
              const { unit, mint, decimal, amount, creator, selection } = data;
              console.log("Creating new game...");
              const balanceCheck = await checkBalance(
                unit === "SOL",
                mint,
                amount * Math.pow(10, decimal),
                creator
              );
              if (!balanceCheck) {
                ws.send(
                  JSON.stringify({
                    type: "ERROR_HANDLE",
                    data: "Not enough Balance!",
                  })
                );
                break;
              }
              let index = 13100;
              const result = await GameModel.findOne({ creator });
              if (result) {
                index = result.index + 1;
              }
  
              const serializedTx = await initGame(
                selection,
                creator,
                mint,
                amount,
                decimal,
                unit === "SOL",
                index
              );
              ws.send(
                JSON.stringify({
                  type: "ROOM_CREATED",
                  room: serializedTx?.base64Transaction,
                  data: {
                    unit,
                    mint,
                    decimal,
                    amount: amount * Math.pow(10, decimal),
                    creator,
                    selection,
                    gamePDA: serializedTx?.newGame,
                    index: serializedTx?.index,
                  },
                })
              );
            } catch (error) {
              ws.send(
                JSON.stringify({
                  type: "ERROR_HANDLE",
                  data: "Error Creating Transaction!",
                })
              );
            }

            break;
          case "JOIN_ROOM": {
            try {
              const { unit, opposite, creator_key, mint, index, amount } = data;
              console.log("building instruction for join game");
              const balanceCheck = await checkBalance(
                unit === "SOL",
                mint,
                amount,
                opposite
              );
              if (!balanceCheck) {
                ws.send(
                  JSON.stringify({
                    type: "ERROR_HANDLE",
                    data: "Not enough Balance!",
                  })
                );
                break;
              }

              const serializedTx = await joinGame(
                opposite,
                creator_key,
                mint,
                index
              );

              ws.send(
                JSON.stringify({
                  type: "USER_JOINED",
                  join: serializedTx?.base64Transaction,
                  data: {
                    opposite,
                    gamePDA: serializedTx?.coinFlipGame,
                  },
                })
              );
            } catch (error) {
              console.log(error);

              ws.send(
                JSON.stringify({
                  type: "ERROR_HANDLE",
                  data: "Error Joining Transaction!",
                })
              );
            }
            break;
          }
          case "GET_ROOMS":
            const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 5 * 60;
            console.log("now time===>", fiveMinutesAgo);

            rooms = await GameModel.find({
              createdAt: { $gt: fiveMinutesAgo },
            });
            ws.send(JSON.stringify({ type: "ROOM_LIST", rooms }));
            break;
          case "Fetch_Result":
            {
              const address = data.data;
              console.log("fetch result ==>", address);
              const games = await GameModel.find({
                $or: [{ creator: address }, { opposite: address }],
              });

              let win = 0;
              for (let index = 0; index < games.length; index++) {
                const element = games[index];
                if (
                  address === element.creator &&
                  element.selection === element.result
                ) {
                  win++;
                } else if (
                  address === element.opposite &&
                  element.selection !== element.result
                ) {
                  win++;
                }
              }

              ws.send(
                JSON.stringify({
                  type: "FETCH_INFO",
                  data: { win, games: games.length },
                })
              );
            }

            break;
          case "MESSAGE":
            const messageData = {
              wallet: data.data.wallet,
              message: data.data.message,
              createdAt: Date.now() / 1000,
            };
            messages.push(messageData);

            broadcast({
              type: "MESSAGE_LIST",
              messages: [messageData],
              isScroll: false,
            });
            break;
          case "FETCH_MESSAGE": {
            let fetchMessages = await MessageModel.find()
              .sort({ createdAt: -1 })
              .skip((data.page - 1) * MESSAGES_PER_PAGE)
              .limit(MESSAGES_PER_PAGE)
              .select("message wallet createdAt -_id");
            let sendMessage = [...fetchMessages.reverse(), ...messages];
            if (data.page > 1) {
              sendMessage = [...fetchMessages];
            }

            ws.send(
              JSON.stringify({
                type: "MESSAGE_LIST",
                messages: sendMessage,
                isScroll: data.page > 1,
              })
            );
            break;
          }
          case "MANAGE_GAMEDATA": {
            if (data.event === "create") {
              /* ---------------- Creating Game Result! ----------------- */
              let {
                mint,
                unit,
                decimal,
                amount,
                creator,
                selection,
                gamePDA,
                index,
              } = data;
              try {
                console.log("save new game on db...");
                const game = new GameModel({
                  unit,
                  mint,
                  decimal,
                  amount,
                  creator,
                  selection,
                  result: selection,
                  createdAt: Math.floor(Date.now() / 1000),
                  gamePDA,
                  index,
                  process: true,
                });
                let result = await game.save();

                broadcast({ type: "ADD_NEW", data: result });
                console.log("saved");

                const decodedBufferTx = Buffer.from(data.room, "base64");
                const vtx = VersionedTransaction.deserialize(decodedBufferTx);

                const preInxSim = await connection.simulateTransaction(vtx);
                console.log("create game simulate result:", preInxSim);
                const signature = await connection.sendTransaction(vtx, {
                  skipPreflight: true,
                });

                await connection.confirmTransaction(signature, "finalized");
                console.log("creating game signature: ", signature);
                const transaction = await connection.getSignatureStatus(
                  signature
                );
                if (
                  transaction.value?.confirmationStatus === "finalized" &&
                  !preInxSim.value.err
                ) {
                  result.process = false;
                  await result.save();
                  broadcast({
                    type: "CHANGE_PROCESS",
                    _id: result._id,
                    creator: result.creator,
                    opposite: result?.opposite,
                    status: "creating",
                  });
                } else if(preInxSim.value.err) {
                  throw new Error("Creating game error!");
                }
              } catch (error) {
                const result = await GameModel.findOneAndUpdate({ gamePDA }, { err: true });

                ws.send(
                  JSON.stringify({
                    type: "ERROR_HANDLE",
                    data: "Game Creating Error!",
                    gamePDA
                  })
                );
              }
            } else if (data.event === "join") {
              /* ---------------- Join to Game Result! ----------------- */
              const { gamePDA, opposite } = data;
              const game = await GameModel.findOneAndUpdate(
                { gamePDA },
                { opposite, process: true },
                { update: true }
              );
              if (!game) {
                const result = await GameModel.findOneAndUpdate({ gamePDA }, { err: true });

                ws.send(
                  JSON.stringify({
                    type: "ERROR_HANDLE",
                    data: "Joining Game Error!",
                    gamePDA
                  })
                );

                return;
              }
              try {
                console.log("join to game ", data.gamePda);
                broadcast({
                  type: "UPDATE_JOIN",
                  data: {
                    _id: game?._id,
                    opposite,
                    creator: game?.creator,
                  },
                });
                const decodedBufferTx = Buffer.from(data.join, "base64");
                const vtx = VersionedTransaction.deserialize(decodedBufferTx);
                const preInxSim = await connection.simulateTransaction(vtx);
                console.log("create game simulate result:", preInxSim);
                const signature = await connection.sendTransaction(vtx, {
                  skipPreflight: true,
                });

                await connection.confirmTransaction(signature, "finalized");
                console.log("join game signature: ", signature);
                const transaction = await connection.getSignatureStatus(
                  signature
                );
                if (
                  transaction.value?.confirmationStatus === "finalized" &&
                  !preInxSim.value.err
                ) {
                  const search = await GameModel.findOneAndUpdate(
                    { _id: game?._id },
                    { process: false, readyToPlay: true }
                  );
                  broadcast({
                    type: "CHANGE_PROCESS",
                    _id: search?._id,
                    creator: search?.creator,
                    opposite: search?.opposite,
                    status: "joining",
                  });
                } else if(preInxSim.value.err) {
                  throw new Error("Joining Error");
                }
              } catch (error) {
                const result = await GameModel.findOneAndUpdate({ gamePDA }, { err: true });

                ws.send(
                  JSON.stringify({
                    type: "ERROR_HANDLE",
                    data: "Joining Game Error!",
                    gamePDA
                  })
                );
                return;
              }
              /* ---------------- Handling Game Result! ----------------- */
              if (game?.creator && game?.mint) {
                try {
                  let handle_sig = await handleGame(
                    game?.creator,
                    game?.mint,
                    opposite,
                    game?.index
                  );
                  if (handle_sig) {
                    const transaction = await connection.getSignatureStatus(
                      handle_sig
                    );
                    if (transaction.value?.confirmationStatus === "finalized") {
                      let gamestatus = await fetchGameStatus(gamePDA);
                      console.log("gamestatus ==> ", gamestatus);
                      if (gamestatus && gamestatus.isFinished) {
                        const updateResult = await GameModel.findOneAndUpdate(
                          { gamePDA },
                          {
                            finished: true,
                            result: gamestatus.result,
                            createdAt: Date.now() / 1000,
                          },
                          { update: true }
                        );
                        broadcast({
                          type: "UPDATE_RESULT",
                          data: {
                            _id: updateResult?._id,
                            result: gamestatus.result,
                            creator: updateResult?.creator,
                            selection: updateResult?.selection,
                            amount: updateResult?.amount,
                            decimal: updateResult?.decimal,
                            unit: updateResult?.unit,
                            opposite: updateResult?.opposite,
                          },
                        });
                        const winner = updateResult?.result === updateResult?.selection
                        ? updateResult?.creator
                        : updateResult?.opposite;

                        const loser = updateResult?.result !== updateResult?.selection
                        ? updateResult?.creator
                        : updateResult?.opposite;

                        const tweetContent = `
  🎲 ${
    (parseFloat(updateResult?.amount as string) /
      Math.pow(10, parseFloat(updateResult?.decimal as string))) *
    2
  } ${updateResult?.unit} Flip Result: 
  
  🎉 Winner: ${winner?.slice(0, 4)} ... ${winner?.slice(winner.length - 4, winner.length)}  
  ❌ Loser: ${loser?.slice(0, 4)} ... ${loser?.slice(loser.length - 4, loser.length)}
  🔍 Tx ID: https://solscan.io/tx/${handle_sig}
  
  @flipdotis
  `;
                        await tweetResult(tweetContent);
                      } else {
                        throw new Error("Handling game error!");
                      }
                    }
                  }
                } catch (error) {
                  const result = await GameModel.findOneAndUpdate({ gamePDA }, { err: true });

                  ws.send(
                    JSON.stringify({
                      type: "ERROR_HANDLE",
                      data: "Handling Game Error!",
                      gamePDA
                    })
                  );
                }
              }
            }
          }
          default:
            break;
        }
      } catch (error) {
        console.log("Error triggered when message on", error);
      }
    });

    ws.on("close", () => {
      console.log("websocke closed!");
      clients = clients.filter((client) => client.ws !== ws);
    });
  } catch (error) {
    console.log("Error triggered when socket!", error);
  }
});
