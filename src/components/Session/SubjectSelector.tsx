import { useState } from 'react'
import { useSessionStore } from '../../store/sessionStore'
import { useSession } from '../../hooks/useSession'

const PRESET_COLORS = ['#4A90E2', '#E24A4A', '#4AE27A', '#E2C94A', '#9B4AE2', '#E24AAA']

export function SubjectSelector() {
  const subjects = useSessionStore((s) => s.subjects)
  const { createSubject, deleteSubject } = useSession()

  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])

  const handleAdd = async () => {
    if (!newName.trim()) return
    await createSubject(newName.trim(), newColor)
    setNewName('')
    setNewColor(PRESET_COLORS[0])
    setIsAdding(false)
  }

  return (
    <div className="subject-selector">
      <h3>과목 목록</h3>
      <ul>
        {subjects.map((s) => (
          <li key={s.id} style={{ borderLeft: `4px solid ${s.color}` }}>
            <span>{s.name}</span>
            <button onClick={() => deleteSubject(s.id)}>삭제</button>
          </li>
        ))}
      </ul>

      {isAdding ? (
        <div className="subject-add-form">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="과목 이름"
            autoFocus
          />
          <div className="color-picker">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                style={{
                  background: c,
                  outline: newColor === c ? '2px solid #000' : 'none'
                }}
                onClick={() => setNewColor(c)}
              />
            ))}
          </div>
          <button onClick={handleAdd}>추가</button>
          <button onClick={() => setIsAdding(false)}>취소</button>
        </div>
      ) : (
        <button onClick={() => setIsAdding(true)}>+ 과목 추가</button>
      )}
    </div>
  )
}
