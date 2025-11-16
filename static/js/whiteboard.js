/**
 * Virtual Whiteboard - Main JavaScript
 * Handles canvas drawing, WebSocket communication, and UI interactions
 */

// Global variables
let canvas, ctx;
let drawing = false;
let currentTool = 'pen';
let currentColor = '#000000';
let strokeWidth = 2;
let startX, startY;
let strokes = [];
let redoStack = [];
let handRaised = false;

// WebSocket connections
let whiteboardWS, chatWS;

/**
 * Initialize whiteboard application
 */
function initWhiteboard(whiteboardSocket, chatSocket) {
    whiteboardWS = whiteboardSocket;
    chatWS = chatSocket;
    
    // Setup canvas
    setupCanvas();
    
    // Setup event listeners
    setupToolbarListeners();
    setupCanvasListeners();
    setupControlListeners();
    setupWebSocketListeners();
    setupChatListeners();
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
}

/**
 * Setup canvas and context
 */
function setupCanvas() {
    canvas = document.getElementById('whiteboard-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    
    // Set canvas drawing properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

/**
 * Resize canvas to fill container
 */
function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Redraw all strokes after resize
    redrawCanvas();
}

/**
 * Setup toolbar button listeners
 */
function setupToolbarListeners() {
    // Tool buttons
    document.querySelectorAll('[data-tool]').forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('[data-tool]').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Set current tool
            currentTool = this.dataset.tool;
            
            // Update cursor
            updateCursor();
        });
    });
    
    // Undo button
    document.getElementById('btn-undo')?.addEventListener('click', undo);
    
    // Redo button
    document.getElementById('btn-redo')?.addEventListener('click', redo);
    
    // Clear button (teacher only)
    document.getElementById('btn-clear')?.addEventListener('click', clearBoard);
    
    // Save button
    document.getElementById('btn-save')?.addEventListener('click', saveAsImage);
    
    // Raise hand button (student only)
    document.getElementById('btn-raise-hand')?.addEventListener('click', toggleHandRaised);
}

/**
 * Setup canvas drawing listeners
 */
function setupCanvasListeners() {
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
}

/**
 * Setup control listeners (color picker, stroke width)
 */
function setupControlListeners() {
    // Color picker
    const colorPicker = document.getElementById('color-picker');
    colorPicker.addEventListener('change', function() {
        currentColor = this.value;
    });
    
    // Stroke width slider
    const strokeWidthSlider = document.getElementById('stroke-width');
    const strokeWidthDisplay = document.getElementById('stroke-width-display');
    strokeWidthSlider.addEventListener('input', function() {
        strokeWidth = parseInt(this.value);
        strokeWidthDisplay.textContent = strokeWidth + 'px';
    });
}

/**
 * Setup WebSocket listeners for whiteboard
 */
function setupWebSocketListeners() {
    whiteboardWS.onopen = function() {
        console.log('✅ Whiteboard WebSocket connected successfully!');
    };
    
    whiteboardWS.onmessage = function(e) {
        console.log('📨 Received whiteboard message:', e.data);
        const data = JSON.parse(e.data);
        handleWhiteboardMessage(data);
    };
    
    whiteboardWS.onclose = function(e) {
        console.log('❌ Whiteboard WebSocket disconnected. Code:', e.code, 'Reason:', e.reason);
    };
    
    whiteboardWS.onerror = function(error) {
        console.error('🔴 WebSocket error:', error);
    };
}

/**
 * Handle incoming whiteboard messages
 */
