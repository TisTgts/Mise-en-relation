from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0010_add_abonnement_fields_profileclient"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="type_utilisateur",
            field=models.CharField(
                choices=[
                    ("client", "Client - Exprime les besoins"),
                    ("fournisseur", "Fournisseur - Offre les services"),
                    ("administrateur", "Administrateur"),
                    ("super_admin", "Super administrateur"),
                ],
                default="client",
                max_length=20,
                verbose_name="Type d'utilisateur",
            ),
        ),
    ]
