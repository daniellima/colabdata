from django.db.models.signals import pre_delete
from django.dispatch import receiver
from .models import Image, Publication
import os
from django.conf import settings

@receiver(pre_delete, sender=Image, weak=False)
def delete_file_from_image(sender, **kwargs):
    instance = kwargs['instance']
    try:
        instance.file.delete()
    except Exception as ex:
        raise Exception("Error when deleting the file {} from image {} of dataset {}(id: {}).".format(
            instance.file.name,
            instance.id,
            instance.dataset.name,
            instance.dataset.id)) from ex

@receiver(pre_delete, sender=Publication, weak=False)
def delete_file_from_publication(sender, **kwargs):
    instance = kwargs['instance']
    try:
        path = os.path.join(Publication.STORAGE_DIRECTORY, instance.get_file_name())
        os.remove(path)
    except Exception as ex:
        pass