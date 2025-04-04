import React, { useEffect, useState, useRef } from 'react';
import { MessageInput } from './components/MessageInput';
import { Message as MessageComponent } from './components/Message';
import { Message } from './types';
import { supabase } from './lib/supabase';
import { MessageSquareText } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const organizeMessages = (data: Message[]) => {
    const messageMap = new Map<string, Message>();
    const rootMessages: Message[] = [];

    data.forEach(message => {
      messageMap.set(message.id, { ...message, replies: [] });
    });

    messageMap.forEach(message => {
      if (message.parent_id) {
        const parent = messageMap.get(message.parent_id);
        if (parent && parent.replies) {
          parent.replies.push(message);
        }
      } else {
        rootMessages.push(message);
      }
    });

    // Sort root messages by created_at in ascending order (oldest first)
    rootMessages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Sort replies by created_at in ascending order
    rootMessages.forEach(message => {
      if (message.replies) {
        message.replies.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
    });

    return rootMessages;
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(organizeMessages(data));
    setTimeout(scrollToBottom, 100);
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('message-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchMessages();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="bg-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
          <MessageSquareText className="text-blue-500 w-6 h-6 mr-2" />
          <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Share Your Fellings
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageComponent 
              key={message.id} 
              message={message} 
              onReplySuccess={fetchMessages}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t shadow-lg">
        <div className="max-w-3xl mx-auto p-4">
          <MessageInput onSuccess={fetchMessages} />
        </div>
      </div>
      
      <Toaster position="top-center" />
    </div>
  );
}

export default App;