'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

function SimpleChatTest() {
  const [input, setInput] = useState('');
  
  const { messages, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e, {
      data: {
        messages: [...messages, { role: 'user', content: input }]
      }
    });
    setInput(''); // Clear input after submit
  };

  console.log('SimpleChatTest state:', { 
    input, 
    isLoading, 
    messagesCount: messages.length,
    inputLength: input?.length || 0,
    inputType: typeof input,
    isLoadingType: typeof isLoading
  });

  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Chat Test (Manual Input Management)</h1>
      
      <div>
        <p>Input: "{input}" (type: {typeof input})</p>
        <p>Input Length: {input?.length || 0}</p>
        <p>Is Loading: {isLoading ? 'true' : 'false'} (type: {typeof isLoading})</p>
        <p>Messages Count: {messages.length}</p>
        <p>Error: {error?.message || 'none'}</p>
      </div>

      <form onSubmit={onSubmit}>
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          rows={3}
          style={{ width: '100%', marginBottom: '10px' }}
        />
        <button
          type="submit"
          disabled={isLoading || !input?.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: isLoading || !input?.trim() ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            cursor: isLoading || !input?.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>

      <div style={{ marginTop: '20px' }}>
        <h3>Messages:</h3>
        {messages.map((message) => (
          <div key={message.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
            <strong>{message.role}:</strong> {message.content}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TestPage() {
  return <SimpleChatTest />;
}
