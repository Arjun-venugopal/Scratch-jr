import { BlockCategory, BlockDefinition } from '../types/scratchBlock';

export interface CategoryColor {
  primary: string;
  secondary: string;
  dark: string;
  text: string;
  badgeBg: string;
  label: string;
  icon: string;
}

export const CATEGORY_COLORS: Record<BlockCategory, CategoryColor> = {
  motion: {
    primary: '#3B82F6',
    secondary: '#60A5FA',
    dark: '#1D4ED8',
    text: '#FFFFFF',
    badgeBg: 'bg-[#3B82F6]',
    label: 'Motion',
    icon: '🏃',
  },
  looks: {
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    dark: '#6D28D9',
    text: '#FFFFFF',
    badgeBg: 'bg-[#8B5CF6]',
    label: 'Looks',
    icon: '👀',
  },
  sound: {
    primary: '#EC4899',
    secondary: '#F472B6',
    dark: '#BE185D',
    text: '#FFFFFF',
    badgeBg: 'bg-[#EC4899]',
    label: 'Sound',
    icon: '🔊',
  },
  events: {
    primary: '#F59E0B',
    secondary: '#FBBF24',
    dark: '#B45309',
    text: '#FFFFFF',
    badgeBg: 'bg-[#F59E0B]',
    label: 'Events',
    icon: '🚩',
  },
  control: {
    primary: '#F97316',
    secondary: '#FB923C',
    dark: '#C2410C',
    text: '#FFFFFF',
    badgeBg: 'bg-[#F97316]',
    label: 'Control',
    icon: '🔁',
  },
  sensing: {
    primary: '#06B6D4',
    secondary: '#22D3EE',
    dark: '#0F766E',
    text: '#FFFFFF',
    badgeBg: 'bg-[#06B6D4]',
    label: 'Sensing',
    icon: '📡',
  },
  operators: {
    primary: '#10B981',
    secondary: '#34D399',
    dark: '#047857',
    text: '#FFFFFF',
    badgeBg: 'bg-[#10B981]',
    label: 'Operators',
    icon: '➕',
  },
  variables: {
    primary: '#EF4444',
    secondary: '#F87171',
    dark: '#B91C1C',
    text: '#FFFFFF',
    badgeBg: 'bg-[#EF4444]',
    label: 'Variables',
    icon: '📦',
  },
  messages: {
    primary: '#14B8A6',
    secondary: '#2DD4BF',
    dark: '#0F766E',
    text: '#FFFFFF',
    badgeBg: 'bg-[#14B8A6]',
    label: 'Messages',
    icon: '💬',
  },
  myblocks: {
    primary: '#F43F5E',
    secondary: '#FB7185',
    dark: '#BE123C',
    text: '#FFFFFF',
    badgeBg: 'bg-[#F43F5E]',
    label: 'My Blocks',
    icon: '🧩',
  },
};

