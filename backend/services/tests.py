from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import ProfileClient, ProfileFournisseur
from services.models import Besoin, CategorieService, Prestation, TransactionService


User = get_user_model()


class ServicesApiTests(TestCase):
    def setUp(self):
        now = timezone.now()
        self.now = now
        self.client_api = APIClient()

        self.fournisseur = User.objects.create_user(
            username="fournisseur_srv",
            email="fournisseur_srv@example.com",
            password="TestPass123!!",
            type_utilisateur="fournisseur",
        )
        self.client_user = User.objects.create_user(
            username="client_srv",
            email="client_srv@example.com",
            password="TestPass123!!",
            type_utilisateur="client",
        )
        ProfileFournisseur.objects.update_or_create(
            user=self.fournisseur,
            defaults={
                "types_services_offerts": ["nettoyage", "entretien bureaux"],
                "zones_couverture": ["Dakar"],
            },
        )
        self.categorie = CategorieService.objects.create(nom="Nettoyage")

    def _payload_prestation(self):
        return {
            "categorie": self.categorie.id,
            "intitule": "Nettoyage bureaux",
            "description": "Service de nettoyage complet",
            "type_prestation": "nettoyage",
            "caracteristiques": {"materiel": True},
            "zones_intervention": ["Dakar"],
            "disponibilite_debut": (self.now + timedelta(hours=1)).isoformat(),
            "disponibilite_fin": (self.now + timedelta(days=2)).isoformat(),
            "mode_tarification": "forfait",
            "tarif_min": "20000.00",
            "tarif_max": "50000.00",
        }

    def _payload_besoin(self):
        return {
            "categorie": self.categorie.id,
            "intitule": "Besoin nettoyage local",
            "description": "Nettoyage après travaux",
            "type_service": "nettoyage",
            "exigences": {"urgence": "haute"},
            "lieu_intervention": "Dakar Plateau",
            "date_souhaitee": (self.now + timedelta(hours=3)).isoformat(),
            "date_limite": (self.now + timedelta(days=1)).isoformat(),
            "urgence": "haute",
            "budget": "45000.00",
            "flexible": True,
        }

    def test_categories_public_est_accessible(self):
        response = self.client_api.get(reverse("category-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_fournisseur_peut_creer_prestation(self):
        self.client_api.force_authenticate(user=self.fournisseur)
        response = self.client_api.post(
            reverse("prestation-list-create"),
            self._payload_prestation(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Prestation.objects.count(), 1)
        self.assertEqual(Prestation.objects.first().fournisseur, self.fournisseur)

    def test_fournisseur_ne_peut_pas_creer_prestation_hors_profil(self):
        self.client_api.force_authenticate(user=self.fournisseur)
        cat_info = CategorieService.objects.create(nom="Informatique & Digital")
        payload = self._payload_prestation()
        payload["categorie"] = cat_info.id
        payload["type_prestation"] = "développement logiciel"
        payload["intitule"] = "Développement ERP"
        response = self.client_api.post(
            reverse("prestation-list-create"),
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_client_ne_peut_pas_creer_prestation(self):
        self.client_api.force_authenticate(user=self.client_user)
        response = self.client_api.post(
            reverse("prestation-list-create"),
            self._payload_prestation(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_peut_creer_besoin(self):
        self.client_api.force_authenticate(user=self.client_user)
        response = self.client_api.post(
            reverse("besoin-list-create"),
            self._payload_besoin(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Besoin.objects.count(), 1)
        self.assertEqual(Besoin.objects.first().client, self.client_user)

    def test_client_peut_creer_besoin_sur_devis_sans_budget(self):
        self.client_api.force_authenticate(user=self.client_user)
        payload = self._payload_besoin()
        payload["mode_budget"] = "sur_devis"
        payload["budget"] = None
        response = self.client_api.post(
            reverse("besoin-list-create"),
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Besoin.objects.latest("id").mode_budget, "sur_devis")

    def test_client_ne_peut_pas_creer_besoin_budget_fixe_sans_budget(self):
        self.client_api.force_authenticate(user=self.client_user)
        payload = self._payload_besoin()
        payload["mode_budget"] = "budget_fixe"
        payload["budget"] = None
        response = self.client_api.post(
            reverse("besoin-list-create"),
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("budget", response.data)

    def test_client_ne_peut_pas_creer_besoin_it_sans_exigences_requises(self):
        self.client_api.force_authenticate(user=self.client_user)
        cat_it = CategorieService.objects.create(nom="Informatique & Digital")
        payload = self._payload_besoin()
        payload["categorie"] = cat_it.id
        payload["type_service"] = "Développement logiciel"
        payload["exigences"] = {"contexte_technique": "ERP interne"}  # stack_souhaitee manquante

        response = self.client_api.post(
            reverse("besoin-list-create"),
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("exigences", response.data)

    def test_client_peut_creer_besoin_it_avec_exigences_requises(self):
        self.client_api.force_authenticate(user=self.client_user)
        cat_it = CategorieService.objects.create(nom="Informatique & Digital")
        payload = self._payload_besoin()
        payload["categorie"] = cat_it.id
        payload["type_service"] = "Développement logiciel"
        payload["exigences"] = {
            "contexte_technique": "ERP interne",
            "stack_souhaitee": "Django + React",
        }

        response = self.client_api.post(
            reverse("besoin-list-create"),
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_creation_transaction_met_a_jour_statuts(self):
        prestation = Prestation.objects.create(
            fournisseur=self.fournisseur,
            categorie=self.categorie,
            intitule="Prestation transaction",
            description="desc",
            type_prestation="nettoyage",
            caracteristiques={},
            zones_intervention=["Dakar"],
            disponibilite_debut=self.now,
            disponibilite_fin=self.now + timedelta(days=1),
            mode_tarification="forfait",
            tarif_min=Decimal("10000.00"),
            tarif_max=Decimal("50000.00"),
            statut="active",
        )
        besoin = Besoin.objects.create(
            client=self.client_user,
            categorie=self.categorie,
            intitule="Besoin transaction",
            description="desc",
            type_service="nettoyage",
            exigences={},
            lieu_intervention="Dakar",
            date_souhaitee=self.now + timedelta(hours=1),
            date_limite=self.now + timedelta(days=1),
            budget=Decimal("30000.00"),
            statut="ouverte",
        )

        self.client_api.force_authenticate(user=self.client_user)
        response = self.client_api.post(
            reverse("transaction-create"),
            {
                "offer_id": prestation.id,
                "need_id": besoin.id,
                "final_price": "28000.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        prestation.refresh_from_db()
        besoin.refresh_from_db()
        self.assertEqual(prestation.statut, "inactive")
        self.assertEqual(besoin.statut, "en_cours")

    def _create_transaction_fixture(self):
        prestation = Prestation.objects.create(
            fournisseur=self.fournisseur,
            categorie=self.categorie,
            intitule="Prestation workflow",
            description="desc",
            type_prestation="nettoyage",
            caracteristiques={},
            zones_intervention=["Dakar"],
            disponibilite_debut=self.now,
            disponibilite_fin=self.now + timedelta(days=1),
            mode_tarification="forfait",
            tarif_min=Decimal("10000.00"),
            tarif_max=Decimal("50000.00"),
            statut="active",
        )
        besoin = Besoin.objects.create(
            client=self.client_user,
            categorie=self.categorie,
            intitule="Besoin workflow",
            description="desc",
            type_service="nettoyage",
            exigences={},
            lieu_intervention="Dakar",
            date_souhaitee=self.now + timedelta(hours=1),
            date_limite=self.now + timedelta(days=1),
            budget=Decimal("30000.00"),
            statut="en_cours",
        )
        return TransactionService.objects.create(
            prestation=prestation,
            besoin=besoin,
            fournisseur=self.fournisseur,
            client=self.client_user,
            prix_final=Decimal("28000.00"),
            statut="en_cours",
        )

    def _create_quote_transaction_fixture(self):
        prestation = Prestation.objects.create(
            fournisseur=self.fournisseur,
            categorie=self.categorie,
            intitule="Prestation devis",
            description="desc",
            type_prestation="nettoyage",
            caracteristiques={},
            zones_intervention=["Dakar"],
            disponibilite_debut=self.now,
            disponibilite_fin=self.now + timedelta(days=1),
            mode_tarification="devis",
            statut="active",
        )
        besoin = Besoin.objects.create(
            client=self.client_user,
            categorie=self.categorie,
            intitule="Besoin devis",
            description="desc",
            type_service="nettoyage",
            exigences={},
            lieu_intervention="Dakar",
            date_souhaitee=self.now + timedelta(hours=1),
            date_limite=self.now + timedelta(days=1),
            mode_budget="sur_devis",
            statut="en_cours",
        )
        return TransactionService.objects.create(
            prestation=prestation,
            besoin=besoin,
            fournisseur=self.fournisseur,
            client=self.client_user,
            statut="en_attente",
            devis_statut="a_proposer",
        )

    def test_workflow_fournisseur_client_cloture(self):
        tx = self._create_transaction_fixture()

        self.client_api.force_authenticate(user=self.fournisseur)
        r1 = self.client_api.post(reverse("transaction-fournisseur-work-done", kwargs={"transaction_id": tx.id}), {}, format="json")
        self.assertEqual(r1.status_code, status.HTTP_200_OK)

        self.client_api.force_authenticate(user=self.client_user)
        r2 = self.client_api.post(reverse("transaction-client-verify", kwargs={"transaction_id": tx.id}), {"approved": True}, format="json")
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        r3 = self.client_api.post(reverse("transaction-client-confirm", kwargs={"transaction_id": tx.id}), {}, format="json")
        self.assertEqual(r3.status_code, status.HTTP_200_OK)
        tx.refresh_from_db()
        self.assertEqual(tx.statut, "terminee")
        self.assertTrue(tx.fin_confirmee)

    def test_workflow_demande_validation_admin(self):
        admin = User.objects.create_user(
            username="admin_srv",
            email="admin_srv@example.com",
            password="TestPass123!!",
            type_utilisateur="administrateur",
        )
        tx = self._create_transaction_fixture()

        self.client_api.force_authenticate(user=self.fournisseur)
        self.client_api.post(reverse("transaction-fournisseur-work-done", kwargs={"transaction_id": tx.id}), {}, format="json")
        self.client_api.force_authenticate(user=self.client_user)
        self.client_api.post(reverse("transaction-client-verify", kwargs={"transaction_id": tx.id}), {"approved": True}, format="json")
        r1 = self.client_api.post(reverse("transaction-request-admin-approval", kwargs={"transaction_id": tx.id}), {}, format="json")
        self.assertEqual(r1.status_code, status.HTTP_200_OK)

        self.client_api.force_authenticate(user=admin)
        r2 = self.client_api.post(
            reverse("transaction-admin-decision", kwargs={"transaction_id": tx.id}),
            {"decision": "accepter"},
            format="json",
        )
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        tx.refresh_from_db()
        self.assertEqual(tx.validation_admin_statut, "acceptee")
        self.assertEqual(tx.statut, "terminee")

    def test_admin_decide_requires_pending_validation(self):
        admin = User.objects.create_user(
            username="admin_decide_chk",
            email="admin_decide_chk@example.com",
            password="TestPass123!!",
            type_utilisateur="administrateur",
        )
        tx = self._create_transaction_fixture()
        self.client_api.force_authenticate(user=admin)
        r = self.client_api.post(
            reverse("transaction-admin-decision", kwargs={"transaction_id": tx.id}),
            {"decision": "accepter"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_finalize_closes_when_ready(self):
        admin = User.objects.create_user(
            username="admin_fin",
            email="admin_fin@example.com",
            password="TestPass123!!",
            type_utilisateur="administrateur",
        )
        tx = self._create_transaction_fixture()
        self.client_api.force_authenticate(user=self.fournisseur)
        self.client_api.post(reverse("transaction-fournisseur-work-done", kwargs={"transaction_id": tx.id}), {}, format="json")
        self.client_api.force_authenticate(user=self.client_user)
        self.client_api.post(
            reverse("transaction-client-verify", kwargs={"transaction_id": tx.id}), {"approved": True}, format="json"
        )

        self.client_api.force_authenticate(user=admin)
        r = self.client_api.post(
            reverse("transaction-admin-finalize", kwargs={"transaction_id": tx.id}), {}, format="json"
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        tx.refresh_from_db()
        self.assertEqual(tx.statut, "terminee")
        self.assertTrue(tx.fin_confirmee)

    def test_admin_finalize_blocked_when_admin_validation_pending(self):
        admin = User.objects.create_user(
            username="admin_fin_blk",
            email="admin_fin_blk@example.com",
            password="TestPass123!!",
            type_utilisateur="administrateur",
        )
        tx = self._create_transaction_fixture()
        self.client_api.force_authenticate(user=self.fournisseur)
        self.client_api.post(reverse("transaction-fournisseur-work-done", kwargs={"transaction_id": tx.id}), {}, format="json")
        self.client_api.force_authenticate(user=self.client_user)
        self.client_api.post(
            reverse("transaction-client-verify", kwargs={"transaction_id": tx.id}), {"approved": True}, format="json"
        )
        self.client_api.post(reverse("transaction-request-admin-approval", kwargs={"transaction_id": tx.id}), {}, format="json")

        self.client_api.force_authenticate(user=admin)
        r = self.client_api.post(
            reverse("transaction-admin-finalize", kwargs={"transaction_id": tx.id}), {}, format="json"
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_workflow_devis_fournisseur_puis_acceptation_client(self):
        tx = self._create_quote_transaction_fixture()

        self.client_api.force_authenticate(user=self.fournisseur)
        r1 = self.client_api.post(
            reverse("transaction-fournisseur-propose-devis", kwargs={"transaction_id": tx.id}),
            {"montant": "32000.00", "description": "Nettoyage + désinfection"},
            format="json",
        )
        self.assertEqual(r1.status_code, status.HTTP_200_OK)
        tx.refresh_from_db()
        self.assertEqual(tx.devis_statut, "en_attente_client")

        self.client_api.force_authenticate(user=self.client_user)
        r2 = self.client_api.post(
            reverse("transaction-client-respond-devis", kwargs={"transaction_id": tx.id}),
            {"decision": "accepter"},
            format="json",
        )
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        tx.refresh_from_db()
        self.assertEqual(tx.devis_statut, "accepte_client")
        self.assertEqual(tx.prix_final, Decimal("32000.00"))
        self.assertEqual(tx.statut, "acceptee")

    def test_devis_non_accepte_bloque_demarrage_travail(self):
        tx = self._create_quote_transaction_fixture()
        self.client_api.force_authenticate(user=self.fournisseur)
        r = self.client_api.post(
            reverse("transaction-fournisseur-work-done", kwargs={"transaction_id": tx.id}),
            {},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_devis_rejet_client_repasse_en_rejete(self):
        tx = self._create_quote_transaction_fixture()
        self.client_api.force_authenticate(user=self.fournisseur)
        self.client_api.post(
            reverse("transaction-fournisseur-propose-devis", kwargs={"transaction_id": tx.id}),
            {"montant": "40000.00"},
            format="json",
        )

        self.client_api.force_authenticate(user=self.client_user)
        r = self.client_api.post(
            reverse("transaction-client-respond-devis", kwargs={"transaction_id": tx.id}),
            {"decision": "rejeter"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        tx.refresh_from_db()
        self.assertEqual(tx.devis_statut, "rejete_client")
        self.assertIsNone(tx.prix_final)

    def test_devis_montant_invalide_refuse(self):
        tx = self._create_quote_transaction_fixture()
        self.client_api.force_authenticate(user=self.fournisseur)
        r = self.client_api.post(
            reverse("transaction-fournisseur-propose-devis", kwargs={"transaction_id": tx.id}),
            {"montant": "-1000"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_seul_le_client_peut_repondre_au_devis(self):
        tx = self._create_quote_transaction_fixture()
        self.client_api.force_authenticate(user=self.fournisseur)
        self.client_api.post(
            reverse("transaction-fournisseur-propose-devis", kwargs={"transaction_id": tx.id}),
            {"montant": "40000.00"},
            format="json",
        )
        # Le fournisseur ne peut pas répondre à son propre devis.
        r = self.client_api.post(
            reverse("transaction-client-respond-devis", kwargs={"transaction_id": tx.id}),
            {"decision": "accepter"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_ne_peut_pas_proposer_devis(self):
        tx = self._create_quote_transaction_fixture()
        self.client_api.force_authenticate(user=self.client_user)
        r = self.client_api.post(
            reverse("transaction-fournisseur-propose-devis", kwargs={"transaction_id": tx.id}),
            {"montant": "40000.00"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_propose_devis_refuse_si_collaboration_sans_devis(self):
        tx = self._create_transaction_fixture()  # forfait, mode_budget budget fixe
        self.client_api.force_authenticate(user=self.fournisseur)
        r = self.client_api.post(
            reverse("transaction-fournisseur-propose-devis", kwargs={"transaction_id": tx.id}),
            {"montant": "40000.00"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_repondre_devis_sans_devis_en_attente_refuse(self):
        tx = self._create_quote_transaction_fixture()  # devis_statut a_proposer
        self.client_api.force_authenticate(user=self.client_user)
        r = self.client_api.post(
            reverse("transaction-client-respond-devis", kwargs={"transaction_id": tx.id}),
            {"decision": "accepter"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)


class AdminPremiumTests(TestCase):
    """Activation/désactivation du statut Premium client par l'administrateur."""

    def setUp(self):
        self.api = APIClient()
        self.admin = User.objects.create_user(
            username="admin_premium",
            email="admin_premium@example.com",
            password="TestPass123!!",
            type_utilisateur="administrateur",
        )
        self.client_user = User.objects.create_user(
            username="client_premium_admin",
            email="client_premium_admin@example.com",
            password="TestPass123!!",
            type_utilisateur="client",
        )
        ProfileClient.objects.get_or_create(user=self.client_user)

    def _detail_url(self):
        return reverse("admin-user-detail", kwargs={"pk": self.client_user.id})

    def test_admin_active_le_premium_client(self):
        self.api.force_authenticate(user=self.admin)
        response = self.api.patch(
            self._detail_url(),
            {"client_abonnement_type": "premium", "client_abonnement_actif": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("client_matching_self_service"))

        profile = ProfileClient.objects.get(user=self.client_user)
        self.assertEqual(profile.abonnement_type, "premium")
        self.assertTrue(profile.abonnement_actif)
        self.assertTrue(profile.can_self_launch_matching())

    def test_admin_desactive_le_premium_client(self):
        profile = ProfileClient.objects.get(user=self.client_user)
        profile.abonnement_type = "premium"
        profile.abonnement_actif = True
        profile.save()

        self.api.force_authenticate(user=self.admin)
        response = self.api.patch(
            self._detail_url(),
            {"client_abonnement_actif": False},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data.get("client_matching_self_service"))
        profile.refresh_from_db()
        self.assertFalse(profile.can_self_launch_matching())

    def test_client_ne_peut_pas_modifier_le_premium(self):
        self.api.force_authenticate(user=self.client_user)
        response = self.api.patch(
            self._detail_url(),
            {"client_abonnement_type": "premium", "client_abonnement_actif": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        profile = ProfileClient.objects.get(user=self.client_user)
        self.assertFalse(profile.can_self_launch_matching())
