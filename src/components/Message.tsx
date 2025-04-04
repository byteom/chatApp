import React, { useState } from 'react';
import { MessageInput } from './MessageInput';
import { Message as MessageType, Reaction } from '../types';
import { MessageSquare, X, ThumbsUp, Heart, Laugh, Frown, HelpingHand as PrayingHands, Smile, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MessageProps {
  message: MessageType;
  onReplySuccess?: () => void;
}

const REACTIONS: { emoji: Reaction; icon: React.ComponentType; color: string }[] = [
  { emoji: '👍', icon: ThumbsUp, color: 'text-blue-500' },
  { emoji: '❤️', icon: Heart, color: 'text-red-500' },
  { emoji: '😂', icon: Laugh, color: 'text-yellow-500' },
  { emoji: '⭐', icon: Star, color: 'text-yellow-400' },
  { emoji: '😢', icon: Frown, color: 'text-purple-500' },
  { emoji: '🙏', icon: PrayingHands, color: 'text-green-500' },
];

export function Message({ message, onReplySuccess }: MessageProps) {
  const [showReply, setShowReply] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const handleReplySuccess = () => {
    if (onReplySuccess) onReplySuccess();
    setShowReply(false);
  };

  const handleReaction = async (emoji: Reaction) => {
    try {
      const currentReactions = message.reactions || {};
      const updatedReactions = {
        ...currentReactions,
        [emoji]: (currentReactions[emoji] || 0) + 1
      };

      const { error } = await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', message.id);

      if (error) throw error;
      setShowReactions(false);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleLongPress = (e: React.TouchEvent) => {
    e.preventDefault();
    setShowReactions(true);
  };

  return (
    <div className="relative group animate-fade-in">
      <div 
        className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
        onTouchStart={(e) => {
          let timer = setTimeout(() => handleLongPress(e), 500);
          e.currentTarget.addEventListener('touchend', () => clearTimeout(timer), { once: true });
        }}
      >
        <p className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        
        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
          <span className="text-xs">{new Date(message.created_at).toLocaleString()}</span>
          <div className="flex items-center gap-2">
            {message.reactions && Object.entries(message.reactions).map(([emoji, count]) => (
              <span key={emoji} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                {emoji}<span className="text-xs font-medium">{count}</span>
              </span>
            ))}
            <button
              onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors bg-blue-50 px-2 py-1 rounded-full"
            >
              {showReply ? <X size={16} /> : <MessageSquare size={16} />}
              {showReply ? 'Cancel' : 'Reply'}
            </button>
          </div>
        </div>

        {showReactions && (
          <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-xl p-2 flex gap-2 border border-gray-100">
            {REACTIONS.map(({ emoji, icon: Icon, color }) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`hover:bg-gray-100 p-2 rounded-full transition-colors ${color}`}
              >
                <Icon size={20} />
              </button>
            ))}
          </div>
        )}
      </div>

      {showReply && (
        <div className="ml-4 mt-2 border-l-2 border-blue-200 pl-4">
          <MessageInput 
            parentId={message.id} 
            onClose={() => setShowReply(false)}
            onSuccess={handleReplySuccess}
          />
        </div>
      )}

      {message.replies && message.replies.length > 0 && (
        <div className="ml-4 mt-2 border-l-2 border-purple-200 pl-4 space-y-2">
          {message.replies.map((reply) => (
            <Message 
              key={reply.id} 
              message={reply}
              onReplySuccess={onReplySuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
}