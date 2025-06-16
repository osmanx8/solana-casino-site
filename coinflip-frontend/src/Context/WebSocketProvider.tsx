import React, { createContext, useContext, useEffect, useState } from 'react';
import { VersionedTransaction, Connection, clusterApiUrl, Transaction } from '@solana/web3.js';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { Buffer } from 'buffer';
import { useEffectContext } from './ReactEffectProvider';
import { errorAlert, infoAlert, successAlert } from '../Component/ToastGroup';
import { WS_HOST, RPC } from '../config/constant';

interface Room {
    unit: String,
    mint: String,
    decimal: number,
    amount: number,
    creator: String,
    selection: Boolean,
    finished: Boolean,
    opposite: string,
    gamePDA: String,
    readyToPlay: Boolean,
    createdAt: Number,
    result: Boolean,
    index: number,
    process: Boolean,
    err: Boolean,
    _id: String
}
interface Message {
    message: string,
    wallet: string,
    createdAt: number
}
interface WebSocketContextProps {
    rooms: Room[];
    creating: boolean,
    joining: boolean,
    finished: boolean,
    porfolioInfo: {
        totalGame: number,
        wins: number,
    },
    chattingmessage: Message[],
    hasMore: boolean,
    isScroll: boolean,
    isNew: boolean,
    createRoom: (unit: String, mint: String, decimal: Number, amount: Number, creator: String, selection: Boolean) => void;
    joinRoom: (unit: String, opposite: string, creator_key: String, mint: String, index: number, amount: number) => void;
    getRooms: () => void;
    setCreatingState: (state: boolean) => void;
    setJoiningState: (state: boolean) => void;
    getInfo: (address: string) => void;
    sendMessage: (wallet: string, message: string) => void,
    fetchMessage: (page: number) => void
}
const connection = new Connection(RPC);

const WebSocketContext = createContext<WebSocketContextProps | undefined>(undefined);

