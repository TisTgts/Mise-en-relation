from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_add_abonnement_fields_profilefournisseur"),
    ]

    operations = [
        migrations.AddField(
            model_name="profileclient",
            name="abonnement_actif",
            field=models.BooleanField(default=False, verbose_name="Abonnement premium actif"),
        ),
        migrations.AddField(
            model_name="profileclient",
            name="abonnement_debut",
            field=models.DateField(blank=True, null=True, verbose_name="Début abonnement premium"),
        ),
        migrations.AddField(
            model_name="profileclient",
            name="abonnement_fin",
            field=models.DateField(blank=True, null=True, verbose_name="Fin abonnement premium"),
        ),
        migrations.AddField(
            model_name="profileclient",
            name="abonnement_type",
            field=models.CharField(
                choices=[("standard", "Standard"), ("premium", "Premium")],
                default="standard",
                max_length=20,
                verbose_name="Type de compte client",
            ),
        ),
    ]
