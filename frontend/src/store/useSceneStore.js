import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSceneStore = create((set, get) => ({
  elements: [],
  history: [],
  redoStack: [],
  selectedElementId: null,
  
  // Permissions
  canDraw: false,
  canChat: false,
  roomLocked: false,
  chatLocked: false,
  // Navigation and Settings
  pan: { x: 0, y: 0 },
  zoom: 1,
  otherCursors: {},
  showGrid: true,

  setPan: (panUpdate) => set((state) => ({ 
    pan: typeof panUpdate === 'function' ? panUpdate(state.pan) : panUpdate 
  })),
  setZoom: (zoomUpdate) => set((state) => ({ 
    zoom: typeof zoomUpdate === 'function' ? zoomUpdate(state.zoom) : zoomUpdate 
  })),
  setOtherCursors: (updater) => set((state) => ({
    otherCursors: typeof updater === 'function' ? updater(state.otherCursors) : updater
  })),
  setShowGrid: (showGrid) => set({ showGrid }),

  setElements: (elementsUpdate) => set((state) => ({ 
    elements: typeof elementsUpdate === 'function' ? elementsUpdate(state.elements) : elementsUpdate 
  })),
  
  addElement: (element) => {
    const { elements, history } = get();
    set({ 
      elements: [...elements, element],
      history: [...history, elements], // Save current state to history
      redoStack: [] // Clear redo on new action
    });
  },

  updateElement: (id, newData) => {
    const { elements } = get();
    set({
      elements: elements.map(el => el.id === id ? { ...el, ...newData } : el)
    });
  },

  bringForward: (id) => {
    const { elements } = get();
    const index = elements.findIndex(e => e.id === id);
    if (index >= 0 && index < elements.length - 1) {
      const newElements = [...elements];
      [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
      set({ elements: newElements });
    }
  },

  sendBackward: (id) => {
    const { elements } = get();
    const index = elements.findIndex(e => e.id === id);
    if (index > 0) {
      const newElements = [...elements];
      [newElements[index - 1], newElements[index]] = [newElements[index], newElements[index - 1]];
      set({ elements: newElements });
    }
  },

  undo: () => {
    const { history, elements, redoStack } = get();
    const username = localStorage.getItem("username");
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      const newHistory = history.slice(0, -1);
      
      // Preserve other users' latest changes while reverting our own
      const myPrevious = previousState.filter(el => String(el.id).startsWith(username + "-"));
      const othersCurrent = elements.filter(el => !String(el.id).startsWith(username + "-"));
      
      set({ 
        elements: [...othersCurrent, ...myPrevious], 
        history: newHistory, 
        redoStack: [elements, ...redoStack] 
      });
    }
  },

  redo: () => {
    const { elements, redoStack, history } = get();
    const username = localStorage.getItem("username");
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      const newRedoStack = redoStack.slice(1);
      
      const myNext = nextState.filter(el => String(el.id).startsWith(username + "-"));
      const othersCurrent = elements.filter(el => !String(el.id).startsWith(username + "-"));

      set({ 
        elements: [...othersCurrent, ...myNext], 
        history: [...history, elements], 
        redoStack: newRedoStack 
      });
    }
  },

  clearElements: () => set({ elements: [], history: [], redoStack: [] }),

  setPermissions: (perms) => set((state) => ({ ...state, ...perms })),
  
  setSelectedElementId: (id) => set({ selectedElementId: id }),
}));

export default useSceneStore;
