// Test file to verify shell command parsing fix
import { StreamingMessageParser } from './StreamingMessageParser';

// Create a test parser
const parser = new StreamingMessageParser({
  onActionClose: (data) => {
    console.log('✅ Shell command parsed:', data.action.content);
    console.log('Expected: npm install');
    console.log('Actual:', JSON.stringify(data.action.content));
    
    if (data.action.content === 'npm install') {
      console.log('🎉 SUCCESS: Shell command parsing is working correctly!');
    } else {
      console.log('❌ FAILED: Shell command still contains markdown syntax');
    }
  },
  onText: (text) => console.log('Text:', text)
});

// Test the problematic case from the logs
const testContent = '<boltAction type="shell">```bash\nnpm install\n```</boltAction>';

console.log('🧪 Testing shell command parsing...');
console.log('Input:', testContent);
parser.parse('test-message', testContent);