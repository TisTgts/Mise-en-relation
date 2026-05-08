from django.db import migrations, models


def migrate_to_subcategory_table(apps, schema_editor):
    CategorieService = apps.get_model("services", "CategorieService")
    SousCategorieService = apps.get_model("services", "SousCategorieService")
    Prestation = apps.get_model("services", "Prestation")
    Besoin = apps.get_model("services", "Besoin")

    # 1) Creer une sous-categorie pour chaque ancienne categorie enfant (parent non null)
    old_children = CategorieService.objects.exclude(parent_id=None)
    subcat_map = {}
    for old_child in old_children:
        parent = CategorieService.objects.filter(id=old_child.parent_id).first()
        if not parent:
            continue
        sub, _ = SousCategorieService.objects.get_or_create(
            categorie=parent,
            nom=old_child.nom,
            defaults={
                "description": old_child.description or "",
                "est_active": getattr(old_child, "est_active", True),
            },
        )
        subcat_map[old_child.id] = sub.id

    # 2) Pour les prestations/besoins pointant vers une ancienne categorie enfant,
    #    renseigner la sous-categorie + remonter la categorie vers la principale.
    for prestation in Prestation.objects.all():
        cid = prestation.categorie_id
        if cid in subcat_map:
            old_child = CategorieService.objects.filter(id=cid).first()
            parent_id = old_child.parent_id if old_child else None
            prestation.sous_categorie_id = subcat_map[cid]
            prestation.categorie_id = parent_id
            prestation.save(update_fields=["categorie_id", "sous_categorie_id"])

    for besoin in Besoin.objects.all():
        cid = besoin.categorie_id
        if cid in subcat_map:
            old_child = CategorieService.objects.filter(id=cid).first()
            parent_id = old_child.parent_id if old_child else None
            besoin.sous_categorie_id = subcat_map[cid]
            besoin.categorie_id = parent_id
            besoin.save(update_fields=["categorie_id", "sous_categorie_id"])

    # 3) Supprimer les anciennes categories enfants pour ne garder que les categories principales.
    old_children.delete()


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0010_add_category_main_sub_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="SousCategorieService",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nom", models.CharField(max_length=100, verbose_name="Nom de la sous-catégorie")),
                ("description", models.TextField(blank=True, verbose_name="Description")),
                ("est_active", models.BooleanField(default=True, verbose_name="Active")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "categorie",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="sous_categories",
                        to="services.categorieservice",
                        verbose_name="Catégorie principale",
                    ),
                ),
            ],
            options={
                "verbose_name": "Sous-catégorie de service",
                "verbose_name_plural": "Sous-catégories de services",
                "ordering": ["categorie__nom", "nom"],
                "unique_together": {("categorie", "nom")},
            },
        ),
        migrations.AddField(
            model_name="prestation",
            name="sous_categorie",
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name="prestations", to="services.souscategorieservice", verbose_name="Sous-catégorie"),
        ),
        migrations.AddField(
            model_name="besoin",
            name="sous_categorie",
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name="besoins", to="services.souscategorieservice", verbose_name="Sous-catégorie"),
        ),
        migrations.RunPython(migrate_to_subcategory_table, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="categorieservice",
            name="categorie_principale",
        ),
        migrations.RemoveField(
            model_name="categorieservice",
            name="sous_categorie",
        ),
        migrations.RemoveField(
            model_name="categorieservice",
            name="parent",
        ),
    ]
