from django.contrib import admin
from .models import MatchingRule, MatchingScore

@admin.register(MatchingRule)
class MatchingRuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'rule_type', 'weight', 'is_active', 'created_at']
    list_filter = ['rule_type', 'is_active', 'created_at']
    search_fields = ['name', 'rule_type']
    list_editable = ['weight', 'is_active']

@admin.register(MatchingScore)
class MatchingScoreAdmin(admin.ModelAdmin):
    list_display = ['offer', 'need', 'score', 'calculated_at']
    list_filter = ['score', 'calculated_at']
    search_fields = ['offer__title', 'need__title']
    readonly_fields = ['calculated_at']
    date_hierarchy = 'calculated_at'
