import { MainCategory, SubCategory, CategoryMeta, Product } from '../types/store';

export const CATEGORIES_META: CategoryMeta[] = [
  {
    id: 'after-effects',
    name: 'After Effects',
    description: 'High-impact motion design presets, plugins, and automation scripts.',
    subcategories: [
      {
        id: 'ae-presets',
        name: 'Presets',
        description: 'Ready-to-use After Effects animation presets and kinetic typography rigs.',
      },
      {
        id: 'ae-plugins',
        name: 'Plugins',
        description: 'Workflow-accelerating plugins and third-party extensions for After Effects.',
      },
      {
        id: 'ae-scripts',
        name: 'Scripts',
        description: 'JSX and automated utility scripts to streamline repetitive composition tasks.',
      },
    ],
  },
  {
    id: 'premiere-pro',
    name: 'Premiere Pro',
    description: 'Timeline-optimized MOGRT templates, transition presets, and editor plugins.',
    subcategories: [
      {
        id: 'pr-plugins',
        name: 'Plugins',
        description: 'Essential editor extensions and panel integrations for Premiere Pro.',
      },
      {
        id: 'mogrt-files',
        name: 'MOGRT Files',
        description: 'Drag-and-drop Motion Graphics Templates with customizable Essential Graphics controls.',
      },
      {
        id: 'pr-presets',
        name: 'Presets',
        description: 'Custom adjustment layer presets including zooms, warps, and speed-curve transitions.',
      },
    ],
  },
  {
    id: 'pro-essentials',
    name: 'Pro Essentials',
    description: 'Everyday creative building blocks: audio stems, SFX, overlays, emojis, and footage.',
    subcategories: [
      {
        id: 'bgms',
        name: 'BGMs',
        description: 'Curated background music tracks and pacing beds optimized for video editing.',
      },
      {
        id: 'sfx',
        name: 'SFX',
        description: 'High-fidelity cinematic whooshes, risers, impacts, and tactile UI foley.',
      },
      {
        id: 'overlays',
        name: 'Overlays',
        description: 'Authentic film grains, light leaks, aspect ratio letterboxes, and vintage textures.',
      },
      {
        id: 'animated-emojis',
        name: 'Apple Animated Emojis',
        description: 'Transparent 3D Apple-style animated emoji stickers for short-form retention.',
      },
      {
        id: 'raw-videos',
        name: 'Raw Videos for Practice',
        description: 'Uncut multi-cam studio raw footage and dialogue clips to practice pacing and cutting.',
      },
    ],
  },
];

