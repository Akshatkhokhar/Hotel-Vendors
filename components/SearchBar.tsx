'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (location) params.append('location', location);
    if (category) params.append('category', category);
    router.push(`/vendors?${params.toString()}`);
  };

  return (
    <form 
      onSubmit={handleSearch}
      className="bg-white dark:bg-surface rounded-full shadow-2xl p-2 md:p-3 flex flex-col md:flex-row items-center gap-2 max-w-4xl w-full mx-auto border border-surface-dim dark:border-outline"
    >
      <div className="flex-1 w-full px-6 flex flex-col justify-center border-r border-surface-dim dark:border-outline">
        <label className="text-[10px] font-body font-bold text-muted-teal uppercase tracking-widest">What are you looking for?</label>
        <input 
          type="text" 
          placeholder="Furniture, Lighting, etc."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent border-none focus:outline-none font-body text-foreground placeholder:text-muted-teal/50 w-full"
        />
      </div>

      <div className="flex-1 w-full px-6 flex flex-col justify-center border-r border-surface-dim dark:border-outline">
        <label className="text-[10px] font-body font-bold text-muted-teal uppercase tracking-widest">Location</label>
        <input 
          type="text" 
          placeholder="New York, California..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="bg-transparent border-none focus:outline-none font-body text-foreground placeholder:text-muted-teal/50 w-full"
        />
      </div>

      <div className="flex-1 w-full px-6 flex flex-col justify-center">
        <label className="text-[10px] font-body font-bold text-muted-teal uppercase tracking-widest">Category</label>
        <select 
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-transparent border-none focus:outline-none font-body text-foreground appearance-none w-full"
        >
          <option value="">All Categories</option>
          <option value="Furniture">Furniture</option>
          <option value="Lighting">Lighting</option>
          <option value="Kitchen">Kitchen</option>
          <option value="Wellness">Wellness</option>
        </select>
      </div>

      <button 
        type="submit"
        className="bg-amber hover:bg-primary text-white font-body font-bold px-10 py-4 rounded-full transition-all w-full md:w-auto"
      >
        Search
      </button>
    </form>
  );
}
