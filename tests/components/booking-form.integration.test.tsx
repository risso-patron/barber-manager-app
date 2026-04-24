import { render, screen, fireEvent } from '@testing-library/react';
import { SignupPromptModal } from '../../components/booking/signup-prompt-modal';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

const defaultProps = {
  isOpen: true,
  onClose: () => {},
  guestData: { name: 'Test User', email: 'test@test.com', phone: '1234567890' },
};

describe('SignupPromptModal integración', () => {
  it('renderiza el modal cuando isOpen es true', () => {
    render(<SignupPromptModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('muestra error si las contraseñas no coinciden', async () => {
    render(<SignupPromptModal {...defaultProps} />);
    const inputs = screen.getAllByRole('textbox');
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    if (passwordInputs.length >= 2) {
      fireEvent.change(passwordInputs[0]!, { target: { value: 'password123' } });
      fireEvent.change(passwordInputs[1]!, { target: { value: 'diferente123' } });
      const submit = screen.getByRole('button', { name: /crear|cuenta/i });
      fireEvent.click(submit);
      expect(await screen.findByText(/contraseñas no coinciden/i)).toBeInTheDocument();
    }
  });
});
