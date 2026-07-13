import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminFilePicker } from './AdminFilePicker'

describe('AdminFilePicker', () => {
  it('shows the empty placeholder when the preview image cannot be loaded', () => {
    render(<AdminFilePicker name="image_path" value="images/missing.png" label="Category image" onChange={vi.fn()} />)

    fireEvent.error(screen.getByAltText('Category image preview'))

    expect(screen.getByText('No image selected')).toBeTruthy()
  })
})
