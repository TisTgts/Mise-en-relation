import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('matching', '0002_alter_matchingscore_need_alter_matchingscore_offer'),
        ('services', '0008_rename_demande_to_besoin'),
    ]

    operations = [
        migrations.AlterField(
            model_name='matchingscore',
            name='need',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='matching_scores',
                to='services.besoin',
            ),
        ),
    ]
