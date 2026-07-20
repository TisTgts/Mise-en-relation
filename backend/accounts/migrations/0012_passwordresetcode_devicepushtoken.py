# Generated manually

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0011_add_super_admin_type'),
    ]

    operations = [
        migrations.CreateModel(
            name='PasswordResetCode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=10, verbose_name='Code')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('used_at', models.DateTimeField(blank=True, null=True)),
                ('expires_at', models.DateTimeField(verbose_name='Expire le')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='password_reset_codes', to=settings.AUTH_USER_MODEL, verbose_name='Utilisateur')),
            ],
            options={
                'verbose_name': 'Code de réinitialisation',
                'verbose_name_plural': 'Codes de réinitialisation',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='DevicePushToken',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.CharField(max_length=255, unique=True, verbose_name='Token Expo')),
                ('platform', models.CharField(blank=True, max_length=20, verbose_name='Plateforme')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='push_tokens', to=settings.AUTH_USER_MODEL, verbose_name='Utilisateur')),
            ],
            options={
                'verbose_name': 'Token push',
                'verbose_name_plural': 'Tokens push',
                'ordering': ['-updated_at'],
            },
        ),
    ]
