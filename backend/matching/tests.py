from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from matching.models import MatchingRun
from matching.services import MatchingService
from accounts.models import ProfileClient, ProfileFournisseur
from services.models import Besoin, CategorieService, Prestation


User = get_user_model()


class MatchingBaseTestCase(TestCase):
    def setUp(self):
        now = timezone.now()

        self.client_user = User.objects.create_user(
            username="client_test",
            password="secret123",
            type_utilisateur="client",
        )
        self.fournisseur_user = User.objects.create_user(
            username="fournisseur_test",
            password="secret123",
            type_utilisateur="fournisseur",
            est_verifie=True,
        )
        self.autre_client = User.objects.create_user(
            username="autre_client",
            password="secret123",
            type_utilisateur="client",
        )

        self.categorie = CategorieService.objects.create(
            nom="Plomberie",
            description="Travaux de plomberie",
        )

        self.besoin = Besoin.objects.create(
            client=self.client_user,
            categorie=self.categorie,
            intitule="Réparation fuite",
            description="Fuite sous évier",
            type_service="plomberie",
            exigences={"urgence": "normale"},
            lieu_intervention="Dakar Plateau",
            date_souhaitee=now + timedelta(hours=2),
            date_limite=now + timedelta(days=1),
            budget=Decimal("50000.00"),
            statut="ouverte",
        )

        self.prestation = Prestation.objects.create(
            fournisseur=self.fournisseur_user,
            categorie=self.categorie,
            intitule="Service plomberie rapide",
            description="Intervention plomberie",
            type_prestation="plomberie",
            caracteristiques={"equipements": ["cle", "joint"]},
            zones_intervention=["Dakar", "Plateau"],
            disponibilite_debut=now,
            disponibilite_fin=now + timedelta(days=2),
            mode_tarification="forfait",
            tarif_min=Decimal("30000.00"),
            tarif_max=Decimal("70000.00"),
            statut="active",
        )

        # Coordonnées proches par défaut (dans le périmètre).
        profile_f, _ = ProfileFournisseur.objects.get_or_create(user=self.fournisseur_user)
        profile_f.emplacement = {"latitude": 14.7167, "longitude": -17.4677}
        profile_f.save(update_fields=["emplacement"])

        profile_c, _ = ProfileClient.objects.get_or_create(user=self.client_user)
        profile_c.emplacement = {"latitude": 14.7300, "longitude": -17.4500}
        profile_c.abonnement_type = "premium"
        profile_c.abonnement_actif = True
        profile_c.save(update_fields=["emplacement", "abonnement_type", "abonnement_actif"])

        self.api_client = APIClient()


