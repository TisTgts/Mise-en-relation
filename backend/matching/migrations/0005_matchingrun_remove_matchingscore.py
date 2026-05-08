import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def migrer_scores_vers_run_unique(apps, schema_editor):
    MatchingScore = apps.get_model("matching", "MatchingScore")
    MatchingRun = apps.get_model("matching", "MatchingRun")
    correspondances = []
    for row in MatchingScore.objects.all().order_by("calculated_at"):
        correspondances.append(
            {
                "besoin_id": row.besoin_id,
                "prestation_id": row.prestation_id,
                "score": float(row.score),
                "details": row.details or {},
                "calculated_at": row.calculated_at.isoformat() if row.calculated_at else None,
            }
        )
    if correspondances:
        MatchingRun.objects.create(lance_par=None, correspondances=correspondances)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("matching", "0004_alter_matchingscore_need_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="MatchingRun",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("lance_le", models.DateTimeField(auto_now_add=True, verbose_name="Date d'exécution")),
                ("correspondances", models.JSONField(default=list, verbose_name="Correspondances")),
                (
                    "lance_par",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="matching_runs_lances",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Lancé par",
                    ),
                ),
            ],
            options={
                "verbose_name": "Exécution de matching",
                "verbose_name_plural": "Exécutions de matching",
                "ordering": ["-lance_le"],
            },
        ),
        migrations.RunPython(migrer_scores_vers_run_unique, noop_reverse),
        migrations.DeleteModel(name="MatchingScore"),
    ]
