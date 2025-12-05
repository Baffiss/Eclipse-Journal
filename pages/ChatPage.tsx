
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SendIcon, EclipseIcon, TrashIcon } from '../components/Icons';
import { GoogleGenAI } from "@google/genai";

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
}

const ChatPage: React.FC = () => {
    const { t } = useApp();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    // Initialize welcome message
    useEffect(() => {
        if (messages.length === 0) {
             setMessages([
                {
                    id: 'welcome',
                    text: t('aiWelcomeMessage'),
                    sender: 'ai'
                }
            ]);
        }
    }, [t]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            text: input.trim(),
            sender: 'user'
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Construct history for context
            const history = messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            }));

            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: "You are Eclipse AI, an expert trading assistant specialized in psychotrading (trading psychology). Your primary focus is to help traders master their emotions, discipline, and mental state. While you can discuss strategies and risk management, always emphasize the psychological aspects—such as controlling fear, greed, FOMO, and maintaining patience. Help users build a professional trader's mindset. Do not provide financial advice or trade signals. Be concise, professional, and supportive.",
                },
                history: history
            });

            const result = await chat.sendMessageStream({ message: userMessage.text });
            
            const aiMessageId = crypto.randomUUID();
            setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai' }]);

            let fullText = '';
            for await (const chunk of result) {
                const text = chunk.text;
                if (text) {
                    fullText += text;
                    setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: fullText } : m));
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { 
                id: crypto.randomUUID(), 
                text: "Sorry, I encountered an error. Please try again.", 
                sender: 'ai' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.32))] md:h-full max-w-4xl mx-auto animate-fade-in">
             <div className="flex justify-between items-center mb-4 p-4 border-b border-border">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <EclipseIcon className="w-6 h-6 text-primary" />
                    {t('chat')}
                </h1>
                <button 
                    onClick={() => setMessages([])} 
                    className="p-2 text-muted-foreground hover:text-danger hover:bg-muted rounded-full transition-colors"
                    title="Clear chat"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.sender === 'ai' && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                                <EclipseIcon className="w-5 h-5 text-primary" />
                            </div>
                        )}
                        <div 
                            className={`max-w-[80%] p-3 rounded-2xl whitespace-pre-wrap ${
                                msg.sender === 'user' 
                                    ? 'bg-primary text-bkg rounded-br-none' 
                                    : 'bg-muted text-content rounded-bl-none'
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3 justify-start">
                         <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                            <EclipseIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="bg-muted p-4 rounded-2xl rounded-bl-none flex gap-1 items-center">
                            <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border">
                <div className="relative flex items-end gap-2 bg-muted rounded-xl p-2 border border-border focus-within:ring-1 focus-within:ring-primary">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('askTheAI')}
                        className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2 px-2"
                        rows={1}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-2 bg-primary text-bkg rounded-lg hover:bg-primary-focus disabled:opacity-50 disabled:cursor-not-allowed mb-1 transition-colors"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
