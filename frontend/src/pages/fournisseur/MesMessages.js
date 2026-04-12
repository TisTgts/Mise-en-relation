import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMessageSquare, FiSend, FiSearch, FiFilter, FiUser, FiClock, FiCheck, FiCheckCircle, FiPhone, FiMail, FiBriefcase } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import messagesService from '../../services/messagesService';
import Toast from '../../components/Toast';

const MesMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        console.log('MesMessages (prestataire) - user:', user);
        const data = await messagesService.getMyMessages();
        console.log('MesMessages (prestataire) - conversations:', data);
        setConversations(data);
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
        setToast({
          message: 'Erreur lors du chargement des conversations',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        try {
          const data = await messagesService.getConversationMessages(selectedConversation.id);
          setMessages(data);
          
          // Marquer comme lu
          if (!selectedConversation.lu) {
            await messagesService.markAsRead(selectedConversation.id);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des messages:', error);
        }
      };

      fetchMessages();
    }
  }, [selectedConversation]);

  const filteredConversations = conversations.filter(conversation => {
    const otherUser = conversation.expediteur?.id === user?.id ? conversation.destinataire : conversation.expediteur;
    const matchesSearch = otherUser?.raison_sociale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         otherUser?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         otherUser?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'unread') return !conversation.lu && matchesSearch;
    if (filter === 'read') return conversation.lu && matchesSearch;
    
    return matchesSearch;
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const otherUser = selectedConversation.expediteur?.id === user?.id ? 
        selectedConversation.destinataire : 
        selectedConversation.expediteur;
      
      const newMsg = await messagesService.sendMessage(otherUser.id, newMessage, selectedConversation.id);
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      setToast({
        message: 'Message envoyé avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setToast({
        message: 'Erreur lors de l\'envoi du message',
        type: 'error'
      });
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const getOtherUser = (conversation) => {
    return conversation.expediteur?.id === user?.id ? conversation.destinataire : conversation.expediteur;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return 'Hier';
    return date.toLocaleDateString('fr-FR');
  };

  const getUserIcon = (user) => {
    if (user?.type_utilisateur === 'prestataire') return FiBriefcase;
    if (user?.type_utilisateur === 'fournisseur') return FiUser;
    return FiUser;
  };

  const getUserTypeLabel = (type) => {
    switch (type) {
      case 'prestataire': return 'Prestataire';
      case 'fournisseur': return 'Fournisseur';
      case 'administrateur': return 'Admin';
      default: return type;
    }
  };

  const unreadCount = conversations.filter(c => !c.lu).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Liste des conversations */}
      <div className="w-full md:w-1/3 border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Messages
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>
          
          {/* Filtres */}
          <div className="space-y-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une conversation..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Toutes les conversations</option>
              <option value="unread">Non lues</option>
              <option value="read">Lues</option>
            </select>
          </div>
        </div>

        <div className="overflow-y-auto h-full">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Aucune conversation trouvée</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredConversations.map((conversation) => {
                const otherUser = getOtherUser(conversation);
                const UserIcon = getUserIcon(otherUser);
                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {otherUser?.raison_sociale || `${otherUser?.first_name} ${otherUser?.last_name}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(conversation.created_at)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.contenu}
                        </p>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs text-gray-500">
                            {getUserTypeLabel(otherUser?.type_utilisateur)}
                          </span>
                          {!conversation.lu && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Nouveau
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Conversation sélectionnée */}
      <div className="hidden md:flex md:flex-1 flex-col">
        {selectedConversation ? (
          <>
            {/* Header de la conversation */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    {(() => {
                      const otherUser = getOtherUser(selectedConversation);
                      const UserIcon = getUserIcon(otherUser);
                      return <UserIcon className="h-5 w-5 text-gray-600" />;
                    })()}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {(() => {
                        const otherUser = getOtherUser(selectedConversation);
                        return otherUser?.raison_sociale || 
                               `${otherUser?.first_name} ${otherUser?.last_name}`;
                      })()}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {(() => {
                          const otherUser = getOtherUser(selectedConversation);
                          return getUserTypeLabel(otherUser?.type_utilisateur);
                        })()}
                      </span>
                      {(() => {
                        const otherUser = getOtherUser(selectedConversation);
                        return otherUser?.telephone && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <FiPhone className="h-3 w-3 mr-1" />
                            {otherUser.telephone}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <FiPhone className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <FiMail className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.expediteur?.id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.expediteur?.id === user?.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.contenu}</p>
                    <p className={`text-xs mt-1 ${
                      message.expediteur?.id === user?.id ? 'text-primary-200' : 'text-gray-500'
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulaire d'envoi */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <FiSend className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Sélectionnez une conversation pour commencer</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default MesMessages;
