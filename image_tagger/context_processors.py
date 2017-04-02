def user_is_admin_processor(request):
    if request.user.is_anonymous:
        is_admin = False
    elif request.user.is_superuser:
        is_admin = True
    else:
        is_admin = request.user.datasets.filter(datasetmembership__group__name='Administrador').exists()
    return {'user_is_admin': is_admin}