import { useState } from 'react';
import { Layout } from '../components/Layout';
import { 
  PaperAirplaneIcon, 
  MagnifyingGlassIcon, 
  PlusIcon,
  EllipsisVerticalIcon,
  PhotoIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const ChatList = ({ chats, activeChat, onChatSelect }) => {
  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
          <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onChatSelect(chat)}
            className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
              activeChat?.id === chat.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {chat.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                {chat.online && (
                  <div className="absolute -bottom-0 -right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {chat.name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {chat.lastMessageTime}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {chat.lastMessage}
                </p>
                {chat.unreadCount > 0 && (
                  <div className="mt-1">
                    <span className="inline-block bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                      {chat.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

ChatList.propTypes = {
  chats: PropTypes.array.isRequired,
  activeChat: PropTypes.object,
  onChatSelect: PropTypes.func.isRequired,
};

const ChatWindow = ({ chat }) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Here you would send the message
    console.log('Sending message:', message);
    setMessage('');
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            <PaperAirplaneIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select a conversation
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Choose from your existing conversations or start a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {chat.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              {chat.online && (
                <div className="absolute -bottom-0 -right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {chat.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {chat.online ? 'Online' : 'Last seen 2h ago'}
              </p>
            </div>
          </div>
          
          <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
            <EllipsisVerticalIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {chat.messages?.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.sender === 'me'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
            }`}>
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs mt-1 ${
                msg.sender === 'me' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={1}
                className="w-full px-4 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <div className="absolute right-2 bottom-2 flex space-x-1">
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-500 rounded"
                >
                  <PaperClipIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-500 rounded"
                >
                  <PhotoIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

ChatWindow.propTypes = {
  chat: PropTypes.object,
};

export const Messages = () => {
  const [activeChat, setActiveChat] = useState(null);

  // Sample chat data
  const chats = [
    {
      id: 1,
      name: "Sarah Johnson",
      lastMessage: "Hey, are you coming to the study group today?",
      lastMessageTime: "2m",
      unreadCount: 2,
      online: true,
      messages: [
        { sender: 'them', text: 'Hi! How was your exam?', time: '10:30 AM' },
        { sender: 'me', text: 'It went pretty well, thanks for asking!', time: '10:32 AM' },
        { sender: 'them', text: 'Great to hear! Are you coming to the study group today?', time: '10:35 AM' },
        { sender: 'them', text: 'We\'re meeting at 3 PM in the library', time: '10:35 AM' },
      ]
    },
    {
      id: 2,
      name: "Computer Science Club",
      lastMessage: "Don't forget about tomorrow's workshop!",
      lastMessageTime: "1h",
      unreadCount: 0,
      online: false,
      messages: [
        { sender: 'them', text: 'Reminder: Workshop tomorrow at 2 PM in Tech Lab 101', time: '2:00 PM' },
        { sender: 'them', text: 'Don\'t forget to bring your laptops!', time: '2:00 PM' },
        { sender: 'me', text: 'Thanks for the reminder!', time: '2:15 PM' },
      ]
    },
    {
      id: 3,
      name: "Mike Chen",
      lastMessage: "Can you send me the notes from yesterday?",
      lastMessageTime: "3h",
      unreadCount: 1,
      online: true,
      messages: [
        { sender: 'them', text: 'Hey, did you take notes in the math class yesterday?', time: '1:00 PM' },
        { sender: 'them', text: 'Can you send me the notes from yesterday?', time: '1:02 PM' },
        { sender: 'me', text: 'Sure! I\'ll send them over in a bit', time: '1:05 PM' },
      ]
    },
    {
      id: 4,
      name: "Emma Wilson",
      lastMessage: "See you at the career fair!",
      lastMessageTime: "1d",
      unreadCount: 0,
      online: false,
      messages: [
        { sender: 'them', text: 'Are you going to the career fair next week?', time: 'Yesterday' },
        { sender: 'me', text: 'Yes! I\'m really excited about it', time: 'Yesterday' },
        { sender: 'them', text: 'See you at the career fair!', time: 'Yesterday' },
      ]
    }
  ];

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex rounded-lg overflow-hidden shadow-lg">
        <ChatList 
          chats={chats} 
          activeChat={activeChat} 
          onChatSelect={setActiveChat} 
        />
        <ChatWindow chat={activeChat} />
      </div>
    </Layout>
  );
};
