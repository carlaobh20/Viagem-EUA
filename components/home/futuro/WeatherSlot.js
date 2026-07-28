'use client';
import StatTile from '../../ui/StatTile';

/**
 * PONTO DE INTEGRAÇÃO FUTURO — Clima.
 * ---------------------------------------------------------------
 * Não está sendo renderizado em nenhuma tela hoje. Pensado pra viver dentro
 * do HeroTravelCard (linha extra de stats) quando existir uma fonte de
 * clima real (API + cidade do ponto atual do roteiro).
 *
 * @typedef {Object} ClimaAtual
 * @property {number} tempC
 * @property {number} [chanceChuvaPct]
 * @property {string} [icone]
 * @property {string} [nascerDoSol] - "HH:MM"
 * @property {string} [porDoSol] - "HH:MM"
 *
 * @param {{ clima: ClimaAtual|null, on?: 'light'|'dark' }} props
 */
export default function WeatherSlot({ clima, on = 'dark' }) {
  if (!clima) return null; // sem API configurada — não fabrica número.
  return <StatTile on={on} label="Clima" value={`${Math.round(clima.tempC)}°${clima.icone ? ' ' + clima.icone : ''}`} />;
}
