from __future__ import unicode_literals
from django.contrib.auth.models import User, Group
from django.db import models

# Create your models here.

class Dataset(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(max_length=5000)
    users = models.ManyToManyField(User, related_name='datasets', through='DatasetMembership')
    
    def __str__(self):
        return self.name

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


class ObjectType(models.Model):
    name = models.CharField(max_length=255)
    dataset = models.ForeignKey(Dataset, related_name="objects")
    
class AttributeType(models.Model):
    name = models.CharField(max_length=255)
    dataset = models.ForeignKey(Dataset, related_name="attributes")
    
    def toJSONSerializable(self):
        return {'name': self.name, 'value': self.value}

class AttributeTypeValue(models.Model):
    name = models.CharField(max_length=255)
    attribute_type = models.ForeignKey(AttributeType, related_name="values")

class RelationType(models.Model):
    name = models.CharField(max_length=255)
    dataset = models.ForeignKey(Dataset, related_name="relations")

class Image(models.Model):
    file = models.ImageField()
    dataset = models.ForeignKey(Dataset, related_name="images")

class Tag(models.Model):
    object_type = models.ForeignKey(ObjectType, related_name="tags")
    x = models.IntegerField()
    y = models.IntegerField()
    width = models.IntegerField()
    height = models.IntegerField()
    user = models.ForeignKey(User, related_name="tags")
    image = models.ForeignKey(Image, related_name="tags")
    date = models.DateTimeField()
    
    def toJSONSerializable(self):
        return {
            'id': self.id,
            'x': self.x,
            'y': self.y,
            'width': self.width,
            'height': self.height,
            'object': self.object_type.name,
            'attributes': [attribute.toJSONSerializable() for attribute in self.attributes.all()],
            'relations': [relation.toJSONSerializable() for relation in self.relatedToRelations.all()]
        }

class Attribute(models.Model):
    value = models.ForeignKey(AttributeTypeValue, related_name="attributes")
    tag = models.ForeignKey(Tag, related_name="attributes")
    
    def toJSONSerializable(self):
        return {'name': self.value.attribute_type.name, 'value': self.value.name}

class Relation(models.Model):
    relation_type = models.ForeignKey(RelationType, related_name="relations")
    originTag = models.ForeignKey(Tag, related_name='relatedToRelations')
    targetTag = models.ForeignKey(Tag, related_name='relatedFromRelations')
    
    def toJSONSerializable(self):
        return {
            'id': self.id,
            'name': self.relation_type.name,
            'originTagId': self.originTag.id, 
            'targetTagId': self.targetTag.id
        }

