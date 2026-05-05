import type { StandardVariant } from './StandardPdf';

// Variant-Katalog pro Template-ID

export const TEMPLATE_VARIANTS: Record<string, StandardVariant> = {
  // Klassische, ruhige Stile
  corporate:     { sidebar: 'left',  sidebarBg: '#f4f6f8', headingStyle: 'bar',       skillStyle: 'bar',   nameSize: 28 },
  nordic:        { sidebar: 'right', sidebarBg: '#eef3f7', headingStyle: 'line',      skillStyle: 'dots',  nameSize: 28 },
  compact:       { sidebar: 'right', sidebarBg: '#f7f7f9', headingStyle: 'underline', skillStyle: 'chips', nameSize: 24 },
  international: { sidebar: 'left',  sidebarBg: '#f7f7f7', header: 'centered',        headingStyle: 'underline', skillStyle: 'chips', nameSize: 30 },
  academic:      { sidebar: 'none',  serif: true,          header: 'centered',        headingStyle: 'underline', skillStyle: 'dots',  nameSize: 30 },

  // Banner-Header-Stile
  executive:     { sidebar: 'left',  sidebarBg: '#1a1a2e', sidebarText: '#f5f5f7', header: 'banner', bannerBg: '#1a1a2e', headingStyle: 'bar',   skillStyle: 'dots',  nameSize: 30 },
  bold:          { sidebar: 'left',  sidebarBg: '#1c1c1e', sidebarText: '#f5f5f7', header: 'banner', bannerBg: '#1c1c1e', headingStyle: 'bar',   skillStyle: 'bar',   nameSize: 32 },
  creative:      { sidebar: 'left',  sidebarBg: '#2d1b4e', sidebarText: '#f5f5f7', header: 'banner', photoInSidebar: true, headingStyle: 'block', skillStyle: 'chips', nameSize: 30 },
  vibrant:       { sidebar: 'right', sidebarBg: '#fff5f7', header: 'banner',       headingStyle: 'block',                    skillStyle: 'chips', nameSize: 30 },

  // Sidebar-Akzent-Stile
  modern:        { sidebar: 'left',  sidebarBg: '#0f1923', sidebarText: '#e5e7eb',  photoInSidebar: true, headingStyle: 'underline', skillStyle: 'bar',   nameSize: 28 },
  tech:          { sidebar: 'left',  sidebarBg: '#0d1117', sidebarText: '#c9d1d9',  photoInSidebar: true, headingStyle: 'bar',       skillStyle: 'chips', nameSize: 26 },
  startup:       { sidebar: 'right', sidebarBg: '#f0fdf4', headingStyle: 'bar',      skillStyle: 'chips', nameSize: 28 },
  pastel:        { sidebar: 'right', sidebarBg: '#fdf2f8', headingStyle: 'line',     skillStyle: 'dots',  nameSize: 28 },
  freelancer:    { sidebar: 'right', sidebarBg: '#fef6e4', headingStyle: 'bar',      skillStyle: 'chips', nameSize: 28 },
  geometric:     { sidebar: 'left',  sidebarBg: '#f1f5f9', headingStyle: 'block',    skillStyle: 'bar',   nameSize: 28 },

  // Ungewoehnliche Layouts
  magazine:      { sidebar: 'left',  sidebarBg: '#111',    sidebarText: '#f5f5f7', photoInSidebar: true, headingStyle: 'underline', skillStyle: 'dots', nameSize: 34, nameTracking: -1.2 },
  vintage:       { sidebar: 'none',  serif: true,          header: 'centered',      headingStyle: 'underline', skillStyle: 'dots', nameSize: 32 },
};
