"""
Vues réservées au super administrateur : gestion des comptes d'administration.

Le super administrateur peut :
  - lister les administrateurs et super administrateurs ;
  - créer un nouveau compte d'administration ;
  - changer le rôle d'un utilisateur (promouvoir / rétrograder) ;
  - activer / désactiver un compte.

Toutes ces vues sont protégées par `IsSuperAdmin`.
"""
import platform
import time

import django
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from rest_framework import generics, permissions, serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from transport_platform.monitoring import metrics

from transport_platform.country import (
    available_countries,
    load_country,
    resolve_country_code,
    set_active_country,
)

from .models import ProfileClient, ProfileFournisseur
from .permissions import IsSuperAdmin

User = get_user_model()

ADMIN_TYPES = ('administrateur', 'super_admin')
ASSIGNABLE_ROLES = ('client', 'fournisseur', 'administrateur', 'super_admin')


def _sync_staff_flags(user):
    """Aligne is_staff / is_superuser sur le rôle métier."""
    is_admin = user.type_utilisateur in ADMIN_TYPES
    user.is_staff = is_admin
    user.is_superuser = user.type_utilisateur == 'super_admin'


def _ensure_profile(user):
    """Crée le profil métier correspondant au rôle si nécessaire."""
    if user.type_utilisateur == 'fournisseur':
        ProfileFournisseur.objects.get_or_create(user=user)
    elif user.type_utilisateur == 'client':
        ProfileClient.objects.get_or_create(user=user)


class AdminAccountSerializer(serializers.ModelSerializer):
    """Sérialise un compte d'administration (lecture)."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'type_utilisateur', 'is_active', 'date_joined', 'last_login',
            'telephone', 'est_verifie',
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class AdminAccountCreateSerializer(serializers.ModelSerializer):
    """Création d'un compte d'administration par le super administrateur."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    type_utilisateur = serializers.ChoiceField(choices=ADMIN_TYPES, default='administrateur')

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'telephone', 'type_utilisateur', 'password',
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte utilise déjà cet email.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.est_verifie = True
        _sync_staff_flags(user)
        user.save()
        return user


class SuperAdminAdminListCreateView(generics.ListCreateAPIView):
    """Liste des comptes d'administration + création d'un nouveau compte."""
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get_queryset(self):
        return User.objects.filter(type_utilisateur__in=ADMIN_TYPES).order_by('-date_joined')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminAccountCreateSerializer
        return AdminAccountSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(AdminAccountSerializer(user).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsSuperAdmin])
def set_user_role(request, user_id):
    """Change le rôle d'un utilisateur (promotion / rétrogradation)."""
    nouveau_role = request.data.get('type_utilisateur')
    if nouveau_role not in ASSIGNABLE_ROLES:
        return Response(
            {'error': "Rôle invalide.", 'roles_autorises': list(ASSIGNABLE_ROLES)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if user.id == request.user.id:
        return Response(
            {'error': "Vous ne pouvez pas modifier votre propre rôle."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Empêcher la suppression du dernier super administrateur actif.
    if user.type_utilisateur == 'super_admin' and nouveau_role != 'super_admin':
        autres = User.objects.filter(
            type_utilisateur='super_admin', is_active=True
        ).exclude(id=user.id).exists()
        if not autres:
            return Response(
                {'error': "Impossible : c'est le dernier super administrateur."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    user.type_utilisateur = nouveau_role
    _sync_staff_flags(user)
    user.save()
    _ensure_profile(user)

    return Response(AdminAccountSerializer(user).data)


def _check_database():
    """Teste la connexion DB et mesure la latence."""
    start = time.perf_counter()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        latency = round((time.perf_counter() - start) * 1000, 1)
        return {"ok": True, "latency_ms": latency, "engine": connection.vendor}
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "error": str(exc)[:300], "engine": connection.vendor}


def _pending_migrations():
    """Liste les migrations non appliquées (indice de déploiement incomplet)."""
    try:
        executor = MigrationExecutor(connection)
        targets = executor.loader.graph.leaf_nodes()
        plan = executor.migration_plan(targets)
        return [f"{migration.app_label}.{migration.name}" for migration, _ in plan]
    except Exception:  # noqa: BLE001
        return []


@api_view(['GET', 'DELETE'])
@permission_classes([permissions.IsAuthenticated, IsSuperAdmin])
def system_health(request):
    """
    Santé de la plateforme pour le super administrateur.

    GET    : état infra (DB, migrations, versions) + métriques de trafic API.
    DELETE : réinitialise les compteurs de métriques.
    """
    if request.method == 'DELETE':
        metrics.reset()
        return Response({'message': 'Compteurs de métriques réinitialisés.'})

    from django.conf import settings

    database = _check_database()
    pending = _pending_migrations()
    traffic = metrics.snapshot()

    # Statut global : dégradé si DB KO, migrations en attente, ou taux d'erreur élevé.
    status_level = 'ok'
    if not database['ok']:
        status_level = 'down'
    elif pending or traffic['error_rate'] >= 10:
        status_level = 'degraded'

    return Response({
        'status': status_level,
        'checked_at': traffic['since'],
        'database': database,
        'migrations': {'pending': pending, 'count': len(pending)},
        'runtime': {
            'python': platform.python_version(),
            'django': django.get_version(),
            'debug': bool(settings.DEBUG),
            'time_zone': settings.TIME_ZONE,
        },
        'traffic': traffic,
    })


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated, IsSuperAdmin])
def active_country(request):
    """
    GET  : liste des pays disponibles + pays actif.
    POST : change le pays actif de l'application ({"code": "bf"|"tg"}).
    """
    if request.method == 'GET':
        return Response({
            'active': resolve_country_code(),
            'countries': available_countries(),
        })

    code = (request.data.get('code') or '').strip().lower()
    try:
        data = set_active_country(code)
    except ValueError:
        return Response(
            {
                'error': "Code pays invalide.",
                'codes_autorises': [c['code'] for c in available_countries()],
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({
        'message': f"Pays de l'application défini sur « {data.get('name') or code} ».",
        'active': resolve_country_code(),
        'country': data,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsSuperAdmin])
def toggle_admin_status(request, user_id):
    """Active / désactive un compte."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if user.id == request.user.id:
        return Response(
            {'error': "Vous ne pouvez pas désactiver votre propre compte."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if user.type_utilisateur == 'super_admin' and user.is_active:
        autres = User.objects.filter(
            type_utilisateur='super_admin', is_active=True
        ).exclude(id=user.id).exists()
        if not autres:
            return Response(
                {'error': "Impossible : c'est le dernier super administrateur actif."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    user.is_active = not user.is_active
    user.save(update_fields=['is_active'])

    return Response({
        'message': f'Compte {"activé" if user.is_active else "désactivé"}.',
        'is_active': user.is_active,
    })
