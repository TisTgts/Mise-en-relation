from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0013_besoin_mode_budget_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='piece_jointe',
            field=models.FileField(
                blank=True,
                null=True,
                upload_to='workspace_files/%Y/%m/',
                verbose_name='Pièce jointe',
            ),
        ),
    ]

