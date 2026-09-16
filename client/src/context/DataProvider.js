import { createContext, useState } from "react";


export const DataContext = createContext(null);

const DataProvider = ({ children }) => {
    // Restore account from sessionStorage so it survives page refresh
    const storedAccount = (() => {
        try {
            const raw = sessionStorage.getItem('account');
            return raw ? JSON.parse(raw) : { name: '', username: '' };
        } catch {
            return { name: '', username: '' };
        }
    })();

    const [account, setAccountState] = useState(storedAccount);

    const setAccount = (data) => {
        setAccountState(data);
        try {
            sessionStorage.setItem('account', JSON.stringify(data));
        } catch { /* ignore storage errors */ }
    };
        
    return (
        <DataContext.Provider value={{ 
            account, 
            setAccount 
        }}>
            {children}
        </DataContext.Provider>
    )
}

export default DataProvider;