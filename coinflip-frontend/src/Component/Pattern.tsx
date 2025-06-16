// import React, { useState, useEffect } from 'react';

// // Function to generate GitHub style pattern based on wallet address
// const generateGithubStyle = (walletAddress: string) => {
//   // Create a hash from the wallet address
//   const hash = Array.from(walletAddress).reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0);
  
//   // Generate color using the hash
//   const hue = Math.abs(hash) % 360; // Get a unique hue
//   const color = `hsl(${hue}, 65%, 55%)`; // Use HSL for color based on the hash

//   // 5x5 grid (25 squares)
//   const pixelSize = 16;  // Size of each pixel
//   const gridSize = 5;    // 5x5 grid
//   const borderSize = 2;  // Border around the grid

//   // Total size of the avatar
//   const totalSize = (pixelSize * gridSize) + (borderSize * 2);

//   const squares: JSX.Element[] = [];

//   // Loop through each grid square (25 squares for a 5x5 grid)
//   for (let i = 0; i < 25; i++) {
//     const row = Math.floor(i / gridSize);
//     const col = i % gridSize;
    
//     // Determine whether to fill this square based on the hash (1 or 0)
//     const shouldFill = ((hash >> i) & 1) === 1;

//     if (shouldFill) {
//       squares.push(
//         <rect
//           key={i}
//           x={borderSize + col * pixelSize}
//           y={borderSize + row * pixelSize}
//           width={pixelSize}
//           height={pixelSize}
//           fill={color} // Use the generated color
//         />
//       );
//     }
//   }

//   return { squares, totalSize };
// };

// interface WalletAvatarProps {
//   walletAddress: String;
//   size: String,
//   border: Boolean,
//   color: String
// }

// export const WalletAvatar: React.FC<WalletAvatarProps> = ({ walletAddress, size, border, color }) => {
//   const [squares, setSquares] = useState<JSX.Element[]>([]);
//   const [totalSize, setTotalSize] = useState<number>(0);

//   useEffect(() => {
//     if (walletAddress) {
//       const { squares, totalSize } = generateGithubStyle(walletAddress as string);
//       setSquares(squares);
//       setTotalSize(totalSize);
//     }
//   }, [walletAddress]);

//   return (
//     <div
//       className={`${size} flex items-center justify-center rounded-full relative overflow-hidden ${border ? `border-2 ${color}` : ''}`}
//     >
//       <svg viewBox={`0 0 ${totalSize} ${totalSize}`} className="w-full h-full">
//         <rect width={totalSize} height={totalSize} fill="white" />
//         <g>{squares}</g>
//       </svg>
//     </div>
//   );
// };

import React, { useEffect } from 'react';

// Keep the original interface structure
interface WalletAvatarProps {
  walletAddress: String;
  size: String;
  border: Boolean;
  color: String;
}

// Function to generate GitHub style pattern based on wallet address
const generateGithubStyle = (walletAddress: string) => {
  if (!walletAddress) {
    return { color: '#ccc', pattern: [] }; // Default color and empty pattern
  }
  // Create a hash from the wallet address
  const hash = Array.from(walletAddress).reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0);
  
  // Generate vibrant color using the hash
  const colorRanges = [
    [280, 320], // Vibrant purples
    [180, 220], // Cyan/Turquoise
    [20, 50],   // Warm oranges
    [130, 160], // Emerald greens
    [340, 360], // Hot pinks
    [200, 240]  // Ocean blues
  ];
  
  // Select and generate color
  const rangeIndex = Math.abs(hash) % colorRanges.length;
  const [min, max] = colorRanges[rangeIndex];
  const hue = min + (Math.abs(hash) % (max - min));
  const color = `hsl(${hue}, 80%, 60%)`;

  // Generate pattern bits
  const pattern: [number, number][] = [];
  // We only generate half the pattern and mirror it
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 3; j++) {
      if (((hash >> (i * 3 + j)) & 1) === 1) {
        // Add left side
        pattern.push([i, j]);
        // Mirror right side (skip middle column)
        if (j < 2) {
          pattern.push([i, 4 - j]);
        }
      }
    }
  }

  return { color, pattern };
};

export const WalletAvatar: React.FC<WalletAvatarProps> = ({ walletAddress, size, border, color }) => {
  // Generate the pattern immediately (no need for useState/useEffect)

  const { color: bgColor, pattern } = generateGithubStyle(walletAddress as string);
  
  // Create a path string for all squares
  const paths = pattern.map(([i, j]) => (
    `M${j} ${i}h1v1h-1z`
  )).join(' ');

  return (
    <div
      className={`${size} flex items-center rounded-full justify-center relative overflow-hidden ${border ? `border-2 ${color}` : ''}`}
    >
      <svg 
        viewBox="0 0 5 5" 
        className="w-full h-full" 
        style={{ 
          background: bgColor,
          shapeRendering: 'crispEdges',
          // pathRendering: 'crispEdges'
        }}
      >
        <path 
          d={paths} 
          fill="white" 
          style={{ 
            shapeRendering: 'crispEdges'
          }}
        />
      </svg>
    </div>
  );
};