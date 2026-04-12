# Generated manually — aligne les noms de champs avec la terminologie métier :
# prestataire → fournisseur (offre de service), fournisseur (sur Demande) → client (demande de service).

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0006_delete_serviceneed_delete_serviceoffer_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='transactionservice',
            old_name='fournisseur',
            new_name='client',
        ),
        migrations.RenameField(
            model_name='transactionservice',
            old_name='prestataire',
            new_name='fournisseur',
        ),
        migrations.RenameField(
            model_name='prestation',
            old_name='prestataire',
            new_name='fournisseur',
        ),
        migrations.RenameField(
            model_name='demande',
            old_name='fournisseur',
            new_name='client',
        ),
    ]
