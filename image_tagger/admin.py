from django.contrib import admin
from .models import ImageData, Dataset, DatasetMembership, Objeto, Attribute, Relation
from django.contrib.auth.models import User, Group, Permission
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.db.models.signals import post_save
from django.db.models import Q
# Register your models here.

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

class DatasetAdmin(admin.ModelAdmin):
    inlines = (DatasetMembershipInline,)
    
    def get_queryset(self, request):
        qs = super(DatasetAdmin, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return request.user.datasets.filter(datasetmembership__group__name="Administrador")
    
    def has_change_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        #     return super(DatasetMembershipInline, self).has_delete_permission(request, obj)
        
        return DatasetMembership.objects.filter(user=request.user, group__name="Administrador", dataset=obj)

admin.site.register(Dataset, DatasetAdmin)

def define_staff_status(sender, **kwargs):

    if(kwargs['created']):
        saved_user = kwargs['instance']
        # preciso fazer manualmente porque chamar save vai chamar o signal novamente...
        User.objects.filter(id=saved_user.id).update(is_staff=False)
        saved_user.user_permissions.add(Permission.objects.get(codename='change_dataset'));
        group = Group.objects.get(name="Colaborador")
        saved_user.groups.add(group)

post_save.connect(define_staff_status, weak=False, sender=User, dispatch_uid="9879879789")

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

admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(ImageData, ImageDataAdmin)
admin.site.register(Objeto, ObjetoAdmin)
admin.site.register(Attribute, AttributeAdmin)
admin.site.register(Relation, RelationAdmin)
admin.site.unregister(Group)
