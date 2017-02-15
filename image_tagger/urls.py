from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^all$', views.all, name='all'),
    url(r'^save/tag$', views.save_tag, name='save_tag'),
    url(r'^save/relation$', views.save_relation, name='save_relation'),
    url(r'^delete/tag$', views.delete_tag, name='delete_tag'),
    url(r'^delete/relation$', views.delete_relation, name='delete_relation'),
    url(r'^login$', views.login, name='login'),
    url(r'^logout$', views.logout, name='logout'),
]