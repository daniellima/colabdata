# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-10-17 19:31
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('image_tagger', '0017_auto_20161017_1820'),
    ]

    operations = [
        migrations.RenameField(
            model_name='attributetypevalue',
            old_name='type',
            new_name='attribute_type',
        ),
    ]
