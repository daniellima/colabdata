# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-10-04 15:51
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('image_tagger', '0009_imagedata_image'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='imagedata',
            name='address',
        ),
        migrations.RemoveField(
            model_name='imagedata',
            name='height',
        ),
        migrations.RemoveField(
            model_name='imagedata',
            name='image',
        ),
        migrations.RemoveField(
            model_name='imagedata',
            name='width',
        ),
        migrations.AddField(
            model_name='imagedata',
            name='file',
            field=models.ImageField(default='', upload_to=b''),
            preserve_default=False,
        ),
    ]
