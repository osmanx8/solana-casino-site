import * as anchor from '@project-serum/anchor';
import {
  PublicKey,
  Connection,
} from '@solana/web3.js';
import rdl from 'readline';
import fs from 'fs';

export const getBalance = async (account: PublicKey, connection: Connection) => {
  return await connection.getBalance(account);
}

export const getAccountRent = async (dataSize: number, connection: Connection) => {
  return await connection.getMinimumBalanceForRentExemption(dataSize);
}

export const dump = async (content: any, isNew: boolean = false) => {
  fs.writeFileSync('./ratio.log', content, {flag: isNew ? 'w' : 'a'});
}

export enum ColorType {
  Reset = "\x1b[0m",
  Bright = "\x1b[1m",
  Dim = "\x1b[2m",
  Underscore = "\x1b[4m",
  Blink = "\x1b[5m",
  Reverse = "\x1b[7m",
  Hidden = "\x1b[8m",

  FgBlack = "\x1b[30m",
  FgRed = "\x1b[31m",
  FgGreen = "\x1b[32m",
  FgYellow = "\x1b[33m",
  FgBlue = "\x1b[34m",
  FgMagenta = "\x1b[35m",
  FgCyan = "\x1b[36m",
  FgWhite = "\x1b[37m",

  BgBlack = "\x1b[40m",
  BgRed = "\x1b[41m",
  BgGreen = "\x1b[42m",
  BgYellow = "\x1b[43m",
  BgBlue = "\x1b[44m",
  BgMagenta = "\x1b[45m",
  BgCyan = "\x1b[46m",
  BgWhite = "\x1b[47m",
}

export const colorPrint = async (content: any, color: ColorType = ColorType.Reset) => {
  console.log(color, content, ColorType.Reset);
}

export const printProgress = async (value: number, newBar: boolean = false) => {
  let ld = LoadingBar.clone();
  if (newBar) {
    ld = LoadingBar.reset();
    ld.start();
    return;
  }

  for (let i = 0; i < value; i++) ld.progress();
}

class LoadingBar {
  size: number
  cursor: number
  finished: boolean
  static self: LoadingBar | null = null

  constructor(size) {
    this.size = size
    this.cursor = 0
    this.finished = false
  }

  start() {
    process.stdout.write("\x1B[?25l")
    for (let i = 0; i < this.size; i++) {
      process.stdout.write("\u2591")
    }
    rdl.cursorTo(process.stdout, this.cursor);
  }

  progress() {
    if (this.finished) return;
    process.stdout.write("\u2588")
    this.cursor++;
    if (this.cursor >= this.size) {
      this.finished = true
      process.stdout.write('\n');
    }
  }

  static clone() {
    if (this.self) return this.self;
    this.self = new LoadingBar(100);
    return this.self;
  }

  static reset() {
    this.self = new LoadingBar(100);
    return this.self;
  }
}
