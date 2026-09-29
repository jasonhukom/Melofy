from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="OAuthState",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("token", models.CharField(max_length=64, unique=True)),
                ("firebase_uid", models.CharField(max_length=128)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("display_name", models.CharField(blank=True, max_length=255)),
                ("platform", models.CharField(default="web", max_length=20)),
                ("purpose", models.CharField(default="youtube_connect", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
