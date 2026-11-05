import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

describe('SearchBar', () => {
  it('não dispara busca com input vazio', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('dispara busca com o termo digitado', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await userEvent.type(screen.getByLabelText(/buscar cidade/i), 'Lisboa');
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(onSearch).toHaveBeenCalledWith('Lisboa');
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('expõe o formulário de busca e o input com label acessível', () => {
    render(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Buscar cidade' })).toBeInTheDocument();
  });

  it('não dispara busca com espaços, mesmo ao submeter o formulário diretamente', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await userEvent.type(screen.getByLabelText(/buscar cidade/i), '   {Enter}');
    expect(screen.getByRole('button', { name: /buscar/i })).toBeDisabled();
    fireEvent.submit(screen.getByRole('search'));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('submete por Enter removendo apenas espaços externos', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await userEvent.type(screen.getByLabelText(/buscar cidade/i), "  São João d'Aliança  {Enter}");
    expect(onSearch).toHaveBeenCalledExactlyOnceWith("São João d'Aliança");
  });

  it('bloqueia input e submissão quando disabled e permite buscar ao reabilitar', async () => {
    const onSearch = vi.fn();
    const { rerender } = render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByLabelText(/buscar cidade/i);
    await userEvent.type(input, 'Recife');

    rerender(<SearchBar onSearch={onSearch} disabled />);
    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: /buscar/i })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    fireEvent.submit(screen.getByRole('search'));
    expect(onSearch).not.toHaveBeenCalled();

    rerender(<SearchBar onSearch={onSearch} disabled={false} />);
    expect(input).toBeEnabled();
    await userEvent.type(input, '{Enter}');
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Recife');
  });

  it('associa cada label ao input correto quando há mais de uma barra', () => {
    render(
      <>
        <SearchBar onSearch={vi.fn()} />
        <SearchBar onSearch={vi.fn()} />
      </>,
    );
    const inputs = screen.getAllByLabelText(/buscar cidade/i);
    expect(inputs).toHaveLength(2);
    expect(inputs[0].id).not.toBe(inputs[1].id);
  });
});
