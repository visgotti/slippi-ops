import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { tryFindFolderContainingFileType } from '.'; // Update with your actual module path
import { describe, beforeEach, afterEach, it } from 'vitest';
describe('tryFindFolderContainingFileType', () => {
    const testDirRoot = path.join(__dirname, 'test-dir');

    // Helper to create directories and files for testing
    const setupTestDir = (structure: Record<string, string[]>) => {
        fs.mkdirSync(testDirRoot, { recursive: true });
        Object.keys(structure).forEach(dir => {
            const dirPath = path.join(testDirRoot, dir);
            fs.mkdirSync(dirPath, { recursive: true });
            structure[dir].forEach(file => {
                fs.writeFileSync(path.join(dirPath, file), '');
            });
        });
    };

    // Helper to clean up test directories after each test
    const cleanUpTestDir = () => {
        fs.rmdirSync(testDirRoot, { recursive: true });
    };

    beforeEach(() => {
        cleanUpTestDir();
    });

    afterEach(() => {
        cleanUpTestDir();
    });

    it('should return the directory containing only the specified file type', async () => {
        setupTestDir({
            'folder1': ['file1.slp', 'file2.slp'],
            'folder1/subfolder': ['file3.slp'],
            'folder2': ['file1.txt', 'file2.txt'],
        });

        const result = await tryFindFolderContainingFileType('.slp', path.join(testDirRoot, 'folder1/subfolder'));
        expect(result).to.equal(path.join(testDirRoot, 'folder1/subfolder'));
    });

    it('should return null if no directory contains only the specified file type', async () => {
        setupTestDir({
            'folder1': ['file1.slp', 'file2.txt'],
            'folder2': ['file1.txt', 'file2.txt'],
        });

        const result = await tryFindFolderContainingFileType('.slp', testDirRoot);
        expect(result).to.be.null;
    });

    it('should return null if the directory is empty', async () => {
        setupTestDir({
            'folder1': [],
        });

        const result = await tryFindFolderContainingFileType('.slp', path.join(testDirRoot, 'folder1'));
        expect(result).to.be.null;
    });

    it('should search parent directories if needed', async () => {
        setupTestDir({
            'folder1': ['file1.slp', 'file2.slp'],
            'folder1/subfolder': [],
        });

        const result = await tryFindFolderContainingFileType('.slp', path.join(testDirRoot, 'folder1/subfolder'));
        expect(result).to.equal(path.join(testDirRoot, 'folder1'));
    });

    it('should correctly handle case-insensitive file extensions', async () => {
        setupTestDir({
            'folder1': ['file1.SLP', 'file2.SLP'],
        });

        const result = await tryFindFolderContainingFileType('.slp', path.join(testDirRoot, 'folder1'));
        expect(result).to.equal(path.join(testDirRoot, 'folder1'));
    });
});
