import { PublicKey } from "@solana/web3.js";

export const COINFLIP = new PublicKey(
  "472RXUv8zUX7zm4LprxNsFQvAZYEpSGaY9EUE4akCvG6"
);
export const GLOBAL_VAULT_SEED = "coinflip_global";
export const GAME_VAULT_SEED = "coinflip_game";
export const FEE_RECEIVER = new PublicKey(
  "GdCJ8rM2cbdKXZMBH5H4EmvLinQSp78Xg1stHoh4nUpr"
);
export const treasury = new PublicKey(
  "9ZTHWWZDpB36UFe1vszf2KEpt83vwi27jDqtHQ7NSXyR"
);

export const BE_HOST = "https://coinflip-backend-production.up.railway.app/";
// export const WS_HOST = "wss://coinflip-backend-production-a018.up.railway.app/";
export const WS_HOST = "ws://localhost:8881";
export const MESSAGES_PER_PAGE = 15;
export const RPC = "https://api.devnet.solana.com";
