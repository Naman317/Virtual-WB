FROM python:3.11-slim

WORKDIR /code
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

COPY requirements.txt /code/
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . /code/
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "project.asgi:application"]
