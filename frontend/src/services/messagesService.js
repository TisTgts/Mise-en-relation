import { API_ENDPOINTS } from '../config/api';

class MessagesService {
  // Récupérer tous les messages de l'utilisateur
  async getMyMessages() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.MESSAGES, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    
    const data = await response.json();
    const messagesList = data.results || data;
    
    // Filtrer les messages de l'utilisateur connecté
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return messagesList.filter(message => 
      message.expediteur?.id === user.id || 
      message.destinataire?.id === user.id
    );
  }

  // Récupérer les messages d'une conversation spécifique
  async getConversationMessages(conversationId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.MESSAGES}?conversation=${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch conversation messages');
    }
    
    const data = await response.json();
    return data.results || data;
  }

  // Envoyer un message
  async sendMessage(destinataireId, contenu, conversationId = null) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.MESSAGES, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destinataire: destinataireId,
        contenu: contenu,
        conversation: conversationId
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    return await response.json();
  }

  // Marquer un message comme lu
  async markAsRead(messageId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.MESSAGES}${messageId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lu: true }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark message as read');
    }
    
    return await response.json();
  }

  // Supprimer un message
  async deleteMessage(messageId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.MESSAGES}${messageId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete message');
    }
    
    return true;
  }

  // Obtenir les conversations de l'utilisateur
  async getMyConversations() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.MESSAGES}conversations/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }
    
    const data = await response.json();
    return data.results || data;
  }

  // Obtenir le nombre de messages non lus
  async getUnreadCount() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.MESSAGES}unread-count/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }
    
    const data = await response.json();
    return data.count || 0;
  }
}

const messagesService = new MessagesService();
export default messagesService;
