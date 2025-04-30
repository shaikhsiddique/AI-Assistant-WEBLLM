import React, { useEffect, useState } from 'react'
import * as webllm from "@mlc-ai/web-llm";

function App() {
  const [messages, setMessages] = useState([{
    role: "system",
    content: "You are a helpful AI assistant. Keep your responses concise and to the point. Focus on providing clear, accurate information without unnecessary elaboration."
  }])
  
  const [inputMessage, setInputMessage] = useState('')
  const [engine, setEngine] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('Loading AI model...')
  const [isModelLoading, setIsModelLoading] = useState(true)

  useEffect(()=>{
    const selectedModel = "Llama-3.1-8B-Instruct-q4f32_1-MLC";
    webllm.CreateMLCEngine(selectedModel,{
      initProgressCallback :(initProgress) => {
        setLoadingText(`Loading model: ${initProgress.text}`);
      }
    }).then(engine=>{ 
      setEngine(engine)
      setIsModelLoading(false)
    })
  },[])

  const handleSendMessage = async () => {
    if (!engine) {
      console.log("Engine is not ready yet!");
      return;
    }
  
    const tempMessage = [...messages];
    tempMessage.push({
      role: "user",
      content: inputMessage,
    });
  
    setMessages(tempMessage);
    setInputMessage('');
    setIsLoading(true);
  
    try {
      const systemMessage = tempMessage.find(msg => msg.role === "system");
      const otherMessages = tempMessage.filter(msg => msg.role !== "system");
      const orderedMessages = [systemMessage, ...otherMessages];

      const reply = await engine.chat.completions.create({
        messages: orderedMessages,
      });
  
      if (reply && reply.choices && reply.choices[0]) {
        const aiResponse = reply.choices[0].message.content;
        const newMessages = [...tempMessage, { role: "assistant", content: aiResponse }];
        setMessages(newMessages);
      } else {
        console.error("No valid response from the model.");
      }
    } catch (error) {
      console.error("Error in generating reply:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage(e)
    }
  }

  if (isModelLoading) {
    return (
      <div className='h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-gray-800 mx-auto'></div>
          <p className='text-gray-700 text-lg'>{loadingText}</p>
        </div>
      </div>
    )
  }

  return (
    <main className='h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col'>
      <header className='w-full py-4 px-6 bg-white border-b border-gray-200 shadow-sm'>
        <h1 className='text-2xl font-bold text-gray-800 text-center'>AI Assistant WEBLLM</h1>
      </header>
      
      <section className='conversation-area flex-1 w-full p-4 overflow-y-auto'>
        <div className='max-w-3xl mx-auto space-y-4'>
          {messages.map((message, index) => {
            if (message.role === "system") {
              return null; // Don't show system message
            } else if (message.role === "assistant") {
              return (
                <div key={index} className='flex items-start space-x-2'>
                  <div className='w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mt-4 flex-shrink-0'>
                    <span className='text-gray-600 font-bold'>AI</span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-[80%] break-words whitespace-pre-wrap'>
                      <p className='text-gray-700'>{message.content}</p>
                    </div>
                  </div>
                </div>
              )
            } else {
              return (
                <div key={index} className='flex items-start justify-end space-x-2'>
                  <div className='flex-1 min-w-0 flex justify-end'>
                    <div className='bg-gray-800 p-4 rounded-lg shadow-sm max-w-[80%] break-words whitespace-pre-wrap'>
                      <p className='text-white'>{message.content}</p>
                    </div>
                  </div>
                  <div className='w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mt-4 flex-shrink-0'>
                    <span className='text-white font-bold'>U</span>
                  </div>
                </div>
              )
            }
          })}
          {isLoading && (
            <div className='flex items-start space-x-2'>
              <div className='w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mt-4 flex-shrink-0'>
                <span className='text-gray-600 font-bold'>AI</span>
              </div>
              <div className='flex-1 min-w-0'>
                <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-[80%]'>
                  <div className='flex items-center space-x-2'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600'></div>
                    <p className='text-gray-600 text-sm'>Thinking...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      
      <section className='input-area w-full p-4 bg-white border-t border-gray-200 shadow-sm'>
        <div className='max-w-3xl mx-auto flex gap-2'>
          <input 
            type="text" 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder='Type your message...' 
            className='flex-1 px-4 py-3 rounded-lg bg-gray-50 text-gray-800 placeholder-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300'
            disabled={isLoading}
          />
          <button 
            onClick={handleSendMessage}
            className='px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={isLoading || !inputMessage.trim()}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </section>
    </main>
  )
}

export default App