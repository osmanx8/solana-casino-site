import { useEffect, useState } from "react"
import { FaX } from "react-icons/fa6"
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { errorAlert, } from '../ToastGroup';
import { useWebSocket } from "../../Context/WebSocketProvider";
import { WalletAvatar } from "../Pattern";
// import ReactConfetti from "react-confetti";

// Address of the deployed program.
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
    _id: String
}
export const JoinModal = (props: { open: boolean, handleModal: any, index: String }) => {
    const { joining, rooms, joinRoom, setJoiningState } = useWebSocket();
    const wallet = useAnchorWallet();
    const [ gameData, setGameData ] = useState<Room>({
        unit: "",
        mint: "", 
        decimal: 1, 
        amount: 0,
        creator: "",
        selection: false,
        finished: false,
        opposite: "",
        gamePDA: "",
        readyToPlay: false,
        createdAt: 0,
        result: false,
        index: 0,
        process: false,
        _id: ""
    })

    useEffect(() => {
        const selectedGame = rooms.find(game => game._id === props.index);
        if (selectedGame) {
            setGameData(selectedGame)
        }
    })

    const handleStep = () => {
        props.handleModal(false);
    }
    const handleJoin = async () => {
        console.log("press join button");
        
        if (wallet) {
            setJoiningState(true);
            joinRoom(gameData?.unit, wallet?.publicKey.toBase58(), gameData?.creator, gameData?.mint, gameData?.index, Number(gameData?.amount));
            // props.handleModal(false);
        } else {
            errorAlert("Please connect wallet!");
        }
    }

    return <div className={`fixed z-20 w-screen h-screen top-0 left-0 backdrop-blur-sm bg-bg-light/50 ${props.open ? "flex" : 'hidden'} flex justify-center hide_scrollbar`}>
        <div className="w-full h-fit md:w-fit border border-white/10 rounded-2xl relative bg-bg-light flex flex-col shadow-2xl mt-20">
            <div className="bg-bg-light flex items-center justify-between py-[16px] px-[20px] text-xm text-white rounded-t-2xl absolute w-full border border-b-white/10 border-t-0 border-x-0 top-0 left-0 z-20">
                <p></p>
                <FaX className="hover:text-purple cursor-pointer" onClick={() => { handleStep() }} />
            </div>
            <div className="h-full flex flex-col gap-6 sm:gap-16 mt-16 sm:mt-28">
                <div className="flex flex-col sm:flex-row items-center w-full justify-around text-white px-[14px] py-[18px] gap-4 text-xm ">
                    <div className="flex flex-col items-center gap-3 px-4">
                        <div className="w-[40px] sm:w-12 h-[40px] sm:h-12 relative">
                            {
                                gameData?.finished && gameData?.result === gameData?.selection?
                                <WalletAvatar walletAddress={gameData?.creator as string} size={"w-12 h-12"} border={true} color={gameData?.selection ? "border-2 border-green" : "border-2 border-purple"} />:
                                <WalletAvatar walletAddress={gameData?.creator as string} size={"w-12 h-12"} border={!gameData?.finished} color={gameData?.selection ? "border-2 border-green" : "border-2 border-purple"} />
                            }
                            <img src={`/img/${gameData?.selection ? "banner_head" : "banner_tail"}.png`} className={`absolute w-9 top-[-6px] right-[-12px]`} alt="" />
                        </div>
                        <p>{gameData?.creator.slice(0, 4) + "..." + gameData?.creator.slice(gameData?.creator.length - 4, gameData?.creator.length)}</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1">
                        {
                            gameData?.finished?
                                <img src={`/img/${gameData?.result ? "banner_head" : "banner_tail"}.png`} className="w-[100px]" alt="" />:
                                gameData.readyToPlay?<div className={`coin w-[75px] h-[75px] flipping`} >
                                    <img src="/img/banner_head.png" className={`coin-face w-[75px]`} alt="" />
                                    <img src="/img/banner_tail.png" className={`coin-back w-[75px]`} alt="" />
                                </div>: 
                                <div className="w-[75px] h-[75px] rounded-full border-2 border-dashed border-white bg-white/10 mb-10"></div>
                        }
                        {gameData?.readyToPlay? <p className="text-purple text-md">{gameData?.finished?"Finished":"Ready Play"}</p>: <></>}
                        <p>Total Pot Value:  {gameData?.amount/Math.pow(10, gameData?.decimal) * 2} {gameData?.unit}</p>
                        <p className="text-[12px] text-grey">Created at {(new Date((gameData?.createdAt as number) * 1000)).toLocaleString()}</p>
                        <p className="text-[12px] text-grey">{gameData?._id}</p>
                    </div>
                    <div className="flex flex-col items-center gap-3 px-4">
                        {gameData?.opposite === ''? <div className={`w-[40px] sm:w-12 h-[40px] sm:h-12 flex items-center justify-center bg-white/10 rounded-full relative border-2 ${!gameData?.selection ? "border-green" : "border-purple"}`}>
                            <img src={`/img/${!gameData?.selection ? "banner_head" : "banner_tail"}.png`} className={`absolute w-9 top-[-6px] right-[-12px]`} alt="" />
                        </div>:
                        <div className={`w-[40px] sm:w-12 h-[40px] sm:h-12 relative`}>
                            {
                                gameData?.finished && gameData?.result !== gameData?.selection?
                                <WalletAvatar walletAddress={gameData?.opposite} size={"w-12 h-12"} border={true} color={!gameData?.selection ? "border-2 border-green" : "border-2 border-purple"} />:
                                <WalletAvatar walletAddress={gameData?.opposite} size={"w-12 h-12"} border={!gameData?.finished} color={!gameData?.selection ? "border-2 border-green" : "border-2 border-purple"} />
                            }

                            <img src={`/img/${!gameData?.selection ? "banner_head" : "banner_tail"}.png`} className={`absolute w-9 top-[-6px] right-[-12px]`} alt="" />
                        </div>}
                        <p>{gameData?.opposite === ""?"New Player": gameData?.opposite?.slice(0, 4) + "..." + gameData?.opposite?.slice(gameData?.opposite?.length - 4, gameData?.opposite?.length)}</p>
                    </div>
                </div>
                <div className="w-full flex justify-end gap-3 text-grey border border-t-white/10 border-b-0 border-x-0 py-[16px] px-[20px]">
                    <button className={`rounded-lg border border-white/10 ${gameData?.readyToPlay || gameData?.creator === wallet?.publicKey.toBase58() || gameData.process || gameData.finished?'w-full':'w-1/2'} mx-auto py-2 text-xm text-center hover:border-purple hover:bg-purple hover:text-white transition`} onClick={() => { handleStep() }}>Close</button>
                    { !gameData?.readyToPlay && wallet?.publicKey.toBase58() !== gameData?.creator && !gameData.process && !gameData.finished? <button className="rounded-lg border border-white/10 w-1/2 mx-auto py-2 text-xm text-center hover:border-purple hover:bg-purple hover:text-white transition" onClick={() => handleJoin()}>Join</button>: <></> }
                </div>
            </div>
            {joining? <div className="w-full h-full absolute top-0 left-0 backdrop-blur-sm flex justify-center items-center z-30">
                {/* <ClipLoader
                    color="#fff"
                    loading = {true}
                    size={100}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                /> */}
            </div>: <></>}

        </div>
    </div>
}