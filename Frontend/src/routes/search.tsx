import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search as SearchIcon, MapPin, User, Leaf } from "lucide-react";
import { communityApi } from "@/services/communityApi";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await communityApi.search(query);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SearchIcon className="w-6 h-6 text-emerald-400" />
          Search
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Find farmers, farms, villages, and crops</p>
      </motion.div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by farmer name, village, crop, farm name, district..."
            className="w-full pl-11 pr-4 py-3 bg-sidebar border border-sidebar-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>
        <button type="submit" disabled={loading}
          className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 transition-all">
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Search"}
        </button>
      </form>

      {results && (
        <div className="space-y-6">
          {/* Farms */}
          {results.farms?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400" />
                Farms ({results.farms.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.farms.map((f: any) => (
                  <div key={f.id} className="bg-sidebar border border-sidebar-border rounded-xl p-4 hover:border-emerald-800/50 transition-colors">
                    <p className="text-sm font-medium text-foreground">{f.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {f.village} · {f.district} · {f.crop}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Farmers */}
          {results.farmers?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                Farmers ({results.farmers.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.farmers.map((f: any) => (
                  <div key={f.id} className="bg-sidebar border border-sidebar-border rounded-xl p-4">
                    <p className="text-sm font-medium text-foreground">{f.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{f.village} · {f.district}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.farms?.length === 0 && results.farmers?.length === 0 && (
            <div className="text-center py-12">
              <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No results found for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
