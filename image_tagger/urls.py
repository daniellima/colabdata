from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^([0-9]+)$', views.image, name='image'),
    url(r'^all$', views.all, name='all'),
    url(r'^save/tag$', views.save_tag, name='save_tag'),
    url(r'^save/relation$', views.save_relation, name='save_relation'),
    url(r'^delete/tag$', views.delete_tag, name='delete_tag'),
    url(r'^delete/relation$', views.delete_relation, name='delete_relation'),
    url(r'^login$', views.login, name='login'),
    url(r'^logout$', views.logout, name='logout'),
    url(r'^dataset/([0-9]+)/publications/$', views.dataset_publications, name="dataset-publications"),
    url(r'^datasets$', views.datasets, name='datasets'),
    url(r'^$', views.index, name='index'),
    url(r'^private_datasets$', views.private_datasets, name='private-datasets'),
    url(r'^dataset_images_tagger/([0-9]+)$', views.dataset_images_tagger, name='dataset-images-tagger'),
    url(r'^logout$', views.logout, name='logout')
]