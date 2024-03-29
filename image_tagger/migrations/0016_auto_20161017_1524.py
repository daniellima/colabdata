# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-10-17 15:24
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('image_tagger', '0015_auto_20161015_0113'),
    ]

    operations = [
        migrations.CreateModel(
            name='AttributeType',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('dataset', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attributes', to='image_tagger.Dataset')),
            ],
        ),
        migrations.CreateModel(
            name='AttributeTypeValue',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='values', to='image_tagger.AttributeType')),
            ],
        ),
        migrations.CreateModel(
            name='Contribution',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateTimeField()),
            ],
        ),
        migrations.CreateModel(
            name='ObjectType',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('dataset', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='objects', to='image_tagger.Dataset')),
            ],
        ),
        migrations.CreateModel(
            name='RelationType',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('dataset', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='relations', to='image_tagger.Dataset')),
            ],
        ),
        migrations.RenameModel(
            old_name='ImageData',
            new_name='Image',
        ),
        migrations.RemoveField(
            model_name='objeto',
            name='dataset',
        ),
        migrations.RemoveField(
            model_name='attribute',
            name='dataset',
        ),
        migrations.RemoveField(
            model_name='attribute',
            name='name',
        ),
        migrations.RemoveField(
            model_name='attribute',
            name='object',
        ),
        migrations.RemoveField(
            model_name='relation',
            name='dataset',
        ),
        migrations.RemoveField(
            model_name='relation',
            name='name',
        ),
        migrations.RemoveField(
            model_name='tag',
            name='image_data',
        ),
        migrations.RemoveField(
            model_name='tag',
            name='object',
        ),
        migrations.RemoveField(
            model_name='tag',
            name='user',
        ),
        migrations.AddField(
            model_name='attribute',
            name='tag',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='attributes', to='image_tagger.Tag'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='attribute',
            name='value',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attributes', to='image_tagger.AttributeTypeValue'),
        ),
        migrations.DeleteModel(
            name='Objeto',
        ),
        migrations.AddField(
            model_name='contribution',
            name='image',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='contributions', to='image_tagger.Image'),
        ),
        migrations.AddField(
            model_name='contribution',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='contributions', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='relation',
            name='relation_type',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='relations', to='image_tagger.RelationType'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='tag',
            name='contribution',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='tags', to='image_tagger.Contribution'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='tag',
            name='object_type',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='tags', to='image_tagger.ObjectType'),
            preserve_default=False,
        ),
    ]
