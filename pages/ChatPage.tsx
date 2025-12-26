
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
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
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

        const userMessageText = input.trim();
        const userMessage: Message = {
            id: crypto.randomUUID(),
            text: userMessageText,
            sender: 'user'
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        try {
            // Initializing GoogleGenAI with the API key from process.env.API_KEY
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Construct history for context
            const history = messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            }));

            const result = await ai.models.generateContentStream({
                model: 'gemini-3-flash-preview',
                contents: [
                    ...history,
                    { role: 'user', parts: [{ text: userMessageText }] }
                ],
                config: {
                    systemInstruction: "You are Eclipse AI, an expert trading assistant specialized in psychotrading (trading psychology). Your primary focus is to help traders master their emotions, discipline, and mental state. Always emphasize the psychological aspects—such as controlling fear, greed, FOMO, and maintaining patience. Help users build a professional trader's mindset. Do not provide financial advice. Be concise, professional, and supportive.",
                },
            });
            
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
                text: "Sorry, I encountered an error. Please check your connection and try again.", 
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
        <div className="flex flex-col h-full max-w-4xl mx-auto animate-fade-in relative">
             <div className="flex justify-between items-center mb-4 p-4 border-b border-border bg-bkg/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <EclipseIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tight leading-none">
                            {t('chat')}
                        </h1>
                        <span className="text-[10px] font-bold text-success uppercase tracking-widest flex items-center gap-1 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                            AI Online
                        </span>
                    </div>
                </div>
                <button 
                    onClick={() => setMessages([])} 
                    className="p-3 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-xl transition-all"
                    title="Clear chat"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
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
                            className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed shadow-sm ${
                                msg.sender === 'user' 
                                    ? 'bg-primary text-bkg rounded-br-none font-bold' 
                                    : 'bg-muted/50 border border-border text-content rounded-bl-none font-medium'
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3 justify-start animate-fade-in">
                         <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                            <EclipseIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="bg-muted/50 border border-border p-4 rounded-2xl rounded-bl-none flex gap-1 items-center">
                            <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 mt-auto">
                <div className="relative flex items-end gap-2 bg-muted/50 border border-border rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-lg">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('askTheAI')}
                        className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 py-3 px-3 text-sm font-medium placeholder:text-muted-foreground/50"
                        rows={1}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-primary text-bkg rounded-xl hover:bg-primary-focus disabled:opacity-50 disabled:cursor-not-allowed mb-1 transition-all shadow-md active:scale-95"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-[10px] text-center text-muted-foreground/40 mt-3 font-bold uppercase tracking-widest">
                    Powered by Gemini Pro • Focus on Psychology
                </p>
            </div>
        </div>
    );
};

export default ChatPage;
