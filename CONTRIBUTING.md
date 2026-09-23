# 🤝 Contributing to Virtual Whiteboard

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## 🎯 Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🎨 Enhance UI/UX
- ⚡ Optimize performance
- ✅ Write tests
- 🔧 Fix issues

## 🚀 Getting Started

### 1. Fork the Repository
Click the "Fork" button on GitHub

### 2. Clone Your Fork
```bash
git clone https://github.com/YOUR_USERNAME/virtual-whiteboard.git
cd virtual-whiteboard
```

### 3. Create a Branch
```bash
git checkout -b feature/your-feature-name
```

### 4. Make Your Changes
- Follow the code style
- Add comments
- Update documentation
- Test your changes

### 5. Commit Your Changes
```bash
git add .
git commit -m "Add: description of your changes"
```

### 6. Push to Your Fork
```bash
git push origin feature/your-feature-name
```

### 7. Create Pull Request
- Go to the original repository
- Click "New Pull Request"
- Select your branch
- Describe your changes

## 📝 Code Style Guidelines

### Python
- Follow PEP 8
- Use 4 spaces for indentation
- Add docstrings to functions/classes
- Keep functions focused and small
- Use meaningful variable names

```python
def create_session(request):
    """
    Create a new whiteboard session
    
    Args:
        request: HTTP request object
        
    Returns:
        HttpResponse: Rendered template or redirect
    """
    # Implementation here
```

### JavaScript
- Use ES6+ features
- Use camelCase for variables
- Add comments for complex logic
- Keep functions pure when possible
- Handle errors gracefully

```javascript
/**
 * Initialize whiteboard canvas
 * @param {WebSocket} socket - WebSocket connection
 */
function initWhiteboard(socket) {
    // Implementation here
}
```

### HTML/CSS
- Use semantic HTML5 tags
- Follow Tailwind CSS conventions
- Keep templates DRY
- Use template inheritance
- Add ARIA labels for accessibility

## 🧪 Testing

### Run Tests
```bash
python manage.py test
```

### Add New Tests
```python
from django.test import TestCase

class SessionTestCase(TestCase):
    def test_session_creation(self):
        """Test that sessions are created correctly"""
        # Test implementation
```

## 📚 Documentation

### Update Documentation When:
- Adding new features
- Changing existing functionality
- Fixing bugs that affect usage
- Improving performance

### Documentation Files
- `README.md` - Main documentation
- `QUICKSTART.md` - Quick start guide
- `FEATURES.md` - Feature documentation
- Code comments - Inline documentation

## 🐛 Reporting Bugs

### Before Reporting
1. Check if bug already reported
2. Verify it's reproducible
3. Test on latest version
4. Gather necessary information

### Bug Report Should Include
- Clear title and description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details:
  - OS and version
  - Python version
  - Django version
  - Browser (if frontend issue)

### Example Bug Report
```markdown
**Title:** Whiteboard strokes not syncing between users

**Description:**
When multiple users draw simultaneously, strokes sometimes don't appear for other users.

**Steps to Reproduce:**
1. Create session as Teacher
2. Join session as Student (different browser)
3. Draw rapidly on both screens
4. Observe missing strokes

**Expected:** All strokes should sync in real-time
**Actual:** Some strokes missing on other user's screen

**Environment:**
- OS: Windows 11
- Python: 3.11
- Browser: Chrome 120
- Redis: 7.0.1
```

## 💡 Suggesting Features

### Feature Requests Should Include
- Clear use case
- Expected behavior
- Why it's useful
- Possible implementation ideas
- Mockups/wireframes (if UI related)

### Example Feature Request
```markdown
**Title:** Add zoom/pan functionality to canvas

**Use Case:**
Users working on detailed drawings need to zoom in for precision.

**Expected Behavior:**
- Mouse wheel zooms in/out
- Click and drag to pan
- Reset zoom button

**Benefits:**
- Better precision for detailed work
- Larger canvas area
- Improved usability

**Implementation Ideas:**
- Use CSS transform for zoom
- Track zoom level in state
- Adjust coordinates for drawing
```

## 🏗️ Project Architecture

### App Structure
```
users/          # Authentication & user management
whiteboard/     # Session & drawing functionality
chat/           # Real-time chat
```

### Key Components
- **Models**: Database structure
- **Views**: HTTP request handlers
- **Consumers**: WebSocket handlers
- **Serializers**: API data formatting
- **Templates**: HTML rendering
- **Static**: CSS/JS files

### Design Patterns
- MVT (Model-View-Template)
- DRY (Don't Repeat Yourself)
- SOLID principles
- Separation of concerns

## 🔧 Development Setup

### Install Development Dependencies
```bash
pip install -r requirements.txt
pip install pytest pytest-django black flake8
```

### Code Formatting
```bash
black .
```

### Linting
```bash
flake8 .
```

### Run Development Server
```bash
python manage.py runserver
```

## 📦 Commit Message Guidelines

### Format
```
Type: Short description

Longer description if needed

Fixes #issue_number
```

### Types
- **Add**: New feature
- **Fix**: Bug fix
- **Update**: Modify existing feature
- **Remove**: Delete feature/code
- **Refactor**: Code restructuring
- **Docs**: Documentation changes
- **Style**: Formatting changes
- **Test**: Add/modify tests

### Examples
```bash
git commit -m "Add: zoom functionality to canvas"
git commit -m "Fix: WebSocket connection error on Firefox"
git commit -m "Update: improve drawing performance"
git commit -m "Docs: add API documentation"
```

## 🔐 Security

### Security Issues
- **DO NOT** create public issues for security vulnerabilities
- Email maintainers directly
- Include detailed description
- Wait for confirmation before disclosure

### Security Best Practices
- Never commit sensitive data
- Use environment variables
- Validate all inputs
- Sanitize user content
- Follow Django security guidelines

## 📋 Pull Request Checklist

Before submitting PR, ensure:
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added (if applicable)
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] No merge conflicts
- [ ] Branch is up-to-date with main
- [ ] Screenshots included (if UI changes)

## 🎉 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## 📞 Contact

- GitHub Issues: For bugs and features
- Pull Requests: For code contributions
- Discussions: For questions and ideas

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to Virtual Whiteboard! 🎨**