export const BLOCK_DEFINITIONS: Record<string, BlockDefinition> = {
  // ── Events ──
  event_whenflagclicked: {
    type: 'event_whenflagclicked',
    category: 'events',
    shape: 'hat',
    label: '🚩 Start',
  },
  event_whenthisspriteclicked: {
    type: 'event_whenthisspriteclicked',
    category: 'events',
    shape: 'hat',
    label: '👆 On Tap',
  },
  event_whentouchingsprite: {
    type: 'event_whentouchingsprite',
    category: 'events',
    shape: 'hat',
    label: '🤝 On Touch',
  },

  // ── Messages ──
  event_broadcast: {
    type: 'event_broadcast',
    category: 'messages',
    shape: 'stack',
    label: '💬 Send %1',
    inputs: [
      {
        name: 'MESSAGE',
        type: 'select',
        defaultValue: 'message1',
        options: [
          { label: 'Message 1 ✉️', value: 'message1' },
          { label: 'Message 2 📨', value: 'message2' },
          { label: 'Orange 🍊', value: 'orange' },
          { label: 'Blue 💙', value: 'blue' },
        ],
      },
    ],
  },
  event_whenbroadcastreceived: {
    type: 'event_whenbroadcastreceived',
    category: 'messages',
    shape: 'hat',
    label: '💬 On %1',
    inputs: [
      {
        name: 'MESSAGE',
        type: 'select',
        defaultValue: 'message1',
        options: [
          { label: 'Message 1 ✉️', value: 'message1' },
          { label: 'Message 2 📨', value: 'message2' },
          { label: 'Orange 🍊', value: 'orange' },
          { label: 'Blue 💙', value: 'blue' },
        ],
      },
    ],
  },

  // ── Motion ──
  motion_moveright: {
    type: 'motion_moveright',
    category: 'motion',
    shape: 'stack',
    label: '➡️ Right %1',
    inputs: [
      {
        name: 'STEPS',
        type: 'number',
        defaultValue: 2,
      },
    ],
  },
  motion_moveleft: {
    type: 'motion_moveleft',
    category: 'motion',
    shape: 'stack',
    label: '⬅️ Left %1',
    inputs: [
      {
        name: 'STEPS',
        type: 'number',
        defaultValue: 2,
      },
    ],
  },
  motion_moveup: {
    type: 'motion_moveup',
    category: 'motion',
    shape: 'stack',
    label: '⬆️ Up %1',
    inputs: [
      {
        name: 'STEPS',
        type: 'number',
        defaultValue: 2,
      },
    ],
  },
  motion_movedown: {
    type: 'motion_movedown',
    category: 'motion',
    shape: 'stack',
    label: '⬇️ Down %1',
    inputs: [
      {
        name: 'STEPS',
        type: 'number',
        defaultValue: 2,
      },
    ],
  },
  motion_turnright: {
    type: 'motion_turnright',
    category: 'motion',
    shape: 'stack',
    label: '↻ Turn Right %1°',
    inputs: [
      {
        name: 'DEGREES',
        type: 'number',
        defaultValue: 15,
      },
    ],
  },
  motion_turnleft: {
    type: 'motion_turnleft',
    category: 'motion',
    shape: 'stack',
    label: '↺ Turn Left %1°',
    inputs: [
      {
        name: 'DEGREES',
        type: 'number',
        defaultValue: 15,
      },
    ],
  },
  motion_jump: {
    type: 'motion_jump',
    category: 'motion',
    shape: 'stack',
    label: '🦘 Hop %1',
    inputs: [
      {
        name: 'HEIGHT',
        type: 'number',
        defaultValue: 2,
      },
    ],
  },
  motion_gohome: {
    type: 'motion_gohome',
    category: 'motion',
    shape: 'stack',
    label: '🏠 Go Home',
  },
  motion_movesteps: {
    type: 'motion_movesteps',
    category: 'motion',
    shape: 'stack',
    label: '🏃 Move %1',
    inputs: [
      {
        name: 'STEPS',
        type: 'number',
        defaultValue: 10,
      },
    ],
  },
  motion_gotoxy: {
    type: 'motion_gotoxy',
    category: 'motion',
    shape: 'stack',
    label: '📍 Go x: %1 y: %2',
    inputs: [
      { name: 'X', type: 'number', defaultValue: 0 },
      { name: 'Y', type: 'number', defaultValue: 0 },
    ],
  },

  // ── Looks ──
  looks_say: {
    type: 'looks_say',
    category: 'looks',
    shape: 'stack',
    label: '💬 Say %1 for %2 s',
    inputs: [
      { name: 'MESSAGE', type: 'text', defaultValue: 'Hello!' },
      { name: 'SECS', type: 'number', defaultValue: 2 },
    ],
  },
  looks_grow: {
    type: 'looks_grow',
    category: 'looks',
    shape: 'stack',
    label: '🔍 Grow %1',
    inputs: [
      { name: 'CHANGE', type: 'number', defaultValue: 2 },
    ],
  },
  looks_shrink: {
    type: 'looks_shrink',
    category: 'looks',
    shape: 'stack',
    label: '🔉 Shrink %1',
    inputs: [
      { name: 'CHANGE', type: 'number', defaultValue: 2 },
    ],
  },
  looks_resetsize: {
    type: 'looks_resetsize',
    category: 'looks',
    shape: 'stack',
    label: '🔄 Reset Size',
  },
  looks_show: {
    type: 'looks_show',
    category: 'looks',
    shape: 'stack',
    label: '👀 Show',
  },
  looks_hide: {
    type: 'looks_hide',
    category: 'looks',
    shape: 'stack',
    label: '🙈 Hide',
  },

  // ── Sound ──
  sound_play: {
    type: 'sound_play',
    category: 'sound',
    shape: 'stack',
    label: '🔊 Sound %1',
    inputs: [
      {
        name: 'SOUND',
        type: 'select',
        defaultValue: 'Meow',
        options: [
          { label: 'Meow 🐱', value: 'Meow' },
          { label: 'Pop 🎈', value: 'Pop' },
          { label: 'Chime 🔔', value: 'Chime' },
        ],
      },
    ],
  },

  // ── Control ──
  control_wait: {
    type: 'control_wait',
    category: 'control',
    shape: 'stack',
    label: '⏳ Wait %1 s',
    inputs: [
      { name: 'DURATION', type: 'number', defaultValue: 1 },
    ],
  },
  control_repeat: {
    type: 'control_repeat',
    category: 'control',
    shape: 'c-block',
    label: '🔁 Repeat %1',
    defaultSubstack: true,
    inputs: [
      { name: 'TIMES', type: 'number', defaultValue: 4 },
    ],
  },
  control_forever: {
    type: 'control_forever',
    category: 'control',
    shape: 'c-block',
    label: '∞ Forever',
    defaultSubstack: true,
  },
  control_setspeed: {
    type: 'control_setspeed',
    category: 'control',
    shape: 'stack',
    label: '⚡ Speed %1',
    inputs: [
      {
        name: 'SPEED',
        type: 'select',
        defaultValue: '2',
        options: [
          { label: 'Slow 🐢', value: '1' },
          { label: 'Normal 🚶', value: '2' },
          { label: 'Fast ⚡', value: '3' },
        ],
      },
    ],
  },
  control_if: {
    type: 'control_if',
    category: 'control',
    shape: 'c-block',
    label: '❓ If %1 then',
    defaultSubstack: true,
    inputs: [
      { name: 'CONDITION', type: 'reporter', defaultValue: '' },
    ],
  },
  control_stop: {
    type: 'control_stop',
    category: 'control',
    shape: 'cap',
    label: '🛑 Stop',
  },

  // ── Sensing ──
  sensing_touchingmouse: {
    type: 'sensing_touchingmouse',
    category: 'sensing',
    shape: 'boolean',
    label: '👉 Touching mouse?',
  },

  // ── Operators ──
  operator_add: {
    type: 'operator_add',
    category: 'operators',
    shape: 'reporter',
    label: '%1 ➕ %2',
    inputs: [
      { name: 'NUM1', type: 'number', defaultValue: '' },
      { name: 'NUM2', type: 'number', defaultValue: '' },
    ],
  },

  // ── Variables ──
  data_variable: {
    type: 'data_variable',
    category: 'variables',
    shape: 'reporter',
    label: '📦 my var',
  },
  data_setvariableto: {
    type: 'data_setvariableto',
    category: 'variables',
    shape: 'stack',
    label: '📦 set var to %1',
    inputs: [
      { name: 'VALUE', type: 'number', defaultValue: 1 },
    ],
  },
};

export const CATEGORY_BLOCK_IDS: Record<BlockCategory, string[]> = {
  events: ['event_whenflagclicked', 'event_whenthisspriteclicked', 'event_whentouchingsprite'],
  messages: ['event_broadcast', 'event_whenbroadcastreceived'],
  motion: [
    'motion_moveright',
    'motion_moveleft',
    'motion_moveup',
    'motion_movedown',
    'motion_turnright',
    'motion_turnleft',
    'motion_jump',
    'motion_gohome',
    'motion_movesteps',
    'motion_gotoxy',
  ],
  looks: ['looks_say', 'looks_grow', 'looks_shrink', 'looks_resetsize', 'looks_show', 'looks_hide'],
  sound: ['sound_play'],
  control: ['control_wait', 'control_repeat', 'control_forever', 'control_setspeed', 'control_stop'],
  sensing: ['sensing_touchingmouse'],
  operators: ['operator_add'],
  variables: ['data_variable', 'data_setvariableto'],
  myblocks: [],
};

