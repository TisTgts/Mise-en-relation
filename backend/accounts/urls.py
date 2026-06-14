from django.urls import path
from . import views, dashboard_views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('user/', views.user_profile_view, name='user_profile'),
    path('me/', views.CurrentUserView.as_view(), name='current_user'),
    path('token/refresh/', views.ThrottledTokenRefreshView.as_view(), name='token_refresh'),
    
    # Admin endpoints
    path('users/', views.UserListView.as_view(), name='users_list'),
    
    # Endpoints pour les deux types d'utilisateurs
    path('providers/', views.ProviderListView.as_view(), name='providers_list'),
    path('client-providers/', views.ClientProviderListView.as_view(), name='client_providers_list'),
    
    # Dashboards spécifiques
    path('dashboard/', dashboard_views.dashboard_router, name='dashboard_router'),
    path('dashboard/provider/', dashboard_views.ProviderDashboardView.as_view(), name='provider_dashboard'),
    path('dashboard/client-provider/', dashboard_views.ClientDashboardView.as_view(), name='client_dashboard'),
    path('capabilities/', dashboard_views.user_capabilities, name='user_capabilities'),
]
