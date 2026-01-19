'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

export default function DynamicListEditor({ 
  label, 
  placeholder = "เพิ่มรายการใหม่...", 
  values = [], 
  onChange,
  color = "purple" // theme color: purple, blue, indigo
}) {
  const [items, setItems] = useState(values);
  const [newItem, setNewItem] = useState("");
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingText, setEditingText] = useState("");

  // Sync state with props
  useEffect(() => { setItems(values || []); }, [values]);

  const updateParent = (newItems) => {
    setItems(newItems);
    if (onChange) onChange(newItems);
  };

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    updateParent([...items, newItem.trim()]);
    setNewItem("");
  };

  const handleDelete = (index) => {
    updateParent(items.filter((_, i) => i !== index));
  };

  const handleSaveEdit = (index) => {
    if (!editingText.trim()) return;
    const newItems = [...items];
    newItems[index] = editingText.trim();
    updateParent(newItems);
    setEditingIndex(-1);
  };

  const handleMove = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, moved);
    updateParent(newItems);
  };

  // Color classes mapping
  const colors = {
    purple: "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 text-purple-600 bg-purple-50",
    blue: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-blue-600 bg-blue-50",
    indigo: "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 text-indigo-600 bg-indigo-50",
  };
  const activeColor = colors[color] || colors.purple;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">{label}</label>
        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-mono">{items.length} Items</span>
      </div>

      {/* List */}
      <div className="space-y-2 mb-4">
        {items.map((item, index) => (
          <div key={index} className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${editingIndex === index ? `ring-2 ring-${color}-100 border-${color}-300 bg-${color}-50/30` : 'border-slate-100 hover:border-slate-300 hover:shadow-sm'}`}>
            
            {/* Controls (Move) */}
            <div className="flex flex-col gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => handleMove(index, -1)} disabled={index === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-0"><ArrowUp size={14} /></button>
               <button onClick={() => handleMove(index, 1)} disabled={index === items.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-0"><ArrowDown size={14} /></button>
            </div>

            {/* Content or Edit Input */}
            <div className="flex-1 min-w-0">
              {editingIndex === index ? (
                <div className="flex gap-2">
                  <textarea 
                    value={editingText} 
                    onChange={(e) => setEditingText(e.target.value)} 
                    className="flex-1 p-2 text-sm border rounded-lg focus:outline-none resize-none"
                    rows={2}
                  />
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleSaveEdit(index)} className={`p-1.5 rounded-md text-white ${activeColor.split(' ')[0]}`}><Check size={16} /></button>
                    <button onClick={() => setEditingIndex(-1)} className="p-1.5 rounded-md bg-slate-200 text-slate-600"><X size={16} /></button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <span className="flex-none w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold mt-0.5">{index + 1}</span>
                  <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{item}</p>
                </div>
              )}
            </div>

            {/* Actions (Edit/Delete) */}
            {editingIndex !== index && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
                <button onClick={() => { setEditingIndex(index); setEditingText(item); }} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-md transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(index)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition-colors"><Trash2 size={16} /></button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-xl">ยังไม่มีข้อมูล</div>}
      </div>

      {/* Add New */}
      <div className="flex gap-2">
        <input 
          type="text" 
          value={newItem} 
          onChange={(e) => setNewItem(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-transparent transition-all"
          style={{ '--tw-ring-color': `var(--${color}-500)` }} 
        />
        <button 
          onClick={handleAddItem}
          disabled={!newItem.trim()}
          className={`px-4 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${activeColor.split(' ')[0]} ${activeColor.split(' ')[1]}`}
        >
          <Plus size={18} /> เพิ่ม
        </button>
      </div>
    </div>
  );
}