function handleWhiteboardMessage(data) {
    switch(data.type) {
        case 'draw_stroke':
            if (data.user_id !== USER_ID) {
                drawStroke(data.data, data.tool);
                strokes.push({ tool: data.tool, data: data.data, id: data.stroke_id });
            }
            break;
            
        case 'undo_stroke':
            if (data.user_id !== USER_ID) {
                performUndo();
            }
            break;
            
        case 'redo_stroke':
            if (data.user_id !== USER_ID) {
                performRedo(data.data);
            }
            break;
            
        case 'clear_board':
            strokes = [];
            redoStack = [];
            clearCanvas();
            break;
            
        case 'user_joined':
            addParticipant(data);
            updateParticipantCount();
            showNotification(`${data.username} joined the session`);
            break;
            
        case 'user_left':
            removeParticipant(data.user_id);
            updateParticipantCount();
            showNotification(`${data.username} left the session`);
            break;
            
        case 'hand_raised':
            updateHandStatus(data.user_id, true);
            if (IS_CREATOR) {
                showNotification(`${data.username} raised their hand!`, 'warning');
            }
            break;
            
        case 'hand_lowered':
            updateHandStatus(data.user_id, false);
            break;
    }
}

/**
 * Start drawing
 */
function startDrawing(e) {
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    
    if (currentTool === 'pen' || currentTool === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
    }
}

/**
 * Draw on canvas
 */
function draw(e) {
    if (!drawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    if (currentTool === 'pen') {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
    } else if (currentTool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = strokeWidth * 3;
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
    } else if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'arrow') {
        // For shapes, we'll draw on mouseup
    }
}

/**
 * Stop drawing and send stroke to WebSocket
 */
function stopDrawing(e) {
    if (!drawing) return;
    drawing = false;
    
    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    
    let strokeData = {
        startX, startY, endX, endY,
        color: currentColor,
        width: strokeWidth
    };
    
    if (currentTool === 'rectangle') {
        drawRectangle(startX, startY, endX, endY, currentColor, strokeWidth);
        strokeData.type = 'rectangle';
    } else if (currentTool === 'circle') {
        drawCircle(startX, startY, endX, endY, currentColor, strokeWidth);
        strokeData.type = 'circle';
    } else if (currentTool === 'arrow') {
        drawArrow(startX, startY, endX, endY, currentColor, strokeWidth);
        strokeData.type = 'arrow';
    } else if (currentTool === 'text') {
        const text = prompt('Enter text:');
        if (text) {
            drawText(text, startX, startY, currentColor);
            strokeData.text = text;
            strokeData.type = 'text';
        } else {
            return;
        }
    }
    
    // Send stroke to WebSocket
    console.log('📤 Sending stroke to WebSocket:', { type: 'draw', tool: currentTool, data: strokeData });
    whiteboardWS.send(JSON.stringify({
        type: 'draw',
        tool: currentTool,
        data: strokeData
    }));
    
    // Add to local strokes array
    strokes.push({ tool: currentTool, data: strokeData });
    redoStack = []; // Clear redo stack after new action
}

/**
 * Draw stroke from data
 */
function drawStroke(data, tool) {
    if (tool === 'pen') {
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.width;
        ctx.beginPath();
        ctx.moveTo(data.startX, data.startY);
        ctx.lineTo(data.endX, data.endY);
        ctx.stroke();
    } else if (tool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = data.width * 3;
        ctx.beginPath();
        ctx.moveTo(data.startX, data.startY);
        ctx.lineTo(data.endX, data.endY);
        ctx.stroke();
    } else if (tool === 'rectangle') {
        drawRectangle(data.startX, data.startY, data.endX, data.endY, data.color, data.width);
    } else if (tool === 'circle') {
        drawCircle(data.startX, data.startY, data.endX, data.endY, data.color, data.width);
    } else if (tool === 'arrow') {
        drawArrow(data.startX, data.startY, data.endX, data.endY, data.color, data.width);
    } else if (tool === 'text') {
        drawText(data.text, data.startX, data.startY, data.color);
    }
}

/**
 * Draw rectangle
 */
function drawRectangle(x1, y1, x2, y2, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
}

/**
 * Draw circle
 */
function drawCircle(x1, y1, x2, y2, color, width) {
    const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
    ctx.stroke();
}

