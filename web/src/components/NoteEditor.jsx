import React, { useState } from 'react'

export default function NoteEditor({ onSave }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return alert('title and content required')
    await onSave({ title: title.trim(), content })
    setTitle('')
    setContent('')
  }

  return (
    <form onSubmit={submit} className="bg-gray-900 p-4 rounded">
      <div className="mb-2">
        <input className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div className="mb-3">
        <textarea rows={8} className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-gray-100 font-mono" placeholder="Markdown content..." value={content} onChange={e => setContent(e.target.value)} />
      </div>
      <div className="text-right">
        <button className="px-4 py-2 bg-green-600 rounded">Save Note</button>
      </div>
    </form>
  )
}
