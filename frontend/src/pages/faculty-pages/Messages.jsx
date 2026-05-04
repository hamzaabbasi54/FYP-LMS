import React, { useState } from 'react';
import { MdSend, MdAttachFile, MdAdminPanelSettings } from 'react-icons/md';

const Messages = () => {
    const [messageInput, setMessageInput] = useState('');

    // Single conversation target
    const adminContact = {
        name: "Admin Office",
        role: "System Administrator",
        avatarColor: "bg-purple-100 text-purple-700"
    };

    // Mock messages
    const messages = [
        {
            id: 1,
            sender: "Admin Office",
            isMe: false,
            content: "Assalam-u-Alaikum Dr. Ahmed Khan,\n\nWe have received your request for additional course materials budget.",
            time: "10:30 AM",
            date: "Today"
        },
        {
            id: 2,
            sender: "Me",
            isMe: true,
            content: "Walaikum Assalam,\n\nThank you for the update. When can I expect the approval?",
            time: "10:35 AM",
            date: "Today"
        },
        {
            id: 3,
            sender: "Admin Office",
            isMe: false,
            content: "Your course assignment request has been approved. You can now access CS-302 Operating Systems for the current semester.",
            time: "10:45 AM",
            date: "Today"
        }
    ];

    const handleSendMessage = () => {
        if (messageInput.trim()) {
            console.log('Sending message:', messageInput);
            setMessageInput('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-180px)] flex flex-col">
                {/* Chat Header */}
                <div className="flex items-center p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${adminContact.avatarColor} flex items-center justify-center shadow-sm`}>
                            <MdAdminPanelSettings className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800 text-lg">{adminContact.name}</h2>
                            <p className="text-xs text-gray-500 font-medium">{adminContact.role}</p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-white">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xl px-5 py-3.5 rounded-2xl shadow-sm ${message.isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-gray-100 text-gray-800 border border-gray-200 rounded-bl-none'
                                    }`}
                            >
                                <p className="text-sm sm:text-base whitespace-pre-line leading-relaxed">{message.content}</p>
                                <p className={`text-xs mt-2 font-medium ${message.isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {message.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-3 max-w-4xl mx-auto w-full">
                        <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                            <MdAttachFile className="w-6 h-6" />
                        </button>
                        <input
                            type="text"
                            placeholder="Type a message to Admin..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1 px-6 py-3 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-gray-50 focus:bg-white transition-all"
                        />
                        <button
                            onClick={handleSendMessage}
                            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 duration-200"
                        >
                            <MdSend className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Messages;
