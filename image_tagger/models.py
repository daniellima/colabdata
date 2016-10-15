from __future__ import unicode_literals
from django.contrib.auth.models import User, Group
from django.db import models

# Create your models here.

class Dataset(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(max_length=5000)
    users = models.ManyToManyField(User, related_name='datasets', through='DatasetMembership')

class ImageData(models.Model):
    file = models.ImageField()
    dataset = models.ForeignKey(Dataset, related_name="images")

class DatasetMembership(models.Model):
    user = models.ForeignKey(User)
    dataset = models.ForeignKey(Dataset)
    group = models.ForeignKey(Group)
    
    def save(self, *args, **kwargs):
        super(DatasetMembership, self).save(*args, **kwargs)
        
        if self.group.name == "Administrador":
            self.user.is_staff = True
            self.user.save()
        else:
            if not self.user.datasets.filter(datasetmembership__group__name="Administrador").exists():
                self.user.is_staff = False
                self.user.save()

class Objeto(models.Model):
    name = models.CharField(max_length=255)
    dataset = models.ForeignKey(Dataset, related_name="objetos")
    
    def toJSONSerializable(self):
        return {
            'name': self.name,
            'attributes': [attribute.toJSONSerializable() for attribute in self.attributes.all()]
        }
    
class Attribute(models.Model):
    name = models.CharField(max_length=255)
    value = models.CharField(max_length=255)
    dataset = models.ForeignKey(Dataset, related_name="attributes")
    object = models.ForeignKey(Objeto, related_name='attributes')
    
    def toJSONSerializable(self):
        return {'name': self.name, 'value': self.value}
    
class Tag(models.Model):
    image_data = models.ForeignKey(ImageData, related_name='tags')
    object = models.ForeignKey(Objeto, related_name='tags')
    user = models.ForeignKey(User, related_name='tags')
    x = models.IntegerField()
    y = models.IntegerField()
    width = models.IntegerField()
    height = models.IntegerField()
    
    def toJSONSerializable(self):
        return {
            'id': self.id,
            'x': self.x,
            'y': self.y,
            'width': self.width,
            'height': self.height,
            'object': self.object.toJSONSerializable(),
            'relations': [relation.toJSONSerializable() for relation in self.relatedToRelations.all()]
        }

class Relation(models.Model):
    name = models.CharField(max_length=255)
    dataset = models.ForeignKey(Dataset, related_name="relations")
    originTag = models.ForeignKey(Tag, related_name='relatedToRelations')
    targetTag = models.ForeignKey(Tag, related_name='relatedFromRelations')
    
    def toJSONSerializable(self):
        return {
            'id': self.id,
            'name': self.name, 
            'originTagId': self.originTag.id, 
            'targetTagId': self.targetTag.id
        }