import { createClient } from '@supabase/supabase-js'
import { SECTION_ORDER } from '@/lib/utils/generateShoppingList'
import type { ShoppingList, ShoppingItem } from '@/lib/supabase/types'

async function getShoppingListByToken(token: string): Promise<ShoppingList | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('share_token', token)
    .single()
  return data
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const list = await getShoppingListByToken(token)

  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh p-8 bg-white">
        <p className="text-slate-500 text-sm">This shopping list is not available.</p>
      </div>
    )
  }

  const items: ShoppingItem[] = list.items ?? []

  // Group by store section
  const grouped = SECTION_ORDER.reduce((acc, section) => {
    const sectionItems = items.filter((i) => (i.store_section ?? 'Other') === section && !i.checked)
    if (sectionItems.length > 0) acc[section] = sectionItems
    return acc
  }, {} as Record<string, ShoppingItem[]>)

  const checkedItems = items.filter((i) => i.checked)
  const total = items.length
  const doneCount = checkedItems.length

  return (
    <div className="max-w-md mx-auto p-4 pb-16 bg-white min-h-dvh">
      {/* Header */}
      <div className="mb-6 pt-4">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M16 10a4 4 0 01-8 0" />
          </svg>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Shopping List
          </h1>
        </div>
        <p className="text-sm text-slate-500">Week of {list.week_start_date}</p>
        {total > 0 && (
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            {doneCount} / {total} done
          </p>
        )}
      </div>

      {total === 0 ? (
        <p className="text-slate-400 text-sm text-center py-12">Nothing on the list yet.</p>
      ) : (
        <>
          {/* Grouped unchecked */}
          {Object.entries(grouped).map(([section, sectionItems]) => (
            <div key={section} className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">
                {section}
              </p>
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {sectionItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-4 h-4 rounded border-2 border-slate-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      {item.quantity != null && (
                        <p className="text-xs text-slate-400">
                          {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Checked */}
          {checkedItems.length > 0 && (
            <div className="mb-4 opacity-50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Done
              </p>
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {checkedItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-4 h-4 rounded border-2 border-emerald-400 bg-emerald-400 shrink-0 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="currentColor">
                        <path d="M1.5 5.5L4 8l4.5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-sm text-slate-400 line-through">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-center text-xs text-slate-300 mt-8">Shared via MakanJe</p>
    </div>
  )
}
