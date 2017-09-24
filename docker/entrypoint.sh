python3 manage.py collectstatic --noinput
python3 manage.py migrate
python3 manage.py createsuperuser --noinput --username superadmin --email superadmin@colabdata.com.br
python3 manage.py loaddata groups

exec gunicorn colabdata.wsgi \
    --name colabdata \
    --bind unix:/srv/colabdata.sock \
    --workers 3 &

exec service nginx start