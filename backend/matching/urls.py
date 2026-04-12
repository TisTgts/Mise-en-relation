from django.urls import path
from . import views

urlpatterns = [
    path('find-matches/need/<int:need_id>/', views.find_matches_for_need, name='find-matches-need'),
    path('find-matches/offer/<int:offer_id>/', views.find_matches_for_offer, name='find-matches-offer'),
    path('scores/', views.get_matching_scores, name='matching-scores'),
]
