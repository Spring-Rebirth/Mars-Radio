import { create } from 'zustand';

export interface EditedImage {
    uri: string;
    width?: number;
    height?: number;
    [key: string]: any;
}

interface EditedImagesState {
    images: EditedImage[];
    setImages: (imgs: EditedImage[]) => void;
    clear: () => void;
}

export const useEditedImagesStore = create<EditedImagesState>((set) => ({
    images: [],
    setImages: (imgs) => set({ images: imgs }),
    clear: () => set({ images: [] }),
})); 
