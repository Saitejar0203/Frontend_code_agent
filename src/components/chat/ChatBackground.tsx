import React from 'react';

const ChatBackground: React.FC = () => {
  return (
    <>
      {/* Dynamic background elements - fixed positioning to prevent layout shifts */}
      <div className="ambient-glow fixed inset-0 pointer-events-none z-0"></div>
      <div className="atmospheric-layer fixed inset-0 pointer-events-none z-0"></div>
      <div className="depth-layer-1 fixed inset-0 pointer-events-none z-0"></div>
      <div className="depth-layer-2 fixed inset-0 pointer-events-none z-0"></div>
      <div className="bg-blob-1 fixed inset-0 pointer-events-none z-0"></div>
      <div className="bg-blob-2 fixed inset-0 pointer-events-none z-0"></div>
      <div className="bg-blob-3 fixed inset-0 pointer-events-none z-0"></div>
      <div className="bg-blob-4 fixed inset-0 pointer-events-none z-0"></div>
      <div className="bg-blob-5 fixed inset-0 pointer-events-none z-0"></div>
      <div className="bg-particle-1 fixed inset-0 pointer-events-none z-0"></div>
      <div className="bg-particle-2 fixed inset-0 pointer-events-none z-0"></div>
      <div className="bg-particle-3 fixed inset-0 pointer-events-none z-0"></div>
      <div className="shimmer-overlay fixed inset-0 pointer-events-none z-0"></div>
    </>
  );
};

export default ChatBackground;