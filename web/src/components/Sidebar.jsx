import React, { useState } from 'react'

export default function Sidebar({ subjects = [], onCreate, selected, onSelect }) {
  const [name, setName] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    await onCreate(name.trim())
    setName('')
  }

  return (
    <aside className="w-72 bg-gray-900 border-r border-gray-700 min-h-screen p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Subjects</h2>
      </div>

      <div className="space-y-2 mb-6">
        {subjects.map(s => (
          <button key={s.id} onClick={() => onSelect(s.id)} className={`w-full text-left px-3 py-2 rounded ${selected === s.id ? 'bg-gray-700' : 'hover:bg-gray-800'}`}>
            {s.name}
          </button>
        ))}
      </div>

      <form onSubmit={handleCreate} className="mt-auto">
        <label className="block text-sm text-gray-400 mb-1">New subject</label>
        <div className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} className="flex-1 px-2 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100" />
          <button className="px-3 py-2 bg-indigo-600 rounded">Add</button>
        </div>
      </form>
    </aside>
  )
}
