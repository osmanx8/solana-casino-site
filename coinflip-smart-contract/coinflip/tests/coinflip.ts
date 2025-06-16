import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { assert } from "chai";
import { Coinflip } from "../target/types/coinflip";
import initialize, { depositSolVault, getSolVaultBalance } from "./instructions/initialize";
import initPlayerPool, { getPlayerStatus } from "./instructions/initPlayerPool";
import playGame from "./instructions/playGame";
import { colorPrint, ColorType, dump, printProgress } from "./utils";

// Configure the client to use the local cluster.
anchor.setProvider(anchor.AnchorProvider.env());
let solConnection = anchor.getProvider().connection;
let provider: anchor.Provider = anchor.getProvider();
let lastWinTimes = 0;

const program = anchor.workspace.Coinflip as Program<Coinflip>;
const payer = provider.publicKey!;

describe("coinflip", () => {
  it("Is initialized!", async () => {
    await initialize(program as Program, provider);
  });
  it("Deposited sol vault!", async () => {
    await depositSolVault(100 * 1e9, program as Program, provider);
    const vaultBalance = await getSolVaultBalance(program as Program, solConnection);
    assert.equal(vaultBalance, 100 * 1e9);
  });

  it("Initialize player pool!", async () => {
    await initPlayerPool(payer, program as Program, provider);
    const playerStatus = await getPlayerStatus(payer, program as Program);
    assert.equal(playerStatus.player, payer.toBase58());
    assert.equal(playerStatus.round, 0);
    assert.equal(playerStatus.winTimes, 0);
  });
});

describe("===> First 1000 testing", () => {
  it("Play kickflip 500 times!", async () => {
    const startedAt = new Date();
    colorPrint(`Started from ${startedAt.toLocaleString()}`, ColorType.FgGreen);
    for (let i = 0; i < 500; i++) {
      await playGame(payer, 0, 0.1, program as Program, provider);
      // printProgress(10, i == 0);
      printProgress(i % 5 == 4 ? 1 : 0, i == 0);
    }
    const endAt = new Date();
    colorPrint(`Ended at ${endAt.toLocaleString()}`, ColorType.FgGreen);

    const playerStatus = await getPlayerStatus(payer, program as Program);
    assert.equal(playerStatus.round, 500);
    colorPrint(`==> Win times: ${playerStatus.winTimes} / 500`, ColorType.FgMagenta);

    lastWinTimes = playerStatus.winTimes;
    await dump(`Try Kickflip 500 times: win - ${playerStatus.winTimes}, lose - ${500 - playerStatus.winTimes}, duration - ${(endAt.getTime() - startedAt.getTime()) / 1000}s, startedAt - ${startedAt.toLocaleString()} \r\n`, true);
  });

  it("Play wipeout 500 times!", async () => {
    const startedAt = new Date();
    colorPrint(`Started from ${startedAt.toLocaleString()}`, ColorType.FgGreen);
    for (let i = 0; i < 500; i++) {
      await playGame(payer, 1, 0.1, program as Program, provider);
      // printProgress(10, i == 0);
      printProgress(i % 5 == 4 ? 1 : 0, i == 0);
    }
    const endAt = new Date();
    colorPrint(`Ended at ${endAt.toLocaleString()}`, ColorType.FgGreen);

    const playerStatus = await getPlayerStatus(payer, program as Program);
    assert.equal(playerStatus.round, 500 * 2);
    colorPrint(`==> Win times: ${playerStatus.winTimes - lastWinTimes} / 500`, ColorType.FgMagenta);
    
    await dump(`Try Wipeout 500 times: win - ${playerStatus.winTimes - lastWinTimes}, lose - ${500 + lastWinTimes - playerStatus.winTimes}, duration - ${(endAt.getTime() - startedAt.getTime()) / 1000}s, startedAt - ${startedAt.toLocaleString()} \r\n`);
    lastWinTimes = playerStatus.winTimes;
  });
});

