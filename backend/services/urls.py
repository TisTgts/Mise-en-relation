from django.urls import path
from . import views, specific_views, api_views, admin_views

urlpatterns = [
    # Catégories de services
    path('categories/', views.ServiceCategoryListView.as_view(), name='category-list'),
    path('categories/public/', api_views.service_categories_public, name='category-public'),
    path('categories/all/', specific_views.service_categories, name='category-all'),
    
    # Statistiques administrateur
    path('statistics/admin/', api_views.admin_statistics, name='admin-statistics'),
    
    # Prestations de services - Vues publiques
    path('prestations/', views.ServiceOfferListCreateView.as_view(), name='prestation-list-create'),
    path('prestations/public/', specific_views.PublicOfferListView.as_view(), name='prestation-public-list'),
    path('prestations/<int:pk>/', views.ServiceOfferDetailView.as_view(), name='prestation-detail'),
    path('prestations/<int:offer_id>/respond/', specific_views.respond_to_offer, name='prestation-respond'),
    
    # Prestations spécifiques au prestataire
    path('prestations/my/', specific_views.my_offers, name='my-prestations'),
    path('prestations/provider/', specific_views.ProviderOfferListView.as_view(), name='provider-prestations'),
    path('prestations/my-prestations/', specific_views.my_offers, name='my-prestations-simple'),
    path('prestations/<int:offer_id>/update_status/', specific_views.update_offer_status, name='update-prestation-status'),
    path('prestations/<int:offer_id>/delete/', specific_views.delete_offer, name='delete-prestation'),
    
    # Demandes de services - Vues publiques
    path('demandes/', views.ServiceNeedListCreateView.as_view(), name='demande-list-create'),
    path('demandes/public/', specific_views.PublicNeedListView.as_view(), name='demande-public-list'),
    path('demandes/<int:pk>/', views.ServiceNeedDetailView.as_view(), name='demande-detail'),
    path('demandes/<int:pk>/edit/', views.ServiceNeedDetailView.as_view(), name='demande-edit'),
    path('demandes/<int:need_id>/respond/', specific_views.respond_to_need, name='demande-respond'),
    
    # Demandes spécifiques au fournisseur
    path('demandes/my/', specific_views.my_needs, name='my-demandes'),
    path('demandes/client/', specific_views.ClientNeedListView.as_view(), name='client-demandes'),
    path('prestations/matching/', specific_views.matching_needs, name='matching-demandes'),
    path('prestations/<int:offer_id>/update_status/', specific_views.update_offer_status, name='update-prestation-status'),
    path('prestations/<int:offer_id>/delete/', specific_views.delete_offer, name='delete-prestation'),
    
    # Transactions
    path('transactions/', views.ServiceTransactionListView.as_view(), name='transaction-list'),
    path('transactions/create/', views.create_transaction, name='transaction-create'),
    
    # Messages
    path('messages/', views.MessageListCreateView.as_view(), name='message-list-create'),
    path('messages/mark-read/', views.mark_messages_read, name='mark-messages-read'),
    
    # Admin endpoints
    path('admin/users/', admin_views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', admin_views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/prestations/', admin_views.AdminPrestationListView.as_view(), name='admin-prestations'),
    path('admin/demandes/', admin_views.AdminDemandeListView.as_view(), name='admin-demandes'),
    path('admin/transactions/', admin_views.AdminTransactionListView.as_view(), name='admin-transactions'),
    path('admin/statistics/', admin_views.admin_statistics, name='admin-statistics-detailed'),
    path('admin/users/<int:user_id>/toggle-status/', admin_views.toggle_user_status, name='admin-toggle-user'),
    path('admin/bulk-delete/', admin_views.bulk_delete_services, name='admin-bulk-delete'),
    path('admin/export/', admin_views.export_data, name='admin-export'),
]