/**
 * Draw arrow
 */
function drawArrow(x1, y1, x2, y2, color, width) {
    const headLength = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(x2, y2);
    ctx.fill();
}

/**
 * Draw text
 */
function drawText(text, x, y, color) {
    ctx.fillStyle = color;
    ctx.font = '20px Arial';
    ctx.fillText(text, x, y);
}

/**
 * Undo last stroke
 */
function undo() {
    if (strokes.length > 0) {
        const lastStroke = strokes.pop();
        redoStack.push(lastStroke);
        
        // Send undo to WebSocket
        whiteboardWS.send(JSON.stringify({
            type: 'undo',
            stroke_id: lastStroke.id
        }));
        
        // Redraw canvas
        redrawCanvas();
    }
}

/**
 * Perform undo (from WebSocket)
 */
function performUndo() {
    if (strokes.length > 0) {
        const lastStroke = strokes.pop();
        redoStack.push(lastStroke);
        redrawCanvas();
    }
}

/**
 * Redo last undone stroke
 */
function redo() {
    if (redoStack.length > 0) {
        const stroke = redoStack.pop();
        strokes.push(stroke);
        
        // Send redo to WebSocket
        whiteboardWS.send(JSON.stringify({
            type: 'redo',
            stroke_id: stroke.id,
            data: stroke.data
        }));
        
        // Redraw canvas
        redrawCanvas();
    }
}

/**
 * Perform redo (from WebSocket)
 */
function performRedo(strokeData) {
    if (redoStack.length > 0) {
        const stroke = redoStack.pop();
        strokes.push(stroke);
        redrawCanvas();
    }
}

/**
 * Clear entire board
 */
function clearBoard() {
    if (confirm('Are you sure you want to clear the entire board? This cannot be undone.')) {
        whiteboardWS.send(JSON.stringify({
            type: 'clear'
        }));
        
        strokes = [];
        redoStack = [];
        clearCanvas();
    }
}

/**
 * Clear canvas
 */
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Redraw all strokes
 */
function redrawCanvas() {
    clearCanvas();
    strokes.forEach(stroke => {
        drawStroke(stroke.data, stroke.tool);
    });
}

/**
 * Save canvas as PNG image
 */
function saveAsImage() {
    const dataURL = canvas.toDataURL('image/png');
    
    // Download image
    const link = document.createElement('a');
    link.download = `whiteboard_${SESSION_CODE}_${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    
    // Save to server (if creator)
    if (IS_CREATOR) {
        fetch(`/whiteboard/save-snapshot/${SESSION_CODE}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: dataURL })
        })
        .then(response => response.json())
        .then(data => {
            showNotification('Snapshot saved to server', 'success');
        })
        .catch(error => {
            console.error('Error saving snapshot:', error);
        });
    }
}

/**
 * Toggle hand raised status
 */
function toggleHandRaised() {
    handRaised = !handRaised;
    const button = document.getElementById('btn-raise-hand');
    const handText = document.getElementById('hand-text');
    
    if (handRaised) {
        button.classList.add('bg-yellow-500');
        button.classList.remove('gradient-bg');
        handText.textContent = 'Lower Hand';
        
        whiteboardWS.send(JSON.stringify({
            type: 'hand_raised'
        }));
    } else {
        button.classList.remove('bg-yellow-500');
        button.classList.add('gradient-bg');
        handText.textContent = 'Raise Hand';
        
        whiteboardWS.send(JSON.stringify({
            type: 'hand_lowered'
        }));
    }
}

/**
 * Update cursor based on current tool
 */
function updateCursor() {
    canvas.classList.remove('cursor-pen', 'cursor-eraser', 'cursor-text', 'cursor-shape');
    
    switch(currentTool) {
        case 'pen':
            canvas.classList.add('cursor-pen');
            break;
        case 'eraser':
            canvas.classList.add('cursor-eraser');
            break;
        case 'text':
            canvas.classList.add('cursor-text');
            break;
        default:
            canvas.classList.add('cursor-shape');
    }
}

