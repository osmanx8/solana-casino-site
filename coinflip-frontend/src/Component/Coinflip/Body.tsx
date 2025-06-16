import { useState, useEffect, ChangeEvent, useRef, useSyncExternalStore } from "react"
import { GameModal } from "../Modals/GameModal"
import { useWallet } from "@solana/wallet-adapter-react"
import { errorAlert } from '../ToastGroup';
import { useWebSocket } from "../../Context/WebSocketProvider";
import { JoinModal } from "../Modals/JoinModal";
import { WalletAvatar } from "../Pattern";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { FaPaperPlane, FaFaceLaugh } from "react-icons/fa6";
import TextareaAutosize from "react-textarea-autosize";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { ClipLoader } from "react-spinners";
import { MESSAGES_PER_PAGE, RPC } from "../../config/constant";
import ConfettiExplosion from 'react-confetti-explosion';
import { useEffectContext } from "../../Context/ReactEffectProvider";

export const Body = () => {

    const [createModal, handleModal] = useState(false);
    const [joinModal, handleJoin] = useState(false);
    const [solBalance, setSolBalance] = useState(2);
    const [pendingCount, setPendingCount] = useState(3);
    const [dataIndex, setDataIndex] = useState<String>('');
    const [text, setText] = useState("");
    const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
    const [pending, setPending] = useState(false);
    const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const { connected, publicKey } = useWallet();
    const { fetchMessage, rooms, hasMore, setCreatingState, isNew, isScroll, porfolioInfo, chattingmessage, sendMessage } = useWebSocket();
    const { confetti, setConfetti } = useEffectContext()

    const messageRef = useRef<HTMLDivElement | null>(null);
    const emojiModalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);
    useEffect(() => {
        if (isEmojiPickerVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        // Clean up event listener on unmount or when modal closes
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEmojiPickerVisible]);

    useEffect(() => {
        const connection = new Connection(RPC);
        if (!publicKey) return

        (async () => {
            const balance = await connection.getBalance(publicKey);
            setSolBalance(balance / 1e9);
        })()

    }, [publicKey]);

    useEffect(() => {
        pageMessage(page)
    }, [page])

    useEffect(() => {
        if (isScroll) {
            if (messageRef.current && chattingmessage.length % MESSAGES_PER_PAGE === 0) {
                messageRef.current.scrollTop = 100;
            }
        } else {
            if (chattingmessage.length > 0 && chattingmessage[chattingmessage.length - 1].wallet === publicKey?.toBase58() || !isNew) {
                scrollToElement();
            }
        }

    }, [chattingmessage])
    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
        if (event.target.value.length < 75) {
            setText(event.target.value);
        }
    }
    const toggleEmojiPicker = () => {
        setIsEmojiPickerVisible((prevState) => !prevState);
    };

    const handleMouseMove = (event: MouseEvent) => {
        setCursorPosition({
            x: event.clientX,
            y: event.clientY,
        });
    };
    const handleClickOutside = (event: MouseEvent) => {
        if (emojiModalRef.current && !emojiModalRef.current.contains(event.target as Node)) {
            setIsEmojiPickerVisible(false); // Close the emoji picker if clicked outside
        }
    };
    const handleEmojiSelect = (emojiObject: EmojiClickData, e: MouseEvent) => {
        if (inputRef.current) {
            const cursorPos = inputRef.current.selectionStart;
            const emoji = emojiObject.emoji;

            // Insert the emoji at the cursor position
            const currentValue = inputRef.current.value;
            if (currentValue.length < 75) {
                const newValue = currentValue.slice(0, cursorPos) + emoji + currentValue.slice(cursorPos);
                console.log("new", newValue);

                inputRef.current.value = newValue; // Update textarea value
                setText(inputRef.current.value);
                setIsEmojiPickerVisible(false); // Close the emoji picker
            }
        }
        setIsEmojiPickerVisible(false); // Close the picker after selecting an emoji
    };
    const scrollToElement = () => {

        const element = document.getElementsByClassName("msg");
        if (element.length) {
            element[element.length - 1].scrollIntoView({
                behavior: 'smooth',  // Smooth scrolling
                block: 'start',      // Align the element at the top of the container
            });
        }
    };

    const handleScroll = () => {
        if (messageRef.current?.scrollTop === 0 && !loading) {
            if (hasMore) {
                setPage((prevPage) => prevPage + 1);
            }
        }
    };
    const waitAndCount = async (ms: number) => {
        return new Promise<void>((resolve) => {
            let count = 2;
            const interval = setInterval(() => {

                setPendingCount(count)
                count--;

                if (count < 0) {
                    setPending(false);
                    setPendingCount(3);
                    clearInterval(interval);
                    resolve(); // Resolve the promise after counting to 3
                }
            }, ms / 3); // Divide the wait time into 3 intervals
        });
    };
    const pageMessage = (page: number) => {
        if (loading) return;
        setLoading(true);
        fetchMessage(page);
        setLoading(false);
    }

    const submit = async () => {
        try {
            if (text !== "" && !pending) {
                if (!publicKey) {
                    return
                }
                let message = {
                    wallet: publicKey?.toBase58(),
                    message: text
                }
                sendMessage(message.wallet, message.message);
                setText("")
                setPending(true);
                await waitAndCount(3000);
            }
        } catch (error) {
            errorAlert("Sending message error!");
        }
    }
    const sendNewMessage = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();

            submit();
        }
    }
    const create_game = () => {
        if (connected) {
            setCreatingState(false);
            handleModal(true);
        } else {
            errorAlert("Please connect wallet!")
        }
    }

    return <div className='px-3 md:px-4 xl:px-9 py-3 md:py-4 bg-bg-light flex flex-col-reverse md:flex-row justify-between gap-3 mt-[60px] h-full md:h-[calc(100vh-60px)] overflow-auto relative'>
        <div className="w-full md:w-[370px] flex flex-col gap-[14px] rounded-2xl h-full">
            <div className="w-full border border-white/10 rounded-2xl relative ">
                <div className="bg-bg-strong flex py-[10px] px-[14px] text-xm text-white rounded-t-2xl absolute w-full border border-b-white/10 border-t-0 border-x-0 top-0 left-0 z-10">My Profile</div>
                <div className="flex flex-col items-center text-white px-[14px] py-[18px] gap-3">
                    <div className="w-16 h-16 relative mt-12">
                        <WalletAvatar walletAddress={publicKey?.toBase58() || ''} size={"w-14 h-14"} border={false} color={''} />
                        <div className="w-5 h-5 rounded-full bg-[#1DAF61] absolute border-4 border-bg-light right-[5px] bottom-[5px]"></div>
                    </div>
                    <div className="text-center">
                        <p className="text-md">{publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(publicKey?.toBase58().length - 4, publicKey?.toBase58().length)}</p>
                        <p className="text-xm text-purple">Balance: {solBalance.toFixed(2)} SOL</p>
                    </div>
                    <div className="flex justify-between w-full gap-2">
                        <div className="w-1/4 border border-white/10 rounded-2xl p-2">
                            <p className="text-[12px] text-grey">Games</p>
                            <p className="text-md text-white">{porfolioInfo.totalGame}</p>
                        </div>
                        <div className="w-1/4 border border-white/10 rounded-2xl p-2">
                            <p className="text-[12px] text-grey">Wins</p>
                            <p className="text-md text-white">{porfolioInfo.wins}</p>
                        </div>
                        <div className="w-1/4 border border-white/10 rounded-2xl p-2">
                            <p className="text-[12px] text-grey">Losses</p>
                            <p className="text-md text-white">{porfolioInfo.totalGame - porfolioInfo.wins}</p>
                        </div>
                        <div className="w-1/4 border border-white/10 rounded-2xl p-2">
                            <p className="text-[12px] text-grey">Win Rate</p>
                            <p className="text-md text-white">{porfolioInfo.totalGame > 0 ? (porfolioInfo.wins / porfolioInfo.totalGame * 100).toFixed(1) : 0}%</p>
                        </div>
                    </div>
                    <button className="rounded-lg border border-purple w-full py-2 text-purple text-xm text-center hover:border-white hover:text-white transition" onClick={() => create_game()}>Create Game</button>
                </div>
            </div>
            <div className="w-full border border-white/10 rounded-2xl relative pb-14 h-screen sm:h-3/5 overflow-hidden">
                <div className="bg-bg-strong flex justify-between py-[10px] px-[14px] text-xm text-white rounded-t-2xl absolute left-0 w-full border border-b-white/10 border-t-0 border-x-0 z-10">
                    <p>Messages</p>
                    {/* <div className="flex text-white/60 gap-2">
                        240
                        <div className="w-5 h-5 rounded-full bg-[#1DAF61] border-4 border-bg-light"></div>
                    </div> */}
                </div>
                <div className="bg-bg-strong gap-3 flex justify-between py-[10px] px-[14px] text-xm text-white rounded-b-2xl absolute left-0 bottom-0 w-full border border-t-white/10 border-b-0 border-x-0 z-10">
                    <TextareaAutosize minRows={1} disabled={pending} placeholder={pending ? pendingCount.toString() : ""} ref={inputRef} maxRows={2} value={text} onChange={handleChange} onKeyDown={sendNewMessage} className="border text-white border-white/10 rounded-md bg-bg-strong outline-none px-3 py-1 w-full resize" />
                    <div className="flex items-center justify-center gap-3">
                        <button className="text-white transition text-md hover:text-purple" onClick={() => toggleEmojiPicker()}><FaFaceLaugh /></button>

                        {isEmojiPickerVisible && (
                            <div className="absolute bottom-0 right-0" ref={emojiModalRef} >
                                <EmojiPicker onEmojiClick={handleEmojiSelect} style={{ width: "100%" }} />
                            </div>
                        )}
                        <button className="text-md text-white transition hover:text-purple" onClick={() => submit()}><FaPaperPlane /></button>
                    </div>
                </div>
                <div className="pt-12 relative h-full">
                    {/* <div className="flex flex-col justify-center items-center gap-2 text-white text-xm absolute top-0 left-0 backdrop-blur-sm bg-bg-light/50 w-full h-full">
                        <img src="/img/watch.png" className="w-10" alt="" />
                        Coming Soon!
                        <p className="text-grey">Live chat feature will coming soon</p>
                    </div> */}
                    <div className="h-full gap-3 overflow-y-auto flex flex-col px-[14px] bg-bg-light chat-container" ref={messageRef} onScroll={handleScroll}>
                        <ClipLoader
                            color="#fff"
                            loading={loading}
                            size={10}
                            aria-label="Loading Spinner"
                            data-testid="loader"
                        />
                        {
                            chattingmessage.map((val, index) =>
                                <div className="px-[14px] py-3 flex items-start gap-3 text-xm w-full bg-bg-strong rounded-xl msg" key={index.toString() + val.wallet} id={index.toString() + val.wallet}>
                                    <WalletAvatar walletAddress={val.wallet} size={"w-7 h-7"} border={false} color={""} />
                                    <div className="w-5/6 md:w-[240px]">
                                        <p className="text-white text-xm break-words"> {val.message?.split('\n').map((line, index) => <span key={index}>{line}<br /></span>)}</p>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
        <div className="w-4/5 border border-white/10 rounded-2xl p-3 hidden lg:block relative">
            <div className="px-3 py-2 bg-bg-strong flex rounded-md text-white text-xm absolute w-[calc(100%-22px)] z-10">
                <div className="w-1/5">Players</div>
                <div className="w-1/5">Bet Item</div>
                <div className="w-1/5">Filp Value</div>
                <div className="w-1/5">Result</div>
                <div className="w-1/5">Action</div>
            </div>
            <div className="flex flex-col text-xm h-full overflow-auto pt-10">
                {
                    rooms.map((val, index) =>
                        <div className={`p-3 flex items-center text-white ${index % 2 === 1 ? 'bg-bg-strong rounded-xl' : ''}`} key={index + 'lblg'}>
                            <div className="flex items-center gap-2 w-1/5">

                                <div className="w-10 h-10 relative">
                                    <WalletAvatar walletAddress={val.creator as string} size={"w-10 h-10"} border={val.selection === val.result} color={val.selection ? "border-2 border-green" : "border-2 border-purple"} />
                                    {val.selection === val.result ? <img src={`/img/${val.selection ? 'banner_head.png' : 'banner_tail.png'}`} className={`absolute w-6 top-[-4px] right-[-8px]`} alt="" /> : ""}
                                </div>
                                vs
                                {val.opposite !== '' ? <div className="w-10 h-10 relative">
                                    <WalletAvatar walletAddress={val.opposite} size={"w-10 h-10"} border={val.selection !== val.result} color={!val.selection ? "border-2 border-green" : "border-2 border-purple"} />
                                    {val.selection !== val.result ? <img src={`/img/${!val.selection ? 'banner_head.png' : 'banner_tail.png'}`} className={`absolute w-6 top-[-4px] right-[-8px]`} alt="" /> : ""}
                                </div> : <div className={`w-10 h-10 flex items-center justify-center bg-white/10 rounded-full relative border-2 border-dotted`}></div>

                                }
                            </div>
                            <div className="w-1/5 text-md font-bold Geo">{val.unit}</div>
                            <div className="w-1/5">{val.amount / Math.pow(10, val.decimal)}</div>

                            <div className="w-1/5 ">
                                {val.finished ?
                                    val.result ?
                                        <img src="/img/head.png" className="w-10" alt="" /> :
                                        <img src="/img/tail.png" className="w-10" alt="" /> :
                                    val.readyToPlay ?
                                        <div className={`coin w-10 h-10 flipping`} >
                                            <img src="/img/head.png" className={`coin-face w-10`} alt="" />
                                            <img src="/img/tail.png" className={`coin-back w-10`} alt="" />
                                        </div> :
                                        <div className={`w-10 h-10 flex items-center justify-center bg-white/10 rounded-full relative border-2 border-dotted`}></div>
                                }
                            </div>

                            <div className="w-1/5">
                                {
                                    val.readyToPlay || val.finished ? <button className="rounded-lg border border-purple  w-1/2 mx-auto py-2 text-white text-xm text-center hover:border-white hover:text-white transition" onClick={() => { handleJoin(true); setDataIndex(val._id) }}>{val.finished ? "Finished" : "Ready"}</button> : val.process || val.err ? <button className={`rounded-lg border border-purple  w-1/2 mx-auto py-2  text-xm text-center  ${val.err ? `text-[#EB475D]` : `text-white hover:border-white hover:text-white`} transition`}>{val.err ? `Failed` : `Processing...`}</button> : publicKey?.toBase58() !== val.creator && val.opposite === '' ? <button className={`rounded-lg border border-purple w-1/2 mx-auto py-2 text-xm text-center bg-purple hover:bg-bg-light text-white transition`} onClick={() => { handleJoin(true); setDataIndex(val._id) }}>Join</button> : <button className="rounded-lg border border-purple  w-1/2 mx-auto py-2 text-white text-xm text-center hover:border-white hover:text-white transition" onClick={() => { handleJoin(true); setDataIndex(val._id) }}>View</button>
                                }
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
        <div className="w-full md:w-4/5 flex lg:hidden flex-col text-white gap-3 h-max-screen hide_scrollbar">
            {
                rooms.map((val, index) =>
                    <div className="border border-white/10 flex flex-col rounded-2xl px-6 py-[14px] gap-6" key={index + 'lb'}>
                        <div className="flex items-center w-full">
                            <div className="flex items-center gap-2 w-1/2">
                                <div className="w-10 h-10 relative">
                                    <WalletAvatar walletAddress={val.creator as string} size={"w-10 h-10"} border={val.selection === val.result} color={'border-2 border-green'} />
                                    {val.selection === val.result ? <img src={`/img/${val.selection ? 'banner_head.png' : 'banner_tail.png'}`} className={`absolute w-6 top-[-4px] right-[-8px]`} alt="" /> : ""}
                                </div>
                                vs
                                {val.opposite !== '' ? <div className="w-10 h-10 relative">
                                    <WalletAvatar walletAddress={val.opposite} size={"w-10 h-10"} border={val.selection !== val.result} color={'border-2 border-green'} />
                                    {val.selection !== val.result ? <img src={`/img/${!val.selection ? 'banner_head.png' : 'banner_tail.png'}`} className={`absolute w-6 top-[-4px] right-[-8px]`} alt="" /> : ""}
                                </div> : <div className={`w-10 h-10 flex items-center justify-center bg-white/10 rounded-full relative border-2 border-dotted`}></div>
                                }
                            </div>
                            <div className="w-1/2 flex justify-between items-center">
                                <div className="">
                                    <p className="text-sm">{val.unit}</p>
                                    <p className="text-[12px] text-grey">{val.amount / Math.pow(10, val.decimal)}</p>
                                </div>
                                {val.finished ?
                                    val.result ?
                                        <img src="/img/head.png" className="w-10" alt="" /> :
                                        <img src="/img/tail.png" className="w-10" alt="" /> :
                                    val.readyToPlay ?
                                        <div className={`coin w-10 h-10 flipping`} >
                                            <img src="/img/head.png" className={`coin-face w-10`} alt="" />
                                            <img src="/img/tail.png" className={`coin-back w-10`} alt="" />
                                        </div> :
                                        <div className={`w-10 h-10 flex items-center justify-center bg-white/10 rounded-full relative border-2 border-dotted`}></div>
                                }
                            </div>
                        </div>
                        {val.readyToPlay ? <button className="rounded-lg border border-purple  w-full mx-auto py-2 text-center text-xm text-white hover:border-white hover:text-white transition" onClick={() => { handleJoin(true); setDataIndex(val._id) }}>{val.finished ? "Finished" : "Ready"}</button> : val.process || val.err ? <button className={`rounded-lg border border-purple  w-full mx-auto py-2 text-xm text-center ${val.err ? `text-[#EB475D]` : `text-white hover:border-white hover:text-white`} transition`} >{val.err ? `Failed` : `Processing...`}</button> :
                            publicKey?.toBase58() == val.creator || val.opposite === '' ? <button className="rounded-lg border border-purple w-full mx-auto py-2 text-purple text-xm text-center hover:border-white hover:text-white transition" onClick={() => { handleJoin(true); setDataIndex(val._id) }}>Join</button> : <button className={`rounded-lg border border-purple w-full mx-auto py-2 text-xm text-center bg-purple hover:bg-bg-light text-white transition`} onClick={() => { handleJoin(true); setDataIndex(val._id) }} >View</button>}
                    </div>
                )
            }
        </div>
        {confetti && <ConfettiExplosion force={0.8} duration={3000} particleCount={250} style={{ position: 'absolute', left: '50%', top: '0' }} onComplete={() => setConfetti(false)} zIndex={30} />}
        <GameModal open={createModal} handleModal={handleModal} />
        <JoinModal open={joinModal} handleModal={handleJoin} index={dataIndex} />
    </div>
}