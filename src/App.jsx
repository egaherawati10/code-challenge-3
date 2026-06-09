import { useState, useEffect, useCallback, useMemo } from 'react'

// Issue 1: Inline API key (security issue)
// Fix 1: Removed hardcoded API key (security issue)
// API keys must never be committed to source code.
// Use environment variables: import.meta.env.VITE_API_KEY

function App() {
  // Issue 2: State management bisa lebih baik
  // Sudah terpisah, tidak diubah
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState('all')
  
  // Issue 3: useEffect tanpa dependency array yang tepat
  // Fix 3: Added correct dependency array (empty = run once on mount)
  useEffect(() => {
    const saved = localStorage.getItem('todos')
    if (saved) {
      try {
        // Fix 7: Added error handling for corrupted localStorage data
        setTodos(JSON.parse(saved))
      } catch {
        localStorage.removeItem('todos')
      }
    }
  }, [])
  
  // Issue 4: useEffect yang terlalu sering run
  // Fix 4: Added [todos] dependency so it only runs when todos actually change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])
  
  // Issue 5: Function yang tidak di-memoize, re-create setiap render
  // Fix 5 & 10: Memoized handlers with useCallback to avoid re-creating on every render
  const addTodo = useCallback(() => {
    const trimmed = input.trim()
    if (trimmed === '') {
      alert('Please enter a todo')
      return
    }
    
    // Issue 6: Menggunakan Date.now() sebagai ID (bisa collision)
    // Fix 6: Use crypto.randomUUID() for collision-free IDs
    const newTodo = {
      id: crypto.randomUUID(),
      text: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
    }
 
    setTodos((prev) => [...prev, newTodo])
    setInput('')
  }, [input])
  
  // Issue 7: Tidak ada error handling
  const deleteTodo = useCallback((id) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }, [])
 
  const toggleTodo = useCallback((id) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }, [])
 
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        addTodo()
      }
    },
    [addTodo]
  )
 
  const handleFilterAll = useCallback(() => setFilter('all'), [])
  const handleFilterActive = useCallback(() => setFilter('active'), [])
  const handleFilterCompleted = useCallback(() => setFilter('completed'), [])
  
  // Issue 8: Logic filtering yang bisa dipindah ke useMemo
  // Fix 8: Moved filtering logic to useMemo so it only recalculates when todos or filter changes
  const filteredTodos = useMemo(() => {
    if (filter === 'active') return todos.filter((t) => !t.completed)
    if (filter === 'completed') return todos.filter((t) => t.completed)
    return todos
  }, [todos, filter])
  
  // Issue 9: Calculation yang tidak perlu di setiap render
  // Fix 9: Memoize stats calculation
  const stats = useMemo(
    () => ({
      total: todos.length,
      completed: todos.filter((t) => t.completed).length,
      active: todos.filter((t) => !t.completed).length,
    }),
    [todos]
  )
  
  // Issue 10: Inline event handler dengan arrow function (re-create setiap render)
  return (
    <div className="app">
      <h1>My Todo List</h1>
      
      {/* Issue 11: Tidak ada label untuk accessibility */}
      {/* Fix 11: Added accessible label for the input */}
      <div className="input-section">
        <label htmlFor="todo-input" className="visually-hidden">
          New todo
        </label>
        <input
          id="todo-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
          aria-label="New todo"
        />
        <button onClick={addTodo}>Add</button>
      </div>
      
      {/* Fix 12: Replaced inline styles with CSS classes */}
      <div className="filter-section">
        <button
          onClick={handleFilterAll}
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
          aria-pressed={filter === 'all'}
        >
          All
        </button>
        <button
          onClick={handleFilterActive}
          className={filter === 'active' ? 'filter-btn active' : 'filter-btn'}
          aria-pressed={filter === 'active'}
        >
          Active
        </button>
        <button
          onClick={handleFilterCompleted}
          className={
            filter === 'completed' ? 'filter-btn active' : 'filter-btn'
          }
          aria-pressed={filter === 'completed'}
        >
          Completed
        </button>
      </div>
 
      <div className="todo-list" role="list" aria-label="Todo items">
        {/* Issue 13: Tidak ada handling untuk empty state */}
        {/* Fix 13: Added empty state handling */}
        {filteredTodos.length === 0 && (
          <p className="empty-state">
            {filter === 'all'
              ? 'No todos yet. Add one above!'
              : `No ${filter} todos.`}
          </p>
        )}
 
        {filteredTodos.map((todo) => (
          // Issue 14: Key menggunakan index bisa lebih baik dengan ID
          // Fix 14: Key already uses todo.id (stable unique ID, not array index)
          <div
            key={todo.id}
            className={`todo-item ${todo.completed ? 'completed' : ''}`}
            role="listitem"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              aria-label={`Mark "${todo.text}" as ${todo.completed ? 'active' : 'completed'}`}
            />
            {/* Issue 15: Potential XSS jika text dari user input */}
            {/* Fix 15: Replaced dangerouslySetInnerHTML with safe text rendering */}
            <span>{todo.text}</span>
            <button
              className="delete-btn"
              onClick={() => deleteTodo(todo.id)}
              aria-label={`Delete "${todo.text}"`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
 
      <div className="stats" aria-live="polite">
        <p>
          Total: {stats.total} | Active: {stats.active} | Completed:{' '}
          {stats.completed}
        </p>
      </div>
      
      {/* Issue 16: Debug code yang tertinggal */}
      {/* Fix 16: Removed leftover console.log debug statements */}
    </div>
  )
}

export default App