class MatchingServiceTests(MatchingBaseTestCase):
    def test_calcul_score_global_retourne_details_attendus(self):
        service = MatchingService()

        score, details = service.calculate_overall_score(self.prestation, self.besoin)

        self.assertGreater(score, Decimal("0"))
        self.assertIn("weights", details)
        self.assertIn("scores", details)
        self.assertIn("competence", details["scores"])
        self.assertIn("geographie", details["scores"])
        self.assertIn("disponibilite", details["scores"])
        self.assertIn("fiabilite", details["scores"])
        self.assertIn("prix", details["scores"])
        self.assertIn("abonnement", details["scores"])
        self.assertIn("meta", details)
        self.assertIn("category_compatibility_level", details["meta"])

    def test_compatibilite_categorie_meme_famille(self):
        """Même catégorie principale, sous-catégories différentes → niveau 2 (pas 0)."""
        from services.models import SousCategorieService

        service = MatchingService()
        sub_a = SousCategorieService.objects.create(categorie=self.categorie, nom="Sous A")
        sub_b = SousCategorieService.objects.create(categorie=self.categorie, nom="Sous B")

        p = Prestation.objects.create(
            fournisseur=self.fournisseur_user,
            categorie=None,
            sous_categorie=sub_a,
            intitule="P test",
            description="d",
            type_prestation="plomberie",
            caracteristiques={},
            zones_intervention=["Dakar"],
            disponibilite_debut=self.prestation.disponibilite_debut,
            disponibilite_fin=self.prestation.disponibilite_fin,
            tarif_min=self.prestation.tarif_min,
            tarif_max=self.prestation.tarif_max,
            statut="active",
        )
        self.besoin.sous_categorie = sub_b
        self.besoin.categorie = None
        self.besoin.save()

        level = service._category_compatibility_level(p, self.besoin)
        self.assertEqual(level, 2)

    def test_trouver_correspondances_service_ne_persiste_pas_en_base(self):
        service = MatchingService()

        matches = service.find_matches_for_besoin(self.besoin, limit=5)

        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0]["prestation"].id, self.prestation.id)
        self.assertEqual(MatchingRun.objects.count(), 0)

    def test_abonnement_premium_donne_plus_de_points_que_standard(self):
        service = MatchingService()
        profile, _ = ProfileFournisseur.objects.get_or_create(user=self.fournisseur_user)
        profile.abonnement_actif = True
        profile.abonnement_type = "standard"
        profile.save(update_fields=["abonnement_actif", "abonnement_type"])
        standard_score = service.calculate_abonnement_score(self.prestation, self.besoin)

        profile.abonnement_type = "premium"
        profile.save(update_fields=["abonnement_type"])
        premium_score = service.calculate_abonnement_score(self.prestation, self.besoin)

        self.assertGreater(premium_score, standard_score)

    def test_competence_penalisee_si_domaine_profil_hors_sujet(self):
        service = MatchingService()
        profile, _ = ProfileFournisseur.objects.get_or_create(user=self.fournisseur_user)
        profile.types_services_offerts = ["développement logiciel", "fourniture matériel informatique"]
        profile.save(update_fields=["types_services_offerts"])

        score = service.calculate_competence_score(self.prestation, self.besoin)
        self.assertLessEqual(score, Decimal("45"))

    def test_competence_bonus_si_domaine_profil_aligne(self):
        service = MatchingService()
        profile, _ = ProfileFournisseur.objects.get_or_create(user=self.fournisseur_user)
        profile.types_services_offerts = ["plomberie", "dépannage"]
        profile.save(update_fields=["types_services_offerts"])

        score = service.calculate_competence_score(self.prestation, self.besoin)
        self.assertGreaterEqual(score, Decimal("90"))

    def test_hard_match_rejete_hors_perimetre_distance(self):
        service = MatchingService()
        self.prestation.zones_intervention = ["Thiès"]
        self.prestation.save(update_fields=["zones_intervention"])
        self.besoin.lieu_intervention = "Dakar Plateau"
        self.besoin.save(update_fields=["lieu_intervention"])

        profile_f, _ = ProfileFournisseur.objects.get_or_create(user=self.fournisseur_user)
        profile_f.emplacement = {"latitude": 12.3714, "longitude": -1.5197}  # Ouaga
        profile_f.save(update_fields=["emplacement"])

        profile_c, _ = ProfileClient.objects.get_or_create(user=self.client_user)
        profile_c.emplacement = {"latitude": 8.9833, "longitude": 1.1333}  # Sokodé
        profile_c.save(update_fields=["emplacement"])

        self.assertFalse(service._is_hard_match(self.prestation, self.besoin))

    def test_hard_match_rejete_it_vs_btp(self):
        service = MatchingService()
        cat_it = CategorieService.objects.create(nom="Informatique & Digital")

        prestation_it = Prestation.objects.create(
            fournisseur=self.fournisseur_user,
            categorie=cat_it,
            intitule="Développement site web",
            description="Dev web",
            type_prestation="développement web",
            caracteristiques={},
            zones_intervention=["Dakar"],
            disponibilite_debut=self.prestation.disponibilite_debut,
            disponibilite_fin=self.prestation.disponibilite_fin,
            tarif_min=Decimal("30000.00"),
            tarif_max=Decimal("120000.00"),
            statut="active",
        )

        self.assertFalse(service._is_hard_match(prestation_it, self.besoin))

    def test_budget_incompatible_diminue_fortement_score_prix(self):
        service = MatchingService()
        self.besoin.budget = Decimal("10000.00")
        self.besoin.save(update_fields=["budget"])
        prix_score = service.calculate_prix_score(self.prestation, self.besoin)
        self.assertLess(prix_score, Decimal("50"))

    def test_tris_descendant_et_seuil_minimal(self):
        service = MatchingService()
        p2 = Prestation.objects.create(
            fournisseur=self.fournisseur_user,
            categorie=self.categorie,
            intitule="Service plomberie économique",
            description="Intervention",
            type_prestation="plomberie",
            caracteristiques={},
            zones_intervention=["Dakar Plateau"],
            disponibilite_debut=self.prestation.disponibilite_debut,
            disponibilite_fin=self.prestation.disponibilite_fin,
            mode_tarification="forfait",
            tarif_min=Decimal("49000.00"),
            tarif_max=Decimal("51000.00"),
            statut="active",
        )
        matches = service.find_matches_for_besoin(self.besoin, limit=10)
        self.assertGreaterEqual(len(matches), 1)
        self.assertGreaterEqual(matches[0]["score"], matches[-1]["score"])
        self.assertTrue(all(m["score"] >= m["threshold"] for m in matches))
        self.assertIn("reasons", matches[0])

    def test_seuil_specifique_categorie_it(self):
        service = MatchingService()
        cat_it = CategorieService.objects.create(nom="Informatique & Digital")
        self.besoin.categorie = cat_it
        self.besoin.type_service = "développement web"
        self.besoin.save(update_fields=["categorie", "type_service"])

        prestation_it = Prestation.objects.create(
            fournisseur=self.fournisseur_user,
            categorie=cat_it,
            intitule="Dev web",
            description="Dev web",
            type_prestation="développement web",
            caracteristiques={},
            zones_intervention=["Dakar"],
            disponibilite_debut=self.prestation.disponibilite_debut,
            disponibilite_fin=self.prestation.disponibilite_fin,
            tarif_min=Decimal("30000.00"),
            tarif_max=Decimal("80000.00"),
            statut="active",
        )
        threshold = service._score_threshold_for_pair(prestation_it, self.besoin)
        self.assertEqual(threshold, Decimal("52"))

    def test_perimetre_specifique_btp_plus_strict(self):
        service = MatchingService()
        cat_btp = CategorieService.objects.create(nom="BTP & Travaux")
        self.besoin.categorie = cat_btp
        self.besoin.type_service = "maçonnerie"
        self.besoin.save(update_fields=["categorie", "type_service"])
        self.prestation.categorie = cat_btp
        self.prestation.type_prestation = "maçonnerie"
        self.prestation.save(update_fields=["categorie", "type_prestation"])

        profile_f, _ = ProfileFournisseur.objects.get_or_create(user=self.fournisseur_user)
        profile_f.emplacement = {"latitude": 12.3714, "longitude": -1.5197}  # Ouaga
        profile_f.save(update_fields=["emplacement"])
        profile_c, _ = ProfileClient.objects.get_or_create(user=self.client_user)
        profile_c.emplacement = {"latitude": 11.9000, "longitude": -1.9000}  # ~65 km
        profile_c.save(update_fields=["emplacement"])
        # Sans recouvrement textuel zone/lieu : le filtre GPS dur s'applique.
        self.prestation.zones_intervention = []
        self.prestation.save(update_fields=["zones_intervention"])

        self.assertFalse(service._within_zone_perimeter(self.prestation, self.besoin))

    def test_zone_intervention_textuelle_accepte_hors_distance_sieges(self):
        """Un fournisseur peut couvrir une ville déclarée même si son siège est ailleurs."""
        service = MatchingService()
        self.prestation.zones_intervention = ["Lomé", "Sokodé"]
        self.prestation.save(update_fields=["zones_intervention"])
        self.besoin.lieu_intervention = "Lomé — Tokoin"
        self.besoin.save(update_fields=["lieu_intervention"])

        profile_f, _ = ProfileFournisseur.objects.get_or_create(user=self.fournisseur_user)
        profile_f.emplacement = {"latitude": 8.9833, "longitude": 1.1333}  # Sokodé
        profile_f.save(update_fields=["emplacement"])
        profile_c, _ = ProfileClient.objects.get_or_create(user=self.client_user)
        profile_c.emplacement = {"latitude": 12.3714, "longitude": -1.5197}  # Ouaga
        profile_c.save(update_fields=["emplacement"])

        self.assertTrue(service._within_zone_perimeter(self.prestation, self.besoin))