const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [creating, setCreating] = useState(false);
    const [chattingmessage, setMessage] = useState<Message[]>([]);
    const [joining, setJoining] = useState(false);
    const [isScroll, setIsScroll] = useState(false);
    const [finished, setFinished] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [hasMore, setHasmore] = useState(true);
    const [porfolioInfo, setInfo] = useState({
        totalGame: 0,
        wins: 0,
    });
    const { setConfetti } = useEffectContext();
    const wallet = useAnchorWallet()
    useEffect(() => {
        if (!wallet) {
            console.warn("Wallet is not initialized");
            return;
        }
        console.log("wallet:", wallet.publicKey);

        const ws = new WebSocket(WS_HOST);
        setSocket(ws);

        ws.onopen = () => {
            // infoAlert("WebSocket connection establishe");
            console.log('WebSocket connection established');
            ws.send(JSON.stringify({ type: 'GET_ROOMS' }));
            ws.send(JSON.stringify({ type: 'Fetch_Result', data: wallet.publicKey.toBase58() }));
            ws.send(JSON.stringify({ type: 'FETCH_MESSAGE', page: 1 }))
        };

        ws.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'ROOM_LIST': {
                    console.log("rooms==>", message.rooms);
                    setRooms(message.rooms.reverse());
                    break;
                }
                case 'ROOM_CREATED': {
                    try {
                        console.log("start create game: ", message.room);
                        const decodedBufferTx = Buffer.from(message.room, 'base64');
                        const vtx = VersionedTransaction.deserialize(decodedBufferTx);
                        if (!wallet) {
                            errorAlert("Wallet is not initialized!");
                            break;
                        }
                        const signedVtx = await wallet?.signTransaction(vtx);
                        if (!signedVtx) break
                        const serializedTx = signedVtx.serialize();
                        const base64Transaction = Buffer.from(serializedTx).toString("base64");

                        ws.send(JSON.stringify({ type: 'MANAGE_GAMEDATA', ...message.data, event: 'create', room: base64Transaction }))

                    } catch (error) {
                        setCreating(false);
                        setJoining(false);
                        console.log("creating error:", error);
                        errorAlert("Error to create game!");
                        break;
                    }

                    break;
                }
                case 'USER_JOINED': {
                    try {
                        console.log("start join game:", message.join);
                        console.log("opposite:", message.opposite);
                        console.log("serializedTx?.coinFlipGame:", message.gamePda);
                        const decodedBufferTx = Buffer.from(message.join, 'base64');
                        const vtx = VersionedTransaction.deserialize(decodedBufferTx);
                        if (!wallet) {
                            errorAlert("Wallet is not initialized!");
                            break;
                        }
                        const signedVtx = await wallet?.signTransaction(vtx);
                        if (!signedVtx) break
                        const serializedTx = signedVtx.serialize();
                        const base64Transaction = Buffer.from(serializedTx).toString("base64");
                        ws.send(JSON.stringify({ type: 'MANAGE_GAMEDATA', ...message.data, join: base64Transaction, event: 'join' }))
                    } catch (error) {
                        setJoining(false);
                        console.log("Joining error:", error);
                        errorAlert("Error to Joing game!");
                    }
                    break;
                }
                case 'ADD_NEW':
                    console.log("add new");
                    console.log("process:", message.data.process);

                    setRooms((prev) => [message.data, ...prev]);
                    if (wallet.publicKey.toBase58() === message.data.creator) {
                        setCreating(false)
                    }
                    break;
                case 'EXPIRE_GAME':
                    console.log("expire game");
                    setRooms((prev) => prev.filter(item =>
                        item._id !== message.data._id
                    ));
                    if (wallet.publicKey.toBase58() == message.data.creator) {
                        infoAlert("Your game has expried!");
                    }

                    if (message.data.opposite) {
                        if (wallet.publicKey.toBase58() == message.data.opposite) {
                            infoAlert(message.data.creator.slice(0, 4) + "..." + message.data.creator.slice(message.data.creator.length - 4, message.data.creator.length) + "'s game has expried!");
                        }
                    }
                    break
                case 'UPDATE_JOIN':
                    console.log("Update join data after saving database!");
                    setRooms((prev) => prev.map(item =>
                        item._id === message.data._id ? { ...item, opposite: message.data.opposite, process: true } : item
                    ));

                    if (wallet.publicKey.toBase58() === message.data.opposite) {
                        setJoining(false);
                    }
                    break;
                case 'UPDATE_RESULT':
                    console.log("result ===>", message.data);

                    const winnerMsg = `You won ${parseFloat(message.data.amount) / Math.pow(10, parseFloat(message.data.decimal)) * 2} ${message.data.unit}`;
                    const loserMsg = `You lost ${parseFloat(message.data.amount) / Math.pow(10, parseFloat(message.data.decimal))} ${message.data.unit}`;

                    setRooms((prev) => prev.map(item =>
                        item._id === message.data._id ? { ...item, finished: true, result: message.data.result, createdAt: Date.now() / 1000 } : item
                    ));
                    if (wallet.publicKey.toBase58() == message.data.creator) {
                        if (message.data.selection === message.data.result) {
                            setConfetti(true);
                            successAlert(winnerMsg);
                        } else {
                            errorAlert(loserMsg);
                        }
                    } else if (wallet.publicKey.toBase58() == message.data.opposite) {
                        if (message.data.selection === message.data.result) {
                            errorAlert(loserMsg)
                        } else {
                            setConfetti(true);
                            successAlert(winnerMsg)
                        }
                        // successAlert(message.data.selection === message.data.result? loserMsg: winnerMsg)
                    }

                    setFinished(!finished);
                    break;
                case 'FETCH_INFO':
                    console.log("result fetching===>", message.data.games, message.data.win);

                    setInfo({
                        totalGame: message.data.games,
                        wins: message.data.win,
                    })
                    break;
                case 'ERROR_HANDLE':
                    if (message.gamePDA) {
                        setRooms((prev) => prev.map(item =>
                            item.gamePDA === message.gamePDA ? { ...item, err: true } : item
                        ));
                    }
                    errorAlert(message.data);
                    setCreating(false);
                    setJoining(false);
                    break
                case 'MESSAGE_LIST':
                    if (message.messages.length > 0) {
                        setIsScroll(message.isScroll);
                        if (message.isScroll) {
                            setMessage((prev) => [...message.messages, ...prev]);
                        } else {
                            if (message.messages.length === 1) {
                                setIsNew(true)
                                setMessage((prev) => [...prev, ...message.messages]);
                            } else {
                                setMessage((prev) => [...message.messages]);
                                setIsNew(false)
                            }
                        }
                    } else {
                        setHasmore(false);
                    }

                    break
                case 'CHANGE_PROCESS':

                    if (message.status === "creating") {
                        setRooms((prev) => prev.map(item =>
                            item._id === message._id ? { ...item, process: false } : item
                        ));
                        if (wallet.publicKey.toBase58() === message.creator) {
                            successAlert("Your game created successfuly!");
                        }
                    } else if (message.status === "joining") {
                        setRooms((prev) => prev.map(item =>
                            item._id === message._id ? { ...item, process: false, readyToPlay: true } : item
                        ));
                        if (wallet.publicKey.toBase58() === message.creator) {
                            infoAlert(message.opposite.slice(0, 4) + "..." + message.opposite.slice(message.opposite.length - 4, message.opposite.length) + " has joined your game:");
                        } else if (wallet.publicKey.toBase58() === message.opposite) {
                            infoAlert("Joined successfully!");
                        }
                    }

                    break
                default: {
                    console.warn('Unknown message type:', message.type);
                }
            }
        };

        ws.onerror = (error) => {
            errorAlert('WebSocket error:' + error);
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            // infoAlert("WebSocket connection closed");
            console.log('WebSocket connection closed');
            setCreating(false);
            setJoining(false);
        };

        return () => ws.close();
    }, [wallet]);

    useEffect(() => {
        setInterval(() => {
            const fiveMinutesAgo: Number = Math.floor(Date.now() / 1000) - 5 * 60;
            if (rooms) {
                setRooms((prev) => prev.filter(item =>
                    item.createdAt >= fiveMinutesAgo || !item.finished
                ));
            }

        }, 5000);

    }, [])

    useEffect(() => {
        if (wallet?.publicKey) {
            getInfo(wallet?.publicKey.toBase58())
        }
    }, [finished]);

    const createRoom = (unit: String, mint: String, decimal: Number, amount: Number, creator: String, selection: Boolean) => {

        console.log("mint, wallet ===>>>", mint, creator, decimal);

        if (socket?.readyState === WebSocket.OPEN) {
            socket?.send(JSON.stringify({ type: 'CREATE_ROOM', unit, mint, decimal, amount, creator, selection }));
        } else {
            setCreating(false);
            infoAlert("WebSocket connection closed");
        }
    };

    const joinRoom = (unit: String, opposite: string, creator_key: String, mint: String, index: number, amount: number) => {
        console.log("join room");

        if (socket?.readyState === WebSocket.OPEN) {
            socket?.send(JSON.stringify({ type: 'JOIN_ROOM', unit, opposite, creator_key, mint, index, amount }));
        } else {
            setJoining(false);
            infoAlert("WebSocket connection closed");
        }
    };

    const getInfo = (address: string) => {
        if (socket?.readyState === WebSocket.OPEN) {
            console.log("fetch info room");
            socket?.send(JSON.stringify({ type: 'Fetch_Result', data: address }));
        } else {
            // infoAlert("WebSocket connection closed");
        }
    };

    const setCreatingState = (state: boolean) => {
        setCreating(state);
    }

    const setJoiningState = (state: boolean) => {
        setJoining(state);
    }

    const getRooms = () => {
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'GET_ROOMS' }));
        } else {
            // errorAlert('WebSocket is not ready');
            console.warn('WebSocket is not ready');
        }
    };

    const sendMessage = (wallet: string, message: string) => {
        if (socket?.readyState === WebSocket.OPEN) {
            socket?.send(JSON.stringify({ type: 'MESSAGE', data: { wallet, message } }));
        } else {
            // infoAlert("WebSocket connection closed");
        }
    }

    const fetchMessage = (page: number) => {
        if (socket?.readyState === WebSocket.OPEN) {
            socket?.send(JSON.stringify({ type: 'FETCH_MESSAGE', page }));
        } else {
            // infoAlert("WebSocket connection closed");
        }
    }
    return (
        <WebSocketContext.Provider value={{ porfolioInfo, finished, rooms, creating, joining, chattingmessage, hasMore, isScroll, isNew, fetchMessage, createRoom, joinRoom, getRooms, setCreatingState, setJoiningState, getInfo, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};

const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

export { WebSocketProvider, useWebSocket };