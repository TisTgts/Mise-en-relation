from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_align_profilefournisseur_with_model'),
    ]

    operations = [
        migrations.RenameField(
            model_name='profileclient',
            old_name='frequence_demandes',
            new_name='frequence_besoins',
        ),
    ]
