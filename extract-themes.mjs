import fs from 'fs';
import { color as oneDarkColor } from '@codemirror/theme-one-dark';
import * as allThemes from '@uiw/codemirror-themes-all';

// Helper to parse hex color to RGB
function parseColor(colorStr) {
  if (!colorStr) return { r: 0, g: 0, b: 0 };
  let hex = colorStr.trim();
  if (hex.startsWith('#')) {
    hex = hex.substring(1);
  }
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

// Helper to format RGB back to hex
function toHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Adjust brightness of a color
function adjustBrightness(colorStr, factor) {
  const { r, g, b } = parseColor(colorStr);
  return toHex(r * factor, g * factor, b * factor);
}

// Check if a color is light or dark using relative luminance
function isLight(colorStr) {
  const { r, g, b } = parseColor(colorStr);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

const rawThemes = {
  oneDark: {
    settings: oneDarkColor,
    border: oneDarkColor.cyan,
    text: oneDarkColor.ivory,
  },
  dracula: {
    settings: allThemes.defaultSettingsDracula,
    border: '#bd93f9',
    text: '#6272a4'
  },
  githubDark: {
    settings: allThemes.defaultSettingsGithubDark,
    border: '#f78166',
    text: '#8b949e'
  },
  githubLight: {
    settings: allThemes.defaultSettingsGithubLight,
    border: '#0969da',
    text: '#57606a'
  },
  nord: {
    settings: allThemes.defaultSettingsNord,
    border: '#88c0d0',
    text: '#d8dee9'
  },
  monokai: {
    settings: allThemes.defaultSettingsMonokai,
    border: '#a6e22e',
    text: '#75715e'
  },
  material: {
    settings: allThemes.defaultSettingsMaterial,
    border: '#80cbc4',
    text: '#546e7a'
  },
  eclipse: {
    settings: allThemes.defaultSettingsEclipse,
    border: '#0000ff',
    text: '#7f7f7f'
  }
};

const themeConfigs = {};

for (const [name, raw] of Object.entries(rawThemes)) {
  const bg = raw.settings.background || '#ffffff';
  const fg = raw.settings.foreground || (isLight(bg) ? '#000000' : '#ffffff');
  
  // Decide tabBg
  let tabBg;
  if (raw.settings.darkBackground) {
    tabBg = raw.settings.darkBackground;
  } else if (raw.settings.gutterBackground && raw.settings.gutterBackground !== bg && raw.settings.gutterBackground !== 'transparent') {
    tabBg = raw.settings.gutterBackground;
  } else {
    // Dynamically scale brightness for the tab bar background to create contrast
    if (isLight(bg)) {
      tabBg = adjustBrightness(bg, 0.95); // Slightly darker for light themes
    } else {
      tabBg = adjustBrightness(bg, 0.78); // Darker for dark themes
    }
  }
  
  const light = isLight(bg);
  const neutralBorder = light ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
  
  themeConfigs[name] = {
    bg,
    tabBg,
    activeTab: bg,
    text: raw.text || fg,
    activeText: fg,
    border: raw.border || fg,
    neutralBorder
  };
}

fs.writeFileSync(
  './src/assets/themes-metadata.json',
  JSON.stringify(themeConfigs, null, 2)
);

console.log('Successfully generated themes-metadata.json!');
