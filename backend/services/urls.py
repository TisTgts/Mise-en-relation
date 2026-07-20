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
    
    # Besoins de services - Vues publiques
    path('besoins/', views.ServiceNeedListCreateView.as_view(), name='besoin-list-create'),
    path('besoins/public/', specific_views.PublicNeedListView.as_view(), name='besoin-public-list'),
    path('besoins/<int:pk>/', views.ServiceNeedDetailView.as_view(), name='besoin-detail'),
    path('besoins/<int:pk>/edit/', views.ServiceNeedDetailView.as_view(), name='besoin-edit'),
    path('besoins/<int:need_id>/respond/', specific_views.respond_to_need, name='besoin-respond'),
    
    # Besoins spécifiques au client / fournisseur
    path('besoins/my/', specific_views.my_needs, name='my-besoins'),
    path('besoins/client/', specific_views.ClientNeedListView.as_view(), name='client-besoins'),
    path('prestations/matching/', specific_views.matching_needs, name='matching-besoins'),
    
    # Transactions
    path('transactions/', views.ServiceTransactionListView.as_view(), name='transaction-list'),
    path('transactions/<int:pk>/', views.ServiceTransactionDetailView.as_view(), name='transaction-detail'),
    path('transactions/create/', views.create_transaction, name='transaction-create'),
    path('transactions/<int:transaction_id>/fournisseur-work-done/', views.fournisseur_work_done, name='transaction-fournisseur-work-done'),
    path('transactions/<int:transaction_id>/fournisseur-propose-devis/', views.fournisseur_propose_quote, name='transaction-fournisseur-propose-devis'),
    path('transactions/<int:transaction_id>/client-respond-devis/', views.client_respond_quote, name='transaction-client-respond-devis'),
    path('transactions/<int:transaction_id>/client-verify/', views.client_verify_work, name='transaction-client-verify'),
    path('transactions/<int:transaction_id>/client-confirm/', views.client_confirm_transaction, name='transaction-client-confirm'),
    path('transactions/<int:transaction_id>/request-admin-approval/', views.request_admin_approval, name='transaction-request-admin-approval'),
    path('transactions/<int:transaction_id>/admin-decision/', views.admin_decide_transaction, name='transaction-admin-decision'),
    path('transactions/<int:transaction_id>/admin-finalize/', views.admin_finalize_transaction, name='transaction-admin-finalize'),
    path('transactions/<int:transaction_id>/besoin-details/', views.transaction_besoin_details, name='transaction-besoin-details'),
    path('transactions/<int:transaction_id>/avis/', views.transaction_avis, name='transaction-avis'),
    
    # Messages
    path('messages/', views.MessageListCreateView.as_view(), name='message-list-create'),
    path('messages/mark-read/', views.mark_messages_read, name='mark-messages-read'),
    
    # Admin endpoints
    path('admin/users/', admin_views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', admin_views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/prestations/', admin_views.AdminPrestationListView.as_view(), name='admin-prestations'),
    path('admin/categories/', admin_views.AdminCategoryListCreateView.as_view(), name='admin-categories'),
    path('admin/categories/<int:pk>/', admin_views.AdminCategoryDetailView.as_view(), name='admin-category-detail'),
    path('admin/sous-categories/', admin_views.AdminSubCategoryListCreateView.as_view(), name='admin-subcategories'),
    path('admin/sous-categories/<int:pk>/', admin_views.AdminSubCategoryDetailView.as_view(), name='admin-subcategory-detail'),
    path('admin/besoins/', admin_views.AdminBesoinListView.as_view(), name='admin-besoins'),
    path('admin/transactions/', admin_views.AdminTransactionListView.as_view(), name='admin-transactions'),
    path('admin/messages/', admin_views.AdminMessageListView.as_view(), name='admin-messages-list'),
    path('admin/statistics/', admin_views.admin_statistics, name='admin-statistics-detailed'),
    path('admin/users/<int:user_id>/toggle-status/', admin_views.toggle_user_status, name='admin-toggle-user'),
    path('admin/bulk-delete/', admin_views.bulk_delete_services, name='admin-bulk-delete'),
    path('admin/export/', admin_views.export_data, name='admin-export'),
]
