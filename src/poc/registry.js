const modules = import.meta.glob('./variants/*/index.jsx', { eager: true })

export const variants = Object.values(modules)
  .map((m) => m.default)
  .filter(Boolean)
  .sort((a, b) => {
    if (a.id === '_template') return -1
    if (b.id === '_template') return 1
    return (a.name || '').localeCompare(b.name || '')
  })

export default variants