class MatchingApiTests(MatchingBaseTestCase):
    def test_endpoint_correspondances_refuse_client_standard(self):
        profile = ProfileClient.objects.get(user=self.client_user)
        profile.abonnement_type = "standard"
        profile.abonnement_actif = False
        profile.save(update_fields=["abonnement_type", "abonnement_actif"])

        self.api_client.force_authenticate(user=self.client_user)
        response = self.api_client.post(
            reverse("trouver-correspondances-besoin", kwargs={"besoin_id": self.besoin.id})
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data.get("code"), "client_matching_premium_required")
        self.assertEqual(MatchingRun.objects.count(), 0)

    def test_endpoint_correspondances_besoin_retourne_resultats(self):
        self.api_client.force_authenticate(user=self.client_user)

        response = self.api_client.post(
            reverse("trouver-correspondances-besoin", kwargs={"besoin_id": self.besoin.id})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["besoin_id"], self.besoin.id)
        self.assertGreaterEqual(response.data["total_matches"], 1)
        self.assertIn("prestation_details", response.data["matches"][0])
        self.assertEqual(MatchingRun.objects.count(), 1)
        run = MatchingRun.objects.first()
        self.assertEqual(len(run.correspondances), response.data["total_matches"])

    def test_endpoint_debug_refuse_client_non_proprietaire(self):
        self.api_client.force_authenticate(user=self.autre_client)

        response = self.api_client.get(
            reverse(
                "matching-score-debug",
                kwargs={"besoin_id": self.besoin.id, "prestation_id": self.prestation.id},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_endpoint_debug_retourne_details_lisibles(self):
        self.api_client.force_authenticate(user=self.client_user)

        response = self.api_client.get(
            reverse(
                "matching-score-debug",
                kwargs={"besoin_id": self.besoin.id, "prestation_id": self.prestation.id},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("accepted", response.data)
        self.assertIn("threshold", response.data)
        self.assertIn("recommendation", response.data)
        self.assertIn("reasons", response.data)
        self.assertIsInstance(response.data["reasons"], list)

    def test_endpoint_scores_retourne_raisons_client(self):
        self.api_client.force_authenticate(user=self.client_user)
        # Générer au moins une correspondance effective.
        self.api_client.post(
            reverse("trouver-correspondances-besoin", kwargs={"besoin_id": self.besoin.id})
        )
        response = self.api_client.get(reverse("matching-scores"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
        first = response.data[0]
        self.assertIn("reasons", first)
        self.assertIn("accepted", first)
        self.assertIn("threshold", first)
        self.assertIn("quote", first)


class MatchingDevisFlowTestCase(MatchingBaseTestCase):
    def setUp(self):
        super().setUp()
        self.besoin.mode_budget = "sur_devis"
        self.besoin.budget = None
        self.besoin.save(update_fields=["mode_budget", "budget"])
        self.api_client = APIClient()

    def test_matching_sur_devis_ne_notifie_pas_les_fournisseurs(self):
        from services.models import Message

        from matching.devis_matching import NOTIFICATION_SUBJECT

        self.api_client.force_authenticate(user=self.client_user)
        response = self.api_client.post(
            reverse("trouver-correspondances-besoin", kwargs={"besoin_id": self.besoin.id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("besoin_sur_devis"))
        self.assertTrue(len(response.data.get("quote_opportunities") or []) >= 1)

        # Aucune notification de devis ne doit partir au moment du matching.
        self.assertFalse(
            Message.objects.filter(
                destinataire=self.fournisseur_user, sujet=NOTIFICATION_SUBJECT
            ).exists()
        )

        scores = self.api_client.get(reverse("matching-scores"))
        self.assertEqual(scores.status_code, status.HTTP_200_OK)
        row = next((s for s in scores.data if s["besoin"]["id"] == self.besoin.id), None)
        self.assertIsNotNone(row)
        self.assertTrue(row["quote"]["match_requires_quote"])

    def test_confirmer_match_declenche_demande_devis_au_fournisseur_choisi(self):
        from services.models import Message

        from matching.devis_matching import NOTIFICATION_SUBJECT

        self.api_client.force_authenticate(user=self.client_user)
        self.api_client.post(
            reverse("trouver-correspondances-besoin", kwargs={"besoin_id": self.besoin.id})
        )
        confirm = self.api_client.post(
            reverse("client-confirmer-match"),
            {
                "besoin_id": self.besoin.id,
                "prestation_id": self.prestation.id,
            },
            format="json",
        )
        self.assertEqual(confirm.status_code, status.HTTP_202_ACCEPTED)
        self.assertTrue(confirm.data.get("awaiting_quote"))
        self.assertTrue(confirm.data.get("requires_quote"))
        self.assertEqual(confirm.data.get("devis_statut"), "a_proposer")

        # Le fournisseur choisi reçoit la notification de devis.
        self.assertTrue(
            Message.objects.filter(
                destinataire=self.fournisseur_user, sujet=NOTIFICATION_SUBJECT
            ).exists()
        )
