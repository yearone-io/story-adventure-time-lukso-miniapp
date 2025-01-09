"use client";

import { GridProvider } from "@/components/GridProvider";
import { Search } from "@/components/Search";
import { Donate } from "@/components/Donate";
import { useGrid } from "@/components/GridProvider";

function MainContent() {
  const { selectedAddress, setSelectedAddress, isSearching } = useGrid();

  return (
    <>
      <div className={`transition-all duration-500 ${isSearching ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <Donate selectedAddress={selectedAddress} />
      </div>

      <div className={`absolute top-0 left-0 w-full transition-all duration-500 ${!isSearching ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <Search onSelectAddress={setSelectedAddress} />
      </div>
    </>
  );
}

export default function Home() {
  return (
    <GridProvider>
      <MainContent />
    </GridProvider>
  );
}
