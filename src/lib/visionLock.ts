let isVisionBusy = false;

/**
 * Attempts to acquire a lock for vision processing (Gemini or Local OCR).
 * Returns true if lock was acquired, false if busy.
 */
export const acquireVisionLock = (): boolean => {
    if (isVisionBusy) return false;
    isVisionBusy = true;
    return true;
};

/**
 * Releases the vision lock.
 */
export const releaseVisionLock = (): void => {
    isVisionBusy = false;
};

/**
 * Checks if vision processing is currently busy.
 */
export const isVisionProcessing = (): boolean => {
    return isVisionBusy;
};