describe("===> Second 1000 testing", () => {
  it("Play kickflip 500 times!", async () => {
    const startedAt = new Date();
    colorPrint(`Started from ${startedAt.toLocaleString()}`, ColorType.FgGreen);
    for (let i = 0; i < 500; i++) {
      await playGame(payer, 0, 0.1, program as Program, provider);
      // printProgress(10, i == 0);
      printProgress(i % 5 == 4 ? 1 : 0, i == 0);
    }
    const endAt = new Date();
    colorPrint(`Ended at ${endAt.toLocaleString()}`, ColorType.FgGreen);

    const playerStatus = await getPlayerStatus(payer, program as Program);
    assert.equal(playerStatus.round, 500 * 3);
    colorPrint(`==> Win times: ${playerStatus.winTimes - lastWinTimes} / 500`, ColorType.FgMagenta);

    await dump(`Try Kickflip 500 times: win - ${playerStatus.winTimes - lastWinTimes}, lose - ${500 + lastWinTimes - playerStatus.winTimes}, duration - ${(endAt.getTime() - startedAt.getTime()) / 1000}s, startedAt - ${startedAt.toLocaleString()} \r\n`);
    lastWinTimes = playerStatus.winTimes;
  });

  it("Play wipeout 500 times!", async () => {
    const startedAt = new Date();
    colorPrint(`Started from ${startedAt.toLocaleString()}`, ColorType.FgGreen);
    for (let i = 0; i < 500; i++) {
      await playGame(payer, 1, 0.1, program as Program, provider);
      // printProgress(10, i == 0);
      printProgress(i % 5 == 4 ? 1 : 0, i == 0);
    }
    const endAt = new Date();
    colorPrint(`Ended at ${endAt.toLocaleString()}`, ColorType.FgGreen);

    const playerStatus = await getPlayerStatus(payer, program as Program);
    assert.equal(playerStatus.round, 500 * 4);
    colorPrint(`==> Win times: ${playerStatus.winTimes - lastWinTimes} / 500`, ColorType.FgMagenta);

    await dump(`Try Wipeout 500 times: win - ${playerStatus.winTimes - lastWinTimes}, lose - ${500 + lastWinTimes - playerStatus.winTimes}, duration - ${(endAt.getTime() - startedAt.getTime()) / 1000}s, startedAt - ${startedAt.toLocaleString()} \r\n`);
    lastWinTimes = playerStatus.winTimes;
  });
});

