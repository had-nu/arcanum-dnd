import { render } from 'preact';
import { App } from './App';
// @ts-ignore
import './styles/global.css';

render(<App />, document.getElementById('app')!);