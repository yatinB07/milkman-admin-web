import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TableImagePreview } from './TableImagePreview'

describe('TableImagePreview', () => {
  it('shows a placeholder when the image cannot be loaded', () => {
    render(<TableImagePreview src="images/missing.png" alt="Missing image" />)

    fireEvent.error(screen.getByAltText('Missing image'))

    expect(screen.getByText('No image')).toBeTruthy()
  })
})
