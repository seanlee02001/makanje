'use client'

const SUGGESTED_TAGS = [
  'Quick', 'Malaysian', 'Italian', 'Chinese',
  'Vegetarian', 'Kid-friendly', 'Comfort food', 'Healthy', 'Spicy',
]

interface TagFilterProps {
  tags: string[]        // available tags to show
  selected: string | null
  onSelect: (tag: string | null) => void
}

export function TagFilter({ tags, selected, onSelect }: TagFilterProps) {
  const allTags = Array.from(new Set([...SUGGESTED_TAGS, ...tags]))

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      <button
        onClick={() => onSelect(null)}
        className="shrink-0 px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors"
        style={{
          background: selected === null ? 'var(--accent)' : 'var(--surface)',
          color: selected === null ? '#ffffff' : 'var(--text-secondary)',
        }}
      >
        All
      </button>
      {allTags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelect(selected === tag ? null : tag)}
          className="shrink-0 px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors whitespace-nowrap"
          style={{
            background: selected === tag ? 'var(--accent)' : 'var(--surface)',
            color: selected === tag ? '#ffffff' : 'var(--text-secondary)',
          }}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}

export { SUGGESTED_TAGS }
