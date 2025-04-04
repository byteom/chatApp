import React, { useState } from 'react';
import { Send, Smile } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

interface MessageInputProps {
  parentId?: string | null;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function MessageInput({ parentId = null, onClose, onSuccess }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ content: message.trim(), parent_id: parentId, reactions: {} }]);

      if (error) throw error;
      
      setMessage('');
      if (onClose) onClose();
      if (onSuccess) onSuccess();
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEmojiClick = (emojiData: any) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative">
      {showEmojiPicker && (
        <div className="absolute bottom-full right-0 mb-2">
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-gray-500 hover:text-blue-500 transition-colors rounded-full hover:bg-gray-100"
        >
          <Smile size={24} />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:hover:opacity-50 transition-all duration-200 shadow-md"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}