export const PRODUCTS: Product[] = [
  // 1. AFTER EFFECTS -> PRESETS
  {
    id: 'ae-text-animation-presets',
    name: 'AE Text Animation Presets',
    slug: 'ae-text-animation-presets',
    mainCategory: 'after-effects',
    subcategory: 'ae-presets',
    categoryLabel: 'AFTER EFFECTS / PRESETS',
    shortDescription: 'Expressive kinetic typography animation presets designed specifically for After Effects.',
    detailedDescription: 'Give your titles punch and energy. A curated collection of expressive, mathematically eased text animation presets built directly for Adobe After Effects. Easily applied to any text layer with instant controls for tracking, velocity, and bounce overshoot.',
    price: 599,
    originalPrice: 999,
    softwareCompatibility: ['Adobe After Effects (2022 and newer)'],
    fileFormat: '.FFX Presets & .AEP Demo Project',
    fileSize: '120 MB',
    isAvailable: true,
    artVariant: 'text',
    artIndex: 'AE / 001',
    kicker: 'For bold kinetic typography',
    whatsIncluded: [
      '30+ After Effects text animation preset files (.ffx)',
      'Master .AEP showcase project with responsive timing controllers',
      'Installation guide PDF and video walkthrough',
      'Commercial client use license',
    ],
    installationInstructions: [
      'Copy the .ffx files into your Adobe After Effects > Support Files > Presets folder.',
      'Open After Effects and navigate to the Effects & Presets panel.',
      'Select any text layer and double-click or drag any preset onto the layer.',
      'Adjust keyframes or velocity sliders in the Effect Controls panel as needed.',
    ],
    downloadFiles: [
      {
        id: 'ae-text-zip',
        name: 'AE_Text_Animation_Presets_v1.0.zip',
        size: '118 MB',
        type: 'ZIP Archive',
        filename: 'AE_Text_Animation_Presets_v1.0.zip',
        description: 'Complete After Effects FFX presets and AEP demo suite',
      },
    ],
  },

  // 2. PREMIERE PRO -> MOGRT FILES
  {
    id: 'pr-text-animation-mogrt',
    name: 'Text Animation MOGRT Pack',
    slug: 'text-animation-mogrt-pack',
    mainCategory: 'premiere-pro',
    subcategory: 'mogrt-files',
    categoryLabel: 'PREMIERE PRO / MOGRT',
    shortDescription: 'Customizable Essential Graphics title templates with auto-resizing text boxes for fast cuts.',
    detailedDescription: 'Built directly for Premiere Pro editors who need high-retention text without opening After Effects. These Motion Graphics Templates (.mogrt) feature auto-scaling bounding boxes, customizable font controls, and responsive intro/outro timing curves.',
    price: 699,
    originalPrice: 1199,
    softwareCompatibility: ['Adobe Premiere Pro (2022 and newer)'],
    fileFormat: '.MOGRT (Essential Graphics)',
    fileSize: '380 MB',
    isAvailable: true,
    artVariant: 'bundle',
    artIndex: 'PR / 001',
    kicker: 'For rapid timeline editing',
    whatsIncluded: [
      '25+ Essential Graphics .MOGRT templates',
      'Auto-resizing text boxes that adjust to your custom words',
      'Color and font customization sliders built-in',
      'Step-by-step setup guide for Premiere Pro',
    ],
    installationInstructions: [
      'Open Premiere Pro and reveal the Essential Graphics panel (Window > Essential Graphics).',
      'Click the Install Motion Graphics Template icon in the lower-right corner, or drag all .mogrt files directly into the Browse tab.',
      'Drag and drop any template directly onto your timeline over your footage.',
      'Edit words, colors, and tracking in the Edit tab of Essential Graphics.',
    ],
    downloadFiles: [
      {
        id: 'pr-mogrt-zip',
        name: 'Text_Animation_MOGRT_Pack_v1.0.zip',
        size: '375 MB',
        type: 'ZIP Archive',
        filename: 'Text_Animation_MOGRT_Pack_v1.0.zip',
        description: 'All 25+ MOGRT template files',
      },
    ],
  },

  // 3. PREMIERE PRO -> PRESETS (Zoom In/Out)
  {
    id: 'pr-zoom-presets',
    name: 'Zoom In/Out Presets',
    slug: 'zoom-in-out-presets',
    mainCategory: 'premiere-pro',
    subcategory: 'pr-presets',
    categoryLabel: 'PREMIERE PRO / PRESETS',
    shortDescription: 'Snappy, motion-blurred zoom in and zoom out transition presets for high-retention video pacing.',
    detailedDescription: 'The core weapon of modern retention editing. Snappy optical zooms with organic motion blur to keep the viewer locked into your edit. Designed for seamless drag-and-drop onto adjustment layers above cut points.',
    price: 499,
    originalPrice: 899,
    softwareCompatibility: ['Adobe Premiere Pro (2021 and newer)'],
    fileFormat: '.prfpset (Premiere Pro Preset File)',
    fileSize: '45 MB',
    isAvailable: true,
    artVariant: 'overlays',
    artIndex: 'PR / 002',
    kicker: 'For instant cut velocity',
    whatsIncluded: [
      '15+ Dynamic Zoom variations (Fast Snap, Smooth Pull, Continuous Push)',
      'Adjustment layer guide timelines',
      'Audio cue markers for perfect sound synchronization',
      'Commercial usage license',
    ],
    installationInstructions: [
      'Open Premiere Pro, go to the Effects panel.',
      'Right-click on the Presets bin and select "Import Presets...".',
      'Select the downloaded .prfpset file.',
      'Create an Adjustment Layer across your cut point (approx 10-14 frames) and drop the zoom preset directly onto it.',
    ],
    downloadFiles: [
      {
        id: 'pr-zoom-zip',
        name: 'Zoom_InOut_Premiere_Presets.zip',
        size: '42 MB',
        type: 'ZIP Archive',
        filename: 'Zoom_InOut_Premiere_Presets.zip',
        description: 'Premiere Pro preset files and adjustment layer guide',
      },
    ],
  },

  // 4. PREMIERE PRO -> PRESETS (Radial Blur)
  {
    id: 'pr-radial-blur-presets',
    name: 'Radial Blur Presets',
    slug: 'radial-blur-presets',
    mainCategory: 'premiere-pro',
    subcategory: 'pr-presets',
    categoryLabel: 'PREMIERE PRO / PRESETS',
    shortDescription: 'High-impact rotational and radial blur transitions for dynamic hooks, b-roll, and fast cuts.',
    detailedDescription: 'Add energetic rotational momentum to your edits. These radial blur transition presets twist and pull the camera into the next shot with buttery smooth bezier easing curves. Ideal for podcast shorts, YouTube intros, and reels.',
    price: 499,
    originalPrice: 899,
    softwareCompatibility: ['Adobe Premiere Pro (2021 and newer)'],
    fileFormat: '.prfpset (Premiere Pro Preset File)',
    fileSize: '50 MB',
    isAvailable: true,
    artVariant: 'sfx',
    artIndex: 'PR / 003',
    kicker: 'For rotational visual punch',
    whatsIncluded: [
      '12+ Radial and rotational blur transitions',
      'Clockwise and counter-clockwise direction variations',
      'Quick install PDF guide',
    ],
    installationInstructions: [
      'In the Effects panel in Premiere Pro, right-click the Presets folder and choose "Import Presets...".',
      'Select the .prfpset file to install.',
      'Drop onto an adjustment layer spanning the cut between two clips.',
    ],
    downloadFiles: [
      {
        id: 'pr-radial-zip',
        name: 'Radial_Blur_Premiere_Presets.zip',
        size: '48 MB',
        type: 'ZIP Archive',
        filename: 'Radial_Blur_Premiere_Presets.zip',
        description: 'Radial blur preset bundle',
      },
    ],
  },
];

export const PORTFOLIO_URL = 'https://piyushretention.framer.website/';
export const BRAND_NAME = 'piyushretention';
export const BRAND_TAGLINE = 'Built for editors. Designed for better storytelling.';
export const BRAND_EMAIL = 'piyushretention@gmail.com';
