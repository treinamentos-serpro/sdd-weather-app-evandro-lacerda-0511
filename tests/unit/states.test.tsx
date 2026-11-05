import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import LoadingState from '../../src/components/states/LoadingState';
import ErrorState from '../../src/components/states/ErrorState';
import EmptyState from '../../src/components/states/EmptyState';

describe('LoadingState', () => {
  it('anuncia carregamento por status sem dados de sucesso ou retry', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando o clima');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText(/°C|°F/)).not.toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('mostra a mensagem no alert e chama retry uma vez por clique', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Falha de rede. Tente novamente." onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede. Tente novamente.');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('permite retry por teclado', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="O tempo de espera foi excedido." onRetry={onRetry} />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('omite o botão quando não há ação recuperável', () => {
    render(<ErrorState message="Resposta indisponível." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Resposta indisponível.');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('não submete o formulário que contém o retry', async () => {
    const onSubmit = vi.fn();
    const onRetry = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <ErrorState message="Falha de rede." onRetry={onRetry} />
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('mostra título e dica sem alert ou retry de falha', () => {
    render(
      <EmptyState
        title="Nenhuma cidade encontrada"
        hint="Verifique a grafia e tente outra cidade."
      />,
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Nenhuma cidade encontrada',
    );
    expect(screen.getByText('Verifique a grafia e tente outra cidade.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('permite omitir a dica', () => {
    render(<EmptyState title="Busque uma cidade para começar" />);
    expect(screen.getByRole('heading')).toHaveTextContent('Busque uma cidade para começar');
    expect(screen.queryByText('Verifique a grafia e tente outra cidade.')).not.toBeInTheDocument();
  });
});
