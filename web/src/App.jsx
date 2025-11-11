import React, { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import NoteEditor from './components/NoteEditor'

export default function App() {
  const [subjects, setSubjects] = useState([])
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState([])

  useEffect(() => {
    fetch('/api/subjects')
      .then(r => r.json())
      .then(setSubjects)
  }, [])

  useEffect(() => {
    if (!selected) return setNotes([])
    fetch(`/api/subjects/${selected}/notes`)
      .then(r => r.json())
      .then(setNotes)
  }, [selected])

  const createSubject = async (name) => {
    const res = await fetch('/api/subjects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    if (res.ok) {
      const s = await res.json()
      setSubjects(prev => [...prev, s])
    }
  }

  const createNote = async ({ title, content }) => {
    if (!selected) return alert('Select a subject first')
    const res = await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content, subject_id: selected }) })
    if (res.ok) {
      const n = await res.json()
      setNotes(prev => [...prev, n])
    }
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        subjects={subjects}
        onCreate={createSubject}
        selected={selected}
        onSelect={setSelected}
      />

      <main className="flex-1 p-6 bg-gray-800 text-gray-100">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold mb-4">Notes</h1>

          {!selected ? (
            <div className="text-gray-300">Select a subject to view notes</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {notes.map(n => (
                  <div key={n.id} className="p-4 bg-gray-700 rounded">
                    <div className="font-medium">{n.title}</div>
                    <div className="text-sm text-gray-300 mt-2">{n.content.slice(0, 200)}</div>
                  </div>
                ))}
              </div>

              <NoteEditor onSave={createNote} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
