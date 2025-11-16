# 🚀 Quick Start Guide

## Installation & Setup (5 minutes)

### Step 1: Install Redis
Redis is required for WebSocket support.

**Windows:**
- Download from: https://github.com/microsoftarchive/redis/releases
- Or use WSL: `wsl --install` then `sudo apt-get install redis-server`
- Start Redis: `redis-server`

**Mac:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### Step 2: Install Python Dependencies
```bash
cd DjangoProject
pip install -r requirements.txt
```

### Step 3: Run Migrations
```bash
python manage.py migrate
```

### Step 4: Create Admin User (Optional)
```bash
python manage.py createsuperuser
```

### Step 5: Start the Server
```bash
python manage.py runserver
```

### Step 6: Open in Browser
```
http://localhost:8000
```

---

## First Time Use

### Create Teacher Account
1. Click "Register"
2. Choose role: **Teacher**
3. Fill in username, email, password
4. Click "Create Account"

### Create a Session
1. From dashboard, click "Create New Session"
2. Enter session name (e.g., "Math Class")
3. Note the **join code** generated

### Create Student Account
1. Open new browser tab (or incognito window)
2. Register as **Student**
3. Click "Join Session"
4. Enter the teacher's join code

### Start Collaborating!
- **Draw**: Select pen tool and draw on canvas
- **Chat**: Type messages in right sidebar
- **Raise Hand**: Students can click raise hand button
- **Change Tools**: Click toolbar buttons on left
- **Undo/Redo**: Use buttons in toolbar
- **Save**: Export whiteboard as PNG

---

## Troubleshooting

### Redis Connection Error
**Problem:** WebSocket not connecting
**Solution:** Make sure Redis is running on port 6379
```bash
redis-cli ping
# Should return: PONG
```

### Static Files Not Loading
**Problem:** CSS/JS not working
**Solution:** Collect static files
```bash
python manage.py collectstatic --noinput
```

### Migration Errors
**Problem:** Database errors
**Solution:** Reset migrations
```bash
python manage.py migrate --run-syncdb
```

### Port Already in Use
**Problem:** Port 8000 is busy
**Solution:** Run on different port
```bash
python manage.py runserver 8080
```

---

## Testing Features

### Test Drawing
1. Teacher opens session
2. Student joins session
3. Both draw - changes appear in real-time

### Test Chat
1. Type message in chat box
2. Press Send or Enter
3. Message appears for all participants

### Test Raise Hand
1. Student clicks "Raise Hand"
2. Teacher sees hand icon next to student name
3. Click again to lower hand

### Test Undo/Redo
1. Draw something
2. Click undo - stroke disappears
3. Click redo - stroke reappears

### Test Save PNG
1. Draw on canvas
2. Click save icon
3. Image downloads to your computer

---

## Development Tips

### Watch Logs
```bash
python manage.py runserver
```

### Check Redis
```bash
redis-cli monitor
```

### View Database
```bash
python manage.py dbshell
```

### Run Tests
```bash
python manage.py test
```

---

## Production Deployment

### Using Docker
```bash
docker-compose up -d
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
```

### Manual Deployment
1. Set environment variables in `.env`
2. Use PostgreSQL instead of SQLite
3. Configure Redis with persistence
4. Use Nginx as reverse proxy
5. Set `DEBUG=False`
6. Configure HTTPS

---

## Common Use Cases

### Classroom Teaching
- Teacher creates session before class
- Shares join code with students
- Uses whiteboard for explanations
- Students can ask questions via chat
- Save whiteboard at end of class

### Tutoring
- Tutor creates private session
- Student joins for 1-on-1 session
- Real-time problem solving
- Export work for student reference

### Study Groups
- Any student can create session
- Friends join to collaborate
- Share ideas visually
- Chat while working

---

## API Usage

### List Sessions
```bash
curl http://localhost:8000/whiteboard/api/sessions/
```

### Get Session Details
```bash
curl http://localhost:8000/whiteboard/api/sessions/1/
```

### Replay Session
```bash
curl http://localhost:8000/whiteboard/api/sessions/1/replay/
```

---

## Next Steps

1. ✅ Complete quick start
2. ✅ Create test accounts
3. ✅ Test all features
4. 📚 Read full README.md
5. 🎨 Customize UI if needed
6. 🚀 Deploy to production

**Need Help?** Check README.md for detailed documentation!
