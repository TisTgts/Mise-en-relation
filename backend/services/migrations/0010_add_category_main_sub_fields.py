from django.db import migrations, models


def populate_category_fields(apps, schema_editor):
    CategorieService = apps.get_model("services", "CategorieService")
    for cat in CategorieService.objects.all():
        if cat.parent_id:
            parent = CategorieService.objects.filter(id=cat.parent_id).first()
            main = parent.nom if parent else cat.nom
            sub = cat.nom
        else:
            main = cat.nom
            sub = ""
        cat.categorie_principale = main or ""
        cat.sous_categorie = sub or ""
        cat.save(update_fields=["categorie_principale", "sous_categorie"])


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0009_alter_besoin_options_alter_besoin_categorie_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="categorieservice",
            name="categorie_principale",
            field=models.CharField(blank=True, default="", max_length=100, verbose_name="Catégorie principale"),
        ),
        migrations.AddField(
            model_name="categorieservice",
            name="sous_categorie",
            field=models.CharField(blank=True, default="", max_length=100, verbose_name="Sous-catégorie"),
        ),
        migrations.RunPython(populate_category_fields, migrations.RunPython.noop),
    ]
