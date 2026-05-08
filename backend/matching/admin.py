from django.contrib import admin

from .models import MatchingRule, MatchingRun


@admin.register(MatchingRule)
class MatchingRuleAdmin(admin.ModelAdmin):
    list_display = ["name", "rule_type", "weight", "is_active", "created_at"]
    list_filter = ["rule_type", "is_active", "created_at"]
    search_fields = ["name", "rule_type"]
    list_editable = ["weight", "is_active"]


@admin.register(MatchingRun)
class MatchingRunAdmin(admin.ModelAdmin):
    list_display = ["id", "lance_le", "lance_par", "nombre_correspondances"]
    list_filter = ["lance_le"]
    readonly_fields = ["lance_le"]
    search_fields = ["lance_par__username"]

    def nombre_correspondances(self, obj):
        return len(obj.correspondances or [])

    nombre_correspondances.short_description = "Nb correspondances"
