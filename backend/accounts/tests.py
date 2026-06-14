from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import ProfileClient, ProfileFournisseur


User = get_user_model()


class AccountsApiTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.password = "TestPass123!!"

    def test_register_client_cree_utilisateur_et_profil(self):
        payload = {
            "username": "client_api",
            "email": "client_api@example.com",
            "first_name": "Client",
            "last_name": "API",
            "telephone": "770000001",
            "type_utilisateur": "client",
            "password": self.password,
            "password_confirm": self.password,
        }

        response = self.client_api.post(reverse("register"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        user = User.objects.get(username="client_api")
        self.assertEqual(user.type_utilisateur, "client")
        self.assertTrue(ProfileClient.objects.filter(user=user).exists())

    def test_register_fournisseur_cree_profil_fournisseur(self):
        payload = {
            "username": "fournisseur_api",
            "email": "fournisseur_api@example.com",
            "first_name": "Fournisseur",
            "last_name": "API",
            "telephone": "770000002",
            "type_utilisateur": "fournisseur",
            "password": self.password,
            "password_confirm": self.password,
        }

        response = self.client_api.post(reverse("register"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="fournisseur_api")
        self.assertTrue(ProfileFournisseur.objects.filter(user=user).exists())

    def test_login_et_endpoint_me(self):
        user = User.objects.create_user(
            username="user_login",
            email="user_login@example.com",
            password=self.password,
            type_utilisateur="client",
        )

        login_response = self.client_api.post(
            reverse("login"),
            {"email": user.email, "password": self.password},
            format="json",
        )

        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_response.data)
        token = login_response.data["access"]

        self.client_api.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        me_response = self.client_api.get(reverse("current_user"))

        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data["username"], user.username)


class AuthRateLimitTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client_api = APIClient()
        self.password = "TestPass123!!"
        User.objects.create_user(
            username="throttle_user",
            email="throttle@example.com",
            password=self.password,
            type_utilisateur="client",
        )

    def test_login_rate_limit_retourne_429(self):
        url = reverse("login")
        payload = {"email": "throttle@example.com", "password": "wrong-password"}

        for _ in range(5):
            response = self.client_api.post(url, payload, format="json")
            self.assertIn(response.status_code, (status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED))

        blocked = self.client_api.post(url, payload, format="json")
        self.assertEqual(blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn("detail", blocked.data)
