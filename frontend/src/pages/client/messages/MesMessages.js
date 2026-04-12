import React, { useState, useEffect } from 'react';
import { FiSend, FiInbox, FiMessageSquare, FiUser, FiCalendar, FiSearch, FiFilter } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';

const MesMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/services/messages/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const messagesList = data.results || data;
          
          // Filtrer les messages du fournisseur connecté
          const mesMessages = messagesList.filter(message => 
            message.destinataire?.id === user?.id || message.expediteur?.id === user?.id
          );
          
          setMessages(mesMessages);
        } else {
          throw new Error('Erreur lors du chargement des messages');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMessages();
    }
  }, [user]);

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.sujet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.contenu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.expediteur?.raison_sociale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.destinataire?.raison_sociale?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'recus') return message.destinataire?.id === user?.id && matchesSearch;
    if (filter === 'envoyes') return message.expediteur?.id === user?.id && matchesSearch;
    if (filter === 'non_lus') return !message.lu && matchesSearch;
    
    return matchesSearch;
  });

  const handleMarkAsRead = async (messageId) => {
    try {
      const response = await fetch(`/api/services/messages/${messageId}/mark-read/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setMessages(messages.map(msg => 
          msg.id === messageId ? { ...msg, lu: true } : msg
        ));
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const handleReply = (message) => {
    setSelectedMessage(message);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch('/api/services/messages/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData
      });
      
      if (response.ok) {
        const newMessage = await response.json();
        setMessages([newMessage, ...messages]);
        e.target.reset();
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      alert('Erreur lors de l\'envoi du message');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Liste des messages */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600 mt-1">Communications avec les prestataires</p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un message..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtre
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Tous les messages</option>
                <option value="recus">Reçus</option>
                <option value="envoyes">Envoyés</option>
                <option value="non_lus">Non lus</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des messages */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {messages.length === 0 ? 'Aucun message' : 'Aucun message trouvé'}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    !message.lu ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    handleMarkAsRead(message.id);
                    setSelectedMessage(message);
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-sm">
                          {(message.expediteur?.raison_sociale || message.destinataire?.raison_sociale)?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {message.sujet}
                        </p>
                        <div className="flex items-center space-x-2">
                          {!message.lu && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Nouveau
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {message.contenu}
                      </p>
                      <div className="flex items-center mt-1">
                        <FiUser className="mr-1 h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {message.expediteur?.id === user?.id 
                            ? `À: ${message.destinataire?.raison_sociale}`
                            : `De: ${message.expediteur?.raison_sociale}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Détails du message */}
      <div className="space-y-4">
        {selectedMessage ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Détails du message</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Sujet</h3>
                <p className="text-sm text-gray-900">{selectedMessage.sujet}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700">Contenu</h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedMessage.contenu}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700">Informations</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <FiUser className="mr-2 h-4 w-4 text-gray-400" />
                    <span>
                      {selectedMessage.expediteur?.id === user?.id 
                        ? `Envoyé à: ${selectedMessage.destinataire?.raison_sociale}`
                        : `Reçu de: ${selectedMessage.expediteur?.raison_sociale}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FiCalendar className="mr-2 h-4 w-4 text-gray-400" />
                    <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => handleReply(selectedMessage)}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiMessageSquare className="mr-2 h-4 w-4" />
                Répondre
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <FiInbox className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Sélectionnez un message</h3>
              <p className="mt-2 text-sm text-gray-500">
                Choisissez un message dans la liste pour voir les détails
              </p>
            </div>
          </div>
        )}

        {/* Nouveau message */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Nouveau message</h2>
          
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destinataire
              </label>
              <select
                name="destinataire"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Sélectionner un destinataire</option>
                {/* Options à remplir dynamiquement avec la liste des prestataires */}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sujet
              </label>
              <input
                type="text"
                name="sujet"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Sujet du message"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                name="contenu"
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Contenu du message"
              />
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiSend className="mr-2 h-4 w-4" />
                Envoyer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MesMessages;
