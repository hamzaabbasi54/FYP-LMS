import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
    MdSend, MdSearch, MdArrowBack, MdPerson, MdCircle,
    MdChatBubbleOutline, MdCheckCircle, MdDoneAll
} from 'react-icons/md';

const Messages = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const queryClient = useQueryClient();

    const [selectedContact, setSelectedContact] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [contactSearch, setContactSearch] = useState('');
    const [localMessages, setLocalMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [showMobileChat, setShowMobileChat] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // ============================================
    // Queries
    // ============================================
    const { data: contactsData, isLoading: loadingContacts } = useQuery({
        queryKey: ['messageContacts'],
        queryFn: async () => {
            const res = await messageApi.getContacts();
            return res.success ? res.data : [];
        },
        refetchInterval: 30000,
    });

    const contacts = contactsData || [];

    const { data: conversationData, isLoading: loadingConversation } = useQuery({
        queryKey: ['conversation', selectedContact?.id],
        queryFn: async () => {
            const res = await messageApi.getConversation(selectedContact.id);
            return res.success ? res.data : [];
        },
        enabled: !!selectedContact?.id,
    });

    // Sync server data to local state
    useEffect(() => {
        if (conversationData) {
            setLocalMessages(conversationData);
        }
    }, [conversationData]);

    // ============================================
    // Send message mutation
    // ============================================
    const sendMutation = useMutation({
        mutationFn: ({ recipientId, content }) => messageApi.send(recipientId, content),
        onSuccess: (data) => {
            if (data.success) {
                // Add to local messages optimistically
                setLocalMessages(prev => [...prev, data.data]);
                setMessageInput('');
                // Refresh contacts to update last_message
                queryClient.invalidateQueries({ queryKey: ['messageContacts'] });
            }
        },
        onError: () => {
            toast.error('Failed to send message');
        }
    });

    // ============================================
    // Socket listeners
    // ============================================
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (data) => {
            // If from the currently viewed contact → append locally
            if (selectedContact && data.sender_id === selectedContact.id) {
                setLocalMessages(prev => [...prev, data]);
                // Mark as read since we're viewing this conversation
                messageApi.markRead(data.sender_id).catch(() => {});
            } else {
                // From another contact → show toast
                toast.info(`New message from ${data.sender_name}`, {
                    autoClose: 3000,
                    onClick: () => {
                        // Find contact and select them
                        const contact = contacts.find(c => c.id === data.sender_id);
                        if (contact) handleSelectContact(contact);
                    }
                });
            }
            // Refresh contacts to update unread counts + last message
            queryClient.invalidateQueries({ queryKey: ['messageContacts'] });
            queryClient.invalidateQueries({ queryKey: ['unreadMessageCount'] });
        };

        const handleTyping = (data) => {
            if (selectedContact && data.senderId === selectedContact.id) {
                setTypingUser(data.senderName);
                // Auto-clear after 3 seconds
                setTimeout(() => setTypingUser(null), 3000);
            }
        };

        const handleStopTyping = (data) => {
            if (selectedContact && data.senderId === selectedContact.id) {
                setTypingUser(null);
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('user_typing', handleTyping);
        socket.on('user_stop_typing', handleStopTyping);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('user_typing', handleTyping);
            socket.off('user_stop_typing', handleStopTyping);
        };
    }, [socket, selectedContact, contacts, queryClient]);

    // ============================================
    // Auto-scroll
    // ============================================
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [localMessages, typingUser]);

    // ============================================
    // Typing indicator emit
    // ============================================
    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
        if (socket && selectedContact) {
            if (!isTyping) {
                setIsTyping(true);
                socket.emit('typing', { recipientId: selectedContact.id });
            }
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                socket.emit('stop_typing', { recipientId: selectedContact.id });
            }, 1500);
        }
    };

    // ============================================
    // Handlers
    // ============================================
    const handleSelectContact = useCallback((contact) => {
        setSelectedContact(contact);
        setLocalMessages([]);
        setTypingUser(null);
        setShowMobileChat(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    const handleSend = () => {
        if (!messageInput.trim() || !selectedContact) return;
        sendMutation.mutate({
            recipientId: selectedContact.id,
            content: messageInput.trim()
        });
        if (socket) socket.emit('stop_typing', { recipientId: selectedContact.id });
        setIsTyping(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ============================================
    // Helpers
    // ============================================
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return d.toLocaleDateString([], { weekday: 'short' });
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const formatMessageTime = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredContacts = contacts.filter(c =>
        !contactSearch || c.full_name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.email?.toLowerCase().includes(contactSearch.toLowerCase())
    );

    const avatarColors = [
        'from-blue-500 to-indigo-600',
        'from-violet-500 to-purple-600',
        'from-emerald-500 to-teal-600',
        'from-amber-500 to-orange-600',
        'from-pink-500 to-rose-600',
        'from-cyan-500 to-sky-600',
    ];
    const getAvatarColor = (id) => avatarColors[(id || 0) % avatarColors.length];

    // ============================================
    // Render
    // ============================================
    return (
        <div className="h-[calc(100vh-96px)] bg-gradient-to-br from-slate-100 to-slate-200 p-4 lg:p-6 rounded-3xl flex flex-col">
            <div className="flex-1 w-full max-w-7xl mx-auto flex bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
            {/* ========== LEFT: Contact List ========== */}
            <div className={`w-full md:w-[340px] lg:w-[380px] flex-shrink-0 border-r border-slate-200 flex flex-col bg-slate-50 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-4 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-3">Messages</h2>
                    <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-slate-200 shadow-sm focus:border-blue-300 transition-all"
                        />
                    </div>
                </div>

                {/* Contact list */}
                <div className="flex-1 overflow-y-auto">
                    {loadingContacts ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                            <p className="text-sm text-slate-400">Loading contacts...</p>
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <MdPerson className="w-12 h-12 text-slate-200 mb-3" />
                            <p className="text-slate-400 text-sm">
                                {contactSearch ? 'No contacts found' : 'No department members yet'}
                            </p>
                        </div>
                    ) : (
                        filteredContacts.map(contact => {
                            const isActive = selectedContact?.id === contact.id;
                            return (
                                <button
                                    key={contact.id}
                                    onClick={() => handleSelectContact(contact)}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-b border-slate-200/50 hover:bg-slate-100/50 ${
                                        isActive ? 'bg-blue-50/80 border-l-4 !border-l-blue-500' : ''
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className={`relative w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(contact.id)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                        <span className="text-white font-bold text-sm">{getInitials(contact.full_name)}</span>
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                                                {contact.full_name}
                                            </p>
                                            {contact.last_message_time && (
                                                <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">
                                                    {formatTime(contact.last_message_time)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <p className="text-xs text-slate-400 truncate pr-2">
                                                {contact.last_message || (
                                                    <span className="capitalize">{contact.role === 'deptadmin' ? 'Department Admin' : contact.role}</span>
                                                )}
                                            </p>
                                            {contact.unread_count > 0 && (
                                                <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                                    {contact.unread_count > 9 ? '9+' : contact.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ========== RIGHT: Conversation View ========== */}
            <div className={`flex-1 flex flex-col bg-white ${!showMobileChat && !selectedContact ? 'hidden md:flex' : 'flex'}`}>
                {!selectedContact ? (
                    /* Empty state */
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <MdChatBubbleOutline className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-600 mb-1">Select a conversation</h3>
                        <p className="text-sm text-slate-400 max-w-xs">
                            Choose a contact from the list to start messaging
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Conversation Header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
                            <button
                                onClick={() => { setShowMobileChat(false); setSelectedContact(null); }}
                                className="md:hidden p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                            >
                                <MdArrowBack className="w-5 h-5" />
                            </button>
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(selectedContact.id)} flex items-center justify-center shadow-sm`}>
                                <span className="text-white font-bold text-sm">{getInitials(selectedContact.full_name)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-800 text-sm">{selectedContact.full_name}</h3>
                                <p className="text-xs text-slate-400 capitalize">
                                    {typingUser ? (
                                        <span className="text-blue-500 animate-pulse">typing...</span>
                                    ) : (
                                        selectedContact.role === 'deptadmin' ? 'Department Admin' : selectedContact.role
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                            {loadingConversation ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                </div>
                            ) : localMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                                        <MdSend className="w-7 h-7 text-blue-300" />
                                    </div>
                                    <p className="text-sm text-slate-400">No messages yet. Say hello! 👋</p>
                                </div>
                            ) : (
                                <>
                                    {localMessages.map((msg, idx) => {
                                        const isMine = msg.sender_id === user?.id;
                                        const prevMsg = localMessages[idx - 1];
                                        const showDateSeparator = idx === 0 || (
                                            prevMsg && new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString()
                                        );
                                        const isConsecutive = prevMsg && prevMsg.sender_id === msg.sender_id && !showDateSeparator;

                                        return (
                                            <React.Fragment key={msg.id || idx}>
                                                {showDateSeparator && (
                                                    <div className="flex items-center justify-center my-4">
                                                        <div className="bg-slate-200/80 text-slate-500 text-[11px] font-medium px-3 py-1 rounded-full">
                                                            {new Date(msg.created_at).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-0.5' : 'mt-3'}`}>
                                                    <div className={`max-w-[75%] ${isMine ? 'order-1' : 'order-1'}`}>
                                                        <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                                            isMine
                                                                ? 'bg-blue-500 text-white rounded-br-md'
                                                                : 'bg-slate-50 text-slate-700 rounded-bl-md border border-slate-200'
                                                        }`}>
                                                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                        </div>
                                                        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                            <span className="text-[10px] text-slate-400">
                                                                {formatMessageTime(msg.created_at)}
                                                            </span>
                                                            {isMine && (
                                                                msg.is_read
                                                                    ? <MdDoneAll className="w-3.5 h-3.5 text-blue-400" />
                                                                    : <MdCheckCircle className="w-3 h-3 text-slate-300" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                    {typingUser && (
                                        <div className="flex justify-start mt-2">
                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Message Input */}
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                            <div className="flex items-end gap-2">
                                <div className="flex-1 relative">
                                    <textarea
                                        ref={inputRef}
                                        value={messageInput}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type a message..."
                                        rows={1}
                                        className="w-full px-4 py-2.5 bg-white rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-slate-200 shadow-sm focus:border-blue-300 transition-all max-h-32 overflow-y-auto"
                                        style={{ minHeight: '42px' }}
                                        onInput={(e) => {
                                            e.target.style.height = 'auto';
                                            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={!messageInput.trim() || sendMutation.isPending}
                                    className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex-shrink-0"
                                >
                                    <MdSend className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            </div>
        </div>
    );
};

export default Messages;
