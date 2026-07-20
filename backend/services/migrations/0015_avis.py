# Generated manually for Avis model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('services', '0014_message_piece_jointe'),
    ]

    operations = [
        migrations.CreateModel(
            name='Avis',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('note', models.PositiveSmallIntegerField(verbose_name='Note')),
                ('commentaire', models.TextField(blank=True, verbose_name='Commentaire')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('auteur', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='avis_rediges', to=settings.AUTH_USER_MODEL, verbose_name='Auteur')),
                ('fournisseur', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='avis_recus', to=settings.AUTH_USER_MODEL, verbose_name='Fournisseur')),
                ('transaction', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='avis', to='services.transactionservice', verbose_name='Transaction')),
            ],
            options={
                'verbose_name': 'Avis',
                'verbose_name_plural': 'Avis',
                'ordering': ['-created_at'],
            },
        ),
    ]