/**
 * Touch event handlers
 */
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

// ==================== CHAT FUNCTIONALITY ====================

/**
 * Setup chat listeners
 */
function setupChatListeners() {
    chatWS.onopen = function() {
        console.log('✅ Chat WebSocket connected successfully!');
    };
    
    chatWS.onmessage = function(e) {
        console.log('💬 Received chat message:', e.data);
        const data = JSON.parse(e.data);
        if (data.type === 'chat_message') {
            addChatMessage(data);
        }
    };
    
    chatWS.onclose = function(e) {
        console.log('❌ Chat WebSocket disconnected. Code:', e.code, 'Reason:', e.reason);
    };
    
    chatWS.onerror = function(error) {
        console.error('🔴 Chat WebSocket error:', error);
    };
    
    // Chat form submission
    const chatForm = document.getElementById('chat-form');
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (message) {
            chatWS.send(JSON.stringify({
                type: 'chat_message',
                content: message
            }));
            input.value = '';
        }
    });
}

/**
 * Add chat message to UI
 */
function addChatMessage(data) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    
    const isOwnMessage = data.user_id === USER_ID;
    
    messageDiv.innerHTML = `
        <div class="flex ${isOwnMessage ? 'justify-end' : 'justify-start'}">
            <div class="${isOwnMessage ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-900'} rounded-lg px-3 py-2 max-w-xs">
                <p class="text-xs font-semibold mb-1">${data.username}</p>
                <p class="text-sm">${escapeHtml(data.content)}</p>
                <p class="text-xs opacity-75 mt-1">${formatTime(data.timestamp)}</p>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Add participant to list
 */
function addParticipant(data) {
    const participantsList = document.getElementById('participants-list');
    const existingParticipant = participantsList.querySelector(`[data-user-id="${data.user_id}"]`);
    
    if (!existingParticipant) {
        const participantDiv = document.createElement('div');
        participantDiv.className = 'participant-badge flex items-center justify-between p-2 bg-gray-50 rounded-lg';
        participantDiv.dataset.userId = data.user_id;
        
        const isTeacher = data.role === 'teacher';
        const initial = data.username.charAt(0).toUpperCase();
        
        participantDiv.innerHTML = `
            <div class="flex items-center space-x-2">
                <div class="w-8 h-8 rounded-full ${isTeacher ? 'bg-purple-500' : 'bg-blue-500'} flex items-center justify-center text-white font-semibold text-sm">
                    ${initial}
                </div>
                <span class="text-sm font-medium text-gray-900">${data.username}</span>
            </div>
        `;
        
        participantsList.appendChild(participantDiv);
    }
}

/**
 * Remove participant from list
 */
function removeParticipant(userId) {
    const participantsList = document.getElementById('participants-list');
    const participant = participantsList.querySelector(`[data-user-id="${userId}"]`);
    
    if (participant) {
        participant.remove();
    }
}

/**
 * Update participant count
 */
function updateParticipantCount() {
    const count = document.getElementById('participants-list').children.length;
    document.getElementById('participant-count').textContent = count;
}

/**
 * Update hand raised status for participant
 */
function updateHandStatus(userId, raised) {
    const participant = document.getElementById('participants-list').querySelector(`[data-user-id="${userId}"]`);
    
    if (participant) {
        let handIcon = participant.querySelector('.hand-raised');
        
        if (raised && !handIcon) {
            handIcon = document.createElement('span');
            handIcon.className = 'hand-raised';
            handIcon.textContent = '✋';
            participant.appendChild(handIcon);
        } else if (!raised && handIcon) {
            handIcon.remove();
        }
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg text-white animate-fade-in z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'warning' ? 'bg-yellow-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Format timestamp
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
