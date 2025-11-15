import { createContext, useContext, useState, ReactNode } from "react";

interface SearchContextType {
  openSearch: boolean;
  setOpenSearch: (open: boolean) => void;
}

// 1. Criamos o Contexto
const SearchContext = createContext<SearchContextType | undefined>(undefined);

// 2. Criamos o Provedor que vai "segurar" o estado
export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [openSearch, setOpenSearch] = useState(false);
  
  // Log para depuração
  console.log("LOG (SearchContext): Estado 'openSearch' é:", openSearch);

  return (
    <SearchContext.Provider value={{ openSearch, setOpenSearch }}>
      {children}
    </SearchContext.Provider>
  );
};

// 3. Criamos o Hook customizado para consumir o estado
export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch deve ser usado dentro de um SearchProvider");
  }
  return context;
};