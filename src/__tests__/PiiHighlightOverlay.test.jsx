import React from 'react';
import { render, screen } from '@testing-library/react';
import { PiiHighlightOverlay } from '../pages/GalleryScreen';

describe('PiiHighlightOverlay', () => {
    it('should correctly render densely overlapping entities safely within DOM boundaries', () => {
        const text = "A BCDEF G.";
        
        // Mock overlapping bounds specifically evaluating clamp mappings 
        // BCD and CDEF overlap perfectly
        const mockEntities = [
            { index: 2, value: "BCD", type: "EMAIL_ADDRESS", source: "Regex" },
            { index: 3, value: "CDEF", type: "PHONE_NUMBER", source: "AI" }
        ];

        render(<PiiHighlightOverlay text={text} entities={mockEntities} />);

        // By targeting bounding styles, we evaluate React rendered each specific sequence accurately
        const marks = document.querySelectorAll('.pii-overlay-match');
        expect(marks.length).toBe(2);
        
        // Validates visual clamping bounds mapping string output "BCD" and "EF" (which is CDEF clamped by 2)
        expect(marks[0].textContent).toBe('BCD');
        expect(marks[1].textContent).toBe('EF');
        
        // Assert full sequence string wasn't compromised natively 
        // Note: The total DOM text mapped continuously without spaces inside span boundaries
        expect(document.body.textContent).toContain('A BCDEF G.');
    });

    it('should handle perfectly identical boundaries collapsing cleanly mapping identically without breaking elements natively', () => {
        const text = "Test string";
        const identicalMock = [
            { index: 5, value: "string", type: "First" },
            { index: 5, value: "string", type: "Second" },
        ];
        
        render(<PiiHighlightOverlay text={text} entities={identicalMock} />);
        
        const marks = document.querySelectorAll('.pii-overlay-match');
        
        // Expected layout natively maps cleanly skipping precisely bounded bounds perfectly returning 1 cleanly rendered tag
        expect(marks.length).toBe(1);
        expect(marks[0].textContent).toBe('string');
        expect(document.body.textContent).toContain('Test string');
    });
});
