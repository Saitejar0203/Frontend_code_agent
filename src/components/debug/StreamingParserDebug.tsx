import React, { useState, useRef, useCallback } from 'react';
import { StreamingMessageParser } from '@/lib/runtime/StreamingMessageParser';
import type { ParserCallbacks } from '@/lib/runtime/StreamingMessageParser';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Play, Trash2, Copy } from 'lucide-react';

interface CallbackEvent {
  id: string;
  timestamp: number;
  type: 'onText' | 'onArtifactOpen' | 'onArtifactClose' | 'onActionOpen' | 'onActionClose';
  data: any;
}

const StreamingParserDebug: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [events, setEvents] = useState<CallbackEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const parserRef = useRef<StreamingMessageParser | null>(null);
  const messageIdRef = useRef<string>('');

  // Initialize parser with debug callbacks
  const initializeParser = useCallback(() => {
    const callbacks: ParserCallbacks = {
      onText: (text: string) => {
        const event: CallbackEvent = {
          id: Date.now().toString() + Math.random(),
          timestamp: Date.now(),
          type: 'onText',
          data: { text }
        };
        setEvents(prev => [...prev, event]);
      },
      onArtifactOpen: (data: any) => {
        const event: CallbackEvent = {
          id: Date.now().toString() + Math.random(),
          timestamp: Date.now(),
          type: 'onArtifactOpen',
          data
        };
        setEvents(prev => [...prev, event]);
      },
      onArtifactClose: (data: any) => {
        const event: CallbackEvent = {
          id: Date.now().toString() + Math.random(),
          timestamp: Date.now(),
          type: 'onArtifactClose',
          data
        };
        setEvents(prev => [...prev, event]);
      },
      onActionOpen: (data: any) => {
        const event: CallbackEvent = {
          id: Date.now().toString() + Math.random(),
          timestamp: Date.now(),
          type: 'onActionOpen',
          data
        };
        setEvents(prev => [...prev, event]);
      },
      onActionClose: (data: any) => {
        const event: CallbackEvent = {
          id: Date.now().toString() + Math.random(),
          timestamp: Date.now(),
          type: 'onActionClose',
          data
        };
        setEvents(prev => [...prev, event]);
      }
    };

    parserRef.current = new StreamingMessageParser(callbacks);
    messageIdRef.current = `debug-message-${Date.now()}`;
  }, []);

  // Process input text through parser
  const processInput = useCallback(async () => {
    if (!inputText.trim() || !parserRef.current) return;

    setIsProcessing(true);
    setEvents([]); // Clear previous events
    
    // Reset parser state before processing
    parserRef.current.reset();

    try {
      // Simulate streaming by processing input in chunks
      // Use word-based chunks to ensure tags remain intact
      const words = inputText.split(/\s+/);
      let accumulatedContent = '';

      for (let i = 0; i < words.length; i++) {
        accumulatedContent += (i > 0 ? ' ' : '') + words[i];
        parserRef.current.parse(messageIdRef.current, accumulatedContent);
        
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error('Parser error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [inputText]);

  // Clear events
  const clearEvents = useCallback(() => {
    setEvents([]);
    if (parserRef.current) {
      parserRef.current.reset();
    }
  }, []);

  // Copy event data to clipboard
  const copyEventData = useCallback((event: CallbackEvent) => {
    const eventData = {
      type: event.type,
      timestamp: new Date(event.timestamp).toISOString(),
      data: event.data
    };
    navigator.clipboard.writeText(JSON.stringify(eventData, null, 2));
  }, []);

  // Initialize parser on mount
  React.useEffect(() => {
    initializeParser();
  }, [initializeParser]);

  // Sample test data
  const sampleData = {
    simpleText: 'Hello world! This is a simple text response.',
    fileCreation: `I'll create a React component for you.

<boltArtifact id="react-component" title="React Component">
<boltAction type="file" filePath="components/Button.tsx">
import React from 'react';

const Button = ({ children, onClick }) => {
  return (
    <button onClick={onClick} className="btn">
      {children}
    </button>
  );
};

export default Button;
</boltAction>
</boltArtifact>

Component created successfully!`,
    shellCommand: `Installing dependencies...

<boltAction type="shell">npm install react react-dom</boltAction>

Dependencies installed successfully!`,
    mixedContent: `I'll create a complete React project for you.

<boltArtifact id="react-project" title="React Project Setup">
First, let me create the package.json:

<boltAction type="file" filePath="package.json">{
  "name": "my-react-app",
  "version": "1.0.0"
}</boltAction>

Now installing dependencies:

<boltAction type="shell">npm install</boltAction>

Creating the main component:

<boltAction type="file" filePath="src/App.tsx">import React from 'react';

function App() {
  return <h1>Hello World!</h1>;
}

export default App;</boltAction>
</boltArtifact>

Project setup complete!`
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'onText': return 'bg-blue-100 text-blue-800';
      case 'onArtifactOpen': return 'bg-green-100 text-green-800';
      case 'onArtifactClose': return 'bg-green-100 text-green-800';
      case 'onActionOpen': return 'bg-orange-100 text-orange-800';
      case 'onActionClose': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">StreamingMessageParser Debug Tool</h1>
        <p className="text-gray-600">Test and monitor StreamingMessageParser callback invocations in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Input Text</CardTitle>
            <CardDescription>
              Enter text with boltArtifact and boltAction tags to test the parser
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter your test content here..."
              className="min-h-[200px] font-mono text-sm"
            />
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={processInput} 
                disabled={isProcessing || !inputText.trim()}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Process Input'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={clearEvents}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Events
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Sample Data:</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(sampleData).map(([key, value]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputText(value)}
                  >
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Callback Events
              <Badge variant="secondary">{events.length} events</Badge>
            </CardTitle>
            <CardDescription>
              Real-time callback invocations from StreamingMessageParser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full">
              {events.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No events yet. Process some input to see callback invocations.
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event, index) => (
                    <div key={event.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getEventBadgeColor(event.type)}>
                            {event.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyEventData(event)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded p-2">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Section */}
      <Card>
        <CardHeader>
          <CardTitle>Event Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['onText', 'onArtifactOpen', 'onArtifactClose', 'onActionOpen', 'onActionClose'].map(type => {
              const count = events.filter(e => e.type === type).length;
              return (
                <div key={type} className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-gray-600">{type}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamingParserDebug;