# -*- coding: utf-8 -*-
# Generated by Django 1.10.3 on 2017-09-30 15:54
from __future__ import unicode_literals

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('image_tagger', '0028_dataset_desired_number_of_contributions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dataset',
            name='desired_number_of_contributions',
            field=models.IntegerField(default=3, help_text="Please note that this value should not be greater than the number of contributors in this dataset. If you don't know what this value means, better to leave it at the default value of 3.", validators=[django.core.validators.MinValueValidator(2)]),
        ),
    ]
