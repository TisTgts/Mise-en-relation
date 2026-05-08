from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0008_alter_profileclient_frequence_besoins"),
    ]

    operations = [
        migrations.AddField(
            model_name="profilefournisseur",
            name="abonnement_actif",
            field=models.BooleanField(default=True, verbose_name="Abonnement actif"),
        ),
        migrations.AddField(
            model_name="profilefournisseur",
            name="abonnement_debut",
            field=models.DateField(blank=True, null=True, verbose_name="Début abonnement"),
        ),
        migrations.AddField(
            model_name="profilefournisseur",
            name="abonnement_fin",
            field=models.DateField(blank=True, null=True, verbose_name="Fin abonnement"),
        ),
        migrations.AddField(
            model_name="profilefournisseur",
            name="abonnement_type",
            field=models.CharField(
                choices=[("standard", "Standard"), ("premium", "Premium")],
                default="standard",
                max_length=20,
                verbose_name="Type d'abonnement",
            ),
        ),
    ]
