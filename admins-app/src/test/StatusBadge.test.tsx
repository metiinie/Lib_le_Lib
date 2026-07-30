import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../components/ui/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders Approved status correctly', () => {
    render(<StatusBadge status="approved" />);
    expect(screen.getByText(/approved/i)).toBeInTheDocument();
  });

  it('renders Rejected status correctly', () => {
    render(<StatusBadge status="rejected" />);
    expect(screen.getByText(/rejected/i)).toBeInTheDocument();
  });

  it('renders Submitted / Pending status correctly', () => {
    render(<StatusBadge status="submitted" />);
    expect(screen.getByText(/submitted/i)).toBeInTheDocument();
  });

  it('renders Suspended account status correctly', () => {
    render(<StatusBadge status="suspended" />);
    expect(screen.getByText(/suspended/i)).toBeInTheDocument();
  });

  it('renders Banned account status correctly', () => {
    render(<StatusBadge status="banned" />);
    expect(screen.getByText(/banned/i)).toBeInTheDocument();
  });
});
