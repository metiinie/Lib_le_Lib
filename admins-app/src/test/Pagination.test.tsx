import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from '../components/ui/Pagination';

describe('Pagination Component', () => {
  it('renders correctly with range statistics', () => {
    const { container } = render(<Pagination total={100} limit={10} offset={0} onPageChange={() => {}} />);
    const statsDiv = container.querySelector('.text-slate-400');
    expect(statsDiv).toHaveTextContent('Showing 1 to 10 of 100 entries');
    expect(screen.getByText('Page 1 of 10')).toBeInTheDocument();
  });

  it('handles Next and Previous button clicks', () => {
    const handlePageChange = vi.fn();
    render(<Pagination total={100} limit={10} offset={20} onPageChange={handlePageChange} />);

    const prevButton = screen.getByTitle('Previous Page');
    const nextButton = screen.getByTitle('Next Page');

    fireEvent.click(nextButton);
    expect(handlePageChange).toHaveBeenCalledWith(30);

    fireEvent.click(prevButton);
    expect(handlePageChange).toHaveBeenCalledWith(10);
  });

  it('disables previous button on first page', () => {
    render(<Pagination total={100} limit={10} offset={0} onPageChange={() => {}} />);
    expect(screen.getByTitle('Previous Page')).toBeDisabled();
    expect(screen.getByTitle('First Page')).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination total={100} limit={10} offset={90} onPageChange={() => {}} />);
    expect(screen.getByTitle('Next Page')).toBeDisabled();
    expect(screen.getByTitle('Last Page')).toBeDisabled();
  });

  it('returns null when total is 0', () => {
    const { container } = render(<Pagination total={0} limit={10} offset={0} onPageChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
