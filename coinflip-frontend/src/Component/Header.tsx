import { useState, useEffect } from 'react';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { FaHouse, FaX, FaCrown, FaClock, FaFileCircleQuestion, FaBars } from 'react-icons/fa6'
import { Link } from 'react-router-dom';
import {
	WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { GiTwoCoins } from "react-icons/gi";
import { WalletAvatar } from './Pattern';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { RPC } from '../config/constant'

export const Header = () => {
    const [openModal, setModal] = useState(false);
    const [solBalance, setSolBalance] = useState(0);

    const wallet = useAnchorWallet();
    const { publicKey } = useWallet()
    const linkList = [
        { icon: <FaHouse  className="group-hover:text-purple transition" />, name: 'Home', url: ''},
        { icon: <GiTwoCoins  className="group-hover:text-purple transition" />, name: 'Coin Flip', url: '/'},
        { icon: <FaCrown  className="group-hover:text-purple transition" />, name: 'Jackpot', url: '/jackpotcomingsoon'},
        { icon: <FaClock  className="group-hover:text-purple transition" />, name: 'History', url: '/historycomingsoon'},
        { icon: <FaFileCircleQuestion   className="group-hover:text-purple transition" />, name: 'How It Works', url: 'https://docs.flip.is/'},
    ]
    useEffect(() => {
        const connection = new Connection(RPC);
        
        if (!publicKey)  {
            setSolBalance(0);
            return
        } 
            
        (async() => {
            const balance = await connection.getBalance(publicKey);
            setSolBalance(balance/1e9);
        })()
       
    }, [publicKey]);
    return <div className='px-3 md:px-4 xl:px-9 py-3 bg-bg-strong flex justify-between items-center border border-b-white/10 border-t-0 border-x-0 fixed top-0 left-0 z-30 w-full'>
        <div className='flex justify-between'>
            {/* <img src="/img/logo.png" alt="" className="w-32 sm:w-40 mr-2 lg:mr-5" /> */}
            <p className="Geo text-white text-lg leading-10 mr-2">flip.is</p>
            <div className="hidden lg:flex">
                {
                    linkList.map((val, index) => 
                        <Link className="flex gap-1 lg:gap-2 text-white text-xm items-center px-2 xl:px-4 py-2 rounded-md hover:bg-bg-light cursor-pointer group" key={index} to={val.url} target={index === linkList.length - 1? "_blank":"_self"}>
                            {val.icon}
                            {val.name}
                        </Link>
                    )
                }
            </div>
        </div>
        <div className="flex gap-1 items-center">
            {/* <div className="p-2 sm:p-3 bg-bg-light rounded-md text-grey cursor-pointer hover:text-white">
                <FaSistrix/>
            </div>
            <div className="p-2 sm:p-3 bg-bg-light rounded-md text-grey cursor-pointer hover:text-white relative">
                <FaBell/>
                <div className="w-2 h-2 rounded-full bg-[#E93544] absolute border-2 border-bg-light top-2 sm:top-[11px] right-2 sm:right-[11px]"></div>
            </div> */}
            <p className="text-md text-white px-3 py-1 border rounded-xl border-purple Geo">Balance: {solBalance.toFixed(2)} SOL</p>
            <div className="lg:hidden flex p-2 sm:p-3 bg-bg-light rounded-md text-grey cursor-pointer hover:text-white" onClick={() => setModal(true)}>
                <FaBars/>
            </div>
            <div className="hidden lg:flex text-white text-xm items-center justify-start rounded-full border border-[#888] bg-bg-light cursor-pointer ml-3 gap-2 py-[1px] pl-[1px] pr-3">
                {/* <div className="py-2 px-[15px] bg-[#b9ccf4] rounded-full">{ wallet?.publicKey.toBase58().slice(0, 1) || "S"}</div> */}
                <WalletAvatar walletAddress={wallet?.publicKey.toBase58() as string} size={"w-8 h-8"} border={false} color={""} />
                    {/* {connected ? `${publicKey?.toString()}` : 'Connect Wallet'} */}
                <WalletMultiButton className="bg-none Geo" style={{background: "transparent", padding: "0", lineHeight: "0", height: "100%", fontSize: "14px"}}/>
                {/* <FaCaretDown/> */}
            </div>
        </div>
        {openModal?<div className="fixed w-full sm:w-1/2 h-screen right-0 bg-bg-strong top-0 z-10 flex lg:hidden flex-col items-start gap-2 py-6 px-4 text-sm text-grey">
            <div className="w-full px-2 sm:px-4 py-3 ">
                <FaX className="float-right hover:text-white cursor-pointer" onClick={() => setModal(false)}/>
            </div>
            {
                linkList.map((val, index) => 
                    <div className="flex w-full items-center gap-3 cursor-pointer hover:text-white hover:bg-bg-light px-4 py-3 transition rounded-xl" key={index + 'menubar'}>
                        {val.icon}
                        {val.name}
                    </div>
                )
            }

            <div className="w-full border border-b-white/10 border-t-0 border-x-0"></div>
            <div className="flex text-white text-xm items-center justify-between rounded-full border border-[#888] bg-bg-light cursor-pointer gap-2 px-3 py-1 ml-3 mt-3">
                <WalletMultiButton className="bg-none" style={{background: "transparent", padding: "0", lineHeight: "0", height: "100%", fontSize: "14px", width: "100%"}}/>
            </div>
        </div>:""}
    </div>
}