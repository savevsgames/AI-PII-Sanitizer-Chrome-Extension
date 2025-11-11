/**
 * Image Editor Component
 * Full-screen modal with pan, zoom, and crop functionality
 * Allows users to scale and compress custom background images
 */
interface ImageEditorResult {
    success: boolean;
    dataURL?: string;
    size?: number;
    error?: string;
    deleted?: boolean;
}
/**
 * Open image editor modal
 */
export declare function openImageEditor(fileOrDataURL: File | string, onSave: (result: ImageEditorResult) => void): void;
export {};
//# sourceMappingURL=imageEditor.d.ts.map