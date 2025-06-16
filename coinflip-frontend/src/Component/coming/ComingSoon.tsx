import React from "react";
import { useLocation } from "react-router-dom";

export const JackPotComingSoon = () => {
    const location = useLocation();
    const { title, message } = location.state || {};
    
    return <div className='px-3 md:px-4 xl:px-9 py-3 md:py-6 bg-bg-light flex justify-center items-center gap-3 mt-[60px] h-full md:h-[calc(100vh-60px)] overflow-auto'>
        <div className="flex flex-col text-white items-center gap-4">
            <img src="/img/coming.png" alt="" className="w-36"/>
            
            <p className="text-center text-sm text-grey"><span className="text-center text-md text-white">This feature is under development</span> <br/>Soon, you’ll be able to participate in high-stakes games and win big! <br/>
            🌟 Stay tuned! This exciting feature will be available soon at flip.is.</p>
            
        </div>
    </div>
}


export const HistoryComingSoon = () => {
    const location = useLocation();
    const { title, message } = location.state || {};
    
    return <div className='px-3 md:px-4 xl:px-9 py-3 md:py-6 bg-bg-light flex justify-center items-center gap-3 mt-[60px] h-full md:h-[calc(100vh-60px)] overflow-auto'>
        <div className="flex flex-col text-white items-center gap-4">
            <img src="/img/coming.png" alt="" className="w-36"/>
            
            <p className="text-center text-sm text-grey"><span className="text-center text-md text-white">The History feature is coming soon</span> <br/>You'll soon be able to view detailed logs of your past games and outcomes! <br/>
            🌟 Stay tuned! This exciting feature will be available soon at flip.is.</p>
            
        </div>
    </div>
}