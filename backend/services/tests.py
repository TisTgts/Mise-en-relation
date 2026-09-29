from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import ProfileClient, ProfileFournisseur
from services.besoin_fields import (
    fields_for_category,
    required_fields_for_besoin_category,
    service_types_for_category,
)
from services.models import Besoin, CategorieService, Prestation, TransactionService
from services.prestation_fields import prestation_fields_for_category


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
        payload["exigences"] = {"structure": "Boutique / commerce"}  # objectif manquant

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
            "structure": "Boutique / commerce",
            "objectif": "Suivre mes ventes et mon stock",
        }

        response = self.client_api.post(
            reverse("besoin-list-create"),
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        besoin_id = response.data["id"]
        detail = self.client_api.get(reverse("besoin-detail", args=[besoin_id]))
        labels = {item["key"]: item["label"] for item in detail.data["exigences_detail"]}
        self.assertEqual(labels["objectif"], "Qu'est-ce que vous voulez obtenir ?")

    def test_modification_besoin_ancien_format_sans_toucher_exigences(self):
        cat_it = CategorieService.objects.create(nom="Informatique & Digital")
        besoin = Besoin.objects.create(
            client=self.client_user,
            categorie=cat_it,
            intitule="Ancien besoin",
            description="Créé avec les anciennes questions",
            type_service="Développement logiciel",
            exigences={"contexte_technique": "ERP interne", "stack_souhaitee": "Django"},
            lieu_intervention="Lomé",
            mode_budget="a_negocier",
        )
        self.client_api.force_authenticate(user=self.client_user)
        response = self.client_api.patch(
            reverse("besoin-detail", args=[besoin.id]),
            {"intitule": "Ancien besoin renommé"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

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


CATEGORIES_AVEC_QUESTIONS = [
    "Transport & Logistique",
    "Informatique & Digital",
    "BTP & Travaux",
    "Maintenance & Réparation",
]
CATEGORIES_SANS_QUESTIONS = [
    "Nettoyage & Entretien",
    "Services a domicile",
    "Securite",
]


class CreationParCategorieTests(TestCase):
    """Création de besoins et de prestations pour chaque catégorie de la plateforme."""

    def setUp(self):
        self.now = timezone.now()
        self.api = APIClient()
        self.client_user = User.objects.create_user(
            username="client_cat",
            email="client_cat@example.com",
            password="TestPass123!!",
            type_utilisateur="client",
        )
        self.categories = {
            nom: CategorieService.objects.create(nom=nom)
            for nom in CATEGORIES_AVEC_QUESTIONS + CATEGORIES_SANS_QUESTIONS
        }

    @staticmethod
    def _answer(field):
        if field["type"] == "select":
            return field["options"][0]
        return f"Réponse test pour {field['key']}"

    def _exigences(self, nom, only_required=False):
        return {
            field["key"]: self._answer(field)
            for field in fields_for_category(nom)
            if field["required"] or not only_required
        }

    def _payload_besoin(self, nom, **overrides):
        types = service_types_for_category(nom)
        payload = {
            "categorie": self.categories[nom].id,
            "intitule": f"Besoin {nom}",
            "description": f"Description du besoin {nom}",
            "type_service": types[0] if types else nom,
            "exigences": self._exigences(nom),
            "lieu_intervention": "Lomé, Bè",
            "date_souhaitee": (self.now + timedelta(days=1)).isoformat(),
            "date_limite": (self.now + timedelta(days=7)).isoformat(),
            "urgence": "normale",
            "mode_budget": "budget_fixe",
            "budget": "50000.00",
        }
        payload.update(overrides)
        return payload

    def _post_besoin(self, payload):
        self.api.force_authenticate(user=self.client_user)
        return self.api.post(reverse("besoin-list-create"), payload, format="json")

    def _fournisseur_pour(self, nom, services):
        user = User.objects.create_user(
            username=f"fourn_{CategorieService.objects.get(nom=nom).id}",
            email=f"fourn_{CategorieService.objects.get(nom=nom).id}@example.com",
            password="TestPass123!!",
            type_utilisateur="fournisseur",
        )
        ProfileFournisseur.objects.update_or_create(
            user=user,
            defaults={"types_services_offerts": services, "zones_couverture": ["Lomé"]},
        )
        return user

    def _payload_prestation(self, nom, type_prestation):
        return {
            "categorie": self.categories[nom].id,
            "intitule": f"{type_prestation} - offre test",
            "description": f"Prestation {type_prestation} dans la catégorie {nom}",
            "type_prestation": type_prestation,
            "caracteristiques": {},
            "zones_intervention": ["Lomé"],
            "disponibilite_debut": (self.now + timedelta(hours=1)).isoformat(),
            "disponibilite_fin": (self.now + timedelta(days=30)).isoformat(),
            "mode_tarification": "forfait",
            "tarif_min": "10000.00",
            "tarif_max": "80000.00",
        }

    def test_chaque_categorie_configuree_expose_ses_questions(self):
        response = self.api.get(reverse("category-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        par_nom = {item["nom"]: item for item in data}
        for nom in CATEGORIES_AVEC_QUESTIONS:
            with self.subTest(categorie=nom):
                self.assertTrue(par_nom[nom]["champs_specifiques"])
                self.assertTrue(par_nom[nom]["types_service_suggeres"])
                self.assertTrue(required_fields_for_besoin_category(nom))
        for nom in CATEGORIES_SANS_QUESTIONS:
            with self.subTest(categorie=nom):
                self.assertEqual(par_nom[nom]["champs_specifiques"], [])

    def test_creation_besoin_complet_pour_chaque_categorie(self):
        for nom in CATEGORIES_AVEC_QUESTIONS + CATEGORIES_SANS_QUESTIONS:
            with self.subTest(categorie=nom):
                response = self._post_besoin(self._payload_besoin(nom))
                self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

                detail = self.api.get(reverse("besoin-detail", args=[response.data["id"]]))
                self.assertEqual(detail.status_code, status.HTTP_200_OK)
                labels = {item["key"]: item["label"] for item in detail.data["exigences_detail"]}
                for field in fields_for_category(nom):
                    self.assertEqual(labels.get(field["key"]), field["label"])

    def test_creation_besoin_avec_seulement_les_questions_obligatoires(self):
        for nom in CATEGORIES_AVEC_QUESTIONS:
            with self.subTest(categorie=nom):
                payload = self._payload_besoin(nom, exigences=self._exigences(nom, only_required=True))
                response = self._post_besoin(payload)
                self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_creation_besoin_pour_chaque_type_de_service_suggere(self):
        for nom in CATEGORIES_AVEC_QUESTIONS:
            for type_service in service_types_for_category(nom):
                with self.subTest(categorie=nom, type_service=type_service):
                    response = self._post_besoin(self._payload_besoin(nom, type_service=type_service))
                    self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_creation_besoin_sur_devis_pour_chaque_categorie(self):
        for nom in CATEGORIES_AVEC_QUESTIONS + CATEGORIES_SANS_QUESTIONS:
            with self.subTest(categorie=nom):
                payload = self._payload_besoin(nom, mode_budget="sur_devis", budget=None)
                response = self._post_besoin(payload)
                self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_question_obligatoire_manquante_refusee_avec_message_clair(self):
        for nom in CATEGORIES_AVEC_QUESTIONS:
            for field in fields_for_category(nom):
                if not field["required"]:
                    continue
                with self.subTest(categorie=nom, champ=field["key"]):
                    exigences = self._exigences(nom)
                    exigences[field["key"]] = "   "
                    response = self._post_besoin(self._payload_besoin(nom, exigences=exigences))
                    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                    message = str(response.data["exigences"])
                    self.assertIn("Merci de répondre à", message)
                    self.assertIn(field["label"], message)

    def test_creation_prestation_pour_chaque_type_de_service(self):
        for nom in CATEGORIES_AVEC_QUESTIONS:
            types = service_types_for_category(nom)
            fournisseur = self._fournisseur_pour(nom, types)
            self.api.force_authenticate(user=fournisseur)
            for type_prestation in types:
                with self.subTest(categorie=nom, type_prestation=type_prestation):
                    response = self.api.post(
                        reverse("prestation-list-create"),
                        self._payload_prestation(nom, type_prestation),
                        format="json",
                    )
                    self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_chaque_categorie_expose_des_questions_fournisseur(self):
        response = self.api.get(reverse("category-list"))
        data = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        for item in data:
            with self.subTest(categorie=item["nom"]):
                self.assertTrue(item["champs_prestation"])

    def test_prestation_precisions_affichees_avec_libelles(self):
        for nom in CATEGORIES_AVEC_QUESTIONS + CATEGORIES_SANS_QUESTIONS:
            with self.subTest(categorie=nom):
                types = service_types_for_category(nom) or [nom]
                fournisseur = self._fournisseur_pour(nom, types)
                self.api.force_authenticate(user=fournisseur)
                questions = prestation_fields_for_category(nom)
                payload = self._payload_prestation(nom, types[0])
                payload["caracteristiques"] = {q["key"]: self._answer(q) for q in questions}
                payload["disponibilite_fin"] = None
                response = self.api.post(reverse("prestation-list-create"), payload, format="json")
                self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

                detail = self.api.get(reverse("prestation-detail", args=[response.data["id"]]))
                labels = {item["key"]: item["label"] for item in detail.data["caracteristiques_detail"]}
                for q in questions:
                    self.assertEqual(labels.get(q["key"]), q["label"])

    def test_prestation_dates_et_prix_incoherents_refuses(self):
        nom = "BTP & Travaux"
        fournisseur = self._fournisseur_pour(nom, ["Plomberie"])
        self.api.force_authenticate(user=fournisseur)

        payload = self._payload_prestation(nom, "Plomberie")
        payload["disponibilite_fin"] = (self.now - timedelta(days=1)).isoformat()
        response = self.api.post(reverse("prestation-list-create"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("disponibilite_fin", response.data)

        payload = self._payload_prestation(nom, "Plomberie")
        payload["tarif_min"], payload["tarif_max"] = "90000.00", "10000.00"
        response = self.api.post(reverse("prestation-list-create"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("tarif_max", response.data)

    def test_creation_prestation_categories_sans_questions(self):
        for nom in CATEGORIES_SANS_QUESTIONS:
            with self.subTest(categorie=nom):
                fournisseur = self._fournisseur_pour(nom, [nom])
                self.api.force_authenticate(user=fournisseur)
                response = self.api.post(
                    reverse("prestation-list-create"),
                    self._payload_prestation(nom, nom),
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)


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
