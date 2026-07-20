from django.urls import path
from . import views, dashboard_views, super_admin_views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('password-reset/', views.password_reset_request, name='password_reset_request'),
    path('password-reset/confirm/', views.password_reset_confirm, name='password_reset_confirm'),
    path('push-token/', views.push_token_view, name='push_token'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('user/', views.user_profile_view, name='user_profile'),
    path('me/', views.CurrentUserView.as_view(), name='current_user'),
    path('token/refresh/', views.ThrottledTokenRefreshView.as_view(), name='token_refresh'),
    
    # Admin endpoints
    path('users/', views.UserListView.as_view(), name='users_list'),

    # Super administrateur : gestion des comptes d'administration
    path('super-admin/admins/', super_admin_views.SuperAdminAdminListCreateView.as_view(), name='superadmin_admins'),
    path('super-admin/users/<int:user_id>/set-role/', super_admin_views.set_user_role, name='superadmin_set_role'),
    path('super-admin/users/<int:user_id>/toggle-status/', super_admin_views.toggle_admin_status, name='superadmin_toggle_status'),
    path('super-admin/country/', super_admin_views.active_country, name='superadmin_country'),
    path('super-admin/health/', super_admin_views.system_health, name='superadmin_health'),
    
    # Endpoints pour les deux types d'utilisateurs
    path('providers/', views.ProviderListView.as_view(), name='providers_list'),
    path('client-providers/', views.ClientProviderListView.as_view(), name='client_providers_list'),
    
    # Dashboards spécifiques
    path('dashboard/', dashboard_views.dashboard_router, name='dashboard_router'),
    path('dashboard/provider/', dashboard_views.ProviderDashboardView.as_view(), name='provider_dashboard'),
    path('dashboard/client-provider/', dashboard_views.ClientDashboardView.as_view(), name='client_dashboard'),
    path('capabilities/', dashboard_views.user_capabilities, name='user_capabilities'),
]
