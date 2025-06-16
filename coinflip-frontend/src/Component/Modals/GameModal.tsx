import { useState } from "react"
import { FaX, FaMinus, FaPlus, FaCircleExclamation } from "react-icons/fa6"
import { token_list } from "../../config/menu";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { errorAlert } from '../ToastGroup';
import { useWebSocket } from "../../Context/WebSocketProvider";
import { WalletAvatar } from "../Pattern";
import { RPC } from '../../config/constant'
// Address of the deployed program.
const connection = new Connection(RPC);

export const GameModal = (props: { open: boolean, handleModal: any }) => {
    const { createRoom, creating, setCreatingState } = useWebSocket();
    const [step, setStep] = useState(0);
    const wallet = useAnchorWallet();
    const [currentCoin, setCurrentCoin] = useState({
        name: 'Solana',
        unit: 'SOL',
        selected: true,
        mint: "So11111111111111111111111111111111111111112",
        decimal: 9
    });
    const [amount, setAmount] = useState(0);
    const [time, setTime] = useState(new Date());
    const [selection, setSelection] = useState(true);
    const [currencies, setCurrencies] = useState(token_list);
    const selectCoin = (i: number) => {
        let currencies_clone = currencies.slice(0, currencies.length);
        for (let index = 0; index < currencies_clone.length; index++) {
            const element = currencies_clone[index];
            element.selected = false;
        }
        currencies_clone[i].selected = true;
        setCurrencies(currencies_clone);
        setCurrentCoin(currencies_clone[i]);
    }
    const changeAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(Number(e.target.value))
    }
    const handleStep = () => {
        if (step === 0) {
            props.handleModal(false);
        } else {
            setStep(0);
        }
    }
    const handleContinue = async () => {
        if (step === 1) {
            try {
                if (!wallet) {
                    return
                }
                createRoom(
                    currentCoin.unit,
                    currentCoin.mint,
                    currentCoin.decimal,
                    amount,
                    wallet?.publicKey.toBase58(),
                    selection,
                )
                setCreatingState(true);
                // props.handleModal(false);
            } catch (error) {
                console.log(error);
                errorAlert("Error to create game!");
            }
        } else {
            const normalTime = new Date(Date.now());
            console.log(normalTime.toLocaleTimeString());
            setTime(normalTime);
            setStep(1)
        }
    }
    const increase = (val: number) => {
        let number = amount + val;

        if (number >= 0) {
            setAmount(number);
        }
    }

    return <div className={`fixed w-screen h-screen top-0 left-0 backdrop-blur-sm bg-bg-light/50 ${props.open ? "flex" : 'hidden'} flex justify-center hide_scrollbar z-20 `}>
        <div className="w-full h-fit md:w-fit border border-white/10 rounded-2xl relative bg-bg-light flex flex-col shadow-2xl mt-20">
            <div className="bg-bg-light flex items-center justify-between py-[16px] px-[20px] text-xm text-white rounded-t-2xl absolute w-full border border-b-white/10 border-t-0 border-x-0 top-0 left-0 z-20">
                {step === 0 ? "Select Bet" : "Confirm"}
                <FaX className="hover:text-purple cursor-pointer" onClick={() => { props.handleModal(false); setStep(0) }} />
            </div>
            <div className={`h-full flex flex-col ${step === 1?`gap-6 sm:gap-16 mt-16 sm:mt-28`:`gap-6 mt-20`}`}>
                {step === 1 ? <div className="flex flex-col sm:flex-row items-center w-full justify-around text-white px-[14px] py-[18px] gap-4 text-xm ">
                    <div className="flex flex-col items-center gap-3 px-4">
                        {/* <div className={`w-[40px] sm:w-12 h-[40px] sm:h-12 flex items-center justify-center bg-[#b9ccf4] rounded-full relative border-2 ${selection ? "border-green" : "border-purple"}`}>
                            {wallet?.publicKey.toBase58().slice(0, 1)}
                            <img src={`/img/${selection ? "banner_head" : "banner_tail"}.png`} className={`absolute w-6 top-[-4px] right-[-8px]`} alt="" />
                        </div> */}
                        <div className="w-[40px] sm:w-12 h-[40px] sm:h-12 relative">
                            <WalletAvatar walletAddress = {wallet?.publicKey.toBase58() as string} size={"w-12 h-12"} border={true} color={selection ? "border-2 border-green" : "border-2 border-purple"} />
                            <img src={`/img/${selection ? "banner_head" : "banner_tail"}.png`} className={`absolute w-9 top-[-6px] right-[-12px]`} alt="" />
                        </div>
                        <p>{wallet?.publicKey.toBase58().slice(0, 4) + "..." + wallet?.publicKey.toBase58().slice(wallet?.publicKey.toBase58().length - 4, wallet?.publicKey.toBase58().length)}</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1">
                        {/* <img src="/img/banner_head.png" className="w-[100px]" alt="" /> */}
                        <div className="w-[75px] h-[75px] rounded-full border-2 border-dashed border-white bg-white/10 mb-10"></div>
                        <p className="mt-5">Total Pot Value: {currentCoin.unit} {amount}</p>
                        <p className="text-[12px] text-grey">Created {time.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-center gap-3 px-4">
                        <div className={`w-[40px] sm:w-12 h-[40px] sm:h-12 flex items-center justify-center bg-white/10 rounded-full relative border-2 ${!selection ? "border-green" : "border-purple"}`}>
                            <img src={`/img/${!selection ? "banner_head" : "banner_tail"}.png`} className={`absolute w-9 top-[-6px] right-[-12px]`} alt="" />
                        </div>
                        <p>New Player</p>
                    </div>
                </div> :
                    <div className="px-[20px] flex flex-col gap-4">
                        <div className="grid grid-cols-2 text-white gap-3">
                            {currencies.map((val, index) =>
                                <div className="py-3 px-4 sm:px-8 border gap-3 border-white/10 rounded-xl flex flex-col items-center justify-between" key={index + "ap"}>
                                    <img src={`/img/${val.unit}.png`} className="w-12" alt="" />
                                    <div>
                                        <p className="text-center text-sm">{val.name} ({val.unit}) </p>
                                    </div>
                                    <button className={`flex w-full h-7 px-1 text-sm py-[6px] justify-center items-center gap-1 rounded-lg ${val.selected ? "bg-purple/10" : "bg-bg-strong"} hover:bg-purple/10 ${val.selected ? "text-purple" : "text-grey"} hover:text-purple`} onClick={() => selectCoin(index)}>{val.selected ? "Selected" : "Select"}</button>
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-white text-sm">Enter Amount<span className="text-purple">*</span><span className="text-grey">({currentCoin.unit})</span></p>
                            <div className="border border-white/10 rounded-xl p-2 flex justify-between items-center gap-2">
                                <div className="flex p-1 justify-center items-center gap-1 text-grey cursor-pointer hover:text-white" onClick={() => increase(-1)}><FaMinus /></div>
                                <input type="number" name="amount" value={amount} className="bg-bg-light outline-none text-white text-center " id="" min="0" onChange={changeAmount} />
                                <div className="flex p-1 justify-center items-center gap-1 text-grey cursor-pointer hover:text-white" onClick={() => increase(1)}><FaPlus /></div>
                            </div>
                            <p className="text-[12px] text-grey flex items-center gap-1"><FaCircleExclamation /> Please enter your bet amount</p>
                        </div>
                        <div className="grid grid-cols-2 text-white gap-3 text-sm">
                            <div className="py-3 px-8 border gap-3 border-white/10 rounded-xl flex flex-col items-center justify-between">
                                <img src={`/img/head.png`} className="w-12" alt="" />
                                <div>
                                    <p className="text-center">Heads </p>
                                </div>
                                <button className={`flex w-full h-7 px-1 py-[6px] justify-center items-center gap-1 rounded-lg ${selection ? "bg-purple/10" : "bg-bg-strong"} hover:bg-purple/10 ${selection ? "text-purple" : "text-grey"} hover:text-purple`} onClick={() => setSelection(true)}>{selection ? "Selected" : "Select"}</button>
                            </div>
                            <div className="py-3 px-8 border gap-3 border-white/10 rounded-xl flex flex-col items-center justify-between">
                                <img src={`/img/tail.png`} className="w-12" alt="" />
                                <div>
                                    <p className="text-center">Tails </p>
                                </div>
                                <button className={`flex w-full h-7 px-1 py-[6px] justify-center items-center gap-1 rounded-lg ${!selection ? "bg-purple/10" : "bg-bg-strong"} hover:bg-purple/10 ${!selection ? "text-purple" : "text-grey"} hover:text-purple`} onClick={() => setSelection(false)}>{!selection ? "Selected" : "Select"}</button>
                            </div>
                        </div>
                    </div>}
                <div className="w-full flex gap-3 text-grey border border-t-white/10 border-b-0 border-x-0 py-[16px] px-[20px]">
                    <button className="rounded-lg border border-white/10 w-1/2 mx-auto py-2 text-xm text-center hover:border-purple hover:bg-purple hover:text-white transition" onClick={() => { handleStep() }}>{step === 0 ? "Cancel" : "Prev"}</button>
                    <button className="rounded-lg border border-white/10 w-1/2 mx-auto py-2 text-xm text-center hover:border-purple hover:bg-purple hover:text-white transition" onClick={() => handleContinue()}>{step == 1 ? "Create" : "Continue"}</button>
                </div>
            </div>
            {creating? <div className="w-full h-full absolute top-0 left-0 backdrop-blur-sm flex justify-center items-center z-30">
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