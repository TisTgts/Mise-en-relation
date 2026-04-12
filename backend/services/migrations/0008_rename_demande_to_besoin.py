from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0007_rename_roles_prestataire_fournisseur_client'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Demande',
            new_name='Besoin',
        ),
        migrations.RenameField(
            model_name='transactionservice',
            old_name='demande',
            new_name='besoin',
        ),
    ]
