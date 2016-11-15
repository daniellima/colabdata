from django.contrib import admin
from django import forms
from .models import Image, Dataset, DatasetMembership, Publication
from django.contrib.auth.models import User, Group, Permission
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.db.models.signals import post_save
from django.db.models import Q
from django.conf import settings
import tarfile
import os
# Register your models here.

def define_staff_status(sender, **kwargs):

    if(kwargs['created']):
        saved_user = kwargs['instance']
        # preciso fazer manualmente porque chamar save vai chamar o signal novamente...
        User.objects.filter(id=saved_user.id).update(is_staff=False)
        saved_user.user_permissions.add(Permission.objects.get(codename='change_dataset'));
        group = Group.objects.get(name="Colaborador")
        saved_user.groups.add(group)

post_save.connect(define_staff_status, weak=False, sender=User, dispatch_uid="9879879789")

class DatasetMembershipInline(admin.StackedInline):
    model = DatasetMembership
    extra = 0
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        formfield = super(DatasetMembershipInline, self).formfield_for_foreignkey(db_field, request, **kwargs)
        
        if db_field.name == "group" and request.user.groups.filter(name="Administrador").exists() and not request.user.is_superuser:
             formfield.queryset = Group.objects.exclude(name="Administrador")
             
        return formfield
    
    def get_queryset(self, request):
        qs = super(DatasetMembershipInline, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.exclude(group__name="Administrador")
    
    def has_change_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        #     return super(DatasetMembershipInline, self).has_change_permission(request, obj)

        return DatasetMembership.objects.filter(user=request.user, group__name="Administrador", dataset=obj.dataset)
        
    def has_add_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        #     return super(DatasetMembershipInline, self).has_add_permission(request, obj)
        
        return DatasetMembership.objects.filter(user=request.user, group__name="Administrador", dataset=obj.dataset)
        
    def has_delete_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        #     return super(DatasetMembershipInline, self).has_delete_permission(request, obj)
        
        return DatasetMembership.objects.filter(user=request.user, group__name="Administrador", dataset=obj)

class DatasetAddForm(forms.ModelForm):
    import_file = forms.FileField(required=False, help_text="Um arquivo no formato tar.gz. O dataset será criado com os dados desse arquivo.")

class DatasetAdmin(admin.ModelAdmin):
    inlines = (DatasetMembershipInline,)
    
    def get_form(self, request, obj=None, **kwargs):
        if obj is None:
            kwargs['form'] = DatasetAddForm
            
        return super(DatasetAdmin, self).get_form(request, obj, **kwargs)
    
    def get_queryset(self, request):
        qs = super(DatasetAdmin, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return request.user.datasets.filter(datasetmembership__group__name="Administrador")
    
    def save_model(self, request, obj, form, change):
        if not change:
            import_file = form.cleaned_data['import_file']
            if import_file is not None:
                # with open(settings.MEDIA_ROOT + import_file.name, 'wb+') as destination:
                #     for chunk in import_file.chunks():
                #         destination.write(chunk)
                obj.name = import_file.name
                obj.description = str(import_file.read())
        super(DatasetAdmin, self).save_model(request, obj, form, change)
        
    
    def has_change_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        #     return super(DatasetMembershipInline, self).has_delete_permission(request, obj)
        
        return DatasetMembership.objects.filter(user=request.user, group__name="Administrador", dataset=obj)

class CustomUserAdmin(UserAdmin):
    
    list_display = ('username', 'email', 'first_name', 'last_name') #, 'is_staff')
    list_filter = ('is_active',) # 'groups')
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'user_permissions', 'groups')}), 
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    readonly_fields = ['date_joined', 'last_login']
    
    def get_queryset(self, request):
        qs = super(CustomUserAdmin, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(is_superuser=False).filter(~Q(groups__name="Administrador") | Q(id=request.user.id))
    
    def has_change_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            if request.user.id == obj.id:
                return True
            
            can_change = (obj.is_superuser == False and not obj.groups.filter(name="Administrador").exists())
            return can_change

class ImageDataAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super(ImageDataAdmin, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(dataset__in=request.user.datasets.filter(datasetmembership__group__name="Administrador"))
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "dataset" and not request.user.is_superuser:
            kwargs["queryset"] = request.user.datasets.filter(datasetmembership__group__name="Administrador")
            
        return super(ImageDataAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)
    
    def has_change_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")

class ObjetoAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super(ObjetoAdmin, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(dataset__in=request.user.datasets.filter(datasetmembership__group__name="Administrador"))
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "dataset" and not request.user.is_superuser:
            kwargs["queryset"] = request.user.datasets.filter(datasetmembership__group__name="Administrador")
            
        return super(ObjetoAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)
    
    def has_change_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")

class AttributeAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super(AttributeAdmin, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(dataset__in=request.user.datasets.filter(datasetmembership__group__name="Administrador"))
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "dataset" and not request.user.is_superuser:
            kwargs["queryset"] = request.user.datasets.filter(datasetmembership__group__name="Administrador")
            
        return super(AttributeAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)
    
    def has_change_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")

class RelationAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super(RelationAdmin, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(dataset__in=request.user.datasets.filter(datasetmembership__group__name="Administrador"))
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "dataset" and not request.user.is_superuser:
            kwargs["queryset"] = request.user.datasets.filter(datasetmembership__group__name="Administrador")
            
        return super(RelationAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)
    
    def has_change_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")

class PublicationAdmin(admin.ModelAdmin):
    
    # see here http://stackoverflow.com/questions/1471909/django-model-delete-not-triggered?noredirect=1&lq=1
    # def get_actions(self, request):
    #     actions = super(PublicationAdmin, self).get_actions(request)
    #     del actions['delete_selected']
    #     return actions
    
    def save_model(self, request, obj, form, change):
        super(PublicationAdmin, self).save_model(request, obj, form, change)
        
        file_name = settings.MEDIA_ROOT + "publications/" + "{0}_publication.txt".format(obj.id)
        with open(file_name, 'w+', encoding='utf-8') as file:
            file.write(obj.description)
        
        # tar_file_name = file_name + ".tar.gz"
        # #with open("publications/" + tar_file_name, 'w+') as tar:
        # with tarfile.open(tar_file_name, "w:gz") as tar2:
        #     tar2.add(file_name, hbolhbljhbjhbkj)
        
    def delete_model(self, request, obj):
        file_name = settings.MEDIA_ROOT + "publications/" + "{0}_publication.txt".format(obj.id)
        os.remove(file_name)
        
        super(PublicationAdmin, self).delete_model(request, obj)
        

admin.site.unregister(Group)
admin.site.register(Dataset, DatasetAdmin)
admin.site.register(Publication, PublicationAdmin)
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(Image, ImageDataAdmin)