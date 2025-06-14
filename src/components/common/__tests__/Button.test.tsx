import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled button</Button>);
    const button = screen.getByText('Disabled button');
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled button</Button>);
    
    fireEvent.click(screen.getByText('Disabled button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply primary variant styles', () => {
    render(<Button variant="primary">Primary button</Button>);
    const button = screen.getByText('Primary button');
    expect(button).toHaveClass('bg-medical-primary');
  });

  it('should apply secondary variant styles', () => {
    render(<Button variant="secondary">Secondary button</Button>);
    const button = screen.getByText('Secondary button');
    expect(button).toHaveClass('bg-gray-200');
  });

  it('should apply danger variant styles', () => {
    render(<Button variant="danger">Danger button</Button>);
    const button = screen.getByText('Danger button');
    expect(button).toHaveClass('bg-medical-danger');
  });

  it('should apply loading state', () => {
    render(<Button loading>Loading button</Button>);
    const button = screen.getByText('Loading button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50');
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom button</Button>);
    const button = screen.getByText('Custom button');
    expect(button).toHaveClass('custom-class');
  });

  it('should apply small size styles', () => {
    render(<Button size="sm">Small button</Button>);
    const button = screen.getByText('Small button');
    expect(button).toHaveClass('px-3', 'py-1', 'text-sm');
  });

  it('should apply large size styles', () => {
    render(<Button size="lg">Large button</Button>);
    const button = screen.getByText('Large button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });
});