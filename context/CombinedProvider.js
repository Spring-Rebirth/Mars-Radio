import { GlobalProvider, TabProvider } from "../context/GlobalProvider";

export default function CombinedProvider({ children }) {
    return (
        <GlobalProvider>
            <TabProvider>
                {children}
            </TabProvider>
        </GlobalProvider>
    );
}