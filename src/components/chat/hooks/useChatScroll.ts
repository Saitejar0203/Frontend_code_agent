import React, { useRef, useLayoutEffect } from 'react';
import { ChatSession } from '../types';

export const useChatScroll = (currentSession: ChatSession | undefined, isGenerating: boolean) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const executionFlowRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const messagesContainer = messagesEndRef.current.closest('.overflow-y-auto');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  };

  const scrollToLatestExecutionFlow = () => {
    console.log('🔄 scrollToLatestExecutionFlow called');
    
    // Find the messages container
    const messagesContainer = document.querySelector('.overflow-y-auto.min-h-0');
    if (!messagesContainer) {
      console.log('❌ messagesContainer not found');
      return;
    }
    
    // Get header height - use more reliable selectors that match the actual header structure
    const header = document.querySelector('.content-layer > div:first-child') || // Direct child approach
                 document.querySelector('div[class*="min-h-[70px]"]') ||        // Min height approach
                 document.querySelector('div[class*="min-h-[80px]"]') ||
                 document.querySelector('.flex.items-center.justify-between[class*="border-b"]');
    
    let headerHeight = 80; // Default fallback
    if (header) {
      headerHeight = header.getBoundingClientRect().height;
      console.log('✅ Found header element, actual height:', headerHeight);
    } else {
      const isMobile = window.innerWidth < 768;
      headerHeight = isMobile ? 70 : 80;
      console.log('⚠️ Header element not found, using fallback height:', headerHeight);
    }
    
    console.log('📏 headerHeight:', headerHeight);
    
    // Find the latest execution flow element
    let executionFlowElement = null;
    
    // Try using the ref first
    if (executionFlowRef.current) {
      executionFlowElement = executionFlowRef.current;
      console.log('✅ Found execution flow via ref');
    } else {
      // Fallback: find the last execution flow in the DOM
      const allExecutionFlows = messagesContainer.querySelectorAll('.bg-gradient-to-r');
      if (allExecutionFlows.length > 0) {
        executionFlowElement = allExecutionFlows[allExecutionFlows.length - 1];
        console.log('✅ Found execution flow via DOM query');
      }
    }
    
    if (!executionFlowElement) {
      console.log('❌ No execution flow element found');
      return;
    }
    
    // Calculate scroll position to place execution flow just below header
    const elementRect = executionFlowElement.getBoundingClientRect();
    const containerRect = messagesContainer.getBoundingClientRect();
    
    // Calculate the element's current position within the scrollable container
    const elementOffsetInContainer = messagesContainer.scrollTop + elementRect.top - containerRect.top;
    
    // Target scroll position: element position minus header height minus small offset
    const targetScrollTop = elementOffsetInContainer - headerHeight - 20;
    
    console.log('📐 elementRect:', elementRect);
    console.log('📐 containerRect:', containerRect);
    console.log('📜 current scrollTop:', messagesContainer.scrollTop);
    console.log('🎯 elementOffsetInContainer:', elementOffsetInContainer);
    console.log('🎯 targetScrollTop:', targetScrollTop);
    
    // Scroll to position the execution flow below the header
    messagesContainer.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });
    
    console.log('✅ Scrolled to execution flow, final position:', Math.max(0, targetScrollTop));
  };

  // Add useLayoutEffect for execution flow scrolling
  useLayoutEffect(() => {
    // Only scroll when there's a new execution flow appearing
    if (currentSession?.messages.length > 0) {
      const lastMessage = currentSession.messages[currentSession.messages.length - 1];
      if (lastMessage.sender === 'agent' && lastMessage.debugLogs && lastMessage.debugLogs.length > 0) {
        // Use multiple timeouts to ensure reliable scrolling
        const timer1 = setTimeout(() => {
          scrollToLatestExecutionFlow();
        }, 100);
        const timer2 = setTimeout(() => {
          scrollToLatestExecutionFlow();
        }, 300);
        const timer3 = setTimeout(() => {
          scrollToLatestExecutionFlow();
        }, 500);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);
        };
      }
    }
  }, [currentSession?.messages]);

  // Additional effect to handle execution flow updates during generation
  useLayoutEffect(() => {
    if (currentSession?.messages.length > 0 && isGenerating) {
      const lastMessage = currentSession.messages[currentSession.messages.length - 1];
      if (lastMessage.sender === 'agent' && lastMessage.debugLogs && lastMessage.debugLogs.length > 0) {
        // Scroll when new debug logs appear during generation
        const timer = setTimeout(() => {
          scrollToLatestExecutionFlow();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [currentSession?.messages.map(m => m.debugLogs?.length).join(','), isGenerating]);

  return {
    messagesEndRef,
    executionFlowRef,
    scrollToBottom,
    scrollToLatestExecutionFlow
  };
};

export default useChatScroll;