import {
  WELCOME_CODE,
} from '../app.config';
import EventEmitter from 'eventemitter3';
import { APP_URL, SHARE_CODE_ROUTE_NAME } from '../app.config';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

const STORAGE_KEY_TABS = 'instacode_tabs';
const STORAGE_KEY_ACTIVE_TAB = 'instacode_active_tab';
const STORAGE_KEY_CLOSED_TABS = 'instacode_closed_tabs';

const ee = new EventEmitter();

let tabs = [];
let activeTabId = null;
let closedTabs = [];
let suggestions = [];

const init = () => {
  let loadedTabs = JSON.parse(localStorage.getItem(STORAGE_KEY_TABS) || 'null');
  
  if (!loadedTabs) {
    // Migration from old version
    const oldCode = localStorage.getItem('code');
    const defaultId = Date.now().toString(36);
    tabs = [{ id: defaultId, title: 'Script 1', code: oldCode || WELCOME_CODE }];
    if (oldCode) localStorage.removeItem('code'); // Cleanup old key
  } else {
    tabs = loadedTabs;
  }

  if (tabs.length === 0) {
    const defaultId = Date.now().toString(36);
    tabs.push({ id: defaultId, title: 'Script 1', code: WELCOME_CODE });
  } else if (tabs.length === 1 && !tabs[0].code.trim()) {
    tabs[0].code = WELCOME_CODE;
  }

  // Persist the repaired/migrated state immediately
  localStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(tabs));

  activeTabId = localStorage.getItem(STORAGE_KEY_ACTIVE_TAB) || tabs[0].id;
  if (!tabs.find(t => t.id === activeTabId)) {
    activeTabId = tabs[0].id;
  }

  closedTabs = JSON.parse(localStorage.getItem(STORAGE_KEY_CLOSED_TABS) || '[]');
};

const codeService = {
  getTabs() { return tabs; },
  getActiveTabId() { return activeTabId; },
  getTab(id) { return tabs.find(t => t.id === id); },
  get() {
    return this.getTab(activeTabId)?.code || '';
  },
  change(code, tabId = activeTabId) {
    const tab = this.getTab(tabId);
    if (tab) {
      tab.code = code;
      localStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(tabs));
      if (tabId === activeTabId) {
        ee.emit('change', { tabId, code });
      }
      ee.emit(`change:${tabId}`, code);
    }
  },
  setActiveTab(id) {
    if (this.getTab(id) && id !== activeTabId) {
      activeTabId = id;
      localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, activeTabId);
      ee.emit('tabs-changed');
    }
  },
  newTab(code = '', customTitle = null) {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const title = customTitle || `Script ${tabs.length + 1}`;
    tabs.push({ id, title, code });
    localStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(tabs));
    ee.emit('tabs-changed');
    this.setActiveTab(id);
    ee.emit('change', { tabId: id, code }); // Start the worker for the new tab
    return id;
  },
  closeTab(id) {
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex(t => t.id === id);
    if (idx !== -1) {
      closedTabs.push(tabs[idx]);
      localStorage.setItem(STORAGE_KEY_CLOSED_TABS, JSON.stringify(closedTabs));
      
      tabs.splice(idx, 1);
      localStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(tabs));
      
      if (activeTabId === id) {
        const nextTab = tabs[Math.min(idx, tabs.length - 1)];
        this.setActiveTab(nextTab.id);
      } else {
        ee.emit('tabs-changed');
      }
    }
  },
  renameTab(id, newTitle) {
    const tab = this.getTab(id);
    if (tab && newTitle && newTitle.trim() !== '') {
      tab.title = newTitle.trim();
      localStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(tabs));
      ee.emit('tabs-changed');
    }
  },
  restoreTab() {
    if (closedTabs.length > 0) {
      const restoredTab = closedTabs.pop();
      tabs.push(restoredTab);
      localStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(tabs));
      localStorage.setItem(STORAGE_KEY_CLOSED_TABS, JSON.stringify(closedTabs));
      ee.emit('tabs-changed');
      this.setActiveTab(restoredTab.id);
      ee.emit('change', { tabId: restoredTab.id, code: restoredTab.code }); // Restart worker for restored tab
    } else {
      this.newTab();
    }
  },
  getSuggestions() {
    return suggestions;
  },
  addSuggestion(suggestion) {
    const existing = suggestions.findIndex(s => s.line === suggestion.line && s.name === suggestion.name);
    if (existing >= 0) {
      suggestions[existing] = suggestion;
    } else {
      suggestions.push(suggestion);
    }
    ee.emit('suggestions-changed');
  },
  removeSuggestion(suggestion) {
    suggestions = suggestions.filter(s => s !== suggestion);
    ee.emit('suggestions-changed');
  },
  clearSuggestions() {
    if (suggestions.length > 0) {
      suggestions = [];
      ee.emit('suggestions-changed');
    }
  },
  stash() {
    // Legacy support: We just open a new tab now instead of stashing to a single array.
    // Or we could rename the current tab. For now, doing nothing is safer as newTab replaces the need for stash.
  },
  setFromUrl(_encoded) {
    const newCode = decompressFromEncodedURIComponent(_encoded);
    this.newTab(newCode, 'Shared Snippet');
  },
  codeToUrl(_code = this.get()) {
    return [APP_URL, SHARE_CODE_ROUTE_NAME, compressToEncodedURIComponent(_code)].join('/');
  },
  ee,
};

init();
export default codeService;