describe("===> Third 1000 testing", () => {
  it("Play kickflip 500 times!", async () => {
    const startedAt = new Date();
    colorPrint(`Started from ${startedAt.toLocaleString()}`, ColorType.FgGreen);
    for (let i = 0; i < 500; i++) {
      await playGame(payer, 0, 0.1, program as Program, provider);
      // printProgress(10, i == 0);
      printProgress(i % 5 == 4 ? 1 : 0, i == 0);
    }
    const endAt = new Date();
    colorPrint(`Ended at ${endAt.toLocaleString()}`, ColorType.FgGreen);

    const playerStatus = await getPlayerStatus(payer, program as Program);
    assert.equal(playerStatus.round, 500 * 5);
    colorPrint(`==> Win times: ${playerStatus.winTimes - lastWinTimes} / 500`, ColorType.FgMagenta);

    await dump(`Try Kickflip 500 times: win - ${playerStatus.winTimes - lastWinTimes}, lose - ${500 + lastWinTimes - playerStatus.winTimes}, duration - ${(endAt.getTime() - startedAt.getTime()) / 1000}s, startedAt - ${startedAt.toLocaleString()} \r\n`);
    lastWinTimes = playerStatus.winTimes;
  });

  it("Play wipeout 500 times!", async () => {
    const startedAt = new Date();
    colorPrint(`Started from ${startedAt.toLocaleString()}`, ColorType.FgGreen);
    for (let i = 0; i < 500; i++) {
      await playGame(payer, 1, 0.1, program as Program, provider);
      // printProgress(10, i == 0);
      printProgress(i % 5 == 4 ? 1 : 0, i == 0);
    }
    const endAt = new Date();
    colorPrint(`Ended at ${endAt.toLocaleString()}`, ColorType.FgGreen);

    const playerStatus = await getPlayerStatus(payer, program as Program);
    assert.equal(playerStatus.round, 500 * 6);
    colorPrint(`==> Win times: ${playerStatus.winTimes - lastWinTimes} / 500`, ColorType.FgMagenta);

    await dump(`Try Wipeout 500 times: win - ${playerStatus.winTimes - lastWinTimes}, lose - ${500 + lastWinTimes - playerStatus.winTimes}, duration - ${(endAt.getTime() - startedAt.getTime()) / 1000}s, startedAt - ${startedAt.toLocaleString()} \r\n`);
    lastWinTimes = playerStatus.winTimes;
  });
});
describe("===> Fourth 1000 testing", () => {
  it("Play kickflip 500 times!", async () => {
    const startedAt = new Date();
    colorPrint(`Started from ${startedAt.toLocaleString()}`, ColorType.FgGreen);
    for (let i = 0; i < 500; i++) {
      await playGame(payer, 0, 0.1, program as Program, provider);
      // printProgress(10, i == 0);
      printProgress(i % 5 == 4 ? 1 : 0, i == 0);
    }
    const endAt = new Date();
    colorPrint(`Ended at ${endAt.toLocaleString()}`, ColorType.FgGreen);

    const playerStatus = await getPlayerStatus(payer, program as Program);
    assert.equal(playerStatus.round, 500 * 7);
    colorPrint(`==> Win times: ${playerStatus.winTimes - lastWinTimes} / 500`, ColorType.FgMagenta);

    await dump(`Try Kickflip 500 times: win - ${playerStatus.winTimes - lastWinTimes}, lose - ${500 + lastWinTimes - playerStatus.winTimes}, duration - ${(endAt.getTime() - startedAt.getTime()) / 1000}s, startedAt - ${startedAt.toLocaleString()} \r\n`);
    lastWinTimes = playerStatus.winTimes;
  });

  it("Play wipeout 500 times!", async () => {
    const startedAt = new Date();
    colorPrint(`Started from ${startedAt.toLocaleString()}`, ColorType.FgGreen);
    for (let i = 0; i < 500; i++) {
      await playGame(payer, 1, 0.1, program as Program, provider);
      // printProgress(10, i == 0);
      printProgress(i % 5 == 4 ? 1 : 0, i == 0);
    }
    const endAt = new Date();
    colorPrint(`Ended at ${endAt.toLocaleString()}`, ColorType.FgGreen);

    const playerStatus = await getPlayerStatus(payer, program as Program);
    assert.equal(playerStatus.round, 500 * 8);
    colorPrint(`==> Win times: ${playerStatus.winTimes - lastWinTimes} / 500`, ColorType.FgMagenta);

    await dump(`Try Wipeout 500 times: win - ${playerStatus.winTimes - lastWinTimes}, lose - ${500 + lastWinTimes - playerStatus.winTimes}, duration - ${(endAt.getTime() - startedAt.getTime()) / 1000}s, startedAt - ${startedAt.toLocaleString()} \r\n`);
    lastWinTimes = playerStatus.winTimes;
  });
});
describe("===> Fifth 1000 testing", () => {
  it("Play kickflip 500 times!", async () => {
    const startedAt = new Date();
    colorPrint(`Started from ${startedAt.toLocaleString()}`, ColorType.FgGreen);
    for (let i = 0; i < 500; i++) {
      await playGame(payer, 0, 0.1, program as Program, provider);
      // printProgress(10, i == 0);
      printProgress(i % 5 == 4 ? 1 : 0, i == 0);
    }
    const endAt = new Date();
    colorPrint(`Ended at ${endAt.toLocaleString()}`, ColorType.FgGreen);

    const playerStatus = await getPlayerStatus(payer, program as Program);
    assert.equal(playerStatus.round, 500 * 9);
    colorPrint(`==> Win times: ${playerStatus.winTimes - lastWinTimes} / 500`, ColorType.FgMagenta);

    await dump(`Try Kickflip 500 times: win - ${playerStatus.winTimes - lastWinTimes}, lose - ${500 + lastWinTimes - playerStatus.winTimes}, duration - ${(endAt.getTime() - startedAt.getTime()) / 1000}s, startedAt - ${startedAt.toLocaleString()} \r\n`);
    lastWinTimes = playerStatus.winTimes;
  });

  it("Play wipeout 500 times!", async () => {
    const startedAt = new Date();
    colorPrint(`Started from ${startedAt.toLocaleString()}`, ColorType.FgGreen);
    for (let i = 0; i < 500; i++) {
      await playGame(payer, 1, 0.1, program as Program, provider);
      // printProgress(10, i == 0);
      printProgress(i % 5 == 4 ? 1 : 0, i == 0);
    }
    const endAt = new Date();
    colorPrint(`Ended at ${endAt.toLocaleString()}`, ColorType.FgGreen);

    const playerStatus = await getPlayerStatus(payer, program as Program);
    assert.equal(playerStatus.round, 500 * 10);
    colorPrint(`==> Win times: ${playerStatus.winTimes - lastWinTimes} / 500`, ColorType.FgMagenta);

    await dump(`Try Wipeout 500 times: win - ${playerStatus.winTimes - lastWinTimes}, lose - ${500 + lastWinTimes - playerStatus.winTimes}, duration - ${(endAt.getTime() - startedAt.getTime()) / 1000}s, startedAt - ${startedAt.toLocaleString()} \r\n`);
    lastWinTimes = playerStatus.winTimes;
  });
});