from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_rename_frequence_demandes_to_frequence_besoins'),
    ]

    operations = [
        migrations.AddField(
            model_name='profileclient',
            name='emplacement',
            field=models.JSONField(blank=True, default=dict, verbose_name='Emplacement (géolocalisation)'),
        ),
        migrations.AddField(
            model_name='profilefournisseur',
            name='emplacement',
            field=models.JSONField(blank=True, default=dict, verbose_name='Emplacement (géolocalisation)'),
        ),
    ]
